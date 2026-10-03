import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { requireBothUser, zodErrorResponse } from "@/lib/api";
import { modelSchema } from "@/lib/masters/schemas";
import {
  createModel,
  deleteModel,
  listModels,
  listModelsByCompany,
  updateModel,
} from "@/lib/masters/service";

export async function GET(request: Request) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const companyId = Number(new URL(request.url).searchParams.get("company_id"));

  try {
    if (companyId) {
      const data = await listModelsByCompany(companyId);
      return NextResponse.json({ data });
    }

    const data = await listModels();
    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to load models" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireBothUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = modelSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await createModel(parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Model name already exists", errors: { name: ["Taken"] } },
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

  const parsed = modelSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const data = await updateModel(id, parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
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
    await deleteModel(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
