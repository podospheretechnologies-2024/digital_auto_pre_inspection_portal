import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAllUser, zodErrorResponse } from "@/lib/api";
import { db } from "@/lib/db";

const deleteSchema = z.object({
  kind: z.enum(["2wheeler", "3wheeler", "4wheeler"]),
  image_id: z.coerce.number().int().positive(),
});

export async function DELETE(request: Request) {
  const user = await requireAllUser();
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { kind, image_id } = parsed.data;

  try {
    if (kind === "2wheeler") {
      await db.tbl_2wheeler_images.delete({ where: { id: image_id } });
    } else if (kind === "3wheeler") {
      await db.tbl_3wheeler_images.delete({ where: { id: image_id } });
    } else {
      await db.tbl_4wheeler_images.delete({ where: { id: image_id } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
