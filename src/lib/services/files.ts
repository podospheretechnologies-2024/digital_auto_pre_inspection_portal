/**
 * S3 / MinIO-compatible object storage (Phase 6).
 *
 * Env:
 * - S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
 * - S3_REGION (default us-east-1)
 * - S3_FORCE_PATH_STYLE (default true for MinIO)
 * - S3_PUBLIC_URL (optional CDN / public base for URL construction)
 * - LOCAL_UPLOAD_DIR (optional) — write under this dir when S3 is unset
 *   (Laravel parity: typically `../DigitalAutoWeb/public`)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type StoredObject = {
  key: string;
  bucket: string;
  etag?: string;
  url: string;
  storage?: "s3" | "local";
};

export type UploadBody = Buffer | Uint8Array | string;

let client: S3Client | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Configure S3/MinIO in .env (see .env.example).`,
    );
  }
  return value;
}

export function getStorageConfig() {
  return {
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle:
      (process.env.S3_FORCE_PATH_STYLE ?? "true").toLowerCase() !== "false",
    publicUrl: process.env.S3_PUBLIC_URL,
    localUploadDir: process.env.LOCAL_UPLOAD_DIR,
  };
}

export function isStorageConfigured(): boolean {
  const c = getStorageConfig();
  return Boolean(c.endpoint && c.bucket && c.accessKey && c.secretKey);
}

export function isLocalUploadConfigured(): boolean {
  return Boolean(process.env.LOCAL_UPLOAD_DIR?.trim());
}

export function canStoreFiles(): boolean {
  return isStorageConfigured() || isLocalUploadConfigured();
}

export function getS3Client(): S3Client {
  if (client) return client;
  const c = getStorageConfig();
  if (!c.endpoint || !c.bucket || !c.accessKey || !c.secretKey) {
    throw new Error(
      "S3 storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY.",
    );
  }
  client = new S3Client({
    region: c.region,
    endpoint: c.endpoint,
    forcePathStyle: c.forcePathStyle,
    credentials: {
      accessKeyId: c.accessKey,
      secretAccessKey: c.secretKey,
    },
  });
  return client;
}

export function buildObjectUrl(key: string): string {
  const c = getStorageConfig();
  const bucket = requireEnv("S3_BUCKET");
  if (c.publicUrl) {
    return `${c.publicUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
  }
  const endpoint = requireEnv("S3_ENDPOINT").replace(/\/+$/, "");
  if (c.forcePathStyle) {
    return `${endpoint}/${bucket}/${key.replace(/^\/+/, "")}`;
  }
  const host = endpoint.replace(/^https?:\/\//, "");
  const proto = endpoint.startsWith("https") ? "https" : "http";
  return `${proto}://${bucket}.${host}/${key.replace(/^\/+/, "")}`;
}

function safeStorageKey(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    normalized.includes("..") ||
    !/^(upload_images|upload_videos|pdfs)\/[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/.test(
      normalized,
    )
  ) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

function safeFileName(filename: string): string {
  const base = path.basename(filename.replace(/\\/g, "/"));
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  if (!cleaned) throw new Error("Invalid storage key");
  return cleaned.slice(0, 180);
}
function buildLocalPublicUrl(key: string): string {
  const legacy = (process.env.LEGACY_APP_URL ?? "").replace(/\/+$/, "");
  const normalized = key.replace(/^\/+/, "");
  if (legacy) {
    return `${legacy}/public/${normalized}`;
  }
  return `/${normalized}`;
}

async function uploadFileLocal(
  key: string,
  body: UploadBody,
): Promise<StoredObject> {
  const root = path.resolve(process.env.LOCAL_UPLOAD_DIR!.trim());
  const normalizedKey = safeStorageKey(key);
  const abs = path.resolve(root, normalizedKey);
  if (!abs.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid storage key");
  }
  await mkdir(path.dirname(abs), { recursive: true });
  const buf =
    typeof body === "string" ? Buffer.from(body) : Buffer.from(body);
  await writeFile(abs, buf);
  return {
    key: normalizedKey,
    bucket: "local",
    url: buildLocalPublicUrl(normalizedKey),
    storage: "local",
  };
}

/**
 * Upload a file to S3/MinIO, or LOCAL_UPLOAD_DIR when S3 is unset.
 * Replaces Laravel `public/upload_images` local moves for new uploads.
 */
