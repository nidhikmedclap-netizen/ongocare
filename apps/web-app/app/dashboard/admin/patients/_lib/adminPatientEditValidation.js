// Super-admin patient edit — re-exports shared profile validation.

export {
  PATIENT_PROFILE_FIELD_MESSAGES,
  patientProfileFieldErrors as adminPatientFieldErrors,
  patientProfileFormIsValid as adminPatientFormIsValid,
} from "@/app/weightloss-onboard/_lib/patientProfileValidation";
