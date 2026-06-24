export const WEIGHT_GOALS = [
  "1–15 lbs.",
  "16–50 lbs.",
  "50+ lbs.",
  "I’m not sure yet",
];

export const INSPIRATIONS = [
  "I want to feel more confident",
  "I want more energy",
  "I want to improve my overall health",
  "I want fewer cravings",
  "I want to reduce my risk of diabetes",
  "I want better health results (labs)",
  "I want to feel better day to day",
];

export const STRUGGLE_DURATIONS = [
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "More than 5 years",
];

export const PAST_METHODS = [
  "Tracking calories",
  "Weight loss programs",
  "Low-carb or keto diets",
  "Intermittent fasting",
  "Regular exercise",
  "Prescription medications",
  "Something else",
];

export const YES_NO = ["Yes", "No"];

export const GLP_EXPERIENCE = [
  "I tolerated it well with little to no side effects",
  "I tolerated it okay but had some side effectst",
  "I’m not sure / I don’t remember",
];

export const GLP_MEDICATIONS = [
  "Wegovy",
  "Ozempic",
  "Rybelsus",
  "Zepbound",
  "Mounjaro",
  "Saxenda or Victoza"

];

export const MEDICATION_DOSES = {
  Wegovy: [
    "0.25 mg (starting dose)",
    "0.5 mg",
    "1 mg",
    "1.7 mg",
    "2.4 mg (maximum dose)",
    "I'm not sure",
  ],
  Ozempic: [
    "0.25 mg (starting dose)",
    "0.5 mg",
    "1 mg",
    "2 mg (higher dose)",
    "I'm not sure",
  ],
  Rybelsus: [
    "1.5 mg (starting dose)",
    "4 mg",
    "9 mg (higher dose)",
    "I'm not sure",
  ],
  Zepbound: [
    "2.5 mg (starting dose)",
    "5 mg",
    "7.5 mg",
    "10 mg",
    "12.5 mg",
    "15 mg (maximum dose)",
    "I'm not sure",
  ],
  Mounjaro: [
    "2.5 mg (starting dose)",
    "5 mg",
    "7.5 mg",
    "10 mg",
    "12.5 mg",
    "15 mg (maximum dose)",
    "I'm not sure",
  ],
  "Saxenda or Victoza": [
    "0.6 mg (starting dose)",
    "1.2 mg",
    "1.8 mg",
    "2.4 mg",
    "3 mg (higher dose)",
    "I'm not sure",
  ],
};
export const NO_YES = ["No", "Yes"];
export const NO_YES_UNSURE = ["No", "Yes", "I'm not sure"];

export const BARIATRIC_PROCEDURES = [
  "Lap band",
  "Gastric sleeve",
  "Gastric bypass",
  "None of these",
];

export const WEIGHT_DIAGNOSES = [
  "High blood pressure",
  "High cholesterol",
  "Type 2 diabetes",
  "Pre-diabetes",
  "Metabolic syndrome",
  "Asthma or COPD",
  "Sleep apnea",
  "Joint pain or arthritis",
  "HIV or AIDS",
  "Cancer",
  "Heart disease",
  "Vascular disease (stroke, blood clots, etc)",
  "Irregular heart beat",
  "None of the above",
];

export const OTHER_CONDITIONS = [
  "PCOS",
  "Thyroid condition",
  "Acid reflux",
  "Fatty liver disease",
  "Anxiety or depression",
  "Kidney disease",
  "None",
  "Other",
];

export const SAFETY_TREATMENTS = [
  "Eating disorder (Anorexia, Nervosa, or other)",
  "Suicidal thoughts or attempts",
  "Gallbladder disease",
  "Allergy to GLP-1 medications",
  "Serious digestive issues",
  "Severe gastroparesis",
  "Kidney disease requiring dialysis",
  "None",
];

export const ALCOHOL_FREQUENCY = [
  "None",
  "0–1",
  "1–6",
  "More than 6",
];

export const RECREATIONAL_DRUGS = [
  "Cannabis",
  "Cocaine or crack",
  "Amyl nitrate or butyl nitrite",
  "I don't use any",
  "Other",
];

export const MEALS_PER_DAY = ["1–2", "3", "4+"];
export const EXERCISE_DAYS = ["0", "1–2", "3–4", "5+"];
export const SLEEP_HOURS = ["Less than 5", "5–6", "7–8", "9+"];
export const FAST_FOOD_PER_WEEK = ["0", "1–2", "3–4", "5+"];
export const SUGARY_DRINKS_PER_WEEK = ["0", "1–3", "4–7", "8+"];
export const WATER_INTAKE = [
  "Less than 4 cups",
  "4–6 cups",
  "7–8 cups",
  "More than 8 cups",
];

export const ETHNICITIES = [
  "Asian or South Asian",
  "African American",
  "Caucasian",
  "Hispanic or Latin",
  "Native American or Alaskan",
  "Pacific Islander",
  "Prefer not to say",
];

export const SEX_OPTIONS = ["Male", "Female", "Prefer not to say"];

export const PLANS = [
  { id: "1m", label: "1 month", months: 1, monthly: 69, oldMonthly: 79, save: -10 },
  { id: "3m", label: "3 months", months: 3, monthly: 219, oldMonthly: 239, save: -20 },
  { id: "6m", label: "6 months", months: 6, monthly: 499, oldMonthly: 579, save: -80 },
];

export const PLAN_BENEFITS = [
  "Unlimited access to a physician & dietitian",
  "Nutrition coaching sessions",
  "Access to weight loss medications and more",
  "24/7 customer support",
];

export const MEDICATION_ADDONS = [
  { label: "Compounded Semaglutide", price: "+ $99/mo", pill: true },
  { label: "Compounded Tirzepatide", price: "+ $199/mo", pill: true },
  { label: "Treatments across skincare, hair growth, and more", price: "", pill: false },
];

// Builds a rolling list of consultation slots starting from today.
// Skips weekends, takes the next 3 weekdays, and offers 2 time slots per day.
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function generateSlots() {
  const slots = [];
  const today = new Date();
  let offset = 0;
  let added = 0;
  while (added < 3 && offset < 14) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      const label = `${DAY_NAMES[dow]} ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
      slots.push({ d: label, t: "9:00 AM" });
      slots.push({ d: label, t: "2:00 PM" });
      added += 1;
    }
    offset += 1;
  }
  return slots;
}
