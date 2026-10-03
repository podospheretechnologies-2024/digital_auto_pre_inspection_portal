import { z } from "zod";

const nonempty = z.string().trim().min(1);

/** POST/GET `/api/legacy/vehicle-rc` — Laravel `rc_regn_no` + `access_token` */
export const vehicleRcSchema = z.object({
  access_token: nonempty,
  rc_regn_no: nonempty,
});

/** GET `/api/legacy/vehicle-info` */
export const vehicleInfoSchema = z.object({
  rc_regn_no: nonempty,
  domain: z.string().trim().optional(),
  force: z.string().trim().optional(),
});

/** GET `/api/legacy/mobile-to-vrn` */
export const mobileToVrnSchema = z.object({
  mobile_number: nonempty,
});

/** GET `/api/legacy/vrn-to-mobile` */
export const vrnToMobileSchema = z.object({
  vehicle_registration_number: nonempty,
});

/**
 * POST `/api/legacy/store-vahan-data` — scraper JSON.
 * Keep permissive; Laravel reads nested vehicle/owner blocks.
 */
export const storeVahanDataSchema = z
  .object({
    registration_no: z.string().optional(),
    vehicle_information: z.record(z.unknown()).optional(),
    owner_information: z.record(z.unknown()).optional(),
  })
  .passthrough();
