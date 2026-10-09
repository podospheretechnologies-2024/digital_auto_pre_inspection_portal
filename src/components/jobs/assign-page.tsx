"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Banknote,
  Boxes,
  Calendar,
  Car,
  Factory,
  FileDigit,
  Check,
  ClipboardPlus,
  CloudUpload,
  CreditCard,
  Eye,
  Hash,
  ImageIcon,
  ImagePlus,
  Landmark,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Truck,
  X,
  UserPlus,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { toast as notice } from "@/lib/toast";

import { RegPlate } from "@/components/atlas/reg-plate";
import { CaseListToolbar } from "@/components/jobs/case-list-toolbar";
import { ChangeStageButton } from "@/components/jobs/change-stage-button";
import { JobHistoryButton } from "@/components/jobs/job-history-button";
import {
  JobActionButton,
  JobActions,
  JobDtiCell,
  JobMetaLine,
  JobSerialCell,
  JobSerialHead,
  JobsListingCard,
  JobsTable,
  JobsTableCell,
  JobsTableHead,
  JobsTableHeader,
  JobsTableRow,
  SheetBank,
  SheetDateTime,
  SheetPager,
  SheetPerson,
  TableBody,
  useSheetPage,
} from "@/components/jobs/jobs-listing";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_CASE_FILTERS,
  filterCaseRows,
  uniqueSorted,
  type CaseListFilterState,
} from "@/lib/jobs/case-list-filters";
import { paymentModes, vehicleTypes } from "@/lib/jobs/schemas";
import { resolveWheelKind } from "@/lib/jobs/helpers";
import { refreshJobSheets } from "@/lib/jobs/refresh-sheets";
import { cn } from "@/lib/utils";

type LookupItem = { id: number; name: string };
type AgentItem = LookupItem & {
  type?: string | null;
  email?: string | null;
  city_id?: number | null;
  parent_id?: number | null;
};
type VariantItem = LookupItem & {
  vehicle_type?: string;
  model_id: number;
  company_id: number;
};
type ModelItem = LookupItem & { company_id: number };

type JobRow = {
  id: number;
  status: string;
  dti_no: string | null;
  cname: string | null;
  mobileno: string | null;
  vehicleno: string | null;
  vehicle_type: string | null;
  bank_id?: number | null;
  company_id?: number | null;
  model_id?: number | null;
  variant_id?: number | null;
  address?: string | null;
  mode?: string | null;
  remark?: string | null;
  bankname?: string;
  company?: string;
  model?: string;
  variant?: string;
  agent_name?: string;
  agent_id: number | null;
  bank_ref_no: string | null;
  cdate: string | null;
  created_at: string | null;
  stage_reason?: string | null;
  assigned_at?: string | null;
  hold_at?: string | null;
  cancelled_at?: string | null;
};

/** Keep outside page component so inputs don't remount (and lose focus) on each keystroke. */
function FormSection({
  icon: Icon,
  title,
  children,
  panel = false,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  panel?: boolean;
}) {
  return (
    <section
      className={
        panel
          ? "rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:p-4"
          : "space-y-2.5"
      }
    >
      <div
        className={cn(
          "flex items-center gap-2",
          panel ? "mb-3.5" : "border-b border-border/60 pb-1.5",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
            title === "Bank" || title === "Vehicle" ? "size-5" : "size-6",
          )}
        >
          <Icon
            className={title === "Bank" || title === "Vehicle" ? "size-3" : "size-3.5"}
            strokeWidth={1.75}
          />
        </span>
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-foreground uppercase">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor?: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-3" strokeWidth={1.75} />
      </span>
      {children}
    </Label>
  );
}

const createEmptyForm = () => ({
  cdate: new Date().toISOString().slice(0, 10),
  cname: "",
  mobileno: "",
  address: "",
  mode: "Company" as (typeof paymentModes)[number],
  bank_id: "",
  bank_ref_no: "",
  vehicle_type: "4 Wheeler" as (typeof vehicleTypes)[number],
  vehicleno: "",
  company_id: "",
  model_id: "",
  variant_id: "",
  remark: "",
});

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as {
    message?: string;
    errors?: Record<string, string[] | undefined>;
  } & T;
  if (!res.ok) {
    const fieldErrors = json.errors
      ? Object.entries(json.errors)
          .flatMap(([key, msgs]) =>
            (msgs ?? []).map((m) => `${key}: ${m}`),
          )
          .join("; ")
      : "";
    throw new Error(fieldErrors || json.message || "Request failed");
  }
  return json as T;
}

type AssignPageProps = {
  /** fresh = unassigned list; schedule = assigned not inspected; assign = both + create */
  mode?: "assign" | "fresh" | "schedule";
};

