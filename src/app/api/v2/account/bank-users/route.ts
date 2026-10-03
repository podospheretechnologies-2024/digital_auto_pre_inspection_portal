import { NextResponse } from "next/server";

import {
  requireBothWithPermission,
  zodErrorResponse,
} from "@/lib/api";
import {
  bankUserCreateSchema,
  bankUserUpdateSchema,
} from "@/lib/account/schemas";
import {
  createBankUser,
  getBankUser,
  getBankUserLookups,
  listBankUsers,
  updateBankUser,
} from "@/lib/account/service";

export async function GET(request: Request) {
  const user = await requireBothWithPermission("bank_user_view");
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));

  try {
    if (id) {
      const data = await getBankUser(id);
      if (!data) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ data });
    }

    const [data, lookups] = await Promise.all([
      listBankUsers(),
      getBankUserLookups(),
    ]);
    return NextResponse.json({ data, lookups });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load bank users" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireBothWithPermission("bank_user_entry");
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = bankUserCreateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await createBankUser(parsed.data);
    return NextResponse.json(
      { data: { id: data.id }, ok: true },
      { status: 201 },
    );
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
  const user = await requireBothWithPermission("bank_user_edit");
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = bankUserUpdateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await updateBankUser(parsed.data);
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
