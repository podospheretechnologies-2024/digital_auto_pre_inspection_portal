import { VehicleInspectionForm } from "@/components/jobs/VehicleInspectionForm";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    type?: string;
    mode?: string;
    skip_qc?: string;
  }>;
};

export default async function InspectJobPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { type, mode: modeParam, skip_qc } = await searchParams;
  const jobId = Number(id);

  const vehicleType =
    type === "2w" || type === "2wheeler"
      ? "2wheeler"
      : type === "3w" || type === "3wheeler"
        ? "3wheeler"
        : type === "4w" || type === "4wheeler"
          ? "4wheeler"
          : undefined;

  const mode =
    modeParam === "edit" ||
    modeParam === "view" ||
    modeParam === "qc" ||
    modeParam === "create"
      ? modeParam
      : "create";

  const skipQc = skip_qc === "1" || skip_qc === "true";

  return (
    <VehicleInspectionForm
      jobId={jobId}
      vehicleType={vehicleType}
      mode={mode}
      skipQc={skipQc}
    />
  );
}
