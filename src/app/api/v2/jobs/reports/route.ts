import { NextResponse } from "next/server";

import { requireAdminOrBankUser } from "@/lib/api";
import { isBank } from "@/lib/rbac";
import { searchPreInspectionReports } from "@/lib/services/qc";

/**
 * GET /api/v2/jobs/reports?customer=&vehicleno=&ref_no=
 * Pre-Inspection global search (QC-complete). PDF download stubbed (Phase 6).
 */
export async function GET(request: Request) {
  const user = await requireAdminOrBankUser();
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const customer = url.searchParams.get("customer") ?? undefined;
  const vehicleno = url.searchParams.get("vehicleno") ?? undefined;
  const ref_no = url.searchParams.get("ref_no") ?? undefined;

  try {
    const data = await searchPreInspectionReports({
      customer,
      vehicleno,
      ref_no,
      bank_id: isBank(user) ? user.bankId : undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/v2/jobs/reports]", error);
    return NextResponse.json({ data: [], message: "Reports unavailable" });
  }
}
