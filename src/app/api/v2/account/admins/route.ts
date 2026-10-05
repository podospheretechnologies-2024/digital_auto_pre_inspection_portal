import { NextResponse } from "next/server";

import {
  createPerson,
  getPersonLookups,
  listAdmins,
  softDeletePerson,
  updatePerson,
} from "@/lib/account/staff";
import {
  personCreateSchema,
  personDeleteSchema,
  personUpdateSchema,
  type PersonRole,
} from "@/lib/account/schemas";
import { requireAdminUser, zodErrorResponse } from "@/lib/api";

const ALLOWED: PersonRole[] = ["Admin"];

export async function GET() {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  try {
    const [data, lookups] = await Promise.all([
      listAdmins(),
      getPersonLookups(),
    ]);
    return NextResponse.json({
      data,
      lookups: { cities: lookups.cities },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load admins" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireAdminUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = personCreateSchema.safeParse({ ...body, role: "Admin" });
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
  const parsed = personUpdateSchema.safeParse({ ...body, role: "Admin" });
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
