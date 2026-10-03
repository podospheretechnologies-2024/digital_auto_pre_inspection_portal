import { z } from "zod";

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72),
    password_confirmation: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export const updateProfileSchema = z.object({
  first_name: z.string().trim().min(1).max(255),
  last_name: z.string().trim().min(1).max(255),
  company: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(255).optional().nullable(),
  website: z.string().trim().max(255).optional().nullable(),
  country: z.string().trim().max(255).optional().nullable(),
  language: z.string().trim().max(255).optional().nullable(),
  timezone: z.string().trim().max(255).optional().nullable(),
  currency: z.string().trim().max(255).optional().nullable(),
  marketing: z.coerce.number().int().optional().nullable(),
});

export const changeEmailSchema = z.object({
  email: z.string().trim().email().max(255),
  current_password: z.string().min(1, "Current password is required"),
});

export const bankUserCreateSchema = z
  .object({
    first_name: z.string().trim().min(1).max(255),
    last_name: z.string().trim().min(1).max(255),
    phone: z.string().trim().min(1).max(255),
    city: z.coerce.number().int().positive(),
    bank: z.coerce.number().int().positive(),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(72),
    password_confirmation: z.string().min(1),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export const bankUserUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  first_name: z.string().trim().min(1).max(255),
  last_name: z.string().trim().min(1).max(255),
  phone: z.string().trim().min(1).max(255),
  city: z.coerce.number().int().positive(),
  bank: z.coerce.number().int().positive(),
  email: z.string().trim().email().max(255),
});

/** Admin-created people: RO / Surveyor / HO / Admin */
export const personRoleSchema = z.enum(["Admin", "HO", "RO", "Surveyor"]);

export const personCreateSchema = z
  .object({
    first_name: z.string().trim().min(1).max(255),
    last_name: z.string().trim().min(1).max(255),
    phone: z.string().trim().min(1).max(255),
    city: z.coerce.number().int().positive(),
    email: z.string().trim().email().max(255),
    role: personRoleSchema,
    password: z.string().min(8).max(72),
    password_confirmation: z.string().min(1),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export const personUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  first_name: z.string().trim().min(1).max(255),
  last_name: z.string().trim().min(1).max(255),
  phone: z.string().trim().min(1).max(255),
  city: z.coerce.number().int().positive(),
  email: z.string().trim().email().max(255),
  role: personRoleSchema,
});

export const personDeleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type BankUserCreateInput = z.infer<typeof bankUserCreateSchema>;
export type BankUserUpdateInput = z.infer<typeof bankUserUpdateSchema>;
export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
export type PersonRole = z.infer<typeof personRoleSchema>;
