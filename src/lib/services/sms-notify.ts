import { db } from "@/lib/db";
import { sendSms } from "@/lib/integrations/sms";

export type SmsNotifyJobData = {
  kind: "pi-assign" | "pi-case-submitted";
  jobId: number;
  agentId?: number;
  /** Optional preloaded fields (avoids extra DB round-trip). */
  customerName?: string | null;
  customerMobile?: string | null;
  agentName?: string | null;
};

export type SmsNotifyResult = {
  kind: SmsNotifyJobData["kind"];
  jobId: number;
  skipped?: string;
  send?: Awaited<ReturnType<typeof sendSms>>;
};

function assignMessage(cname: string, mobileno: string): string {
  return `Dear sir,
New case assigned. Customer Name - ${cname}, Mobile - ${mobileno}
DIGITAL TECHI.`;
}

function caseSubmittedMessage(
  agentName: string,
  cname: string,
  mobileno: string,
): string {
  return `Dear sir,
Case submitted by Agent  ${agentName} of Customer Name - ${cname}, Mobile - ${mobileno}
DIGITAL TECHI.`;
}

/**
 * Process PI SMS notification (Laravel JobsController yourbulksms curls).
 * Primary: agent assign. Secondary stub path: case submitted (inspect save).
 */
export async function processSmsNotify(
  data: SmsNotifyJobData,
): Promise<SmsNotifyResult> {
  const job = await db.tbl_jobs.findFirst({
    where: { id: data.jobId, is_deleted: 0 },
    select: {
      id: true,
      cname: true,
      mobileno: true,
      agent_id: true,
      created_user_id: true,
    },
  });

  if (!job) {
    return { kind: data.kind, jobId: data.jobId, skipped: "job_not_found" };
  }

  const cname = data.customerName ?? job.cname ?? "";
  const mobileno = data.customerMobile ?? job.mobileno ?? "";

  if (data.kind === "pi-assign") {
    const agentId = data.agentId ?? job.agent_id;
    if (!agentId) {
      return { kind: data.kind, jobId: data.jobId, skipped: "no_agent" };
    }

    const info = await db.user_infos.findUnique({
      where: { user_id: agentId },
      select: { phone: true },
    });
    if (!info?.phone) {
      return {
        kind: data.kind,
        jobId: data.jobId,
        skipped: "agent_phone_missing",
      };
    }

    const send = await sendSms({
      mobile: info.phone,
      message: assignMessage(cname, mobileno),
    });
    return { kind: data.kind, jobId: data.jobId, send };
  }

  // pi-case-submitted — Laravel posts to creator's phone from join users/user_infos
  const creatorId = job.created_user_id;
  if (!creatorId) {
    return { kind: data.kind, jobId: data.jobId, skipped: "no_creator" };
  }

  const [creatorInfo, creatorUser, agentUser] = await Promise.all([
    db.user_infos.findUnique({
      where: { user_id: creatorId },
      select: { phone: true },
    }),
    db.users.findUnique({
      where: { id: creatorId },
      select: { first_name: true, last_name: true },
    }),
    job.agent_id
      ? db.users.findUnique({
          where: { id: job.agent_id },
          select: { first_name: true, last_name: true },
        })
      : Promise.resolve(null),
  ]);

  if (!creatorInfo?.phone) {
    return {
      kind: data.kind,
      jobId: data.jobId,
      skipped: "creator_phone_missing",
    };
  }

  const agentName =
    data.agentName ??
    (agentUser
      ? `${agentUser.first_name} ${agentUser.last_name}`.trim()
      : creatorUser
        ? `${creatorUser.first_name} ${creatorUser.last_name}`.trim()
        : "Agent");

  const send = await sendSms({
    mobile: creatorInfo.phone,
    message: caseSubmittedMessage(agentName, cname, mobileno),
  });
  return { kind: data.kind, jobId: data.jobId, send };
}
