import { NextResponse } from "next/server";

export function jobActionError(error: unknown, label: string) {
  const code = error instanceof Error ? error.message : "";
  if (code === "NOT_FOUND") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (code === "CANCELLED") {
    return NextResponse.json(
      { message: "Job is cancelled — restore first" },
      { status: 422 },
    );
  }
  if (code === "COMPLETED") {
    return NextResponse.json(
      { message: "Completed cases cannot be changed this way" },
      { status: 422 },
    );
  }
  if (code === "ALREADY_ASSIGNED") {
    return NextResponse.json(
      { message: "This case is already assigned to a surveyor" },
      { status: 422 },
    );
  }
  if (code === "CONFLICT") {
    return NextResponse.json(
      { message: "This case was updated by someone else. Refresh and try again." },
      { status: 409 },
    );
  }
  if (code === "INVALID_SURVEYOR") {
    return NextResponse.json(
      {
        message: "Assign only a verified Surveyor linked to an RO (parent_id)",
      },
      { status: 422 },
    );
  }
  if (code === "INVALID_PARENT_RO") {
    return NextResponse.json(
      { message: "Surveyor's parent RO is missing or not verified" },
      { status: 422 },
    );
  }
  if (code === "INVALID_TRANSITION") {
    return NextResponse.json(
      { message: "That stage change is not allowed from here" },
      { status: 422 },
    );
  }
  if (code === "NO_INSPECTION") {
    return NextResponse.json(
      { message: "No inspection found for this case" },
      { status: 422 },
    );
  }
  if (code === "NO_AGENT") {
    return NextResponse.json(
      { message: "Case has no assigned surveyor" },
      { status: 422 },
    );
  }
  console.error(label, error);
  return NextResponse.json({ message: "Request failed" }, { status: 500 });
}
