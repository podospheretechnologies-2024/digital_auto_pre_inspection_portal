"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { toast as notice } from "@/lib/toast";

import {
  InspectionMediaUpload,
  type UploadedPhoto,
} from "@/components/jobs/InspectionMediaUpload";
import { JobsNav } from "@/components/jobs/jobs-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LinkButton } from "@/components/ui/link-button";
import {
  CONDITION_OPTIONS,
  conditionFieldsFor,
  pdfPathForInspection,
  resolveWheelKind,
  type WheelKind,
} from "@/lib/jobs/helpers";
import { refreshJobSheets } from "@/lib/jobs/refresh-sheets";

export type VehicleInspectionMode = "create" | "edit" | "view" | "qc";

type Props = {
  jobId: number;
  vehicleType?: string;
  mode?: VehicleInspectionMode;
  /** Laravel skip-QC inspect (*-add-direct) — save with QC=1 */
  skipQc?: boolean;
};

type JobData = {
  id: number;
  vehicleno: string | null;
  cname: string | null;
  vehicle_type: string | null;
  bankname?: string;
  dti_no: string | null;
  company_id?: number | null;
  model_id?: number | null;
  variant_id?: number | null;
  company?: string;
  model?: string;
  variant?: string;
};

const CORE_DEFAULTS = {
  proposer: "",
  insurer_broker: "",
  vehicleno: "",
  chassisno: "",
  engineno: "",
  year_of_manufacture: "",
  odometer_reading: "",
  rc_verified: "Yes",
  inspection_place: "",
  insurer_ref_no: "",
  ins_broker_name: "",
  ins_broker_mobileno: "",
  ins_broker_mailid: "",
  ins_broker_agentcode: "",
  inspection_case: "No",
  inspection_type: "BREAK-IN",
  inspection_status: "",
  remarks: "",
  colour: "",
  fuel_used: "",
  stereo_make: "",
  tyre_of_body: "Three Wheeler",
  chassis_production_no: "",
  market_value: "",
  stepney_make_dot_no: "",
  rh_front_tyre_dot_no: "",
  lh_front_tyre_dot_no: "",
  lh_rear_tyre_dot_no: "",
  rh_rear_tyre_dot_no: "",
  cd_charger_make: "",
  other_electrical: "",
  seat_cover: "",
  center_lock: "",
  gear_locking: "",
  other_non_electrical: "",
  ownership_name: "",
  valuation_price: "",
  ctime: "" as "" | "AM" | "PM",
};

const FUEL_OPTIONS = ["Petrol", "Diesel", "LPG", "Electric"] as const;
const RC_OPTIONS = ["Yes", "No"] as const;
const CTIME_OPTIONS = ["AM", "PM"] as const;

function manufactureYearOptions(): string[] {
  const years: string[] = [];
  const current = new Date().getFullYear();
  for (let y = current; y >= 2000; y -= 1) years.push(String(y));
  years.push("NA");
  return years;
}