export async function uploadFile(
  key: string,
  body: UploadBody,
  contentType = "application/octet-stream",
): Promise<StoredObject> {
  const normalizedKey = safeStorageKey(key);

  if (isStorageConfigured()) {
    const bucket = requireEnv("S3_BUCKET");
    const result = await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: normalizedKey,
        Body: body,
        ContentType: contentType,
      }),
    );
    return {
      key: normalizedKey,
      bucket,
      etag: result.ETag,
      url: buildObjectUrl(normalizedKey),
      storage: "s3",
    };
  }

  if (isLocalUploadConfigured()) {
    return uploadFileLocal(normalizedKey, body);
  }

  throw new Error(
    "No storage configured. Set S3_* or LOCAL_UPLOAD_DIR.",
  );
}

/** Read an allowlisted stored media object for the authenticated media route. */
export async function readStoredFile(
  key: string,
): Promise<{ data: Uint8Array; contentType: string }> {
  const normalizedKey = key.replace(/^\/+/, "");
  if (!/^(upload_images|upload_videos)\/[^/]+$/.test(normalizedKey)) {
    throw new Error("Invalid media key");
  }
  const keys = normalizedKey.startsWith("upload_videos/")
    ? [normalizedKey, normalizedKey.replace("upload_videos/", "upload_images/")]
    : [normalizedKey];

  if (isStorageConfigured()) {
    const bucket = requireEnv("S3_BUCKET");
    for (const objectKey of keys) {
      try {
        const result = await getS3Client().send(
          new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
        );
        if (!result.Body) continue;
        return {
          data: await result.Body.transformToByteArray(),
          contentType: result.ContentType ?? "application/octet-stream",
        };
      } catch {
        if (objectKey === keys[keys.length - 1]) throw new Error("Media file was not found");
      }
    }
    throw new Error("Media file was not found");
  }

  if (isLocalUploadConfigured()) {
    const root = path.resolve(process.env.LOCAL_UPLOAD_DIR!.trim());
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".webm": "video/webm",
    };
    for (const objectKey of keys) {
      const absolutePath = path.resolve(root, objectKey);
      if (!absolutePath.startsWith(`${root}${path.sep}`)) {
        throw new Error("Invalid media key");
      }
      try {
        const data = await readFile(absolutePath);
        const ext = path.extname(absolutePath).toLowerCase();
        return { data, contentType: contentTypes[ext] ?? "application/octet-stream" };
      } catch (error) {
        if (objectKey === keys[keys.length - 1]) throw error;
      }
    }
  }

  throw new Error("No storage configured. Set S3_* or LOCAL_UPLOAD_DIR.");
}

export async function deleteFile(
  key: string,
): Promise<{ key: string; deleted: true }> {
  const normalizedKey = safeStorageKey(key);
  if (isStorageConfigured()) {
    const bucket = requireEnv("S3_BUCKET");
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: normalizedKey,
      }),
    );
  }
  return { key: normalizedKey, deleted: true };
}

/** Presigned GET URL (private buckets). */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const bucket = requireEnv("S3_BUCKET");
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key.replace(/^\/+/, ""),
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
}

/** Convenience: store a generated PDF under `pdfs/…`. */
export async function uploadPdf(
  key: string,
  buffer: Buffer,
): Promise<StoredObject> {
  const normalized = safeFileName(key.startsWith("pdfs/") ? key.slice(5) : key);
  return uploadFile(`pdfs/${normalized}`, buffer, "application/pdf");
}

/** Convenience: store job photos under `upload_images/…` (Laravel path parity). */
export async function uploadJobImage(
  filename: string,
  body: UploadBody,
  contentType = "image/jpeg",
): Promise<StoredObject> {
  const key = `upload_images/${safeFileName(filename)}`;
  return uploadFile(key, body, contentType);
}

/** Convenience: store inspection videos under `upload_videos/…` (Laravel path parity). */
export async function uploadJobVideo(
  filename: string,
  body: UploadBody,
  contentType = "video/mp4",
): Promise<StoredObject> {
  const key = `upload_videos/${safeFileName(filename)}`;
  return uploadFile(key, body, contentType);
}

/**
 * Resolve a public URL for a stored image/video filename.
 * Prefers S3 public URL; falls back to Laravel public path via LEGACY_APP_URL.
 */
export function resolveMediaUrl(
  filename: string | null | undefined,
  opts?: { folder?: "upload_images" | "upload_videos"; s3Url?: string | null },
): string | null {
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename)) return filename;
  const folder = opts?.folder ?? "upload_images";
  const key = filename.includes("/")
    ? filename.replace(/^\/+/, "")
    : `${folder}/${filename}`;
  if (canStoreFiles()) return `/api/v2/files/media?key=${encodeURIComponent(key)}`;
  if (opts?.s3Url) return opts.s3Url;
  const legacy = (process.env.LEGACY_APP_URL ?? "").replace(/\/+$/, "");
  if (legacy) return `${legacy}/public/${key}`;
  return `/${key}`;
}
