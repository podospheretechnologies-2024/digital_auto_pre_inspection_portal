import { NextResponse } from "next/server";
import { z } from "zod";

import { denyUnlessButtonPermission, requireAllUser, zodErrorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { canWorkInspection } from "@/lib/jobs/access";
import { isBoth } from "@/lib/rbac";

const deleteSchema = z.object({
  kind: z.enum(["2wheeler", "3wheeler", "4wheeler"]),
  image_id: z.coerce.number().int().positive(),
});

export async function DELETE(request: Request) {
  const user = await requireAllUser();
  if (user instanceof NextResponse) return user;
  const denied = denyUnlessButtonPermission(user, "inspect_delete");
  if (denied) return denied;

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { kind, image_id } = parsed.data;

  try {
    const image =
      kind === "2wheeler"
        ? await db.tbl_2wheeler_images.findUnique({ where: { id: image_id } })
        : kind === "3wheeler"
          ? await db.tbl_3wheeler_images.findUnique({ where: { id: image_id } })
          : await db.tbl_4wheeler_images.findUnique({ where: { id: image_id } });
    if (!image?.parent_id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const inspection =
      kind === "2wheeler"
        ? await db.tbl_2wheeler.findUnique({ where: { id: image.parent_id } })
        : kind === "3wheeler"
          ? await db.tbl_3wheeler.findUnique({ where: { id: image.parent_id } })
          : await db.tbl_4wheeler.findUnique({ where: { id: image.parent_id } });
    if (!inspection?.job_id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const job = await db.tbl_jobs.findFirst({
      where: { id: inspection.job_id },
      select: { agent_id: true, bank_id: true, is_deleted: true, on_hold: true },
    });
    if (!job) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (job.on_hold === 1 || job.is_deleted === 1) {
      return NextResponse.json(
        { message: "That stage change is not allowed from here" },
        { status: 422 },
      );
    }
    if (!(await canWorkInspection(user, job))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (Number(inspection.qc ?? 0) === 1 && !isBoth(user)) {
      return NextResponse.json(
        { message: "Completed inspection cannot be edited" },
        { status: 422 },
      );
    }

    if (kind === "2wheeler") {
      await db.tbl_2wheeler_images.delete({ where: { id: image_id } });
    } else if (kind === "3wheeler") {
      await db.tbl_3wheeler_images.delete({ where: { id: image_id } });
    } else {
      await db.tbl_4wheeler_images.delete({ where: { id: image_id } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
