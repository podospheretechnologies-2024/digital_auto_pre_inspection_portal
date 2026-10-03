import { z } from "zod";

export const bankSchema = z.object({
  name: z.string().trim().min(1).max(190),
  contact_person: z.string().trim().min(1).max(190),
  phone: z.string().trim().min(1).max(190),
  emailid: z.string().trim().email().max(190),
  pincode: z.string().trim().min(1).max(190),
  ifsc: z.string().trim().min(1).max(190),
});

export const nameOnlySchema = z.object({
  name: z.string().trim().min(1).max(190),
});

export const modelSchema = z.object({
  name: z.string().trim().min(1).max(190),
  company_id: z.coerce.number().int().positive(),
});

export const vehicleTypes = [
  "2 Wheeler",
  "3 Wheeler",
  "4 Wheeler",
  "Commercial Vehicle",
  "Agriculture Tractor",
] as const;

export const variantSchema = z.object({
  name: z.string().trim().min(1).max(190),
  company_id: z.coerce.number().int().positive(),
  model_id: z.coerce.number().int().positive(),
  vehicle_type: z.enum(vehicleTypes),
});

export type BankInput = z.infer<typeof bankSchema>;
export type NameOnlyInput = z.infer<typeof nameOnlySchema>;
export type ModelInput = z.infer<typeof modelSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
