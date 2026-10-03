import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { requireBothUser, zodErrorResponse } from "@/lib/api";
import { bankSchema } from "@/lib/masters/schemas";
import {
  createBank,
  deleteBank,
  listBanks,
  updateBank,
} from "@/lib/masters/service";

export async function GET() {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  try {
    const data = await listBanks();
    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load banks. Check DATABASE_URL / schema." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = bankSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await createBank(parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Bank name already exists", errors: { name: ["Taken"] } },
        { status: 422 },
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const id = Number(body.id);
  if (!id) {
    return NextResponse.json({ message: "id is required" }, { status: 422 });
  }

  const parsed = bankSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await updateBank(id, parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Bank name already exists", errors: { name: ["Taken"] } },
        { status: 422 },
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const id = Number(body.id);
  if (!id) {
    return NextResponse.json({ message: "id is required" }, { status: 422 });
  }

  try {
    await deleteBank(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
