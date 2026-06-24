// Validation for super-admin doctor profile edits (same rules as doctor onboarding).

export {
  licensesValid,
  availabilityValid,
  routingValid,
  accountValid,
  bankingValid,
  doctorProfileFieldErrors as adminDoctorFieldErrors,
  doctorProfileFormIsValid as adminDoctorFormIsValid,
} from "@/app/doctor/doctor-onboard/_lib/validation";
