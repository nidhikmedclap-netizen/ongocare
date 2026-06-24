// Builds and submits the onboarding payload to our Mautic form (id 4).
// All POSTs go through /api/mautic to avoid CORS issues with the Mautic host.

import { calculateBmi, isValidEmail } from "./utils";

const MAUTIC_FORM_ID = 4;

const joinList = (values) => values.filter(Boolean).join(", ");

const formatHeight = (form) => {
  if (form.bmiUnit === "metric") {
    return form.heightCm ? `${form.heightCm} cm` : "";
  }
  if (!form.heightFt) return "";
  const inches = form.heightIn || "0";
  return `${form.heightFt}' ${inches}"`;
};

const formatWeight = (form) => {
  if (form.bmiUnit === "metric") {
    return form.weightKg ? `${form.weightKg} kg` : "";
  }
  return form.weightLbs ? `${form.weightLbs} lbs` : "";
};

const buildBariatric = (form) => {
  const list = joinList(form.s9);
  if (!list) return "";
  return form.bariDate ? `${list} (${form.bariDate})` : list;
};

const buildHealthConditions = (form) => {
  const parts = [...form.s10, ...form.s11];
  if (form.s11Other.trim()) parts.push(form.s11Other.trim());
  return joinList(parts);
};

const buildDrugs = (form) => {
  const parts = [...form.s17];
  if (form.s17Other.trim()) parts.push(form.s17Other.trim());
  return joinList(parts);
};

const buildPastMethods = (form) => {
  const parts = [...form.s6];
  if (form.s6Other?.trim()) parts.push(form.s6Other.trim());
  return joinList(parts);
};

const buildGlpDose = (form) => {
  if (!form.glpDose) return "";
  const details = form.glpDoseDetails?.trim();
  return details ? `${form.glpDose} — ${details}` : form.glpDose;
};

export function buildMauticPayload(form, currentStep) {
  const bmi = calculateBmi({
    unit: form.bmiUnit,
    heightFt: form.heightFt,
    heightIn: form.heightIn,
    weightLbs: form.weightLbs,
    heightCm: form.heightCm,
    weightKg: form.weightKg,
  });

  const disqualified =
    form.s13 === "Yes" ||
    form.s15 === "Yes" ||
    (bmi !== null && bmi < 27);

  return {
    email: form.email,
    firstname: form.firstName,
    lastname: form.lastName,
    phone: form.phone,
    current_step: currentStep,
    weight_goal: form.s1,
    inspirations: joinList(form.s2),
    bmi: bmi !== null ? bmi.toFixed(1) : "",
    height: formatHeight(form),
    current_weight: formatWeight(form),
    highest_weight: form.wtHigh,
    lowest_weight: form.wtLow,
    goal_weight1: form.wtGoal,
    struggle_duration: form.s5,
    past_methods: buildPastMethods(form),
    glp_history: form.s7,
    glp_med: form.glpMed,
    glp_dose: buildGlpDose(form),
    glp_experience: form.glpExperience,
    glp_last_injection: form.glpLastInjection,
    bariatric_surgery: buildBariatric(form),
    health_conditions: buildHealthConditions(form),
    safety_flags: joinList(form.s12),
    mtc_men2: form.s13,
    pancreatitis: form.s15,
    pregnancy_status: form.s14,
    sex_at_birth: form.sexAtBirth,
    alcohol: form.s16,
    drugs: buildDrugs(form),
    meals_per_day: form.meals,
    exercise_days: form.exercise,
    sleep_hours: form.sleep,
    fast_food: form.fastFood,
    sugary_drinks: form.sugary,
    water_intake: form.water,
    stress_level: String(form.stress),
    ethnicity: joinList(form.s19),
    date: form.dob,
    zip: form.zip,
    address: form.address,
    current_meds: form.meds,
    allergies: form.allergies,
    pharmacy: form.pharmacy,
    selected_doctor: form.doctor,
    consultation_slot: form.slot ? form.slot.replace("|", " · ") : "",
    selected_plan: form.plan,
    paid: form.paid ? "yes" : "no",
    disqualified: disqualified ? "yes" : "no",
  };
}

// Fire-and-forget. Errors are logged; never thrown into the UI.
export async function submitToMautic(form, currentStep) {
  if (!isValidEmail(form.email)) return;
  try {
    const payload = buildMauticPayload(form, currentStep);
    await fetch("/api/mautic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId: MAUTIC_FORM_ID, payload }),
      keepalive: true,
    });
  } catch (err) {
    console.warn("Mautic submission failed:", err);
  }
}
