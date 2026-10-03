/**
 * Resolve PI photo/video URLs for PDF HTML.
 * Prefer S3 URL → public MinIO → Laravel `public/upload_images` (legacy).
 */

import { buildObjectUrl, isStorageConfigured } from "@/lib/services/files";

function legacyBase(): string {
  return (
    process.env.LEGACY_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
}

/** Laravel `asset('public/upload_images/' . $name)` parity. */
export function resolveUploadImageUrl(
  filename: string | null | undefined,
  s3Url?: string | null,
): string | null {
  if (s3Url && String(s3Url).trim()) return String(s3Url).trim();
  if (!filename || !String(filename).trim()) return null;
  const name = String(filename).replace(/^\/+/, "");

  if (/^https?:\/\//i.test(name)) return name;

  if (isStorageConfigured()) {
    try {
      return buildObjectUrl(`upload_images/${name}`);
    } catch {
      /* fall through to legacy */
    }
  }

  return `${legacyBase()}/public/upload_images/${name}`;
}

/** Laravel `linkVideoURL` parity. */
export function resolveVideoUrl(
  video: string | null | undefined,
  s3videoUrl?: string | null,
): string | null {
  if (s3videoUrl && String(s3videoUrl).trim()) return String(s3videoUrl).trim();
  if (!video || !String(video).trim()) return null;
  const name = String(video).replace(/^\/+/, "");
  if (/^https?:\/\//i.test(name)) return name;
  return `${legacyBase()}/public/upload_videos/${name}`;
}
