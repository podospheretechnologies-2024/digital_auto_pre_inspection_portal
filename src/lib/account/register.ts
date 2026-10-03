import { hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";

/**
 * Guest self-signup — mirrors Laravel RegisteredUserController::store,
 * with type=Surveyor and verified_at null (HO approve via surveyors list).
 */
export const registerSchema = z
  .object({
    first_name: z.string().trim().min(1).max(255),
    last_name: z.string().trim().min(1).max(255),
    city_id: z.coerce.number().int().positive(),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(72),
    password_confirmation: z.string().min(1),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export async function registerSurveyor(input: RegisterInput) {
  const city = await db.m_city.findUnique({
    where: { id: input.city_id },
    select: { id: true },
  });
  if (!city) {
    throw new Error("INVALID_CITY");
  }

  const now = new Date();
  const passwordHash = await hash(input.password, 10);

  try {
    return await db.users.create({
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        city_id: input.city_id,
        type: "Surveyor",
        is_admin: 0,
        status: "Active",
        verified_at: null,
        password: passwordHash,
        created_at: now,
        updated_at: now,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        type: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("EMAIL_TAKEN");
    }
    throw error;
  }
}
