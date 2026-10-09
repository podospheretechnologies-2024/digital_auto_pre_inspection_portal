import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/api";
import { isBoth } from "@/lib/rbac";
import { listBanks, listCompanies, listModels, listVariants } from "@/lib/masters/service";
import { listAgents } from "@/lib/services/job-assignment";
import { db } from "@/lib/db";

/** GET /api/v2/jobs/lookups?company_id=&model_id= — banks, agents, CMV cascade */
export async function GET(request: Request) {
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const companyId = url.searchParams.get("company_id");
  const modelId = url.searchParams.get("model_id");

  try {
    const [banks, companies, agents, brokers] = await Promise.all([
      listBanks(),
      listCompanies(),
      listAgents(),
      db.m_broker.findMany({ orderBy: { name: "asc" } }),
    ]);

    let models: Awaited<ReturnType<typeof listModels>> = [];
    let variants: Awaited<ReturnType<typeof listVariants>> = [];

    if (companyId) {
      models = (await listModels()).filter(
        (m) => m.company_id === Number(companyId),
      );
    } else {
      models = await listModels();
    }

    if (modelId) {
      variants = (await listVariants()).filter(
        (v) => v.model_id === Number(modelId),
      );
    } else if (companyId) {
      variants = (await listVariants()).filter(
        (v) => v.company_id === Number(companyId),
      );
    } else {
      variants = await listVariants();
    }

    return NextResponse.json({
      data: {
        banks: banks.map((b) => ({ id: b.id, name: b.name })),
        companies: companies.map((c) => ({ id: c.id, name: c.name })),
        models: models.map((m) => ({
          id: m.id,
          name: m.name,
          company_id: m.company_id,
        })),
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          company_id: v.company_id,
          model_id: v.model_id,
          vehicle_type: v.vehicle_type,
        })),
        agents: isBoth(user)
          ? agents.map((a) => ({
              id: a.id,
              name: `${a.first_name} ${a.last_name}`.trim(),
              email: a.email,
              type: a.type,
              city_id: a.city_id,
              parent_id: a.parent_id,
            }))
          : [],
        brokers: brokers.map((b) => ({ id: b.id, name: b.name })),
      },
    });
  } catch (error) {
    console.error("[api/v2/jobs/lookups]", error);
    return NextResponse.json(
      { message: "Failed to load lookups" },
      { status: 500 },
    );
  }
}
