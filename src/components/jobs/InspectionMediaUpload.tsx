"use client";

import { useState, type ReactNode } from "react";
import { Eye, ImagePlus, Loader2, Trash2, Upload, Video } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type UploadedPhoto = {
  image: string;
  s3_url?: string | null;
  url?: string | null;
};

type Props = {
  disabled?: boolean;
  wheelKind?: "2wheeler" | "3wheeler" | "4wheeler";
  chassisphoto: string;
  chassisphotoUrl?: string | null;
  video: string;
  videoUrl?: string | null;
  photos: UploadedPhoto[];
  existingPhotoUrls?: Array<{ id: number; url: string | null; image: string | null }>;
  onChassisChange: (filename: string, url?: string | null) => void;
  onVideoChange: (filename: string, url?: string | null) => void;
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  onExistingDeleted?: (id: number) => void;
};

type Preview = { url: string; name: string; type: "image" | "video" };
type DeleteRequest = {
  name: string;
  all?: boolean;
  action: () => void | Promise<void>;
};

async function uploadOne(
  file: File,
  folder: "upload_images" | "upload_videos",
): Promise<{ key: string; url: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch("/api/v2/files/upload", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || json.error || "Upload failed");
  const key = String(json.stored?.key ?? "");
  const url = String(json.stored?.url ?? "");
  if (!key || !url) throw new Error("Upload completed without a usable media URL");
  return { key, url, filename: key.split("/").pop() || file.name };
}

