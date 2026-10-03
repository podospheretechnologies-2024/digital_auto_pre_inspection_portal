"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

async function uploadOne(
  file: File,
  folder: "upload_images" | "upload_videos",
): Promise<{ key: string; url: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch("/api/v2/files/upload", {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || json.message || "Upload failed");
  }
  const key = String(json.stored?.key ?? "");
  const url = String(json.stored?.url ?? "");
  const filename = key.split("/").pop() || file.name;
  return { key, url, filename };
}

/**
 * Chassis + gallery photos + optional video via Phase 6 `/api/v2/files/upload`.
 */
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

  const deleteExisting = async (imageId: number) => {
    if (!wheelKind || disabled) return;
    setBusy(true);
    try {
      const res = await fetch("/api/v2/jobs/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: wheelKind, image_id: imageId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Delete failed");
      onExistingDeleted?.(imageId);
      toast.success("Image removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const runUpload = async (
    files: FileList | null,
    kind: "chassis" | "gallery" | "video",
  ) => {
    if (!files?.length || disabled) return;
    setBusy(true);
    try {
      if (kind === "chassis") {
        const file = files[0];
        const up = await uploadOne(file, "upload_images");
        onChassisChange(up.filename, up.url);
        toast.success("Chassis photo uploaded");
      } else if (kind === "video") {
        const file = files[0];
        const up = await uploadOne(file, "upload_videos");
        onVideoChange(up.filename, up.url);
        toast.success("Video uploaded");
      } else {
        const next = [...photos];
        for (const file of Array.from(files).slice(0, 30 - next.length)) {
          const up = await uploadOne(file, "upload_images");
          next.push({ image: up.filename, s3_url: up.url, url: up.url });
        }
        onPhotosChange(next);
        toast.success(`${next.length - photos.length} photo(s) uploaded`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1.5">
        <Label>Chassis photo</Label>
        <Input
          type="file"
          accept="image/*"
          disabled={disabled || busy}
          onChange={(e) => void runUpload(e.target.files, "chassis")}
        />
        {chassisphoto ? (
          <p className="truncate text-xs text-muted-foreground">{chassisphoto}</p>
        ) : null}
        {chassisphotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chassisphotoUrl}
            alt="Chassis"
            className="mt-1 h-20 w-auto rounded border object-cover"
          />
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label>Video (optional)</Label>
        <Input
          type="file"
          accept="video/*"
          disabled={disabled || busy}
          onChange={(e) => void runUpload(e.target.files, "video")}
        />
        {video ? (
          <p className="truncate text-xs text-muted-foreground">{video}</p>
        ) : null}
        {videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary underline"
          >
            Open video
          </a>
        ) : null}
      </div>

      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <Label>Gallery photos (max 30)</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          disabled={disabled || busy || photos.length >= 30}
          onChange={(e) => void runUpload(e.target.files, "gallery")}
        />
        {photos.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {photos.map((p, i) => (
              <div key={`${p.image}-${i}`} className="relative">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt={p.image}
                    className="h-14 w-14 rounded border object-cover"
                  />
                ) : (
                  <span className="text-xs">{p.image}</span>
                )}
                {!disabled ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="absolute -right-1 -top-1 h-5 px-1 text-[10px]"
                    onClick={() =>
                      onPhotosChange(photos.filter((_, idx) => idx !== i))
                    }
                  >
                    ×
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {existingPhotoUrls.length ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {existingPhotoUrls.map((p) =>
              p.url ? (
                <div key={p.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.image ?? ""}
                    className="h-14 w-14 rounded border object-cover"
                    title="Saved"
                  />
                  {!disabled && wheelKind ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute -right-1 -top-1 h-5 px-1 text-[10px]"
                      disabled={busy}
                      onClick={() => void deleteExisting(p.id)}
                    >
                      ×
                    </Button>
                  ) : null}
                </div>
              ) : null,
            )}
          </div>
        ) : null}
        {busy ? (
          <p className="text-xs text-muted-foreground">Uploading…</p>
        ) : null}
      </div>
    </div>
  );
}
