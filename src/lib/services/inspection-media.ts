import { db } from "@/lib/db";
import type { WheelKind } from "@/lib/jobs/helpers";
import { resolveMediaUrl } from "@/lib/services/files";

export type InspectionPhotoInput = {
  image: string;
  s3_url?: string | null;
};

export type InspectionPhotoRow = {
  id: number;
  parent_id: number | null;
  image: string | null;
  s3_url?: string | null;
  url: string | null;
};

export async function listInspectionPhotos(
  kind: WheelKind,
  inspectionId: number,
): Promise<InspectionPhotoRow[]> {
  if (kind === "2wheeler") {
    const rows = await db.tbl_2wheeler_images.findMany({
      where: { parent_id: inspectionId },
      orderBy: { id: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      parent_id: r.parent_id,
      image: r.image,
      url: resolveMediaUrl(r.image),
    }));
  }
  if (kind === "3wheeler") {
    const rows = await db.tbl_3wheeler_images.findMany({
      where: { parent_id: inspectionId },
      orderBy: { id: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      parent_id: r.parent_id,
      image: r.image,
      s3_url: r.s3_url,
      url: resolveMediaUrl(r.image, { s3Url: r.s3_url }),
    }));
  }
  const rows = await db.tbl_4wheeler_images.findMany({
    where: { parent_id: inspectionId },
    orderBy: { id: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    parent_id: r.parent_id,
    image: r.image,
    s3_url: r.s3_url,
    url: resolveMediaUrl(r.image, { s3Url: r.s3_url }),
  }));
}

/** Append gallery photos (Laravel tbl_*wheeler_images). */
export async function appendInspectionPhotos(
  kind: WheelKind,
  inspectionId: number,
  photos: InspectionPhotoInput[],
): Promise<void> {
  if (!photos.length) return;
  const now = new Date();

  if (kind === "2wheeler") {
    await db.tbl_2wheeler_images.createMany({
      data: photos.map((p) => ({
        parent_id: inspectionId,
        image: p.image,
        created_at: now,
      })),
    });
    return;
  }

  if (kind === "3wheeler") {
    await db.tbl_3wheeler_images.createMany({
      data: photos.map((p) => ({
        parent_id: inspectionId,
        image: p.image,
        s3_url: p.s3_url ?? null,
        created_at: now,
        updated_at: now,
      })),
    });
    return;
  }

  await db.tbl_4wheeler_images.createMany({
    data: photos.map((p) => ({
      parent_id: inspectionId,
      image: p.image,
      s3_url: p.s3_url ?? null,
      created_at: now,
      updated_at: now,
    })),
  });
}