function labelize(key: string) {
  return key.replace(/_/g, " ");
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

/**
 * Parameterized Pre-Inspection form (2W/3W/4W).
 * Core identity fields + Safe/Not Safe condition grid + media upload.
 */
export function VehicleInspectionForm({
  jobId,
  vehicleType,
  mode: modeProp = "create",
  skipQc = false,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [core, setCore] = useState(CORE_DEFAULTS);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [conditions, setConditions] = useState<Record<string, string>>({});
  const [inspectionId, setInspectionId] = useState<number | null>(null);
  const [chassisphoto, setChassisphoto] = useState("");
  const [chassisphotoUrl, setChassisphotoUrl] = useState<string | null>(null);
  const [video, setVideo] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [newPhotos, setNewPhotos] = useState<UploadedPhoto[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<
    Array<{ id: number; url: string | null; image: string | null }>
  >([]);
  const [modeOverride, setModeOverride] = useState<VehicleInspectionMode | null>(
    null,
  );
  const mode = modeOverride ?? modeProp;

  const loadQuery = useQuery({
    queryKey: ["inspection", jobId, vehicleType],
    queryFn: async () => {
      const params = new URLSearchParams({ job_id: String(jobId) });
      if (vehicleType) params.set("type", vehicleType);
      return apiJson<{
        data: Record<string, unknown> | null;
        job: JobData;
        wheel_kind: WheelKind;
      }>(`/api/v2/jobs/inspections?${params}`);
    },
  });

  const brokersQuery = useQuery({
    queryKey: ["jobs-lookups-brokers"],
    queryFn: async () =>
      apiJson<{
        data: { brokers: Array<{ id: number; name: string }> };
      }>("/api/v2/jobs/lookups"),
    staleTime: 60_000,
  });
  const brokerNames = useMemo(() => {
    const names = (brokersQuery.data?.data?.brokers ?? [])
      .map((b) => b.name)
      .filter(Boolean);
    return names;
  }, [brokersQuery.data]);

  const yearOptions = useMemo(() => manufactureYearOptions(), []);

  const kind = useMemo(() => {
    if (loadQuery.data?.wheel_kind) return loadQuery.data.wheel_kind;
    return resolveWheelKind(vehicleType ?? loadQuery.data?.job?.vehicle_type);
  }, [loadQuery.data, vehicleType]);

  const conditionKeys = useMemo(() => conditionFieldsFor(kind), [kind]);

  useEffect(() => {
    const job = loadQuery.data?.job;
    const row = loadQuery.data?.data;
    if (!job && !row) return;

    queueMicrotask(() => {
      if (job && !row) {
        setCore((c) => ({
          ...c,
          proposer: job.cname ?? "",
          vehicleno: job.vehicleno ?? "",
        }));
      }
      if (row) {
        setInspectionId(Number(row.id));
        if (modeProp === "create") setModeOverride("edit");
        setCore({
          proposer: String(row.proposer ?? ""),
          insurer_broker: String(row.insurer_broker ?? ""),
          vehicleno: String(row.vehicleno ?? ""),
          chassisno: String(row.chassisno ?? ""),
          engineno: String(row.engineno ?? ""),
          year_of_manufacture: String(row.year_of_manufacture ?? ""),
          odometer_reading: String(row.odometer_reading ?? ""),
          rc_verified: String(row.rc_verified ?? "Yes"),
          inspection_place: String(row.inspection_place ?? ""),
          insurer_ref_no: String(row.insurer_ref_no ?? ""),
          ins_broker_name: String(row.ins_broker_name ?? ""),
          ins_broker_mobileno: String(row.ins_broker_mobileno ?? ""),
          ins_broker_mailid: String(row.ins_broker_mailid ?? ""),
          ins_broker_agentcode: String(row.ins_broker_agentcode ?? ""),
          inspection_case: String(row.inspection_case ?? "No"),
          inspection_type: String(row.inspection_type ?? "BREAK-IN"),
          inspection_status: String(row.inspection_status ?? ""),
          remarks: String(row.remarks ?? ""),
          colour: String(row.colour ?? ""),
          fuel_used: String(row.fuel_used ?? ""),
          stereo_make: String(row.stereo_make ?? ""),
          tyre_of_body: String(row.tyre_of_body ?? ""),
          chassis_production_no: String(row.chassis_production_no ?? ""),
          market_value: String(row.market_value ?? ""),
          stepney_make_dot_no: String(row.stepney_make_dot_no ?? ""),
          rh_front_tyre_dot_no: String(row.rh_front_tyre_dot_no ?? ""),
          lh_front_tyre_dot_no: String(row.lh_front_tyre_dot_no ?? ""),
          lh_rear_tyre_dot_no: String(row.lh_rear_tyre_dot_no ?? ""),
          rh_rear_tyre_dot_no: String(row.rh_rear_tyre_dot_no ?? ""),
          cd_charger_make: String(row.cd_charger_make ?? ""),
          other_electrical: String(row.other_electrical ?? ""),
          seat_cover: String(row.seat_cover ?? ""),
          center_lock: String(row.center_lock ?? ""),
          gear_locking: String(row.gear_locking ?? ""),
          other_non_electrical: String(row.other_non_electrical ?? ""),
          ownership_name: String(row.ownership_name ?? ""),
          valuation_price:
            row.valuation_price != null ? String(row.valuation_price) : "",
          ctime:
            row.ctime === "AM" || row.ctime === "PM"
              ? row.ctime
              : ("" as const),
        });
        setChassisphoto(String(row.chassisphoto ?? ""));
        setChassisphotoUrl(

        typeof row.chassisphoto_url === "string" ? row.chassisphoto_url : null,
      );
      setVideo(String(row.video ?? ""));
      setVideoUrl(typeof row.video_url === "string" ? row.video_url : null);
      const photoList = Array.isArray(row.photos)
        ? (row.photos as Array<{
            id: number;
            url: string | null;
            image: string | null;
          }>)
        : [];
      setExistingPhotos(photoList);
      setNewPhotos([]);
      const next: Record<string, string> = {};
      for (const key of conditionKeys) {
        const val = row[key];
        if (val != null && val !== "") next[key] = String(val);
        else next[key] = "Safe";
      }
      setConditions(next);
    } else if (conditionKeys.length && Object.keys(conditions).length === 0) {
      const next: Record<string, string> = {};
      for (const key of conditionKeys) next[key] = "Safe";
      setConditions(next);
    }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once when data arrives
  }, [loadQuery.data, conditionKeys]);

  async function persistInspection(forceSkipQc: boolean) {
    const jobRow = loadQuery.data?.job;
    const payload = {
      job_id: jobId,
      ...core,
      valuation_price: core.valuation_price
        ? Number(core.valuation_price)
        : null,
      ctime: core.ctime === "AM" || core.ctime === "PM" ? core.ctime : null,
      company_id: jobRow?.company_id ?? null,
      model_id: jobRow?.model_id ?? null,
      variant_id: jobRow?.variant_id ?? null,
      conditions,
      vehicle_type: kind,
      chassisphoto: chassisphoto || null,
      video: video || null,
      s3video_url: videoUrl,
      photos: newPhotos.map((p) => ({
        image: p.image,
        s3_url: p.s3_url ?? p.url ?? null,
      })),
      skip_qc: forceSkipQc || skipQc,
    };
    if (inspectionId) {
      return apiJson<{ data: { id: number } }>("/api/v2/jobs/inspections", {
        method: "PUT",
        body: JSON.stringify({ ...payload, inspection_id: inspectionId }),
      });
    }
    return apiJson<{ data: { id: number } }>("/api/v2/jobs/inspections", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  const saveMutation = useMutation({
    mutationFn: () => persistInspection(false),
    onSuccess: async (res) => {
      notice.success(
        skipQc ? "Inspection saved (QC skipped)" : "Inspection saved",
      );
      if (res?.data?.id) setInspectionId(res.data.id);
      setNewPhotos([]);
      void queryClient.invalidateQueries({ queryKey: ["inspection", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendToCompletedMutation = useMutation({
    mutationFn: () => persistInspection(true),
    onSuccess: async (res) => {
      if (res?.data?.id) setInspectionId(res.data.id);
      setNewPhotos([]);
      void queryClient.invalidateQueries({ queryKey: ["inspection", jobId] });
      notice.success("Sent to Completed");
      await refreshJobSheets(queryClient);
      router.push("/jobs/complete");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const readOnly = mode === "view";
  const job = loadQuery.data?.job;

  const coreFields = useMemo(() => {
    const base: Array<[keyof typeof CORE_DEFAULTS, string]> = [
      ["proposer", "Proposer"],
      ["insurer_broker", "Insurer / Broker"],
      ["inspection_place", "Inspection place"],
      ["insurer_ref_no", "Insurer ref no"],
      ["ins_broker_name", "Broker name"],
      ["ins_broker_mobileno", "Broker mobile"],
      ["ins_broker_mailid", "Broker email"],
      ["ins_broker_agentcode", "Agent code"],
      ["vehicleno", "Vehicle no"],
      ["chassisno", "Chassis no"],
      ["engineno", "Engine no"],
      ["year_of_manufacture", "Year of manufacture"],
      ["odometer_reading", "Odometer"],
      ["rc_verified", "RC verified"],
      ["inspection_case", "Inspection case"],
      ["inspection_type", "Inspection type"],
      ["inspection_status", "Inspection status"],
    ];
    if (kind === "4wheeler") {
      base.push(
        ["colour", "Colour"],
        ["fuel_used", "Fuel used"],
        ["stepney_make_dot_no", "Stepney DOT"],
        ["rh_front_tyre_dot_no", "RH front tyre DOT"],
        ["lh_front_tyre_dot_no", "LH front tyre DOT"],
        ["lh_rear_tyre_dot_no", "LH rear tyre DOT"],
        ["rh_rear_tyre_dot_no", "RH rear tyre DOT"],
        ["stereo_make", "Stereo make"],
        ["cd_charger_make", "CD changer make"],
        ["other_electrical", "Other electrical"],
        ["seat_cover", "Seat cover"],
        ["center_lock", "Centre lock"],
        ["gear_locking", "Gear locking"],
        ["other_non_electrical", "Other non-electrical"],
      );
    }
    if (kind === "3wheeler") {
      base.push(
        ["tyre_of_body", "Type of body"],
        ["fuel_used", "Fuel used"],
        ["chassis_production_no", "Chassis production no"],
        ["stereo_make", "Stereo make"],
        ["colour", "Colour"],
        ["market_value", "Market value"],
      );
    }
    return base;
  }, [kind]);

  const SELECT_FIELDS: Partial<
    Record<keyof typeof CORE_DEFAULTS, readonly string[]>
  > = {
    fuel_used: FUEL_OPTIONS,
    inspection_case: ["No", "Yes"],
    inspection_type: ["BREAK-IN", "NAME-TRANSFER", "ENDORSEMENT"],
    rc_verified: RC_OPTIONS,
    year_of_manufacture: yearOptions,
    insurer_broker: brokerNames.length ? brokerNames : undefined,
    ctime: CTIME_OPTIONS,
  };

  function firstMissingField() {
    for (const [key, label] of coreFields) {
      if (!String(core[key] ?? "").trim()) return { key: String(key), label };
    }
    if (!core.remarks.trim()) return { key: "remarks", label: "Remarks" };
    if (skipQc) {
      if (!core.ctime.trim()) {
        return { key: "ctime", label: "Submit time (AM/PM)" };
      }
      if (!core.ownership_name.trim()) {
        return { key: "ownership_name", label: "Ownership name" };
      }
      if (!core.valuation_price.trim()) {
        return { key: "valuation_price", label: "Valuation price" };
      }
    }
    return null;
  }

  function requireAllFilled() {
    const missing = firstMissingField();
    if (!missing) {
      setFieldError(null);
      return true;
    }
    setFieldError(missing.key);
    document.getElementById(`core-${missing.key}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return false;
  }

  function fieldNote(key: string, label: string) {
    if (fieldError !== key) return null;
    return (
      <p className="text-[11px] font-medium text-red-600">Fill {label}</p>
    );
  }

  return (
    <>
      <PageHeader
        title={`Inspect ${kind}${skipQc ? " (Skip QC)" : ""}`}
        description={
          job
            ? `${job.dti_no ?? job.id} — ${job.cname ?? ""} — ${job.vehicleno ?? ""}`
            : `Job #${jobId}`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {inspectionId ? (
              <LinkButton
                href={pdfPathForInspection(kind, inspectionId)}
                variant="outline"
                size="sm"
              >
                PDF
              </LinkButton>
            ) : null}
            <LinkButton href="/jobs/pending" variant="outline" size="sm">
              Pending list
            </LinkButton>
          </div>
        }
      />
      <JobsNav active="/jobs/pending" />

      {loadQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : loadQuery.isError ? (
        <p className="text-sm text-destructive">
          {(loadQuery.error as Error).message}
        </p>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Core details</CardTitle>
              <CardDescription>
                Mode={mode}
                {skipQc ? " · skip QC (admin)" : ""}
                {inspectionId ? ` · inspection #${inspectionId}` : " · new"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(job?.company || job?.model || job?.variant) && (
                <div className="mb-4 grid gap-3 rounded-lg border border-border/70 bg-muted/30 p-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Make
                    </p>
                    <p className="text-sm">{job.company || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Model
                    </p>
                    <p className="text-sm">{job.model || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Variant
                    </p>
                    <p className="text-sm">{job.variant || "—"}</p>
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {coreFields.map(([key, label]) => {
                  const options = SELECT_FIELDS[key];
                  const selectOptions =
                    options &&
                    key === "insurer_broker" &&
                    core.insurer_broker &&
                    !options.includes(core.insurer_broker)
                      ? [core.insurer_broker, ...options]
                      : options &&
                          key === "year_of_manufacture" &&
                          core.year_of_manufacture &&
                          !options.includes(core.year_of_manufacture)
                        ? [core.year_of_manufacture, ...options]
                        : options;
                  return (
                    <div key={key} id={`core-${key}`} className="scroll-mt-24 space-y-1.5">
                      <Label>{label}</Label>
                      {selectOptions ? (
                        <select
                          disabled={readOnly}
                          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${fieldError === key ? "border-red-500" : "border-input"}`}
                          value={core[key]}
                          onChange={(e) =>
                            setCore((c) => ({ ...c, [key]: e.target.value }))
                          }
                        >
                          <option value="">Select…</option>
                          {selectOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          disabled={readOnly}
                          value={core[key]}
                          className={fieldError === key ? "border-red-500" : undefined}
                          onChange={(e) =>
                            setCore((c) => ({ ...c, [key]: e.target.value }))
                          }
                        />
                      )}
                      {fieldNote(key, label)}
                    </div>
                  );
                })}
                {skipQc ? (
                  <>
                    <div id="core-ctime" className="scroll-mt-24 space-y-1.5">
                      <Label>Submit time (AM/PM)</Label>
                      <select
                        disabled={readOnly}
                        className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${fieldError === "ctime" ? "border-red-500" : "border-input"}`}
                        value={core.ctime}
                        onChange={(e) =>
                          setCore((c) => ({
                            ...c,
                            ctime: e.target.value as "" | "AM" | "PM",
                          }))
                        }
                      >
                        <option value="">Auto</option>
                        {CTIME_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {fieldNote("ctime", "Submit time (AM/PM)")}
                    </div>
                    <div id="core-ownership_name" className="scroll-mt-24 space-y-1.5">
                      <Label>Ownership name</Label>
                      <Input
                        disabled={readOnly}
                        value={core.ownership_name}
                        className={
                          fieldError === "ownership_name"
                            ? "border-red-500"
                            : undefined
                        }
                        onChange={(e) =>
                          setCore((c) => ({
                            ...c,
                            ownership_name: e.target.value,
                          }))
                        }
                      />
                      {fieldNote("ownership_name", "Ownership name")}
                    </div>
                    <div id="core-valuation_price" className="scroll-mt-24 space-y-1.5">
                      <Label>Valuation price</Label>
                      <Input
                        type="number"
                        disabled={readOnly}
                        value={core.valuation_price}
                        className={
                          fieldError === "valuation_price"
                            ? "border-red-500"
                            : undefined
                        }
                        onChange={(e) =>
                          setCore((c) => ({
                            ...c,
                            valuation_price: e.target.value,
                          }))
                        }
                      />
                      {fieldNote("valuation_price", "Valuation price")}
                    </div>
                  </>
                ) : null}
                <div id="core-remarks" className="scroll-mt-24 space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <Label>Remarks</Label>
                  <Textarea
                    disabled={readOnly}
                    value={core.remarks}
                    className={fieldError === "remarks" ? "border-red-500" : undefined}
                    onChange={(e) =>
                      setCore((c) => ({ ...c, remarks: e.target.value }))
                    }
                  />
                  {fieldNote("remarks", "Remarks")}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Photos & video</CardTitle>
              <CardDescription>
                Uploads via POST /api/v2/files/upload (S3/MinIO). Requires
                storage env when adding new media.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InspectionMediaUpload
                disabled={readOnly}
                wheelKind={kind}
                chassisphoto={chassisphoto}
                chassisphotoUrl={chassisphotoUrl}
                video={video}
                videoUrl={videoUrl}
                photos={newPhotos}
                existingPhotoUrls={existingPhotos}
                onChassisChange={(filename, url) => {
                  setChassisphoto(filename);
                  setChassisphotoUrl(url ?? null);
                }}
                onVideoChange={(filename, url) => {
                  setVideo(filename);
                  setVideoUrl(url ?? null);
                }}
                onPhotosChange={setNewPhotos}
                onExistingDeleted={(id) =>
                  setExistingPhotos((rows) => rows.filter((r) => r.id !== id))
                }
              />
            </CardContent>
          </Card>

          <Card className="mb-6 border-border/80 shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Condition checklist</CardTitle>
                <CardDescription>
                  {conditionKeys.length} parts — values stored as Safe / Not
                  Safe / N/A
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Safe
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-700">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  N/A
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-red-700">
                  <span className="size-1.5 rounded-full bg-red-500" />
                  Not Safe
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {conditionKeys.map((key) => {
                  const value = conditions[key] ?? "Safe";
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-border/80 bg-card p-3 shadow-xs"
                    >
                      <p className="mb-2 text-sm font-medium capitalize">
                        {labelize(key)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {CONDITION_OPTIONS.map((option) => {
                          const active = value === option;
                          const tone =
                            option === "Safe"
                              ? active
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
                              : option === "Not Safe"
                                ? active
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-red-200 bg-red-50 text-red-800 hover:border-red-400"
                                : active
                                  ? "border-amber-600 bg-amber-600 text-white"
                                  : "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-400";
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={readOnly}
                              onClick={() =>
                                setConditions((c) => ({
                                  ...c,
                                  [key]: option,
                                }))
                              }
                              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${tone}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {!readOnly ? (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button
                size="lg"
                disabled={
                  saveMutation.isPending || sendToCompletedMutation.isPending
                }
                onClick={() => {
                  if (!requireAllFilled()) return;
                  saveMutation.mutate();
                }}
              >
                {saveMutation.isPending
                  ? "Saving…"
                  : skipQc
                    ? "Submit & skip QC"
                    : inspectionId
                      ? "Update inspection"
                      : "Save inspection"}
              </Button>
              {!skipQc ? (
                <Button
                  variant="outline"
                  size="lg"
                  disabled={
                    saveMutation.isPending || sendToCompletedMutation.isPending
                  }
                  onClick={() => {
                    if (!requireAllFilled()) return;
                    sendToCompletedMutation.mutate();
                  }}
                >
                  {sendToCompletedMutation.isPending
                    ? "Sending…"
                    : "Send to Completed"}
                </Button>
              ) : null}
              <p className="w-full text-xs text-muted-foreground sm:w-auto">
                Inspections are logged and reviewed for quality assurance.
              </p>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