function MediaCard({
  title,
  subtitle,
  name,
  url,
  type,
  disabled,
  compact = false,
  onView,
  onDelete,
  children,
}: {
  title: string;
  subtitle: string;
  name?: string;
  url?: string | null;
  type: "image" | "video";
  disabled?: boolean;
  compact?: boolean;
  onView?: () => void;
  onDelete?: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-border/70 bg-background shadow-sm">
      {!compact ? <div className="flex items-center gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {type === "image" ? <ImagePlus className="size-4" /> : <Video className="size-4" />}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div> : null}
      <div className={compact ? "p-2" : "space-y-3 p-4"}>
        {children}
        {url ? (
          <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20">
            <button
              type="button"
              className="block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left disabled:cursor-default"
              disabled={!onView}
              onClick={onView}
              aria-label={onView ? `View ${name || title}` : undefined}
            >
              {type === "image" ? (
                // Dynamic upload URLs are served by the authenticated media route.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={name || title} className={compact ? "h-40 w-full object-cover" : "h-44 w-full object-cover"} />
              ) : (
                <div className="flex h-44 items-center justify-center bg-slate-950">
                  <Video className="size-10 text-white/80" />
                </div>
              )}
            </button>
            <div className="flex min-h-11 items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0 truncate text-xs text-muted-foreground" title={name}>
                {name || "Uploaded media"}
              </span>
              <div className="flex shrink-0 gap-1.5">
                {onView ? (
                  <Button type="button" size="sm" variant="outline" onClick={onView}>
                    <Eye /> View
                  </Button>
                ) : null}
                {!disabled && onDelete ? (
                  <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
                    <Trash2 /> Delete
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-16 items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-3">
            <p className="min-w-0 truncate text-xs text-muted-foreground" title={name}>
              {name || `No ${type === "image" ? "photo" : "video"} uploaded yet.`}
            </p>
            {!disabled && onDelete ? (
              <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
                <Trash2 /> Delete
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

export function InspectionMediaUpload({
  disabled,
  wheelKind,
  chassisphoto,
  chassisphotoUrl,
  video,
  videoUrl,
  photos,
  existingPhotoUrls = [],
  onChassisChange,
  onVideoChange,
  onPhotosChange,
  onExistingDeleted,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);

  const deleteExisting = async (imageId: number, notify = true) => {
    if (!wheelKind || disabled) throw new Error("Unable to delete this photo");
    setBusy(true);
    setUploadProgress(null);
    try {
      const res = await fetch("/api/v2/jobs/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: wheelKind, image_id: imageId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Delete failed");
      onExistingDeleted?.(imageId);
      if (notify) toast.success("Photo removed");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRequest) return;
    setDeleteBusy(true);
    try {
      await deleteRequest.action();
      setDeleteRequest(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
      setDeleteRequest(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const deleteAllGalleryPhotos = async () => {
    const savedPhotos = [...existingPhotoUrls];
    const total = photos.length + savedPhotos.length;
    let deletedSaved = 0;

    try {
      for (const photo of savedPhotos) {
        await deleteExisting(photo.id, false);
        deletedSaved += 1;
      }
    } catch (error) {
      if (deletedSaved > 0) {
        const reason = error instanceof Error ? error.message : "Delete failed";
        throw new Error(`Removed ${deletedSaved} saved photo(s), but could not remove the rest. ${reason}`);
      }
      throw error;
    }

    onPhotosChange([]);
    toast.success(`Deleted all ${total} photo(s)`);
  };

  const runUpload = async (files: FileList | null, kind: "chassis" | "gallery" | "video") => {
    if (!files?.length || disabled) return;
    const selected = Array.from(files);
    if (kind !== "video") {
      const invalid = selected.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type));
      if (invalid) {
        toast.error("Choose a JPG, PNG, or WEBP image.");
        return;
      }
      if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
        toast.error("Each photo must be 5 MB or smaller.");
        return;
      }
    } else {
      const file = selected[0];
      if (!file.type.startsWith("video/")) {
        toast.error("Choose a valid video file.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("The video must be 100 MB or smaller.");
        return;
      }
    }

    setBusy(true);
    try {
      if (kind === "chassis") {
        const up = await uploadOne(selected[0], "upload_images");
        onChassisChange(up.filename, up.url);
        toast.success("Chassis photo uploaded");
      } else if (kind === "video") {
        const up = await uploadOne(selected[0], "upload_videos");
        onVideoChange(up.filename, up.url);
        toast.success("Video uploaded");
      } else {
        const remaining = Math.max(0, 30 - photos.length - existingPhotoUrls.length);
        if (selected.length > remaining) {
          toast.error(`You can add ${remaining} more photo(s).`);
          return;
        }
        let next = [...photos];
        let completed = 0;
        setUploadProgress({ completed: 0, total: selected.length });
        for (const file of selected) {
          const up = await uploadOne(file, "upload_images");
          next = [...next, { image: up.filename, s3_url: up.url, url: up.url }];
          onPhotosChange(next);
          completed += 1;
          setUploadProgress({ completed, total: selected.length });
        }
        toast.success(`${completed} photo(s) uploaded`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };

  const uploadInput = (label: string, accept: string, multiple: boolean, kind: "chassis" | "gallery" | "video") => (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-primary/35 bg-primary/[0.03] p-3 transition-colors hover:bg-primary/[0.07] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Upload className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-xs text-muted-foreground">
            {kind === "video" ? "MP4, MOV, or WebM · up to 100 MB" : "JPG, PNG, or WEBP · up to 5 MB"}
          </span>
        </span>
      </span>
      <span className="shrink-0 rounded-md border bg-background px-3 py-1.5 text-xs font-semibold">Browse</span>
      <Input
        className="sr-only"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled || busy}
        onChange={(event) => {
          void runUpload(event.currentTarget.files, kind);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );

  const gallery = [
    ...photos.map((photo, index) => ({
      key: `new-${photo.image}-${index}`,
      image: photo.image,
      url: photo.url ?? photo.s3_url ?? null,
      onDelete: () => setDeleteRequest({
        name: photo.image,
        action: () => onPhotosChange(photos.filter((_, current) => current !== index)),
      }),
    })),
    ...existingPhotoUrls.map((photo) => ({
      key: `saved-${photo.id}`,
      image: photo.image ?? "Saved photo",
      url: photo.url,
      onDelete: () => setDeleteRequest({ name: photo.image ?? "Saved photo", action: () => deleteExisting(photo.id) }),
    })),
  ];

  return (
    <>
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <MediaCard
            title="Chassis photo"
            subtitle="Vehicle identification image"
            name={chassisphoto}
            url={chassisphotoUrl}
            type="image"
            disabled={disabled}
            onView={chassisphotoUrl ? () => setPreview({ url: chassisphotoUrl, name: chassisphoto || "Chassis photo", type: "image" }) : undefined}
            onDelete={chassisphoto ? () => setDeleteRequest({ name: chassisphoto, action: () => onChassisChange("", null) }) : undefined}
          >
            {!disabled ? uploadInput("Choose chassis photo", "image/jpeg,image/png,image/webp", false, "chassis") : null}
          </MediaCard>
          <MediaCard
            title="Inspection video"
            subtitle="Optional video evidence"
            name={video}
            url={videoUrl}
            type="video"
            disabled={disabled}
            onView={videoUrl ? () => setPreview({ url: videoUrl, name: video || "Inspection video", type: "video" }) : undefined}
            onDelete={video ? () => setDeleteRequest({ name: video, action: () => onVideoChange("", null) }) : undefined}
          >
            {!disabled ? uploadInput("Choose inspection video", "video/mp4,video/quicktime,video/webm", false, "video") : null}
          </MediaCard>
        </div>

        <section className="rounded-xl border border-border/70 bg-background shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ImagePlus className="size-4" /></span>
              <div>
                <h3 className="text-sm font-semibold">Photos</h3>
                <p className="text-xs text-muted-foreground">Case image gallery · {gallery.length} of 30 photos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {busy ? <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" />{uploadProgress ? ` Uploading ${uploadProgress.completed} of ${uploadProgress.total}…` : " Working…"}</span> : null}
              {!disabled && gallery.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busy || deleteBusy}
                  onClick={() => setDeleteRequest({
                    name: `${gallery.length} photo(s)`,
                    all: true,
                    action: deleteAllGalleryPhotos,
                  })}
                >
                  <Trash2 /> Delete all
                </Button>
              ) : null}
            </div>
          </div>
          <div className="space-y-4 p-4">
            {!disabled && gallery.length < 30 ? uploadInput("Choose photos", "image/jpeg,image/png,image/webp", true, "gallery") : null}
            {gallery.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {gallery.map((photo) => (
                  <MediaCard
                    key={photo.key}
                    title="Photo"
                    subtitle="Linked to this inspection"
                    name={photo.image}
                    url={photo.url}
                    type="image"
                    disabled={disabled}
                    compact
                    onView={photo.url ? () => setPreview({ url: photo.url!, name: photo.image, type: "image" }) : undefined}
                    onDelete={!disabled ? photo.onDelete : undefined}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">No photos have been added to this case yet.</p>
            )}
          </div>
        </section>
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="w-[min(92vw,900px)] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.name}</DialogTitle>
            <DialogDescription>Media preview</DialogDescription>
          </DialogHeader>
          {preview?.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt={preview.name} className="max-h-[70vh] w-full rounded-lg bg-muted object-contain" />
          ) : preview ? (
            <video src={preview.url} controls autoPlay className="max-h-[70vh] w-full rounded-lg bg-black" />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteRequest)}
        onOpenChange={(open) => { if (!open && !deleteBusy) setDeleteRequest(null); }}
        title={deleteRequest?.all ? "Delete all photos?" : "Delete this media?"}
        description={deleteRequest?.all
          ? `All ${deleteRequest.name} will be removed from this inspection.`
          : deleteRequest
            ? `“${deleteRequest.name}” will be removed from this inspection.`
            : undefined}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleteBusy}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
