/**
 * Resolve PI photo/video URLs for PDF HTML.
 * Prefer S3 URL → public MinIO → Laravel `public/upload_images` (legacy).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { buildObjectUrl, isStorageConfigured, readStoredFile } from "@/lib/services/files";

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

function appBase(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

const PDF_MEDIA_TTL_SECONDS = 60 * 60 * 24 * 7;

function mediaSecret(): string | null {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  return secret || null;
}

/** Stored key from a filename or from an existing `/api/v2/files/media?key=` URL. */
export function pdfMediaKey(
  value: string | null | undefined,
  folder: "upload_images" | "upload_videos",
): string | null {
  if (!value || !String(value).trim()) return null;
  const raw = String(value).trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const key = new URL(raw).searchParams.get("key");
      if (key && /^(upload_images|upload_videos)\/[^/]+$/.test(key)) return key;
    } catch {
      return null;
    }
    return null;
  }
  const name = raw.replace(/^\/+/, "");
  if (/^(upload_images|upload_videos)\/[^/]+$/.test(name)) return name;
  const file = name.split("/").pop();
  if (!file || file.includes("..")) return null;
  return `${folder}/${file}`;
}

export function signPdfMediaKey(key: string, exp: number): string {
  const secret = mediaSecret();
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");
  return createHmac("sha256", secret).update(`${key}.${exp}`).digest("hex");
}

export function verifyPdfMediaSig(
  key: string,
  sig: string,
  expRaw: string,
): boolean {
  const secret = mediaSecret();
  const exp = Number(expRaw);
  if (!secret || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(`${key}.${exp}`)
    .digest("hex");
  if (expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

/** Absolute URL that opens the stored file from a PDF click. */
export function pdfMediaHref(
  value: string | null | undefined,
  folder: "upload_images" | "upload_videos",
): string | null {
  const key = pdfMediaKey(value, folder);
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + PDF_MEDIA_TTL_SECONDS;
  const url = new URL("/api/v2/files/media", `${appBase()}/`);
  url.searchParams.set("key", key);
  url.searchParams.set("exp", String(exp));
  url.searchParams.set("sig", signPdfMediaKey(key, exp));
  return url.toString();
}

/** Inline image bytes so the PDF shows the photo even when the URL is private. */
export async function embedStoredImage(
  filename: string | null | undefined,
  s3Url?: string | null,
): Promise<string | null> {
  const key =
    pdfMediaKey(filename, "upload_images") ??
    pdfMediaKey(s3Url, "upload_images");
  if (key) {
    try {
      const { data, contentType } = await readStoredFile(key);
      if (contentType.startsWith("image/")) {
        return `data:${contentType};base64,${Buffer.from(data).toString("base64")}`;
      }
    } catch {
      /* keep the URL fallback */
    }
  }
  return resolveUploadImageUrl(filename, s3Url);
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
