import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { requireBothUser, zodErrorResponse } from "@/lib/api";
import { nameOnlySchema } from "@/lib/masters/schemas";

type NameCrud = {
  list: () => Promise<unknown>;
  create: (data: { name: string }) => Promise<unknown>;
  update: (id: number, data: { name: string }) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  label: string;
};

export function createNameOnlyHandlers(crud: NameCrud) {
  return {
    async GET() {
      const user = await requireBothUser();
      if (user instanceof NextResponse) return user;

      try {
        const data = await crud.list();
        return NextResponse.json({ data });
      } catch (error) {
        console.error(error);
        return NextResponse.json(
          { message: `Failed to load ${crud.label}` },
          { status: 500 },
        );
      }
    },

    async POST(request: Request) {
      const user = await requireBothUser();
      if (user instanceof NextResponse) return user;

      const body = await request.json();
      const parsed = nameOnlySchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);

      try {
        const data = await crud.create(parsed.data);
        return NextResponse.json({ data }, { status: 201 });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return NextResponse.json(
            {
              message: `${crud.label} name already exists`,
              errors: { name: ["Taken"] },
            },
            { status: 422 },
          );
        }
        console.error(error);
        return NextResponse.json({ message: "Create failed" }, { status: 500 });
      }
    },

    async PUT(request: Request) {
      const user = await requireBothUser();
      if (user instanceof NextResponse) return user;

      const body = await request.json();
      const id = Number(body.id);
      if (!id) {
        return NextResponse.json({ message: "id is required" }, { status: 422 });
      }

      const parsed = nameOnlySchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);

      try {
        const data = await crud.update(id, parsed.data);
        return NextResponse.json({ data });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return NextResponse.json(
            {
              message: `${crud.label} name already exists`,
              errors: { name: ["Taken"] },
            },
            { status: 422 },
          );
        }
        console.error(error);
        return NextResponse.json({ message: "Update failed" }, { status: 500 });
      }
    },

    async DELETE(request: Request) {
      const user = await requireBothUser();
      if (user instanceof NextResponse) return user;

      const body = await request.json();
      const id = Number(body.id);
      if (!id) {
        return NextResponse.json({ message: "id is required" }, { status: 422 });
      }

      try {
        await crud.remove(id);
        return NextResponse.json({ ok: true });
      } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Delete failed" }, { status: 500 });
      }
    },
  };
}
