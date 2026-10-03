import { NextResponse } from "next/server";

import {
  changeStaffPassword,
  createPerson,
  getPersonLookups,
  listStaff,
  softDeletePerson,
  staffPasswordSchema,
  updatePerson,
} from "@/lib/account/staff";
import {
  personCreateSchema,
  personDeleteSchema,
  personUpdateSchema,
  type PersonRole,
} from "@/lib/account/schemas";
import { requireAdminUser, zodErrorResponse } from "@/lib/api";

const ALLOWED: PersonRole[] = ["HO"];

export async function GET() {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  try {
    const [data, cities] = await Promise.all([
      listStaff(),
      getPersonLookups(),
    ]);
    return NextResponse.json({ data, lookups: { cities } });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load staff" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = personCreateSchema.safeParse({ ...body, role: "HO" });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await createPerson(parsed.data);
    return NextResponse.json({ data, ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { message: "Email already in use", errors: { email: ["Taken"] } },
        { status: 422 },
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();

  // Password change: { staff_id, password, password_confirmation }
  if (body?.staff_id != null && body.password != null) {
    const parsed = staffPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    try {
      await changeStaffPassword(parsed.data);
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      console.error(error);
      return NextResponse.json(
        { message: "Password update failed" },
        { status: 500 },
      );
    }
  }

  const parsed = personUpdateSchema.safeParse({ ...body, role: "HO" });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await updatePerson(parsed.data, ALLOWED);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { message: "Email already in use", errors: { email: ["Taken"] } },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = personDeleteSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await softDeletePerson(parsed.data.id, ALLOWED, Number(user.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "CANNOT_DELETE_SELF") {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
