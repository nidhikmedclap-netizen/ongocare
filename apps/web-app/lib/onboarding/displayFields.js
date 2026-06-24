// Friendly labels and display formatting for onboarding field dumps
// (admin / doctor patient detail "Full onboarding response" sections).

import { formatMoney, PLAN_LABELS } from "@/lib/billing/money";
import {
  formatIsoDateUs,
  formatUsDateTime,
} from "@/lib/dates/usDate";
import { formatPatientDob } from "@/lib/prescriptions/format";

const MONEY_KEYS = new Set([
  "paymentAmount",
  "paymentBaseAmount",
  "couponDiscountAmount",
]);

const ISO_DATE_KEYS = new Set([
  "slotDate",
  "glpLastInjection",
  "bariDate",
]);

const TIMESTAMP_KEYS = new Set([
  "paidAt",
  "paymentAuthorizedAt",
]);

export const ONBOARDING_FIELD_LABELS = {
  s1: "Why they joined",
  s2: "Motivators",
  s5: "Recent weight trend",
  s6: "Weight-affecting events",
  s6Other: "Past methods — other",
  s7: "GLP-1 experience",
  s9: "Bariatric history",
  s10: "Chronic conditions",
  s11: "Other conditions",
  s11Other: "Conditions — other",
  s12: "Contraindication risks",
  s13: "Hospitalizations",
  s14: "Pregnancy / lactation",
  s15: "Family history",
  s16: "Exercise routine",
  s17: "Eating habits",
  s17Other: "Eating habits — other",
  s19: "Goals & barriers",
  bmiUnit: "BMI unit",
  heightFt: "Height (ft)",
  heightIn: "Height (in)",
  weightLbs: "Weight (lbs)",
  heightCm: "Height (cm)",
  weightKg: "Weight (kg)",
  wtHigh: "Highest weight",
  wtLow: "Lowest weight",
  wtGoal: "Goal weight",
  waist: "Waist",
  meals: "Meals per day",
  exercise: "Exercise frequency",
  sleep: "Sleep hours",
  fastFood: "Fast food / week",
  sugary: "Sugary drinks / week",
  water: "Water / day",
  stress: "Stress level (1–10)",
  glpExperience: "Prior GLP-1 experience",
  glpMed: "Prior GLP-1 medication",
  glpDose: "Prior GLP-1 dose",
  glpDoseDetails: "Dose details",
  glpLastInjection: "Last injection date",
  pregnancyConsent: "Pregnancy consent",
  vialPhotoName: "Vial photo",
  photoIdName: "Photo ID",
  firstName: "First name",
  lastName: "Last name",
  dob: "Date of birth",
  zip: "ZIP code",
  state: "State",
  sexAtBirth: "Sex at birth",
  phone: "Phone",
  address: "Address",
  email: "Email",
  meds: "Medications",
  allergies: "Allergies",
  pharmacy: "Pharmacy",
  doctor: "Doctor name",
  doctorUid: "Doctor ID",
  slot: "Appointment slot",
  slotDate: "Appointment date",
  slotTime: "Appointment time",
  plan: "Program plan",
  paid: "Paid",
  paidAt: "Paid at",
  paymentStatus: "Payment status",
  paymentAuthorizedAt: "Payment authorized at",
  paymentIntentId: "Payment intent ID",
  paymentAmount: "Payment amount",
  paymentBaseAmount: "Plan price (before discount)",
  paymentCurrency: "Payment currency",
  paymentBrand: "Card brand",
  paymentLast4: "Card last 4",
  paymentExpMonth: "Card exp. month",
  paymentExpYear: "Card exp. year",
  paymentCardholder: "Cardholder name",
  couponCode: "Coupon code",
  couponId: "Coupon ID",
  couponDiscountPercent: "Coupon discount (%)",
  couponDiscountAmount: "Coupon discount amount",
  consentH: "HIPAA consent",
  consentT: "Terms consent",
  bariDate: "Bariatric procedure date",
};

function humanizeKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function formatOnboardingFieldLabel(key) {
  return ONBOARDING_FIELD_LABELS[key] || humanizeKey(key);
}

function formatTime24(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm || "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatOnboardingFieldValue(
  key,
  value,
  { currency = "usd" } = {},
) {
  if (value == null || value === "") return "";

  if (key === "password") return "••••••••";
  if (key === "dob") return formatPatientDob(value);
  if (key === "plan") return PLAN_LABELS[value] || String(value);
  if (key === "slotTime") return formatTime24(value);
  if (key === "couponDiscountPercent" && typeof value === "number") {
    return `${value}%`;
  }
  if (key === "paymentCurrency") return String(value).toUpperCase();
  if (key === "slot" && typeof value === "string" && value.includes("|")) {
    const [date, time] = value.split("|");
    const datePart = formatIsoDateUs(date, date);
    const timePart = /^\d{2}:\d{2}$/.test(time) ? formatTime24(time) : time;
    return `${datePart} · ${timePart}`;
  }
  if (MONEY_KEYS.has(key) && typeof value === "number") {
    return formatMoney(value, currency);
  }
  if (TIMESTAMP_KEYS.has(key) && typeof value === "number") {
    return formatUsDateTime(value);
  }
  if (ISO_DATE_KEYS.has(key)) {
    return formatIsoDateUs(value, String(value));
  }

  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function isOnboardingFieldEmpty(value) {
  return (
    value === "" ||
    value == null ||
    (Array.isArray(value) && value.length === 0)
  );
}