export function AssignJobsPage({ mode = "assign" }: AssignPageProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CaseListFilterState>(EMPTY_CASE_FILTERS);
  const [form, setForm] = useState(createEmptyForm);
  const [fieldError, setFieldError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [assignJob, setAssignJob] = useState<JobRow | null>(null);
  const [selectedRoId, setSelectedRoId] = useState("");
  const [selectedSurveyorId, setSelectedSurveyorId] = useState("");
  const [createdCase, setCreatedCase] = useState<{
    id: number;
    dti_no: string;
    cname: string | null;
    vehicleno: string;
  } | null>(null);
  const [cancelJobId, setCancelJobId] = useState<number | null>(null);
  const [holdJobId, setHoldJobId] = useState<number | null>(null);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [confirmSubmitQc, setConfirmSubmitQc] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(createEmptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [uploadJob, setUploadJob] = useState<JobRow | null>(null);
  const [uploadPhotos, setUploadPhotos] = useState<
    Array<{
      image: string;
      s3_url?: string | null;
      url?: string | null;
      id?: number;
      preview?: string | null;
    }>
  >([]);
  const [pendingUploads, setPendingUploads] = useState<
    Array<{ localId: string; file: File; preview: string }>
  >([]);
  const [uploadInspectionId, setUploadInspectionId] = useState<number | null>(
    null,
  );
  const [uploadInspCore, setUploadInspCore] = useState<{
    proposer: string;
    insurer_broker: string;
    vehicleno: string;
    chassisno: string;
    engineno: string;
    year_of_manufacture: string;
    odometer_reading: string;
    rc_verified: string;
    company_id: number | null;
    model_id: number | null;
    variant_id: number | null;
  } | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploadViewSrc, setUploadViewSrc] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const listKey =
    mode === "fresh" ? "fresh" : mode === "schedule" ? "schedule" : "fresh";

  const listQuery = useQuery({
    queryKey: ["jobs", listKey],
    queryFn: async () => {
      const json = await apiJson<{ data: JobRow[] }>(
        `/api/v2/jobs?list=${listKey}&limit=100`,
        { cache: "no-store" },
      );
      return json.data;
    },
    enabled: mode !== "assign",
  });

  const cascadeCompanyId =
    editingJobId != null ? editForm.company_id : form.company_id;
  const cascadeModelId =
    editingJobId != null ? editForm.model_id : form.model_id;

  const lookupsQuery = useQuery({
    queryKey: ["jobs-lookups", cascadeCompanyId, cascadeModelId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cascadeCompanyId) params.set("company_id", cascadeCompanyId);
      if (cascadeModelId) params.set("model_id", cascadeModelId);
      const qs = params.toString();
      const json = await apiJson<{
        data: {
          banks: LookupItem[];
          companies: LookupItem[];
          models: ModelItem[];
          variants: VariantItem[];
          agents: AgentItem[];
        };
      }>(`/api/v2/jobs/lookups${qs ? `?${qs}` : ""}`);
      return json.data;
    },
    // Keep previous dropdown options while cascading — avoids flicker / focus jank
    placeholderData: (previous) => previous,
  });

  const banks = lookupsQuery.data?.banks ?? [];
  const companies = lookupsQuery.data?.companies ?? [];
  const models = useMemo(
    () => lookupsQuery.data?.models ?? [],
    [lookupsQuery.data?.models],
  );
  const variants = useMemo(
    () => lookupsQuery.data?.variants ?? [],
    [lookupsQuery.data?.variants],
  );
  const agents = lookupsQuery.data?.agents ?? [];
  const roAgents = useMemo(
    () => agents.filter((a) => a.type === "RO"),
    [agents],
  );
  const selectedRo = useMemo(
    () => roAgents.find((a) => String(a.id) === selectedRoId) ?? null,
    [roAgents, selectedRoId],
  );
  const surveyorsUnderRo = useMemo(() => {
    if (!selectedRo) return [];
    return agents.filter(
      (a) =>
        a.type === "Surveyor" &&
        a.parent_id != null &&
        a.parent_id === selectedRo.id,
    );
  }, [agents, selectedRo]);

  const closeAssignDialog = () => {
    setAssignJob(null);
    setSelectedRoId("");
    setSelectedSurveyorId("");
  };

  function toDateInput(value: string | Date | null | undefined): string {
    if (!value) return new Date().toISOString().slice(0, 10);
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  async function openEditDialog(job: JobRow) {
    setEditingJobId(job.id);
    setEditLoading(true);
    try {
      const json = await apiJson<{
        data: {
          id: number;
          cdate: string | null;
          cname: string | null;
          mobileno: string | null;
          address: string | null;
          mode: string | null;
          bank_id: number | null;
          bank_ref_no: string | null;
          vehicle_type: string | null;
          vehicleno: string | null;
          company_id: number | null;
          model_id: number | null;
          variant_id: number | null;
          remark: string | null;
        };
      }>(`/api/v2/jobs/${job.id}`);
      const d = json.data;
      const vehicleType = (vehicleTypes as readonly string[]).includes(
        d.vehicle_type ?? "",
      )
        ? (d.vehicle_type as (typeof vehicleTypes)[number])
        : "4 Wheeler";
      const payMode = (paymentModes as readonly string[]).includes(d.mode ?? "")
        ? (d.mode as (typeof paymentModes)[number])
        : "Company";
      setEditForm({
        cdate: toDateInput(d.cdate),
        cname: d.cname ?? "",
        mobileno: d.mobileno ?? "",
        address: d.address ?? "",
        mode: payMode,
        bank_id: d.bank_id != null ? String(d.bank_id) : "",
        bank_ref_no: d.bank_ref_no ?? "",
        vehicle_type: vehicleType,
        vehicleno: d.vehicleno ?? "",
        company_id: d.company_id != null ? String(d.company_id) : "",
        model_id: d.model_id != null ? String(d.model_id) : "",
        variant_id: d.variant_id != null ? String(d.variant_id) : "",
        remark: d.remark ?? "",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load case");
      setEditingJobId(null);
    } finally {
      setEditLoading(false);
    }
  }

  const closeEditDialog = () => {
    setEditingJobId(null);
    setEditForm(createEmptyForm());
    setEditLoading(false);
  };

  /** Browser-safe thumbnail URL for local Next public uploads (avoids LEGACY_APP_URL). */
  function uploadPhotoSrc(photo: {
    image: string;
    s3_url?: string | null;
    url?: string | null;
    preview?: string | null;
  }): string {
    const filename = photo.image.replace(/^.*[/\\]/, "").trim();
    const candidates = [photo.preview, photo.url, photo.s3_url].filter(
      (v): v is string => Boolean(v && String(v).trim()),
    );
    for (const raw of candidates) {
      const c = raw.trim();
      if (c.startsWith("blob:")) return c;
      if (c.startsWith("/") && !c.startsWith("//")) {
        return c.replace(/^\/public(?=\/)/, "");
      }
      const legacyMatch = c.match(
        /\/(?:public\/)?upload_images\/([^?#]+)/i,
      );
      if (legacyMatch?.[1]) {
        return `/upload_images/${decodeURIComponent(legacyMatch[1])}`;
      }
      if (/^https?:\/\//i.test(c) && !/127\.0\.0\.1:8000|localhost:8000/i.test(c)) {
        return c;
      }
    }
    return filename ? `/upload_images/${filename}` : "";
  }

  function mapInspectionPhoto(p: {
    id: number;
    image: string | null;
    s3_url?: string | null;
    url?: string | null;
  }, blobPreview?: string | null) {
    const image = String(p.image);
    const mapped = {
      id: p.id,
      image,
      s3_url: p.s3_url ?? p.url,
      url: p.url ?? p.s3_url,
      preview: blobPreview || null,
    };
    return {
      ...mapped,
      preview: blobPreview || uploadPhotoSrc(mapped),
      url: uploadPhotoSrc(mapped),
    };
  }

  function closeUploadDialog() {
    for (const p of uploadPhotos) {
      if (p.preview?.startsWith("blob:")) URL.revokeObjectURL(p.preview);
    }
    for (const p of pendingUploads) {
      if (p.preview.startsWith("blob:")) URL.revokeObjectURL(p.preview);
    }
    setUploadJob(null);
    setUploadPhotos([]);
    setPendingUploads([]);
    setUploadInspectionId(null);
    setUploadInspCore(null);
    setUploadBusy(false);
    setUploadProgress(null);
    setUploadDragOver(false);
    setUploadViewSrc(null);
  }

  async function openUploadDialog(job: JobRow) {
    setUploadJob(job);
    setUploadPhotos([]);
    setPendingUploads([]);
    setUploadInspectionId(null);
    setUploadInspCore(null);
    setUploadProgress(null);
    setUploadBusy(true);
    try {
      const kind = resolveWheelKind(job.vehicle_type);
      const json = await apiJson<{
        data: {
          id: number;
          proposer?: string | null;
          insurer_broker?: string | null;
          vehicleno?: string | null;
          chassisno?: string | null;
          engineno?: string | null;
          year_of_manufacture?: string | null;
          odometer_reading?: string | null;
          rc_verified?: string | null;
          company_id?: number | null;
          model_id?: number | null;
          variant_id?: number | null;
          photos?: Array<{
            id: number;
            image: string | null;
            s3_url?: string | null;
            url?: string | null;
          }>;
        } | null;
      }>(`/api/v2/jobs/inspections?job_id=${job.id}&type=${kind}`);
      if (json.data?.id) {
        const d = json.data;
        setUploadInspectionId(d.id);
        setUploadInspCore({
          proposer: d.proposer || job.cname || "Customer",
          insurer_broker: d.insurer_broker || job.bankname || "Bank",
          vehicleno: d.vehicleno || job.vehicleno || "UNKNOWN",
          chassisno: d.chassisno || "PENDING",
          engineno: d.engineno || "PENDING",
          year_of_manufacture: d.year_of_manufacture || "PENDING",
          odometer_reading: d.odometer_reading || "0",
          rc_verified: d.rc_verified || "Pending",
          company_id: d.company_id ?? job.company_id ?? null,
          model_id: d.model_id ?? job.model_id ?? null,
          variant_id: d.variant_id ?? job.variant_id ?? null,
        });
        setUploadPhotos(
          (d.photos ?? [])
            .filter((p) => p.image)
            .map((p) => mapInspectionPhoto(p)),
        );
      }
    } catch {
      // No inspection yet — fine
    } finally {
      setUploadBusy(false);
    }
  }

  function inspectionPayloadFromJob(
    job: JobRow,
    photos: Array<{ image: string; s3_url?: string | null }>,
    kind: ReturnType<typeof resolveWheelKind>,
  ) {
    return {
      job_id: job.id,
      vehicle_type: kind,
      proposer: (job.cname ?? "Customer").trim() || "Customer",
      insurer_broker: (job.bankname ?? "Bank").trim() || "Bank",
      vehicleno: (job.vehicleno ?? "UNKNOWN").trim() || "UNKNOWN",
      chassisno: "PENDING",
      engineno: "PENDING",
      year_of_manufacture: "PENDING",
      odometer_reading: "0",
      rc_verified: "Pending",
      company_id: job.company_id ?? null,
      model_id: job.model_id ?? null,
      variant_id: job.variant_id ?? null,
      photos,
      skip_qc: false,
    };
  }

  type SyncedPhoto = {
    id?: number;
    image: string;
    s3_url?: string | null;
    url?: string | null;
    preview?: string | null;
  };

  async function syncUploadedPhotos(
    job: JobRow,
    photos: Array<{ image: string; s3_url?: string | null }>,
    inspectionId: number | null,
  ): Promise<{ id: number; photos: SyncedPhoto[] }> {
    const kind = resolveWheelKind(job.vehicle_type);
    type InspResp = {
      data: {
        id: number;
        proposer?: string | null;
        insurer_broker?: string | null;
        vehicleno?: string | null;
        chassisno?: string | null;
        engineno?: string | null;
        year_of_manufacture?: string | null;
        odometer_reading?: string | null;
        rc_verified?: string | null;
        company_id?: number | null;
        model_id?: number | null;
        variant_id?: number | null;
        photos?: Array<{
          id: number;
          image: string | null;
          s3_url?: string | null;
          url?: string | null;
        }>;
      };
    };

    if (inspectionId) {
      const core =
        uploadInspCore ??
        ({
          proposer: job.cname || "Customer",
          insurer_broker: job.bankname || "Bank",
          vehicleno: job.vehicleno || "UNKNOWN",
          chassisno: "PENDING",
          engineno: "PENDING",
          year_of_manufacture: "PENDING",
          odometer_reading: "0",
          rc_verified: "Pending",
          company_id: job.company_id ?? null,
          model_id: job.model_id ?? null,
          variant_id: job.variant_id ?? null,
        } as const);
      const updated = await apiJson<InspResp>("/api/v2/jobs/inspections", {
        method: "PUT",
        body: JSON.stringify({
          inspection_id: inspectionId,
          job_id: job.id,
          vehicle_type: kind,
          ...core,
          photos,
          skip_qc: false,
        }),
      });
      setUploadInspCore(core);
      return {
        id: inspectionId,
        photos: (updated.data.photos ?? [])
          .filter((p) => p.image)
          .map((p) => mapInspectionPhoto(p)),
      };
    }

    try {
      const created = await apiJson<InspResp>("/api/v2/jobs/inspections", {
        method: "POST",
        body: JSON.stringify(inspectionPayloadFromJob(job, photos, kind)),
      });
      const d = created.data;
      setUploadInspCore({
        proposer: d.proposer || job.cname || "Customer",
        insurer_broker: d.insurer_broker || job.bankname || "Bank",
        vehicleno: d.vehicleno || job.vehicleno || "UNKNOWN",
        chassisno: d.chassisno || "PENDING",
        engineno: d.engineno || "PENDING",
        year_of_manufacture: d.year_of_manufacture || "PENDING",
        odometer_reading: d.odometer_reading || "0",
        rc_verified: d.rc_verified || "Pending",
        company_id: d.company_id ?? job.company_id ?? null,
        model_id: d.model_id ?? job.model_id ?? null,
        variant_id: d.variant_id ?? job.variant_id ?? null,
      });
      return {
        id: d.id,
        photos: (d.photos ?? [])
          .filter((p) => p.image)
          .map((p) => mapInspectionPhoto(p)),
      };
    } catch (error) {
      const again = await apiJson<{
        data: { id: number } | null;
      }>(`/api/v2/jobs/inspections?job_id=${job.id}&type=${kind}`);
      if (again.data?.id) {
        return syncUploadedPhotos(job, photos, again.data.id);
      }
      throw error;
    }
  }

  function stageUploadFiles(files: FileList | File[] | null) {
    if (!files || !uploadJob) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast.error("Please choose image files only");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    const tooBig = list.filter((f) => f.size > maxBytes);
    const ok = list.filter((f) => f.size <= maxBytes);
    if (tooBig.length) {
      toast.error(`${tooBig.length} file(s) skipped (over 5MB)`);
    }
    const room = Math.max(0, 30 - uploadPhotos.length - pendingUploads.length);
    if (room === 0) {
      toast.error("Maximum 30 images reached");
      return;
    }
    const batch = ok.slice(0, room);
    if (batch.length === 0) return;
    setPendingUploads((prev) => [
      ...prev,
      ...batch.map((file) => ({
        localId: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    if (ok.length > room) {
      toast.message(`Only ${room} more image(s) can be added`);
    }
  }

  async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    ms: number,
  ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error("Upload timed out — please try again");
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  async function uploadOneFile(file: File): Promise<{
    image: string;
    s3_url: string;
    url: string;
  }> {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 48);
    const key = `upload_images/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("key", key);
    const res = await fetchWithTimeout(
      "/api/v2/files/upload",
      { method: "POST", body: formData },
      45000,
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || json.message || "Upload failed");
    }
    const storedKey = String(json.stored?.key ?? key);
    const storedUrl = String(json.stored?.url ?? "");
    const filename = storedKey.replace(/^.*[/\\]/, "") || safe;
    const publicUrl = `/upload_images/${filename}`;
    const s3ForDb =
      storedUrl.startsWith("http") &&
      !/127\.0\.0\.1:8000|localhost:8000|\/public\/upload_images\//i.test(
        storedUrl,
      )
        ? storedUrl
        : publicUrl;
    return { image: filename, s3_url: s3ForDb, url: publicUrl };
  }

  async function runUploadPending() {
    if (!uploadJob) return;
    if (pendingUploads.length === 0) {
      toast.error("Select images first");
      return;
    }
    const batch = [...pendingUploads];
    setUploadBusy(true);
    setUploadProgress({ done: 0, total: batch.length });
    try {
      const added: Array<{
        image: string;
        s3_url?: string | null;
        url?: string | null;
        preview?: string | null;
      }> = new Array(batch.length);

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const stored = await uploadOneFile(item.file);
        added[i] = {
          ...stored,
          preview: item.preview,
        };
        setUploadProgress({ done: i + 1, total: batch.length });
      }

      // File(s) on disk — now persist to DB (was hanging on Redis SMS before)
      setUploadProgress(null);

      const synced = await syncUploadedPhotos(
        uploadJob,
        added.map((a) => ({ image: a.image, s3_url: a.s3_url })),
        uploadInspectionId,
      );
      setUploadInspectionId(synced.id);

      const blobByName = new Map(
        added.map((a) => [a.image, a.preview ?? null] as const),
      );
      if (synced.photos.length > 0) {
        setUploadPhotos(
          synced.photos.map((p) =>
            mapInspectionPhoto(
              {
                id: p.id ?? 0,
                image: p.image,
                s3_url: p.s3_url,
                url: p.url,
              },
              blobByName.get(p.image.replace(/^.*[/\\]/, "")) ?? null,
            ),
          ),
        );
      } else {
        setUploadPhotos((prev) => [...prev, ...added]);
      }
      setPendingUploads([]);
      toast.success(`${added.length} image(s) saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadBusy(false);
      setUploadProgress(null);
    }
  }

  function removePendingUpload(localId: string) {
    setPendingUploads((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (target?.preview.startsWith("blob:")) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((p) => p.localId !== localId);
    });
  }

  async function removeUploadPhoto(index: number) {
    const photo = uploadPhotos[index];
    if (!photo || !uploadJob) return;
    setUploadBusy(true);
    try {
      if (photo.id != null) {
        const kind = resolveWheelKind(uploadJob.vehicle_type);
        const res = await fetch("/api/v2/jobs/images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, image_id: photo.id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Delete failed");
      }
      if (photo.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(photo.preview);
      }
      setUploadPhotos((prev) => prev.filter((_, i) => i !== index));
      toast.success("Image removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setUploadBusy(false);
    }
  }

  const submitToQcMutation = useMutation({
    mutationFn: async () => {
      if (!uploadJob) throw new Error("No case selected");
      if (pendingUploads.length > 0) {
        throw new Error("Click Upload Images first to save selected files");
      }
      if (uploadPhotos.length === 0) {
        throw new Error("Upload at least one image first");
      }
      if (!uploadInspectionId) {
        const synced = await syncUploadedPhotos(
          uploadJob,
          uploadPhotos,
          null,
        );
        setUploadInspectionId(synced.id);
      }
      return true;
    },
    onSuccess: async () => {
      notice.success("Submitted to Quality Check");
      closeUploadDialog();
      await refreshJobSheets(queryClient);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const createMutation = useMutation({
    mutationFn: async () => {
      const mobile = form.mobileno.replace(/\D/g, "");
      return apiJson<{ data: { id: number; dti_no: string; cname: string | null; vehicleno: string } }>(
        "/api/v2/jobs",
        {
          method: "POST",
          body: JSON.stringify({
            cdate: form.cdate,
            cname: form.cname.trim(),
            mobileno: mobile,
            address: form.address.trim(),
            mode: form.mode,
            bank_id: Number(form.bank_id),
            bank_ref_no: form.bank_ref_no.trim(),
            vehicle_type: form.vehicle_type,
            vehicleno: form.vehicleno.trim().toUpperCase(),
            company_id: Number(form.company_id),
            model_id: Number(form.model_id),
            variant_id: Number(form.variant_id),
            agent_id: null,
            remark: form.remark.trim() || null,
          }),
        },
      );
    },
    onSuccess: (res) => {
      setCreatedCase(res.data);
      setForm(createEmptyForm());
      setFieldError(null);
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: async ({
      jobId,
      agentId,
    }: {
      jobId: number;
      agentId: number;
    }) =>
      apiJson(`/api/v2/jobs/${jobId}/assign`, {
        method: "POST",
        body: JSON.stringify({ agent_id: agentId }),
      }),
    onSuccess: async () => {
      notice.success("Case assigned — moved to Assign Case queue");
      closeAssignDialog();
      await refreshJobSheets(queryClient);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const workflowMutation = useMutation({
    mutationFn: ({
      jobId,
      action,
    }: {
      jobId: number;
      action: "hold" | "cancel";
    }) =>
      apiJson(`/api/v2/jobs/${jobId}/workflow`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: async (_d, vars) => {
      notice.success(vars.action === "hold" ? "Moved to Hold" : "Cancelled");
      await refreshJobSheets(queryClient);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (editingJobId == null) throw new Error("No case selected");
      const missing: string[] = [];
      if (!editForm.cdate) missing.push("Date");
      if (!editForm.cname.trim()) missing.push("Customer name");
      if (!editForm.mobileno.trim()) missing.push("Mobile");
      if (!editForm.address.trim()) missing.push("Address");
      if (!editForm.bank_id) missing.push("Bank");
      if (!editForm.bank_ref_no.trim()) missing.push("Bank ref no");
      if (!editForm.vehicleno.trim()) missing.push("Vehicle no");
      if (!editForm.company_id) missing.push("Company");
      if (!editForm.model_id) missing.push("Model");
      if (!editForm.variant_id) missing.push("Variant");
      if (missing.length > 0) {
        throw new Error(`Please fill: ${missing.join(", ")}`);
      }
      const mobile = editForm.mobileno.replace(/\D/g, "");
      if (mobile.length < 10) {
        throw new Error("Mobile must be at least 10 digits");
      }
      return apiJson(`/api/v2/jobs/${editingJobId}`, {
        method: "PUT",
        body: JSON.stringify({
          id: editingJobId,
          cdate: editForm.cdate,
          cname: editForm.cname.trim(),
          mobileno: mobile,
          address: editForm.address.trim(),
          mode: editForm.mode,
          bank_id: Number(editForm.bank_id),
          bank_ref_no: editForm.bank_ref_no.trim(),
          vehicle_type: editForm.vehicle_type,
          vehicleno: editForm.vehicleno.trim().toUpperCase(),
          company_id: Number(editForm.company_id),
          model_id: Number(editForm.model_id),
          variant_id: Number(editForm.variant_id),
          remark: editForm.remark.trim() || null,
        }),
      });
    },
    onSuccess: () => {
      notice.success("Case updated");
      closeEditDialog();
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const title =
    mode === "fresh"
      ? "Fresh Case"
      : mode === "schedule"
        ? "Assign Case"
        : "Create Intimation";

  const description =
    mode === "fresh"
      ? "Unassigned cases waiting for a surveyor. Assign an agent to move the case forward."
      : mode === "schedule"
        ? "Assigned cases pending inspection. Open the form to upload images and submit."
        : "Enter customer, bank and vehicle details to open a new pre-inspection case.";

  const badge =
    mode === "fresh"
      ? "Unassigned"
      : mode === "schedule"
        ? "Assigned"
        : "New case";

  const allListRows = listQuery.data ?? [];
  const listBanks = useMemo(
    () => uniqueSorted(allListRows.map((r) => r.bankname)),
    [allListRows],
  );
  const listSurveyors = useMemo(
    () => uniqueSorted(allListRows.map((r) => r.agent_name)),
    [allListRows],
  );
  const filteredListRows = useMemo(
    () =>
      filterCaseRows(
        allListRows,
        filters,
        mode === "schedule" ? "assigned" : "created",
      ),
    [allListRows, filters, mode],
  );
  const sheet = useSheetPage(filteredListRows);

  function nextCreateFieldError() {
    if (!form.cdate) return { id: "cdate", message: "Please fill Date" };
    if (!form.cname.trim()) {
      return { id: "cname", message: "Please fill Customer name" };
    }
    if (!form.mobileno.trim()) {
      return { id: "mobileno", message: "Please fill Mobile" };
    }
    if (form.mobileno.replace(/\D/g, "").length < 10) {
      return { id: "mobileno", message: "Mobile must be at least 10 digits" };
    }
    if (!form.address.trim()) {
      return { id: "address", message: "Please fill Address" };
    }
    if (!form.bank_id) return { id: "bank_id", message: "Please fill Bank" };
    if (!form.bank_ref_no.trim()) {
      return { id: "bank_ref_no", message: "Please fill Bank ref no" };
    }
    if (!form.vehicleno.trim()) {
      return { id: "vehicleno", message: "Please fill Vehicle no" };
    }
    if (!form.company_id) {
      return { id: "company_id", message: "Please fill Company" };
    }
    if (!form.model_id) return { id: "model_id", message: "Please fill Model" };
    if (!form.variant_id) {
      return { id: "variant_id", message: "Please fill Variant" };
    }
    return null;
  }

  useEffect(() => {
    if (!fieldError) return;
    const current = nextCreateFieldError();
    if (!current || current.id !== fieldError.id) setFieldError(null);
  }, [form, fieldError]);

  function submitCreate() {
    const error = nextCreateFieldError();
    if (error) {
      setFieldError(error);
      const el = document.getElementById(error.id);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setFieldError(null);
    createMutation.mutate();
  }

  function fieldNote(id: string) {
    if (fieldError?.id !== id) return null;
    return (
      <p className="text-center text-[11px] font-medium text-red-600">
        {fieldError.message}
      </p>
    );
  }

  function fieldBorder(id: string, base: string) {
    return cn(base, fieldError?.id === id && "border-red-500");
  }

  const fieldClass = "min-w-0 space-y-1";
  const labelClass = "text-[11px] font-medium text-muted-foreground";
  const controlClass = "h-8 w-full text-[13px]";
  const gridClass =
    "grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3";
  const selectClass = cn(
    "flex h-8 w-full min-w-0 rounded-md border border-input bg-background px-2.5 text-[13px] outline-none transition-colors",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );
  const createFieldClass = "min-w-0 space-y-1.5";
  const createGridClass =
    "grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3";
  const createControlClass =
    "h-9 w-full rounded-lg bg-background text-[13px] shadow-none";
  const createSelectClass = cn(
    selectClass,
    "h-9 rounded-lg bg-background px-3 shadow-none",
  );

  function renderTable(
    rows: JobRow[] | undefined,
    showAssign: boolean,
    start = 0,
  ) {
    if ((rows ?? []).length === 0) return null;
    const isFresh = showAssign;

    return (
      <JobsTable>
        <JobsTableHeader>
          <JobsTableRow>
            <JobSerialHead />
            <JobsTableHead>DTI</JobsTableHead>
            <JobsTableHead>Customer</JobsTableHead>
            <JobsTableHead>Vehicle</JobsTableHead>
            <JobsTableHead>Type</JobsTableHead>
            <JobsTableHead>Bank</JobsTableHead>
            {isFresh ? null : <JobsTableHead>Agent</JobsTableHead>}
            <JobsTableHead>Date</JobsTableHead>
            <JobsTableHead>Reason</JobsTableHead>
            <JobsTableHead className="text-right">Actions</JobsTableHead>
          </JobsTableRow>
        </JobsTableHeader>
        <TableBody>
          {(rows ?? []).map((job, index) => (
            <JobsTableRow key={job.id}>
              <JobSerialCell index={start + index} />
              <JobsTableCell>
                <JobDtiCell value={job.dti_no ?? job.id} />
              </JobsTableCell>
              <JobsTableCell>
                <SheetPerson name={job.cname} phone={job.mobileno} />
              </JobsTableCell>
              <JobsTableCell className="align-top">
                <RegPlate value={job.vehicleno} className="-mt-0.5" />
                <JobMetaLine full>
                  {[job.company, job.model, job.variant]
                    .filter(Boolean)
                    .join(" / ")}
                </JobMetaLine>
              </JobsTableCell>
              <JobsTableCell>
                <span className="inline-flex rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {job.vehicle_type ?? "—"}
                </span>
              </JobsTableCell>
              <JobsTableCell>
                <SheetBank name={job.bankname} meta={job.bank_ref_no} />
              </JobsTableCell>
              {isFresh ? null : (
                <JobsTableCell>
                  <SheetPerson name={job.agent_name} />
                </JobsTableCell>
              )}
              <JobsTableCell>
                <SheetDateTime
                  value={
                    isFresh
                      ? (job.created_at ?? job.cdate)
                      : (job.assigned_at ?? job.created_at)
                  }
                />
              </JobsTableCell>
              <JobsTableCell>
                <div
                  className="max-w-[12rem] truncate text-[12px]"
                  title={job.stage_reason ?? undefined}
                >
                  {job.stage_reason || "—"}
                </div>
              </JobsTableCell>
              <JobsTableCell>
                <JobActions>
                  <JobActionButton
                    tone="edit"
                    icon={Pencil}
                    label="Edit"
                    disabled={editLoading || editMutation.isPending}
                    onClick={() => void openEditDialog(job)}
                  />
                  {isFresh && !job.agent_id ? (
                    <JobActionButton
                      tone="primary"
                      icon={UserPlus}
                      label="Assign Case"
                      onClick={() => {
                        setAssignJob(job);
                        setSelectedRoId("");
                        setSelectedSurveyorId("");
                      }}
                    />
                  ) : null}
                  {!isFresh ? (
                    <JobActionButton
                      tone="info"
                      icon={ImagePlus}
                      label="Image Upload"
                      onClick={() => void openUploadDialog(job)}
                    />
                  ) : null}
                  {!isFresh ? (
                    <ChangeStageButton
                      from="assigned"
                      jobId={job.id}
                      dtiNo={job.dti_no}
                      onSuccess={() => {
                        void queryClient.invalidateQueries({
                          queryKey: ["jobs"],
                        });
                      }}
                    />
                  ) : null}
                  <JobHistoryButton
                    stage={isFresh ? "fresh" : "assigned"}
                    job={job}
                  />
                  <JobActionButton
                    tone="danger"
                    icon={Ban}
                    label="Cancel"
                    disabled={workflowMutation.isPending}
                    onClick={() => setCancelJobId(job.id)}
                  />
                </JobActions>
              </JobsTableCell>
            </JobsTableRow>
          ))}
        </TableBody>
      </JobsTable>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Workflow"
        badge={badge}
      />

      {mode === "assign" ? (
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border/70 bg-gradient-to-r from-primary/5 to-transparent px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ClipboardPlus className="size-4" />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-[15px] leading-none">
                  New intimation
                </CardTitle>
                <CardDescription className="mt-1 text-[12px]">
                  Create case now · assign surveyor later from Fresh Case
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3.5 px-4 py-4 sm:px-5">
            <FormSection panel icon={UserRound} title="Customer">
              <div className={createGridClass}>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="cdate" icon={Calendar}>
                    Date
                  </FieldLabel>
                  <Input
                    id="cdate"
                    type="date"
                    className={fieldBorder("cdate", createControlClass)}
                    value={form.cdate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cdate: e.target.value }))
                    }
                  />
                  {fieldNote("cdate")}
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="cname" icon={UserRound}>
                    Customer name
                  </FieldLabel>
                  <Input
                    id="cname"
                    placeholder="Full name"
                    className={fieldBorder("cname", createControlClass)}
                    value={form.cname}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cname: e.target.value }))
                    }
                  />
                  {fieldNote("cname")}
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="mobileno" icon={Phone}>
                    Mobile
                  </FieldLabel>
                  <Input
                    id="mobileno"
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                    className={fieldBorder("mobileno", createControlClass)}
                    value={form.mobileno}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mobileno: e.target.value }))
                    }
                  />
                  {fieldNote("mobileno")}
                </div>
                <div className={cn(createFieldClass, "sm:col-span-2 lg:col-span-3")}>
                  <FieldLabel htmlFor="address" icon={MapPin}>
                    Address
                  </FieldLabel>
                  <Textarea
                    id="address"
                    rows={2}
                    placeholder="Inspection / customer address"
                    className={fieldBorder(
                      "address",
                      "field-sizing-fixed h-20 w-full resize-y rounded-lg bg-background py-2 text-[13px] leading-snug shadow-none",
                    )}
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                  {fieldNote("address")}
                </div>
              </div>
            </FormSection>

            <FormSection panel icon={Landmark} title="Bank">
              <div className={createGridClass}>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="bank_id" icon={Banknote}>
                    Bank
                  </FieldLabel>
                  <select
                    id="bank_id"
                    className={fieldBorder("bank_id", createSelectClass)}
                    value={form.bank_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bank_id: e.target.value }))
                    }
                  >
                    <option value="">Select bank…</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {fieldNote("bank_id")}
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="bank_ref_no" icon={FileDigit}>
                    Bank ref no
                  </FieldLabel>
                  <Input
                    id="bank_ref_no"
                    placeholder="Reference number"
                    className={fieldBorder("bank_ref_no", createControlClass)}
                    value={form.bank_ref_no}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bank_ref_no: e.target.value }))
                    }
                  />
                  {fieldNote("bank_ref_no")}
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="mode" icon={CreditCard}>
                    Payment mode
                  </FieldLabel>
                  <select
                    id="mode"
                    className={createSelectClass}
                    value={form.mode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        mode: e.target.value as (typeof paymentModes)[number],
                      }))
                    }
                  >
                    {paymentModes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FormSection>

            <FormSection panel icon={Car} title="Vehicle">
              <div className={createGridClass}>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="vehicle_type" icon={Truck}>
                    Vehicle type
                  </FieldLabel>
                  <select
                    id="vehicle_type"
                    className={createSelectClass}
                    value={form.vehicle_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        vehicle_type: e.target
                          .value as (typeof vehicleTypes)[number],
                      }))
                    }
                  >
                    {vehicleTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="vehicleno" icon={Hash}>
                    Vehicle no
                  </FieldLabel>
                  <Input
                    id="vehicleno"
                    placeholder="e.g. MH12AB1234"
                    className={fieldBorder("vehicleno", cn(createControlClass, "font-medium uppercase tracking-wide"))}
                    value={form.vehicleno}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        vehicleno: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                  {fieldNote("vehicleno")}
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="company_id" icon={Factory}>
                    Company
                  </FieldLabel>
                  <select
                    id="company_id"
                    className={fieldBorder("company_id", createSelectClass)}
                    value={form.company_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        company_id: e.target.value,
                        model_id: "",
                        variant_id: "",
                      }))
                    }
                  >
                    <option value="">Select company…</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {fieldNote("company_id")}
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="model_id" icon={Boxes}>
                    Model
                  </FieldLabel>
                  <select
                    id="model_id"
                    className={fieldBorder("model_id", createSelectClass)}
                    value={form.model_id}
                    disabled={!form.company_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        model_id: e.target.value,
                        variant_id: "",
                      }))
                    }
                  >
                    <option value="">Select model…</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {fieldNote("model_id")}
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="variant_id" icon={Layers}>
                    Variant
                  </FieldLabel>
                  <select
                    id="variant_id"
                    className={fieldBorder("variant_id", createSelectClass)}
                    value={form.variant_id}
                    disabled={!form.model_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, variant_id: e.target.value }))
                    }
                  >
                    <option value="">Select variant…</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  {fieldNote("variant_id")}
                </div>
                <div className={createFieldClass}>
                  <FieldLabel htmlFor="remark" icon={MessageSquare}>
                    Remark
                  </FieldLabel>
                  <Input
                    id="remark"
                    placeholder="Optional notes"
                    className={createControlClass}
                    value={form.remark}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remark: e.target.value }))
                    }
                  />
                </div>
              </div>
            </FormSection>
          </CardContent>

          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/70 bg-muted/15 px-4 py-3.5 sm:px-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => {
                setForm(createEmptyForm());
                setFieldError(null);
              }}
              className={cn(
                "h-9 min-w-[6.5rem] gap-2 rounded-md px-4 text-[13px] font-medium",
                "border-border bg-background transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:text-red-600",
                "hover:shadow-md hover:shadow-red-500/20",
                "active:translate-y-0 active:scale-[0.98]",
                "dark:hover:border-red-400 dark:hover:bg-red-500/15 dark:hover:text-red-400",
              )}
            >
              <RotateCcw className="size-3.5 transition-transform duration-200 group-hover/button:-rotate-180" />
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={createMutation.isPending}
              onClick={submitCreate}
              className={cn(
                "h-9 min-w-[10.5rem] gap-2 rounded-md px-4 text-[13px] font-medium",
                "transition-all duration-200",
                "hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30",
                "active:translate-y-0 active:scale-[0.98]",
                "disabled:translate-y-0 disabled:shadow-none",
              )}
            >
              {createMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ClipboardPlus className="size-3.5 transition-transform duration-200 group-hover/button:scale-110" />
              )}
              {createMutation.isPending ? "Saving…" : "Create intimation"}
            </Button>
          </div>
        </Card>
      ) : (
        <JobsListingCard
          title="Case list"
          description={
            mode === "schedule"
              ? "Assigned cases waiting for inspection"
              : "Unassigned cases ready for RO / Surveyor assignment"
          }
          count={filteredListRows.length}
          totalCount={allListRows.length}
          mark={mode === "schedule" ? "assigned" : "fresh"}
          loading={listQuery.isLoading}
          error={
            listQuery.isError
              ? (listQuery.error as Error).message
              : null
          }
          empty={
            allListRows.length > 0
              ? "No cases match these filters"
              : mode === "schedule"
                ? "No pending inspection cases"
                : "No fresh cases waiting"
          }
          filters={
            <CaseListToolbar
              value={filters}
              onChange={setFilters}
              banks={listBanks}
              surveyors={listSurveyors}
              showSurveyor={mode === "schedule"}
            />
          }
          footer={
            filteredListRows.length > 0 ? (
              <SheetPager
                page={sheet.page}
                pageCount={sheet.pageCount}
                onPage={sheet.setPage}
              />
            ) : null
          }
        >
          {renderTable(sheet.pageItems, mode !== "schedule", sheet.start)}
        </JobsListingCard>
      )}

      <Dialog
        open={assignJob != null}
        onOpenChange={(open) => {
          if (!open) closeAssignDialog();
        }}
      >
        <DialogContent className="sm:max-w-[24rem]" showCloseButton={false}>
          <DialogHeader className="mb-3 pr-0">
            <DialogTitle className="flex items-center gap-2 text-[1.05rem]">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <UserPlus className="size-4" />
              </span>
              Assign Case
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              First select an RO, then choose a Surveyor under that RO. The case
              will move to Assign Case.
            </DialogDescription>
          </DialogHeader>

          {assignJob ? (
            <div className="mb-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2.5 text-left text-[12.5px]">
              <div className="flex justify-between gap-3 py-0.5">
                <span className="text-muted-foreground">DTI</span>
                <span className="font-semibold tracking-wide">
                  {assignJob.dti_no ?? assignJob.id}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border/50 py-0.5">
                <span className="text-muted-foreground">Customer</span>
                <span className="max-w-[12rem] truncate font-medium">
                  {assignJob.cname ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border/50 py-0.5">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-semibold tracking-wide">
                  {assignJob.vehicleno ?? "—"}
                </span>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">
                1. Select RO
              </Label>
              <select
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                )}
                value={selectedRoId}
                onChange={(e) => {
                  setSelectedRoId(e.target.value);
                  setSelectedSurveyorId("");
                }}
              >
                <option value="">Select RO…</option>
                {roAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {roAgents.length === 0 ? (
                <p className="text-[11px] text-amber-700">
                  No verified RO found. Add RO from Account → Surveyors.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">
                2. Select Surveyor (under RO)
              </Label>
              <select
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-[13px] outline-none",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                value={selectedSurveyorId}
                disabled={!selectedRoId}
                onChange={(e) => setSelectedSurveyorId(e.target.value)}
              >
                <option value="">
                  {selectedRoId ? "Select Surveyor…" : "First select RO"}
                </option>
                {surveyorsUnderRo.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {selectedRoId && surveyorsUnderRo.length === 0 ? (
                <p className="text-[11px] text-amber-700">
                  No verified Surveyor linked to this RO. Create a Surveyor
                  under this RO (parent link) and Approve them first.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 shadow-none"
              disabled={assignMutation.isPending}
              onClick={closeAssignDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 min-w-[8.5rem] gap-1.5 shadow-none"
              disabled={
                !selectedRoId ||
                !selectedSurveyorId ||
                assignMutation.isPending
              }
              onClick={() => {
                if (!assignJob || !selectedSurveyorId) return;
                assignMutation.mutate({
                  jobId: assignJob.id,
                  agentId: Number(selectedSurveyorId),
                });
              }}
            >
              {assignMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserPlus className="size-3.5" />
              )}
              {assignMutation.isPending ? "Assigning…" : "Assign Case"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingJobId != null}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Pencil className="size-4" />
              </span>
              Edit case
            </DialogTitle>
            <DialogDescription>
              Update intimation details for this case.
            </DialogDescription>
          </DialogHeader>

          {editLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading case…
            </p>
          ) : (
            <div className="space-y-4">
              <FormSection icon={UserRound} title="Customer">
                <div className={gridClass}>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Date</Label>
                    <Input
                      type="date"
                      className={controlClass}
                      value={editForm.cdate}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, cdate: e.target.value }))
                      }
                    />
                  </div>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Customer name</Label>
                    <Input
                      className={controlClass}
                      value={editForm.cname}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, cname: e.target.value }))
                      }
                    />
                  </div>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Mobile</Label>
                    <Input
                      className={controlClass}
                      inputMode="numeric"
                      value={editForm.mobileno}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, mobileno: e.target.value }))
                      }
                    />
                  </div>
                  <div className={cn(fieldClass, "sm:col-span-2 lg:col-span-3")}>
                    <Label className={labelClass}>Address</Label>
                    <Textarea
                      rows={2}
                      className="field-sizing-fixed h-16 w-full resize-y py-2 text-[13px] leading-snug"
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, address: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection icon={Landmark} title="Bank">
                <div className={gridClass}>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Bank</Label>
                    <select
                      className={selectClass}
                      value={editForm.bank_id}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, bank_id: e.target.value }))
                      }
                    >
                      <option value="">Select bank…</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Bank ref no</Label>
                    <Input
                      className={controlClass}
                      value={editForm.bank_ref_no}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          bank_ref_no: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Payment mode</Label>
                    <select
                      className={selectClass}
                      value={editForm.mode}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          mode: e.target.value as (typeof paymentModes)[number],
                        }))
                      }
                    >
                      {paymentModes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>

              <FormSection icon={Car} title="Vehicle">
                <div className={gridClass}>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Vehicle type</Label>
                    <select
                      className={selectClass}
                      value={editForm.vehicle_type}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          vehicle_type: e.target
                            .value as (typeof vehicleTypes)[number],
                        }))
                      }
                    >
                      {vehicleTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Vehicle no</Label>
                    <Input
                      className={controlClass}
                      value={editForm.vehicleno}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          vehicleno: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Company</Label>
                    <select
                      className={selectClass}
                      value={editForm.company_id}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          company_id: e.target.value,
                          model_id: "",
                          variant_id: "",
                        }))
                      }
                    >
                      <option value="">Select company…</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Model</Label>
                    <select
                      className={selectClass}
                      value={editForm.model_id}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          model_id: e.target.value,
                          variant_id: "",
                        }))
                      }
                    >
                      <option value="">Select model…</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldClass}>
                    <Label className={labelClass}>Variant</Label>
                    <select
                      className={selectClass}
                      value={editForm.variant_id}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          variant_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select variant…</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={cn(fieldClass, "sm:col-span-2 lg:col-span-3")}>
                    <Label className={labelClass}>Remark</Label>
                    <Input
                      className={controlClass}
                      value={editForm.remark}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, remark: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </FormSection>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 shadow-none"
                  disabled={editMutation.isPending}
                  onClick={closeEditDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-9 min-w-[7.5rem] gap-1.5 shadow-none"
                  disabled={editMutation.isPending || editLoading}
                  onClick={() => setConfirmEdit(true)}
                >
                  {editMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Pencil className="size-3.5" />
                  )}
                  {editMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadJob != null}
        onOpenChange={(open) => {
          if (!open) closeUploadDialog();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="mb-3">
            <DialogTitle className="flex items-center gap-2.5 text-[1.05rem]">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CloudUpload className="size-4" />
              </span>
              Upload Images
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Add inspection photos for this assigned case
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {uploadJob ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ["REFERENCE", uploadJob.dti_no ?? String(uploadJob.id)],
                    ["CUSTOMER", uploadJob.cname ?? "—"],
                    ["BANK", uploadJob.bankname ?? "—"],
                    ["BANK REF. NO.", uploadJob.bank_ref_no ?? "—"],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5"
                  >
                    <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      {label}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] font-semibold text-foreground uppercase">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <input
              ref={uploadInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              multiple
              className="sr-only"
              disabled={uploadBusy || submitToQcMutation.isPending}
              onChange={(e) => {
                stageUploadFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              disabled={uploadBusy || submitToQcMutation.isPending}
              onClick={() => uploadInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setUploadDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setUploadDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setUploadDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setUploadDragOver(false);
                stageUploadFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-5 text-left transition-colors",
                uploadDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border/80 bg-muted/15 hover:border-primary/45 hover:bg-muted/30",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                {uploadBusy ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ImageIcon className="size-5" />
                )}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[13px] font-semibold text-foreground">
                  {uploadBusy
                    ? uploadProgress
                      ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…`
                      : "Saving to database…"
                    : "Drop photos here, or click to browse"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  JPG, PNG, WEBP · up to 30 files · 5MB each
                </p>
              </div>
            </button>

            {pendingUploads.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-foreground">
                  {pendingUploads.length} ready to upload
                </p>
                <div className="grid max-h-36 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {pendingUploads.map((p) => (
                    <div
                      key={p.localId}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border/70 bg-muted/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.preview}
                        alt=""
                        className="size-full object-cover"
                      />
                      <div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          title="View"
                          onClick={() => setUploadViewSrc(p.preview)}
                          className="flex size-7 items-center justify-center rounded-md bg-background/90 text-sky-700 shadow-sm hover:bg-sky-600 hover:text-white"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Remove"
                          disabled={uploadBusy || submitToQcMutation.isPending}
                          onClick={() => removePendingUpload(p.localId)}
                          className="flex size-7 items-center justify-center rounded-md bg-background/90 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {uploadPhotos.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium text-foreground">
                    {uploadPhotos.length} image
                    {uploadPhotos.length === 1 ? "" : "s"} synced
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Ready for Quality Check
                  </p>
                </div>
                <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {uploadPhotos.map((p, i) => {
                    const src = uploadPhotoSrc(p);
                    return (
                      <div
                        key={`${p.id ?? p.image}-${i}`}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border/70 bg-muted/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="size-full object-cover"
                          onError={(e) => {
                            const el = e.currentTarget;
                            const fallback = `/upload_images/${p.image.replace(/^.*[/\\]/, "")}`;
                            if (el.src && !el.src.endsWith(fallback)) {
                              el.src = fallback;
                              return;
                            }
                            el.style.display = "none";
                            const sibling = el.nextElementSibling;
                            if (sibling instanceof HTMLElement) {
                              sibling.hidden = false;
                            }
                          }}
                        />
                        <div
                          hidden
                          className="absolute inset-0 flex items-center justify-center bg-muted/50 p-2 text-center text-[10px] text-muted-foreground"
                        >
                          Preview unavailable
                        </div>
                        <div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            title="View"
                            onClick={() => setUploadViewSrc(src)}
                            className="flex size-7 items-center justify-center rounded-md bg-background/90 text-sky-700 shadow-sm hover:bg-sky-600 hover:text-white"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Remove"
                            disabled={uploadBusy || submitToQcMutation.isPending}
                            onClick={() => void removeUploadPhoto(i)}
                            className="flex size-7 items-center justify-center rounded-md bg-background/90 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : pendingUploads.length === 0 ? (
              <p className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5 text-center text-[12px] text-muted-foreground">
                No images yet. Select photos, then click{" "}
                <span className="font-medium text-foreground">Upload Images</span>
                .
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1.5 border-red-200 bg-red-600 text-white shadow-none hover:bg-red-700 hover:text-white"
                disabled={uploadBusy || submitToQcMutation.isPending}
                onClick={closeUploadDialog}
              >
                <X className="size-3.5" />
                Cancel
              </Button>
              <Button
                type="button"
                className="h-9 min-w-[8.5rem] gap-1.5 shadow-none"
                disabled={
                  uploadBusy ||
                  submitToQcMutation.isPending ||
                  pendingUploads.length === 0
                }
                onClick={() => void runUploadPending()}
              >
                {uploadBusy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="size-3.5" />
                )}
                {uploadBusy
                  ? uploadProgress
                    ? `${uploadProgress.done}/${uploadProgress.total}`
                    : "Saving…"
                  : "Upload Images"}
              </Button>
              <Button
                type="button"
                className="h-9 min-w-[8.5rem] gap-1.5 bg-emerald-600 text-white shadow-none hover:bg-emerald-700"
                disabled={
                  uploadBusy ||
                  submitToQcMutation.isPending ||
                  uploadPhotos.length === 0 ||
                  pendingUploads.length > 0
                }
                onClick={() => setConfirmSubmitQc(true)}
              >
                {submitToQcMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                {submitToQcMutation.isPending
                  ? "Submitting…"
                  : "Submit to QC"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadViewSrc != null}
        onOpenChange={(open) => {
          if (!open) setUploadViewSrc(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-1rem)] border-border/70 bg-slate-950 sm:max-w-[min(96vw,90rem)]">
          <DialogHeader className="sr-only">
            <DialogTitle>Image preview</DialogTitle>
          </DialogHeader>
          {uploadViewSrc ? (
            <div className="-m-5 flex max-h-[90vh] items-center justify-center overflow-auto bg-slate-950 sm:-m-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadViewSrc}
                alt="Inspection photo"
                className="max-h-[90vh] max-w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmEdit}
        onOpenChange={setConfirmEdit}
        title="Save this case?"
        description="The case details will be updated."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={editMutation.isPending}
        onConfirm={() => {
          setConfirmEdit(false);
          editMutation.mutate();
        }}
      />

      <ConfirmDialog
        open={confirmSubmitQc}
        onOpenChange={setConfirmSubmitQc}
        title="Submit to Quality Check?"
        description="This case will move to the Quality Check queue."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={submitToQcMutation.isPending}
        onConfirm={() => {
          setConfirmSubmitQc(false);
          submitToQcMutation.mutate();
        }}
      />

      <ConfirmDialog
        open={holdJobId != null}
        onOpenChange={(open) => {
          if (!open) setHoldJobId(null);
        }}
        tone="hold"
        title="Put this case on Hold?"
        description="The case will move to the Hold queue. You can resume it anytime from there."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={workflowMutation.isPending}
        onConfirm={() => {
          if (holdJobId == null) return;
          workflowMutation.mutate(
            { jobId: holdJobId, action: "hold" },
            { onSettled: () => setHoldJobId(null) },
          );
        }}
      />

      <ConfirmDialog
        open={cancelJobId != null}
        onOpenChange={(open) => {
          if (!open) setCancelJobId(null);
        }}
        tone="danger"
        title="Cancel this case?"
        description="The case will move to the Cancel queue. You can restore it later if needed."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={workflowMutation.isPending}
        onConfirm={() => {
          if (cancelJobId == null) return;
          workflowMutation.mutate(
            { jobId: cancelJobId, action: "cancel" },
            { onSettled: () => setCancelJobId(null) },
          );
        }}
      />

      <Dialog
        open={createdCase != null}
        onOpenChange={(open) => {
          if (!open) setCreatedCase(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[19rem]"
        >
          <div className="flex flex-col items-center text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="size-5" strokeWidth={3} />
            </span>

            <DialogHeader className="mb-3 items-center gap-1 pr-0 text-center">
              <DialogTitle className="text-[1.02rem] font-semibold tracking-tight">
                Case created successfully
              </DialogTitle>
              <DialogDescription className="max-w-[15.5rem] text-[12px] leading-snug">
                Intimation saved. Assign a surveyor from Fresh Case when ready.
              </DialogDescription>
            </DialogHeader>

            {createdCase ? (
              <dl className="w-full space-y-1.5 rounded-md border border-border/80 bg-muted/20 p-2.5 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-white">
                    <FileDigit className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      DTI no
                    </dt>
                    <dd className="truncate text-[12.5px] font-semibold tracking-wide">
                      {createdCase.dti_no}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-white">
                    <UserRound className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Customer
                    </dt>
                    <dd className="truncate text-[12.5px] font-semibold">
                      {createdCase.cname ?? "—"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-800 text-white">
                    <Car className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Vehicle
                    </dt>
                    <dd className="truncate text-[12.5px] font-semibold tracking-wide">
                      {createdCase.vehicleno}
                    </dd>
                  </div>
                </div>
              </dl>
            ) : null}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              className="h-9 min-w-[8rem] rounded-md bg-[#5d87ff] px-8 text-[13px] font-semibold text-white shadow-none hover:bg-[#4a73e8] hover:shadow-none"
              onClick={() => setCreatedCase(null)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
