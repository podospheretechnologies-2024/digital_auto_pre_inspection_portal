import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/api";
import {
  canStoreFiles,
  isLocalUploadConfigured,
  isStorageConfigured,
  uploadFile,
  uploadJobImage,
  uploadJobVideo,
  uploadPdf,
} from "@/lib/services/files";

/**
 * Pre-Inspection file upload (Phase 6).
 *
 * Prefer S3/MinIO; if unset and LOCAL_UPLOAD_DIR is set, write under that
 * directory (Laravel `public/upload_images` compatibility).
 *
 * POST multipart/form-data:
 *   file — required
 *   folder — optional: upload_images (default) | pdfs | custom key prefix
 *   key — optional explicit object key (overrides folder/filename)
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (!canStoreFiles()) {
    return NextResponse.json(
      {
        error: "Storage not configured",
        hint: "Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY — or LOCAL_UPLOAD_DIR pointing at Laravel public/",
      },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Expected multipart field `file`" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";
    const explicitKey = form.get("key");
    const folder = String(form.get("folder") ?? "upload_images");

    let stored;
    if (typeof explicitKey === "string" && explicitKey.trim()) {
      stored = await uploadFile(explicitKey.trim(), bytes, contentType);
    } else if (folder === "pdfs" || contentType === "application/pdf") {
      stored = await uploadPdf(file.name || `pi-${Date.now()}.pdf`, bytes);
    } else if (folder === "upload_videos" || contentType.startsWith("video/")) {
      const name = file.name || `pi-${Date.now()}.mp4`;
      stored = await uploadJobVideo(name, bytes, contentType);
    } else {
      const name =
        file.name ||
        `pi-${Date.now()}.${contentType.includes("png") ? "png" : "jpg"}`;
      stored = await uploadJobImage(name, bytes, contentType);
    }

    const mediaUrl = new URL("/api/v2/files/media", request.url);
    mediaUrl.searchParams.set("key", stored.key);
    return NextResponse.json({
      phase: 6,
      scope: "pre-inspection",
      stored: { ...stored, url: mediaUrl.toString() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Upload failed", message }, { status: 500 });
  }
  const user = await requireSessionUser();
  if (user instanceof NextResponse) return user;
  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    phase: 6,
    scope: "pre-inspection",
    configured: canStoreFiles(),
    s3: isStorageConfigured(),
    local: isLocalUploadConfigured(),
    endpoints: {
      upload: "POST /api/v2/files/upload (multipart file)",
    },
  });
}
