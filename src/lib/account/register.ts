/**
 * Guest Surveyor self-signup — re-exports staff register helpers.
 * Surveyor must choose a verified parent RO; HO must approve before login.
 */
export {
  registerSurveyor,
  registerSurveyorSchema as registerSchema,
  type RegisterSurveyorInput as RegisterInput,
} from "@/lib/account/staff";
