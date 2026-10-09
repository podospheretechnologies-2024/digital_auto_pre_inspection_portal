import { NextResponse } from "next/server";

import { requireAdminUser, zodErrorResponse } from "@/lib/api";
import {
  getPermissionMatrix,
  listHoStaffForPermissions,
  savePermissionsSchema,
  saveStaffPermissions,
} from "@/lib/account/staff";

export async function GET(request: Request) {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const staffId = Number(url.searchParams.get("staff_id"));

  try {
    const staff = await listHoStaffForPermissions();
    if (!staffId) {
      return NextResponse.json({ data: { staff } });
    }
    const matrix = await getPermissionMatrix(staffId);
    return NextResponse.json({ data: { staff, ...matrix } });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load permissions" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = savePermissionsSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const saved = await saveStaffPermissions(parsed.data, Number(user.id));
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 },
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Save failed" }, { status: 500 });
  }
}
