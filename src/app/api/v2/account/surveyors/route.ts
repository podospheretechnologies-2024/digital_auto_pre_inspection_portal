import { NextResponse } from "next/server";

import {
  agentApproveSchema,
  approveSurveyor,
  createPerson,
  getPersonLookups,
  listSurveyors,
  softDeletePerson,
  updatePerson,
} from "@/lib/account/staff";
import {
  personCreateSchema,
  personDeleteSchema,
  personUpdateSchema,
  type PersonRole,
} from "@/lib/account/schemas";
import {
  requireBothWithPermission,
  zodErrorResponse,
} from "@/lib/api";

const ALLOWED: PersonRole[] = ["RO", "Surveyor"];

export async function GET() {
  const user = await requireBothWithPermission("surveyor_view");
  if (user instanceof NextResponse) return user;

  try {
    const [data, lookups] = await Promise.all([
      listSurveyors(),
      getPersonLookups(),
    ]);
    return NextResponse.json({ data, lookups });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to load surveyors" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await requireBothWithPermission("surveyor_entry");
  if (user instanceof NextResponse) return user;

  const body = await request.json();

  // Legacy approve payload: { agent_id }
  if (body?.agent_id != null && body.first_name == null) {
    const parsed = agentApproveSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    try {
      await approveSurveyor(parsed.data.agent_id);
      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      if (error instanceof Error && error.message === "PARENT_RO_REQUIRED") {
        return NextResponse.json(
          { message: "Link Surveyor to a verified RO before approve" },
          { status: 422 },
        );
      }
      if (error instanceof Error && error.message === "INVALID_PARENT_RO") {
        return NextResponse.json(
          { message: "Parent RO is invalid or unverified" },
          { status: 422 },
        );
      }
      console.error(error);
      return NextResponse.json({ message: "Approve failed" }, { status: 500 });
    }
  }

  const parsed = personCreateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  if (!ALLOWED.includes(parsed.data.role)) {
    return NextResponse.json(
      { message: "Role must be RO or Surveyor" },
      { status: 422 },
    );
  }

  try {
    const data = await createPerson(parsed.data);
    return NextResponse.json(
      {
        data,
        ok: true,
        message:
          parsed.data.role === "RO" || parsed.data.role === "Surveyor"
            ? "Created — approve before they can login"
            : "Created",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { message: "Email already in use", errors: { email: ["Taken"] } },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "INVALID_PARENT_RO") {
      return NextResponse.json(
        {
          message: "Select a verified RO first",
          errors: { parent_id: ["Invalid or unverified RO"] },
        },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "PARENT_RO_REQUIRED") {
      return NextResponse.json(
        {
          message: "Surveyor must be linked to an RO",
          errors: { parent_id: ["Required"] },
        },
        { status: 422 },
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await requireBothWithPermission("surveyor_edit");
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = personUpdateSchema.safeParse(body);
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
    if (error instanceof Error && error.message === "INVALID_ROLE") {
      return NextResponse.json({ message: "Invalid role" }, { status: 422 });
    }
    if (error instanceof Error && error.message === "INVALID_PARENT_RO") {
      return NextResponse.json(
        {
          message: "Select a verified RO first",
          errors: { parent_id: ["Invalid or unverified RO"] },
        },
        { status: 422 },
      );
    }
    if (error instanceof Error && error.message === "PARENT_RO_REQUIRED") {
      return NextResponse.json(
        {
          message: "Surveyor must be linked to an RO",
          errors: { parent_id: ["Required"] },
        },
        { status: 422 },
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireBothWithPermission("surveyor_delete");
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
