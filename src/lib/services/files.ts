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

import { mkdir, writeFile } from "node:fs/promises";
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
  const root = process.env.LOCAL_UPLOAD_DIR!.trim();
  const normalizedKey = key.replace(/^\/+/, "");
  const abs = path.join(root, normalizedKey);
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
  const normalizedKey = key.replace(/^\/+/, "");

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

export async function deleteFile(
  key: string,
): Promise<{ key: string; deleted: true }> {
  const normalizedKey = key.replace(/^\/+/, "");
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
  const normalized = key.startsWith("pdfs/") ? key : `pdfs/${key}`;
  return uploadFile(normalized, buffer, "application/pdf");
}

/** Convenience: store job photos under `upload_images/…` (Laravel path parity). */
export async function uploadJobImage(
  filename: string,
  body: UploadBody,
  contentType = "image/jpeg",
): Promise<StoredObject> {
  const key = `upload_images/${filename.replace(/^\/+/, "")}`;
  return uploadFile(key, body, contentType);
}

/** Convenience: store inspection videos under `upload_videos/…` (Laravel path parity). */
export async function uploadJobVideo(
  filename: string,
  body: UploadBody,
  contentType = "video/mp4",
): Promise<StoredObject> {
  const key = `upload_videos/${filename.replace(/^\/+/, "")}`;
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
  if (opts?.s3Url) return opts.s3Url;
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename)) return filename;
  const folder = opts?.folder ?? "upload_images";
  const key = filename.includes("/")
    ? filename.replace(/^\/+/, "")
    : `${folder}/${filename}`;
  if (isStorageConfigured()) {
    try {
      return buildObjectUrl(key);
    } catch {
      // fall through
    }
  }
  const legacy = (process.env.LEGACY_APP_URL ?? "").replace(/\/+$/, "");
  if (legacy) return `${legacy}/public/${key}`;
  return `/${key}`;
}
