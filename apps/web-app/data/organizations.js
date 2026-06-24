/**
 * Multi-tenant organization registry.
 *
 * Each entry describes the per-tenant content that gets injected into the
 * shared layout when a user lands on /<slug>. The main site at "/" does NOT
 * read from this file — it uses each section's built-in defaults so the
 * production homepage continues to render with its original real content.
 *
 * Add a new tenant by adding another key here. Only specify the fields you
 * want to override; anything you leave out falls back to that section's
 * default content (defined inside the section component).
 *
 * Future: this file can be swapped for a loader that pulls from Firestore,
 * a CMS, or a database without changing any consuming components.
 */

/**
 * Where per-org assets should live once dedicated artwork exists:
 *   /public/organizations/<slug>/<filename>
 *
 * Until each tenant ships its own assets, we point logos/OG images at
 * existing site assets so pages always render. Replace these with
 * placeholderImage("<slug>", "<filename>") once real files land.
 */
// Per-tone option sets. Routing-sensitive choices (e.g. "Yes"/"No",
// "None of these", "Other", BMI goal buckets) are encoded as
// { value, label } so tenants can rephrase the on-screen text without
// breaking the routing/validation logic that keys off `value`.
const optionFlavors = {
  // ─── personalised (MedClap One) ──────────────────────────────────
  personalised: {
    weightGoalCards: [
      // `value` is preserved exactly — `estimateLossLbs` switches on these.
      { value: "1–15 lbs.", desc: "Personalised tune-up to feel sharper week to week." },
      { value: "16–50 lbs.", desc: "Sustainable loss with a clinician who knows you." },
      { value: "50+ lbs.", desc: "Bigger goal? MedClap pairs you with the right plan." },
      { value: "I’m not sure yet", desc: "That's okay — MedClap will help you map it out." },
    ],
    inspirations: [
      "I want a clinician who actually knows me",
      "I want more steady, all-day energy",
      "I want a plan that fits my real life",
      "I want fewer cravings without willpower games",
      "I want to lower my long-term diabetes risk",
      "I want lab numbers that finally move",
      "I want to feel like myself again",
    ],
    struggleDurations: [
      "Less than a year",
      "1 to 3 years",
      "3 to 5 years",
      "More than 5 years",
    ],
    pastMethods: [
      "Calorie tracking apps",
      "Weight loss programs (WW, Noom, etc.)",
      "Low-carb or keto",
      "Intermittent fasting",
      "Working out regularly",
      "Prescription medications",
      "Something else not listed",
    ],
    alcoholFrequency: [
      "None at all",
      "1 drink or less",
      "2 to 6 drinks",
      "More than 6 drinks",
    ],
    ethnicities: [
      "Asian or South Asian",
      "Black or African American",
      "White or Caucasian",
      "Hispanic, Latino, or Latin",
      "Native American or Alaska Native",
      "Pacific Islander",
      "Prefer not to share",
    ],
    weightDiagnoses: [
      { value: "High blood pressure", label: "High blood pressure (hypertension)" },
      { value: "High cholesterol", label: "High cholesterol" },
      { value: "Type 2 diabetes", label: "Type 2 diabetes" },
      { value: "Pre-diabetes", label: "Pre-diabetes" },
      { value: "Metabolic syndrome", label: "Metabolic syndrome" },
      { value: "Asthma or COPD", label: "Asthma or COPD" },
      { value: "Sleep apnea", label: "Sleep apnea" },
      { value: "Joint pain or arthritis", label: "Joint pain or arthritis" },
      { value: "HIV or AIDS", label: "HIV or AIDS" },
      { value: "Cancer", label: "Cancer (current or past)" },
      { value: "Heart disease", label: "Heart disease" },
      { value: "Vascular disease (stroke, blood clots, etc)", label: "Stroke, blood clots, or vascular disease" },
      { value: "Irregular heart beat", label: "Irregular heart beat (arrhythmia)" },
      { value: "None of the above", label: "None of the above" },
    ],
    otherConditions: [
      { value: "PCOS", label: "PCOS" },
      { value: "Thyroid condition", label: "Thyroid condition" },
      { value: "Acid reflux", label: "Acid reflux / GERD" },
      { value: "Fatty liver disease", label: "Fatty liver disease" },
      { value: "Anxiety or depression", label: "Anxiety or depression" },
      { value: "Kidney disease", label: "Kidney disease" },
      { value: "None", label: "None of these" },
      { value: "Other", label: "Something else" },
    ],
    safetyTreatments: [
      { value: "Eating disorder (Anorexia, Nervosa, or other)", label: "An eating disorder (current or past)" },
      { value: "Suicidal thoughts or attempts", label: "Thoughts of self-harm or suicide" },
      { value: "Gallbladder disease", label: "Gallbladder disease" },
      { value: "Allergy to GLP-1 medications", label: "A known GLP-1 allergy" },
      { value: "Serious digestive issues", label: "Serious digestive issues" },
      { value: "Severe gastroparesis", label: "Severe gastroparesis" },
      { value: "Kidney disease requiring dialysis", label: "Kidney disease needing dialysis" },
      { value: "None", label: "None of these" },
    ],
    recreationalDrugs: [
      { value: "Cannabis", label: "Cannabis or marijuana" },
      { value: "Cocaine or crack", label: "Cocaine or crack" },
      { value: "Amyl nitrate or butyl nitrite", label: "Amyl/butyl nitrites" },
      { value: "I don't use any", label: "I don't use any" },
      { value: "Other", label: "Something else" },
    ],
    bariatricProcedures: [
      { value: "Lap band", label: "Lap band" },
      { value: "Gastric sleeve", label: "Gastric sleeve" },
      { value: "Gastric bypass", label: "Gastric bypass" },
      { value: "None of these", label: "None of these" },
    ],
    yesNo: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" },
    ],
    yesNoUnsure: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" },
      { value: "I'm not sure", label: "I'm not sure" },
    ],
    sexOptions: [
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" },
      { value: "Prefer not to say", label: "Prefer not to say" },
    ],
    mealsPerDay: ["1–2 meals", "3 meals", "4 or more"],
    exerciseDays: ["0 days", "1–2 days", "3–4 days", "5+ days"],
    sleepHours: ["Less than 5", "5–6 hrs", "7–8 hrs", "9+ hrs"],
    fastFoodPerWeek: ["0 times", "1–2 times", "3–4 times", "5+ times"],
    sugaryDrinksPerWeek: ["0 drinks", "1–3 drinks", "4–7 drinks", "8+ drinks"],
    waterIntake: ["Less than 4 cups", "4–6 cups", "7–8 cups", "More than 8 cups"],
    glpExperience: [
      "Tolerated well, few side effects",
      "Tolerated okay, some side effects",
      "I'm not sure / can't remember",
    ],
  },

  // ─── concierge (MedClap Plus) ────────────────────────────────────
  concierge: {
    weightGoalCards: [
      { value: "1–15 lbs.", desc: "Fine-tune. Plus members hit it fast with priority care." },
      { value: "16–50 lbs.", desc: "Concierge-paced loss with weekly check-ins." },
      { value: "50+ lbs.", desc: "Big goal? Plus expedites every step." },
      { value: "I’m not sure yet", desc: "Your Plus concierge will help you scope it." },
    ],
    inspirations: [
      "I want care that doesn't make me wait",
      "I want a Plus team that's there 24/7",
      "I want priority access to GLP-1 medications",
      "I want a concierge clinician matched to me",
      "I want results without the runaround",
      "I want fewer cravings, faster",
      "I want care that respects my schedule",
    ],
    struggleDurations: [
      "Recently — within the last year",
      "1 to 3 years on my mind",
      "3 to 5 years of trying",
      "More than 5 years",
    ],
    pastMethods: [
      "Tracking macros or calories",
      "Premium weight loss programs",
      "Personal trainer or coach",
      "Intermittent fasting protocols",
      "Boutique fitness routines",
      "Prescription weight-loss meds",
      "Something else (private)",
    ],
    alcoholFrequency: [
      "Don't drink",
      "Up to 1 drink a week",
      "2 to 6 drinks a week",
      "More than 6 drinks a week",
    ],
    ethnicities: [
      "Asian / South Asian",
      "Black / African American",
      "White / European",
      "Hispanic / Latin",
      "Indigenous / First Nations",
      "Pacific Islander",
      "Prefer not to say",
    ],
    weightDiagnoses: [
      { value: "High blood pressure", label: "Hypertension" },
      { value: "High cholesterol", label: "High cholesterol / dyslipidemia" },
      { value: "Type 2 diabetes", label: "Type 2 diabetes" },
      { value: "Pre-diabetes", label: "Pre-diabetes" },
      { value: "Metabolic syndrome", label: "Metabolic syndrome" },
      { value: "Asthma or COPD", label: "Asthma / COPD" },
      { value: "Sleep apnea", label: "Sleep apnea (OSA)" },
      { value: "Joint pain or arthritis", label: "Chronic joint pain or arthritis" },
      { value: "HIV or AIDS", label: "HIV or AIDS" },
      { value: "Cancer", label: "Cancer history" },
      { value: "Heart disease", label: "Heart disease" },
      { value: "Vascular disease (stroke, blood clots, etc)", label: "Vascular disease (stroke, clots)" },
      { value: "Irregular heart beat", label: "Arrhythmia" },
      { value: "None of the above", label: "None of these apply" },
    ],
    otherConditions: [
      { value: "PCOS", label: "PCOS (polycystic ovary syndrome)" },
      { value: "Thyroid condition", label: "Thyroid issues" },
      { value: "Acid reflux", label: "GERD / acid reflux" },
      { value: "Fatty liver disease", label: "Fatty liver" },
      { value: "Anxiety or depression", label: "Anxiety, depression, or mood concerns" },
      { value: "Kidney disease", label: "Kidney disease" },
      { value: "None", label: "Nothing else" },
      { value: "Other", label: "Other (please describe)" },
    ],
    safetyTreatments: [
      { value: "Eating disorder (Anorexia, Nervosa, or other)", label: "Eating disorder history" },
      { value: "Suicidal thoughts or attempts", label: "Suicidal ideation or attempts" },
      { value: "Gallbladder disease", label: "Gallbladder disease" },
      { value: "Allergy to GLP-1 medications", label: "GLP-1 allergy" },
      { value: "Serious digestive issues", label: "Severe GI problems" },
      { value: "Severe gastroparesis", label: "Severe gastroparesis" },
      { value: "Kidney disease requiring dialysis", label: "Dialysis-dependent kidney disease" },
      { value: "None", label: "None apply" },
    ],
    recreationalDrugs: [
      { value: "Cannabis", label: "Cannabis" },
      { value: "Cocaine or crack", label: "Stimulants (cocaine/crack)" },
      { value: "Amyl nitrate or butyl nitrite", label: "Nitrites (poppers)" },
      { value: "I don't use any", label: "I don't use any" },
      { value: "Other", label: "Other substance" },
    ],
    bariatricProcedures: [
      { value: "Lap band", label: "Lap band" },
      { value: "Gastric sleeve", label: "Sleeve gastrectomy" },
      { value: "Gastric bypass", label: "Gastric bypass (Roux-en-Y)" },
      { value: "None of these", label: "I haven't had surgery" },
    ],
    yesNo: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" },
    ],
    yesNoUnsure: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" },
      { value: "I'm not sure", label: "Unsure" },
    ],
    sexOptions: [
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" },
      { value: "Prefer not to say", label: "I'd rather not say" },
    ],
    mealsPerDay: ["1–2 a day", "3 a day", "4+ a day"],
    exerciseDays: ["None", "1–2 / week", "3–4 / week", "5+ / week"],
    sleepHours: ["< 5 hrs", "5–6 hrs", "7–8 hrs", "9+ hrs"],
    fastFoodPerWeek: ["Never", "1–2 / week", "3–4 / week", "5+ / week"],
    sugaryDrinksPerWeek: ["Never", "1–3 / week", "4–7 / week", "8+ / week"],
    waterIntake: ["< 4 cups", "4–6 cups", "7–8 cups", "> 8 cups"],
    glpExperience: [
      "Tolerated well with minimal side effects",
      "Tolerated with some side effects",
      "Unsure — can't recall",
    ],
  },

  // ─── affordable (MedClap Lite) ───────────────────────────────────
  affordable: {
    weightGoalCards: [
      { value: "1–15 lbs.", desc: "Smaller goal? Lite keeps it simple and affordable." },
      { value: "16–50 lbs.", desc: "Steady, transparent weight loss without the markup." },
      { value: "50+ lbs.", desc: "Big change? Lite pairs honest pricing with real care." },
      { value: "I’m not sure yet", desc: "No pressure — Lite will help you figure it out." },
    ],
    inspirations: [
      "I want care I can actually afford",
      "I want to skip the membership upsells",
      "I want straight answers, no concierge tax",
      "I want simple, affordable GLP-1 support",
      "I want to feel better without overpaying",
      "I want predictable monthly billing",
      "I want to be free of yo-yo dieting",
    ],
    struggleDurations: [
      "Under a year",
      "Roughly 1–3 years",
      "About 3–5 years",
      "5+ years",
    ],
    pastMethods: [
      "Free calorie-tracking apps",
      "DIY meal planning",
      "Low-carb or keto on my own",
      "Intermittent fasting",
      "Walking / light exercise",
      "Affordable Rx meds",
      "Other approach",
    ],
    alcoholFrequency: [
      "I don't drink",
      "Up to 1",
      "2 to 6",
      "More than 6",
    ],
    ethnicities: [
      "Asian / South Asian",
      "African American",
      "White",
      "Hispanic / Latino",
      "Native American",
      "Pacific Islander",
      "Prefer not to answer",
    ],
    weightDiagnoses: [
      { value: "High blood pressure", label: "High blood pressure" },
      { value: "High cholesterol", label: "High cholesterol" },
      { value: "Type 2 diabetes", label: "Type 2 diabetes" },
      { value: "Pre-diabetes", label: "Pre-diabetes" },
      { value: "Metabolic syndrome", label: "Metabolic syndrome" },
      { value: "Asthma or COPD", label: "Asthma or COPD" },
      { value: "Sleep apnea", label: "Sleep apnea" },
      { value: "Joint pain or arthritis", label: "Joint pain or arthritis" },
      { value: "HIV or AIDS", label: "HIV or AIDS" },
      { value: "Cancer", label: "Cancer" },
      { value: "Heart disease", label: "Heart disease" },
      { value: "Vascular disease (stroke, blood clots, etc)", label: "Stroke or blood clots" },
      { value: "Irregular heart beat", label: "Irregular heartbeat" },
      { value: "None of the above", label: "None of these" },
    ],
    otherConditions: [
      { value: "PCOS", label: "PCOS" },
      { value: "Thyroid condition", label: "Thyroid condition" },
      { value: "Acid reflux", label: "Acid reflux" },
      { value: "Fatty liver disease", label: "Fatty liver" },
      { value: "Anxiety or depression", label: "Anxiety or depression" },
      { value: "Kidney disease", label: "Kidney disease" },
      { value: "None", label: "None" },
      { value: "Other", label: "Other" },
    ],
    safetyTreatments: [
      { value: "Eating disorder (Anorexia, Nervosa, or other)", label: "Eating disorder" },
      { value: "Suicidal thoughts or attempts", label: "Suicidal thoughts or attempts" },
      { value: "Gallbladder disease", label: "Gallbladder issues" },
      { value: "Allergy to GLP-1 medications", label: "Allergic to GLP-1s" },
      { value: "Serious digestive issues", label: "Serious GI issues" },
      { value: "Severe gastroparesis", label: "Gastroparesis" },
      { value: "Kidney disease requiring dialysis", label: "Dialysis kidney disease" },
      { value: "None", label: "None" },
    ],
    recreationalDrugs: [
      { value: "Cannabis", label: "Cannabis" },
      { value: "Cocaine or crack", label: "Cocaine / crack" },
      { value: "Amyl nitrate or butyl nitrite", label: "Poppers / nitrites" },
      { value: "I don't use any", label: "None" },
      { value: "Other", label: "Other" },
    ],
    bariatricProcedures: [
      { value: "Lap band", label: "Lap band surgery" },
      { value: "Gastric sleeve", label: "Gastric sleeve" },
      { value: "Gastric bypass", label: "Gastric bypass" },
      { value: "None of these", label: "I have not had surgery" },
    ],
    yesNo: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" },
    ],
    yesNoUnsure: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" },
      { value: "I'm not sure", label: "Not sure" },
    ],
    sexOptions: [
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" },
      { value: "Prefer not to say", label: "Prefer not to say" },
    ],
    mealsPerDay: ["1–2", "3", "4+"],
    exerciseDays: ["0", "1–2", "3–4", "5+"],
    sleepHours: ["Under 5", "5–6", "7–8", "9+"],
    fastFoodPerWeek: ["0", "1–2", "3–4", "5+"],
    sugaryDrinksPerWeek: ["0", "1–3", "4–7", "8+"],
    waterIntake: ["Under 4 cups", "4–6 cups", "7–8 cups", "Over 8 cups"],
    glpExperience: [
      "Went fine, barely any side effects",
      "Went okay, had a few side effects",
      "Honestly, I can't remember",
    ],
  },
};

// Builds an onboarding content override block for a tenant from a small set
// of brand levers (name, tone words, CTA phrasing). Each screen in the
// onboarding flow reads from this block via `useScreenContent` and falls
// back to the screen's own defaults when a key is missing — so we only
// override the text that should differ per tenant; everything else (form
// state shape, clinical lists, validation, routing) stays uniform.
//
// `slug` is used to build per-portal links from inside the form (e.g.
// the S1/S2 "Already a member? Sign In" footnote → /<slug>/login).
function buildOnboarding({ brand, shortBrand, tone, ctaVerb, slug }) {
  const opts = optionFlavors[tone] ?? optionFlavors.personalised;
  const loginHref = slug ? `/${slug}/login` : "/login";
  return {
    sections: {
      weight:    { short: `${shortBrand} weight` },
      meds:      { short: "Meds" },
      id:        { short: "ID" },
      bariatric: { short: "Surgery" },
      medical:   { short: "Medical" },
      safety:    { short: "Safety" },
      lifestyle: { short: "Lifestyle" },
      profile:   { short: "Wrap-up" },
    },
    s1: {
      pill: `${brand} · 2 minute quiz`,
      titleStart: "Let's ",
      titleEm: `personalize your ${shortBrand}`,
      titleEnd: "treatment plan",
      subtitle: `Answer a few quick questions and we'll pair you with the right ${brand} plan.`,
      question: `How much weight would you like to lose with ${brand}?`,
      cards: opts.weightGoalCards,
      ctaLabel: "Continue",
      signInPrefix: `Already a ${brand} member?`,
      signInHref: loginHref,
    },
    s2: {
      pill: `${brand} · Almost there`,
      titleStart: "What's ",
      titleEm: `driving you to ${brand}`,
      titleEnd: "right now?",
      subtitle: `Tell us what matters most so ${brand} can tailor your plan.`,
      question: `What's making you want to start ${brand} now?`,
      questionSub: "Select all that apply.",
      options: opts.inspirations,
      ctaLabel: "Continue",
      signInHref: loginHref,
    },
    s3: {
      eyebrow: `${brand} · Eligibility check`,
      question: `Let's see if a ${brand} GLP-1 plan fits you`,
      subtitle: `Your height and weight help ${brand} calculate your BMI — a key part of eligibility.`,
    },
    iGood: {
      title: `${brand} good news!`,
      bodyStart: "Based on this info, ",
      bodyStrong: `you may be eligible for ${brand} GLP-1 care`,
      bodyEnd: ". Here's what your journey could look like:",
    },
    iRoad: {
      title: `Great! Here's your ${brand} road map`,
      subtitle: `A few more questions and ${brand} will build a personalised plan.`,
      step1Title: `${brand} health intake`,
      step1Desc: `Quick questions about your goals and history.`,
      step2Title: `See your ${brand} match`,
      step2Desc: `Get matched with a ${brand} treatment plan.`,
      step3Title: `Book a ${brand} consult`,
      step3Desc: `Your ${brand} clinician will call you at your scheduled time.`,
      step4Title: `Start your ${brand} plan`,
      step4Desc: `${brand} medication ships discreetly to your door.`,
      trust1: `${brand} licensed clinicians`,
      trust2: "HIPAA secure",
    },
    s4: {
      question: `Share a little about your weight journey with ${brand}.`,
      subtitle: `This helps your ${brand} clinician understand your story.`,
      placeholderHigh: "Highest adult weight (lbs)",
      placeholderLow: "Lowest weight in past 5 yrs (lbs)",
      placeholderGoal: "Your goal weight (lbs)",
      placeholderWaist: "Waist (inches, optional)",
    },
    s5: {
      question: `How long has weight been a concern before joining ${brand}?`,
      options: opts.struggleDurations,
    },
    s6: {
      question: `What have you tried before turning to ${brand}?`,
      subtitle: "Select all that apply.",
      options: opts.pastMethods,
    },
    s7: {
      question: `Have you used any GLP-1 medications before ${brand}?`,
      options: opts.yesNo,
    },
    s7m: {
      question: `Which GLP-1 medication have you used? ${brand} will pick up from where you left off.`,
    },
    s7b: {
      questionTemplate: `What ${brand} dose of {med} are/were you on?`,
      detailsLabel: `Share how many units you draw per injection and your ${brand} cadence.`,
    },
    s7a: {
      question: `How was your ${brand}-relevant GLP-1 experience overall?`,
      options: opts.glpExperience,
    },
    s7c: {
      question: `When was your last GLP-1 injection before ${brand}? (MM/DD/YYYY)`,
    },
    s7d: {
      question: `If you have a photo of your current GLP-1 medication, upload it so ${brand} clinicians can verify dosing.`,
      uploadLabel: `⬆ Upload to ${brand}`,
    },
    s7e: {
      question: `Upload a photo ID for ${brand}`,
      subtitle: `${brand} verifies identity with a government-issued ID (driver's license, passport, state ID).`,
      tip1: "Entire ID is visible",
      tip2: "Not cropped, blurry, or dark",
      tip3: `Only your ${brand} healthcare team sees this`,
      selectLabel: "📁 Select photo",
      takeLabel: "📷 Take photo",
    },
    s9: {
      question: `Have you had any weight loss surgery before joining ${brand}?`,
      subtitle: "Select all that apply.",
      options: opts.bariatricProcedures,
    },
    s9b: {
      questionTemplate: `When was your {list} {word}? ${brand} clinicians need this for planning.`,
    },
    s10: {
      question: `Has a doctor diagnosed you with any of these conditions? ${brand} clinicians use this to tailor care.`,
      subtitle: "Select all that apply.",
      options: opts.weightDiagnoses,
    },
    s11: {
      question: `Any other conditions ${brand} should know about?`,
      subtitle: "Select all that apply.",
      options: opts.otherConditions,
      otherPlaceholder: "Anything else? (optional)",
    },
    s12: {
      question: `Are you currently dealing with any of these? ${brand} reviews these carefully for safety.`,
      subtitle: "Select all that apply.",
      options: opts.safetyTreatments,
    },
    s13: {
      question: `Have you or a close family member had medullary thyroid cancer or MEN2 syndrome? ${brand} screens for this before prescribing.`,
      options: opts.yesNoUnsure,
    },
    s13a: {
      question: `What was your sex assigned at birth? ${brand} uses this for clinical decisions only.`,
      options: opts.sexOptions,
    },
    s14: {
      question: `Are you pregnant, planning to become pregnant, or breastfeeding? ${brand} requires we ask.`,
      options: opts.yesNo,
    },
    s14b: {
      question: `By selecting "I understand" you confirm any ${brand}-prescribed treatment must be discontinued before pregnancy or breastfeeding.`,
      consentLabel: "I understand",
    },
    s15: {
      question: `Have you ever had pancreatitis? ${brand} screens for this before prescribing GLP-1s.`,
      options: opts.yesNo,
    },
    s16: {
      question: `How many alcoholic drinks per week, on average? ${brand} factors this into your plan.`,
      options: opts.alcoholFrequency,
    },
    s17: {
      question: `Do you use any recreational drugs? Your answer stays private inside ${brand}.`,
      subtitle: "Your answer is private.",
      options: opts.recreationalDrugs,
    },
    s18: {
      question: `Tell ${brand} about your daily routine.`,
      subtitle: `This helps your ${brand} clinician personalise your plan.`,
      stressLabel: "Stress level",
      mealsOptions: opts.mealsPerDay,
      exerciseOptions: opts.exerciseDays,
      sleepOptions: opts.sleepHours,
      fastFoodOptions: opts.fastFoodPerWeek,
      sugaryOptions: opts.sugaryDrinksPerWeek,
      waterOptions: opts.waterIntake,
    },
    s19: {
      question: `What is your ethnicity? ${brand} uses this to tailor treatment options.`,
      subtitle: `Optional — but it helps ${brand} personalise care.`,
      options: opts.ethnicities,
    },
    s20: {
      question: `Create your ${brand} account`,
      subtitle: `Enter your email and create a password — you'll use these to sign in to your ${brand} dashboard.`,
      emailPlaceholder: "Your email",
      passwordPlaceholder: "Create a password",
      consentHipaaText: `I agree to ${brand}'s`,
      consentHipaaLink: "HIPAA Authorization",
      consentTelehealthPrefix: `I agree to ${brand}'s`,
      consentTelehealthLink: "Telehealth Consent",
      consentTermsLink: "Terms of Use",
      consentPrivacyLink: "Privacy Policy",
      ctaLabel: `Continue to ${brand}`,
      ctaSaving: `Setting up ${brand}…`,
      googleLabel: `Continue to ${brand} with Google`,
      goToSignIn: `Go to ${brand} sign in →`,
    },
    s21: {
      question: `Complete your ${brand} profile`,
      subtitle: `${brand} clinicians need this for treatment and prescriptions.`,
      firstNamePlaceholder: "First name",
      lastNamePlaceholder: "Last name",
      zipPlaceholder: "ZIP code",
      phonePlaceholder: "Mobile phone",
      addressPlaceholder: "Street address",
    },
    s22: {
      medsQuestion: `Any medications or supplements ${brand} should know about?`,
      medsSubtitle: "Include prescriptions, OTC meds, and supplements.",
      medsPlaceholder: "e.g. Metformin 500mg, Fish Oil — or type None",
      allergiesQuestion: `Any allergies your ${brand} clinician should flag?`,
      allergiesPlaceholder: "e.g. Penicillin — or type None",
      pharmacyQuestion: `Preferred pharmacy for your ${brand} prescription?`,
      pharmacyPlaceholder: "e.g. CVS, 123 Main St (optional)",
    },
    s22b: {
      question: `Meet your ${brand} clinician`,
      subtitle: `Your ${brand} consultation is with a licensed, board-certified clinician specialising in metabolic health and GLP-1 therapy. Pick who you'd like to see.`,
      loadingText: `Loading ${brand} clinicians…`,
      emptyText: `No ${brand} clinicians licensed in your state are available right now. Head to your patient dashboard — we'll let you know when a clinician is ready.`,
      emptyNoMatchTemplate: `No ${brand} clinicians licensed in {state} are available right now. Head to your patient dashboard — we'll let you know when a clinician is ready.`,
      dashboardCtaLabel: "Go to your dashboard",
    },
    s23: {
      question: `When would you like to meet your ${brand} clinician?`,
      subtitle: `${brand} consultations take 10–30 minutes. Pick the slot that fits your week.`,
      loadingText: `Loading your ${brand} clinician's open times…`,
      emptyText: `No ${brand} slots in the next three weeks. We'll be in touch shortly.`,
      confirmLabel: `You picked your ${brand} slot:`,
      ctaLabel: `Confirm my ${brand} appointment`,
    },
    sPlan: {
      label: `Choose your ${brand} plan`,
      ctaLabel: `Continue`,
    },
    sPay: {
      label: `${brand} payment`,
      question: `Secure your ${brand} plan`,
      subtitleTemplate: `Complete your one-time payment to activate your ${brand} {plan}.`,
    },
    iConfirm: {
      title: `Welcome to ${brand}!`,
      body: `Your ${brand} consultation is booked. Check your email for prep instructions — your clinician will review your intake before the call.`,
      confirmedTitle: `${brand} consultation confirmed`,
      channel: "Phone consultation",
      expectTitle: `What to expect from ${brand}`,
      expectBody: `Your ${brand} clinician will discuss your goals and prescribe a personalised GLP-1 plan if clinically appropriate.`,
      ctaLabel: `Go to my ${brand} dashboard →`,
    },
    dHard: {
      title: `${brand} wants to keep you safe`,
      body: `Based on your answers, GLP-1 medications may not be appropriate for you at this time. Please talk to your primary care provider — ${brand} will email helpful resources.`,
      emailPlaceholder: `Your email — we'll share ${brand} resources`,
      ctaLabel: `Keep ${brand} updates coming`,
    },
    iThanks: {
      title: `Thanks — ${brand} will stay in touch`,
      bodyTemplate: `${brand} will send helpful resources to {email}. In the meantime, please reach out to your primary care provider for personalised guidance.`,
    },
  };
}

const placeholderImage = (slug, name) => `/organizations/${slug}/${name}`;
const fallbackLogo = "/images/ongo-weight-loss-logo.webp";
const fallbackOg = "/images/ongo-weight-loss-logo.webp";

export const organizations = {
  medclap1: {
    slug: "medclap1",
    name: "MedClap One",

    branding: {
      logoSrc: fallbackLogo,
      logoAlt: "MedClap One",
      logoText: "MedClap One",
      shortName: "MedClap",
      logoMark: "◆",
      logoWidth: 220,
      logoHeight: 144,
      drawerLogoText: "MedClap One",
      tagline: "Clinician-led metabolic care, personalised for you.",
      email: "hello@medclap1.com",
      phone: "+1 (555) 100-0001",
      phoneHref: "tel:+15551000001",
      copyrightName: "MedClap One",
      footerTagline: "Doctor-led GLP-1 care, made for you.",
      disclaimerLead: "Medical disclaimer:",
      disclaimerBody:
        " MedClap One connects you with licensed medical providers. GLP-1 medications require a clinician evaluation and prescriptions are issued only when medically appropriate. Individual results vary. This site does not provide medical advice.",
      newsletterEyebrow: "MedClap insider",
      newsletterHeading: "Member stories & MedClap updates",
      newsletterCopy: "One MedClap email a month. Unsubscribe anytime.",
      social: {
        instagram: "https://instagram.com/medclap1",
        youtube: "https://youtube.com/@medclap1",
        yelp: "https://yelp.com/biz/medclap1",
      },
    },

    seo: {
      title: "MedClap One — Personalised GLP-1 Weight Loss Care",
      description:
        "MedClap One pairs you with licensed clinicians for a fully personalised GLP-1 treatment plan, delivered online.",
      keywords: [
        "MedClap One",
        "GLP-1",
        "weight loss",
        "telehealth",
        "semaglutide",
      ],
      ogImage: fallbackOg,
    },

    hero: {
      eyebrow: "5,000+ MEMBERS TRUST MEDCLAP ONE WITH THEIR GLP-1 JOURNEY",
      headingMain: "Personalised",
      headingItalic: " GLP-1 care ",
      headingSuffix: "for lasting results",
      subcopy:
        "MedClap One pairs you with a licensed clinician who tailors every step of your GLP-1 treatment plan to your body.",
      ctaLabel: "Start My MedClap Evaluation",
      ctaHref: "/weightloss-onboard",
      trustBadges: [
        "Board-certified Clinicians",
        "HIPAA-secure Platform",
        "100% Virtual Visits",
      ],
      disclaimer: "Prescription approvals are at clinician discretion.",
    },

    loseWeight: {
      headingMain: "A MedClap weight loss plan",
      headingAccentLead: "tuned to",
      headingAccent: "your biology",
      subcopy: "MedClap One's program adapts to your routine. We offer:",
      benefits: [
        { icon: "✋", text: "Dedicated 1:1 clinician partnership" },
        { icon: "◐", text: "GLP-1 medication access (when indicated)" },
        { icon: "📈", text: "Continuous progress check-ins" },
      ],
      ctaLabel: "Start My MedClap Evaluation",
      ctaHref: "/weightloss-onboard",
      disclaimer:
        "GLP-1 prescriptions are issued only when medically appropriate and in line with FDA guidelines.",
      chipLabel: "MedClap Weight",
      chipValue: "32 lbs",
    },

    howItWorks: {
      headingMain: "How your MedClap",
      headingAccent: "treatment journey works",
      ctaLabel: "Book My Free Intake Call",
      ctaHref: "/weightloss-onboard",
      disclaimerLabel: "Heads up:",
      disclaimerBody:
        " After your visit, fill your prescription at any licensed pharmacy or use our optional pharmacy partner.",
      steps: [
        {
          number: "Step 1",
          title: "Free MedClap Intake Call",
          caption: "Tell us about your goals and history",
          imageAlt: "Welcome call with a MedClap care advisor",
          imageSrc: "/images/step-a.webp",
          features: [
            "Quick virtual signup",
            "Friendly care advisor",
            "No pressure to continue",
          ],
        },
        {
          number: "Step 2",
          title: "Visit a Licensed Clinician",
          caption: "We confirm whether GLP-1 is right for you",
          imageAlt: "MedClap licensed clinician on phone consultation",
          imageSrc: "/images/step-b.webp",
          features: [
            "Licensed clinician review",
            "Eligibility confirmation",
            "Personalised plan",
          ],
        },
        {
          number: "Step 3",
          title: "Begin Your Personalised Plan",
          caption: "If appropriate, treatment ships discreetly",
          imageAlt: "Medication arriving at the door",
          imageSrc: "/images/step-c.webp",
          features: [
            "Custom medication plan",
            "Discreet home delivery",
            "Ongoing clinician support",
          ],
        },
      ],
    },

    bmi: {
      eyebrow: "MEDCLAP ELIGIBILITY",
      headingMain: "Could a GLP-1 fit",
      headingItalic: "your",
      headingSuffix: "MedClap plan?",
      subcopy:
        "Your MedClap clinician reviews BMI and clinical history together to determine whether you qualify.",
    },

    plans: {
      eyebrow: "MEDCLAP MEDICATIONS",
      headingMain: "Find the right medication for your",
      headingAccent: "MedClap plan",
      subcopy:
        "MedClap clinicians can prescribe from a panel of GLP-1 options depending on what's medically appropriate.",
      ctaPrefix: "Start MedClap with",
      disclaimerLead: "Important:",
      disclaimerBody:
        " medications like Ozempic, Mounjaro, Rybelsus, and Victoza are not FDA-approved for weight loss but may be prescribed off-label when medically appropriate.",
      disclaimerSmall:
        "Compounded medications may be offered based on eligibility but are not FDA-approved.",
    },

    cta: {
      eyebrow: "Clinician-Supervised Lifestyle Coaching",
      headingMain: "A MedClap plan built for",
      headingAccent: "long-term success",
      rotatingText: "★ MEDCLAP CARE · MODERN HEALTHCARE  ",
      cardTitle: "Lifestyle coaching\nbuilt around you",
      cardText:
        "MedClap pairs medication with nutrition and movement guidance, so progress sticks long after you reach your goal.",
      stats: [
        { value: "-29.3 lbs", label: "Avg loss in 6 months" },
        { value: "92%", label: "See visible results" },
      ],
      cardHint: "Drag the slider to see real MedClap results",
      footerText:
        "We're committed to safe, steady, sustainable weight loss with MedClap.",
      footerLink: "Built for those who choose progress →",
    },

    pricing: {
      eyebrow: "MedClap Membership Pricing",
      headingMain: "What's included in your",
      headingAccent: "MedClap membership",
      subcopy:
        "Transparent, honest pricing. Every MedClap member gets the same level of clinical care.",
      trustList: [
        { value: "5000+", text: "Members" },
        { value: "$0", text: "Intake Call" },
        { value: "24/7", text: "Care Support" },
      ],
      disclaimerTitle: "MedClap pricing note",
      disclaimerText:
        "Displayed pricing is for compounded medications. Brand-name options and final costs vary by prescription and pharmacy.",
      ctaLabel: "Start My MedClap Evaluation at $69",
    },

    reviews: {
      eyebrow: "MEDCLAP MEMBERS",
      headingMain: "There's a reason MedClap members",
      headingAccent: "keep recommending us",
      subcopy:
        "Thousands of MedClap members have found a sustainable path to weight loss with our clinical team.",
    },

    education: {
      headingMain: "Why choose",
      headingAccent: "MedClap One",
      subcopy:
        "MedClap is built around the idea that real weight loss takes real clinical care — not gimmicks.",
      miniStats: [
        { value: "5000+", label: "Members" },
        { value: "100%", label: "Online" },
      ],
      ctaLabel: "Start My MedClap Evaluation",
      ctaHref: "/weightloss-onboard",
    },

    doctors: {
      headingMain: "Meet your",
      headingAccent: "MedClap Clinicians",
      subcopy:
        "MedClap connects you with licensed clinicians who specialise in sustainable, evidence-based weight loss care.",
      ctaLabel: "Meet My MedClap Clinician",
      ctaHref: "/weightloss-onboard",
      trustItems: [
        { value: "30+", label: "Licensed clinicians" },
        { value: "50", label: "States covered" },
      ],
    },

    faq: {
      eyebrow: "MEDCLAP · ANSWERS",
      headingMain: "MedClap",
      headingAccent: "questions",
      headingSuffix: ", clearly answered.",
      subcopy:
        "Everything you need to know about MedClap's GLP-1 program. Can't find your answer? Our care team is one click away.",
      contactBadge: "MedClap Care Team",
      contactTitle: "Still have questions?",
      contactText:
        "Talk to a MedClap care team member and get clarity before you commit.",
      contactCta: "Start My Free MedClap Call →",
      faqs: [
        {
          question: "What are GLP-1 medications and how do they help with weight loss?",
          answer:
            "GLP-1 medications are prescription drugs that help control appetite and blood sugar. MedClap clinicians use them as one part of a personalised plan, never as a quick fix.",
        },
        {
          question: "How is MedClap One different from generic telehealth?",
          answer:
            "MedClap One pairs you with a clinician who tailors every step of your plan, including lifestyle coaching alongside medication.",
        },
        {
          question: "Who qualifies for MedClap One's GLP-1 program?",
          answer:
            "Adults with obesity or who are overweight with related conditions (type 2 diabetes, high blood pressure, high cholesterol) may qualify. A MedClap clinician confirms eligibility.",
        },
        {
          question: "Are MedClap One prescriptions FDA approved?",
          answer:
            "Approved GLP-1s are FDA-approved for weight loss when criteria are met. Some medications may be prescribed off-label when clinically appropriate.",
        },
        {
          question: "How much does MedClap One cost?",
          answer:
            "The MedClap One evaluation fee is $69. Medication costs vary based on the prescription, dose, and pharmacy.",
        },
        {
          question: "Can I cancel MedClap One anytime?",
          answer:
            "Yes — pause or cancel before your next billing cycle. We recommend talking to your MedClap clinician before stopping any medication.",
        },
      ],
    },

    appCta: {
      headingMain: "Take charge of",
      headingItalic: "your MedClap journey!",
      subcopy:
        "Start your MedClap evaluation today and get a GLP-1 plan designed around your health.",
      ctaLabel: "Start My MedClap Evaluation",
      ctaHref: "/weightloss-onboard",
    },

    onboarding: buildOnboarding({
      brand: "MedClap One",
      shortBrand: "MedClap",
      tone: "personalised",
      ctaVerb: "Start",
      slug: "medclap1",
    }),
  },

  medclap2: {
    slug: "medclap2",
    name: "MedClap Plus",

    branding: {
      logoSrc: fallbackLogo,
      logoAlt: "MedClap Plus",
      logoText: "MedClap Plus",
      shortName: "Plus",
      logoMark: "✦",
      logoWidth: 220,
      logoHeight: 144,
      drawerLogoText: "MedClap Plus",
      tagline: "Concierge GLP-1 care, on your schedule.",
      email: "care@medclap2.com",
      phone: "+1 (555) 200-0002",
      phoneHref: "tel:+15552000002",
      copyrightName: "MedClap Plus",
      footerTagline: "Concierge GLP-1 care, on your schedule.",
      disclaimerLead: "Medical disclaimer:",
      disclaimerBody:
        " MedClap Plus is a concierge service connecting you with licensed medical providers. GLP-1 medications require a clinician evaluation and prescriptions are issued only when medically appropriate.",
      newsletterEyebrow: "Plus insider",
      newsletterHeading: "Concierge stories & member-only updates",
      newsletterCopy: "Short, useful, monthly. Plus members get it first.",
      social: {
        instagram: "https://instagram.com/medclap2",
        youtube: "https://youtube.com/@medclap2",
        yelp: "https://yelp.com/biz/medclap2",
      },
    },

    seo: {
      title: "MedClap Plus — Concierge GLP-1 Care",
      description:
        "MedClap Plus delivers concierge GLP-1 care with same-day virtual visits, fast prescriptions, and 24/7 messaging.",
      keywords: [
        "MedClap Plus",
        "concierge GLP-1",
        "weight loss",
        "telehealth",
      ],
      ogImage: fallbackOg,
    },

    hero: {
      eyebrow: "CONCIERGE GLP-1 CARE · SAME-DAY VISITS",
      headingMain: "Concierge",
      headingItalic: " GLP-1 weight loss",
      headingSuffix: " on your schedule",
      subcopy:
        "MedClap Plus offers same-day virtual visits, faster prescriptions, and 24/7 messaging with your dedicated care team.",
      ctaLabel: "Start My Concierge Evaluation",
      ctaHref: "/weightloss-onboard",
      trustBadges: [
        "Concierge Care Team",
        "Same-Day Visits",
        "24/7 Messaging",
      ],
      disclaimer:
        "All prescriptions remain at the discretion of your licensed clinician.",
    },

    loseWeight: {
      headingMain: "MedClap Plus pairs",
      headingAccentLead: "clinical rigor with",
      headingAccent: "concierge convenience",
      subcopy:
        "Built for busy lives. Here's what every MedClap Plus member gets:",
      benefits: [
        { icon: "✋", text: "Dedicated concierge clinician" },
        { icon: "◐", text: "Priority GLP-1 medication access" },
        { icon: "📈", text: "Weekly progress reviews" },
      ],
      ctaLabel: "Start My Concierge Evaluation",
      ctaHref: "/weightloss-onboard",
      disclaimer:
        "MedClap Plus prescriptions are issued only when clinically appropriate per FDA guidelines.",
      chipLabel: "Plus Weight",
      chipValue: "38 lbs",
    },

    howItWorks: {
      headingMain: "MedClap Plus",
      headingAccent: "concierge journey",
      ctaLabel: "Book My Concierge Visit",
      ctaHref: "/weightloss-onboard",
      disclaimerLabel: "Plus perk:",
      disclaimerBody:
        " Members receive priority pharmacy routing and complimentary delivery.",
      steps: [
        {
          number: "Step 1",
          title: "Same-Day Concierge Intake",
          caption: "Skip the queue with priority booking",
          imageAlt: "MedClap Plus concierge intake",
          imageSrc: "/images/step-a.webp",
          features: [
            "Same-day appointments",
            "Concierge onboarding specialist",
            "Direct text line",
          ],
        },
        {
          number: "Step 2",
          title: "Dedicated Clinician Visit",
          caption: "Meet a clinician matched to your goals",
          imageAlt: "MedClap Plus clinician phone consultation",
          imageSrc: "/images/step-b.webp",
          features: [
            "Concierge clinician match",
            "Eligibility decision in days",
            "Personalised care plan",
          ],
        },
        {
          number: "Step 3",
          title: "Treatment & 24/7 Support",
          caption: "Receive your plan with around-the-clock support",
          imageAlt: "MedClap Plus member receiving medication",
          imageSrc: "/images/step-c.webp",
          features: [
            "Priority pharmacy routing",
            "Free expedited delivery",
            "24/7 messaging with care team",
          ],
        },
      ],
    },

    bmi: {
      eyebrow: "PLUS ELIGIBILITY",
      headingMain: "Find out if",
      headingItalic: "Plus",
      headingSuffix: "is right for you",
      subcopy:
        "MedClap Plus clinicians weigh more than just BMI — they look at your full health profile in days, not weeks.",
    },

    plans: {
      eyebrow: "PLUS MEDICATIONS",
      headingMain: "Concierge access to the",
      headingAccent: "GLP-1 medication you need",
      subcopy:
        "MedClap Plus members get expedited access to a full panel of GLP-1 medications, prescribed only when clinically appropriate.",
      ctaPrefix: "Get Plus pricing for",
      disclaimerLead: "Note:",
      disclaimerBody:
        " Some medications are prescribed off-label. Your clinician will explain whether off-label use is right for you.",
      disclaimerSmall:
        "Compounded medications may be available subject to eligibility and are not FDA-approved.",
    },

    cta: {
      eyebrow: "Concierge Lifestyle Coaching",
      headingMain: "A Plus plan engineered for",
      headingAccent: "real-life results",
      rotatingText: "★ MEDCLAP PLUS · CONCIERGE CARE  ",
      cardTitle: "Concierge support\nbuilt around you",
      cardText:
        "MedClap Plus combines clinical care with nutrition, fitness, and behavioural coaching — all from one team.",
      stats: [
        { value: "-32.1 lbs", label: "Avg loss in 6 months" },
        { value: "95%", label: "Report visible results" },
      ],
      cardHint: "Drag the slider to see real Plus member results",
      footerText:
        "Concierge weight loss done safely, steadily, sustainably.",
      footerLink: "Built for people who don't have time to waste →",
    },

    pricing: {
      eyebrow: "Plus Membership Pricing",
      headingMain: "Everything you get with",
      headingAccent: "MedClap Plus",
      subcopy:
        "Concierge-level care without concierge-level pricing surprises. Clear membership pricing, always.",
      trustList: [
        { value: "Same-day", text: "Visits" },
        { value: "$0", text: "Intake Call" },
        { value: "24/7", text: "Messaging" },
      ],
      disclaimerTitle: "Plus pricing note",
      disclaimerText:
        "Pricing reflects compounded options. Brand-name options vary by prescription, dosage, and pharmacy partner.",
      ctaLabel: "Start My Plus Evaluation at $69",
    },

    reviews: {
      eyebrow: "PLUS MEMBERS · REAL STORIES",
      headingMain: "Plus members keep",
      headingAccent: "telling us why",
      subcopy:
        "Hear directly from MedClap Plus members who've put concierge care to work in their lives.",
    },

    education: {
      headingMain: "Why pick",
      headingAccent: "MedClap Plus",
      subcopy:
        "Concierge care is more than a label — it's same-day visits, priority pharmacy, and 24/7 messaging built in.",
      miniStats: [
        { value: "Same-day", label: "Visits" },
        { value: "24/7", label: "Support" },
      ],
      ctaLabel: "Start My Plus Evaluation",
      ctaHref: "/weightloss-onboard",
    },

    doctors: {
      headingMain: "Your",
      headingAccent: "Plus Concierge Team",
      subcopy:
        "MedClap Plus clinicians are hand-picked for their experience guiding members through long-term metabolic care.",
      ctaLabel: "Meet My Plus Clinician",
      ctaHref: "/weightloss-onboard",
      trustItems: [
        { value: "20+", label: "Concierge clinicians" },
        { value: "50", label: "States covered" },
      ],
    },

    faq: {
      eyebrow: "PLUS · ANSWERED",
      headingMain: "Plus",
      headingAccent: "frequently asked",
      headingSuffix: ", honestly answered.",
      subcopy:
        "Everything you should know before joining MedClap Plus. Still have something on your mind? Tap the care team button.",
      contactBadge: "Plus Concierge Team",
      contactTitle: "Need more clarity?",
      contactText:
        "Talk with a Plus concierge specialist to make sure MedClap Plus is the right fit.",
      contactCta: "Talk To My Plus Specialist →",
      faqs: [
        {
          question: "What makes MedClap Plus a concierge program?",
          answer:
            "Plus members get same-day virtual visits, priority pharmacy routing, complimentary delivery, and 24/7 messaging with a dedicated care team.",
        },
        {
          question: "How fast can I start with MedClap Plus?",
          answer:
            "Most Plus members complete intake and meet their concierge clinician on the same day they sign up.",
        },
        {
          question: "Is the clinical care really the same as a non-concierge plan?",
          answer:
            "Yes — every Plus visit is run by a licensed clinician, with the same evidence-based GLP-1 protocols. Concierge service is about speed and access, not clinical shortcuts.",
        },
        {
          question: "What if I need to cancel MedClap Plus?",
          answer:
            "You can pause or cancel before your next billing cycle. Your Plus concierge specialist will help you transition safely off any medication.",
        },
        {
          question: "How much does MedClap Plus cost?",
          answer:
            "Plus membership starts at $69 for evaluation. Concierge benefits are bundled into the membership; medication costs are itemised separately.",
        },
      ],
    },

    appCta: {
      headingMain: "Be ready for",
      headingItalic: "concierge GLP-1 care!",
      subcopy:
        "Start your MedClap Plus evaluation today — same-day visits and 24/7 messaging await.",
      ctaLabel: "Start My Plus Evaluation",
      ctaHref: "/weightloss-onboard",
    },

    onboarding: buildOnboarding({
      brand: "MedClap Plus",
      shortBrand: "Plus",
      tone: "concierge",
      ctaVerb: "Start",
      slug: "medclap2",
    }),
  },

  medclap3: {
    slug: "medclap3",
    name: "MedClap Lite",

    branding: {
      logoSrc: fallbackLogo,
      logoAlt: "MedClap Lite",
      logoText: "MedClap Lite",
      shortName: "Lite",
      logoMark: "◇",
      logoWidth: 220,
      logoHeight: 144,
      drawerLogoText: "MedClap Lite",
      tagline: "Affordable GLP-1 care, the simple way.",
      email: "hi@medclap3.com",
      phone: "+1 (555) 300-0003",
      phoneHref: "tel:+15553000003",
      copyrightName: "MedClap Lite",
      footerTagline: "Affordable GLP-1 care, the simple way.",
      disclaimerLead: "Medical disclaimer:",
      disclaimerBody:
        " MedClap Lite connects you with licensed medical providers. GLP-1 medications require a clinician evaluation and prescriptions are issued only when medically appropriate.",
      newsletterEyebrow: "Lite letter",
      newsletterHeading: "Practical tips, honest pricing news",
      newsletterCopy: "One Lite email a month. Cancel any time, no judgment.",
      social: {
        instagram: "https://instagram.com/medclap3",
        youtube: "https://youtube.com/@medclap3",
        yelp: "https://yelp.com/biz/medclap3",
      },
    },

    seo: {
      title: "MedClap Lite — Affordable GLP-1 Weight Loss",
      description:
        "MedClap Lite makes clinician-supervised GLP-1 weight loss affordable and simple, with no concierge upsell.",
      keywords: [
        "MedClap Lite",
        "affordable GLP-1",
        "weight loss",
        "telehealth",
      ],
      ogImage: fallbackOg,
    },

    hero: {
      eyebrow: "AFFORDABLE GLP-1 CARE · NO MEMBERSHIP TRAPS",
      headingMain: "Affordable",
      headingItalic: " GLP-1 weight loss",
      headingSuffix: " without the markup",
      subcopy:
        "MedClap Lite keeps it simple: clinician-supervised GLP-1 care at the most accessible price we can offer.",
      ctaLabel: "Start My Lite Evaluation",
      ctaHref: "/weightloss-onboard",
      trustBadges: [
        "Up-front Pricing",
        "Licensed Clinicians",
      ],
      disclaimer:
        "Prescriptions are always at the discretion of your licensed clinician.",
    },

    loseWeight: {
      headingMain: "MedClap Lite makes",
      headingAccentLead: "GLP-1 care",
      headingAccent: "accessible",
      subcopy: "We strip the program down to what matters most:",
      benefits: [
        { icon: "✋", text: "Licensed clinician supervision" },
        { icon: "◐", text: "GLP-1 access at competitive pricing" },
        { icon: "📈", text: "Monthly progress check-ins" },
      ],
      ctaLabel: "Start My Lite Evaluation",
      ctaHref: "/weightloss-onboard",
      disclaimer:
        "Prescriptions are issued only when medically appropriate per FDA guidelines.",
      chipLabel: "Lite Weight",
      chipValue: "26 lbs",
    },

    howItWorks: {
      headingMain: "How a MedClap Lite",
      headingAccent: "plan comes together",
      ctaLabel: "Start My Free Lite Intake",
      ctaHref: "/weightloss-onboard",
      disclaimerLabel: "Heads up:",
      disclaimerBody:
        " Fill at any licensed pharmacy — no contracts, no required delivery service.",
      steps: [
        {
          number: "Step 1",
          title: "Quick Lite Intake",
          caption: "Tell us about your health goals",
          imageAlt: "MedClap Lite intake form",
          imageSrc: "/images/step-a.webp",
          features: [
            "5-minute online intake",
            "Honest questions, honest pricing",
            "No upsell pressure",
          ],
        },
        {
          number: "Step 2",
          title: "Clinician Review",
          caption: "Affordable doesn't mean cutting clinical corners",
          imageAlt: "Lite clinician review",
          imageSrc: "/images/step-b.webp",
          features: [
            "Licensed clinician review",
            "Eligibility decision",
            "Plan you can afford",
          ],
        },
        {
          number: "Step 3",
          title: "Start On Your Terms",
          caption: "Use any pharmacy, pause anytime",
          imageAlt: "Lite member starting their plan",
          imageSrc: "/images/step-c.webp",
          features: [
            "Use your preferred pharmacy",
            "Cancel or pause anytime",
            "Transparent monthly billing",
          ],
        },
      ],
    },

    bmi: {
      eyebrow: "LITE ELIGIBILITY",
      headingMain: "Could GLP-1 fit",
      headingItalic: "your",
      headingSuffix: "Lite plan?",
      subcopy:
        "MedClap Lite clinicians use BMI and your overall health to determine whether you're a candidate.",
    },

    plans: {
      eyebrow: "LITE MEDICATIONS",
      headingMain: "Affordable access to the",
      headingAccent: "GLP-1 options that fit you",
      subcopy:
        "Lite clinicians can prescribe from the same panel of GLP-1 medications — at our lowest prices.",
      ctaPrefix: "See Lite pricing for",
      disclaimerLead: "Note:",
      disclaimerBody:
        " Some GLP-1 medications are prescribed off-label. Your clinician will walk you through what that means for you.",
      disclaimerSmall:
        "Compounded options may be offered subject to eligibility and are not FDA-approved.",
    },

    cta: {
      eyebrow: "Affordable Lifestyle Coaching",
      headingMain: "A Lite plan that respects",
      headingAccent: "your budget and your time",
      rotatingText: "★ MEDCLAP LITE · AFFORDABLE CARE  ",
      cardTitle: "Honest coaching\nwithout the markup",
      cardText:
        "Lite includes the lifestyle coaching that actually moves the needle — without surprise upcharges.",
      stats: [
        { value: "-24.6 lbs", label: "Avg loss in 6 months" },
        { value: "88%", label: "Report visible results" },
      ],
      cardHint: "Drag the slider to see real Lite member results",
      footerText:
        "Affordable weight loss done safely, steadily, sustainably.",
      footerLink: "Built for everyone who deserves access →",
    },

    pricing: {
      eyebrow: "Lite Membership Pricing",
      headingMain: "Honest pricing,",
      headingAccent: "no surprises",
      subcopy:
        "MedClap Lite keeps the program simple and the pricing transparent — no hidden membership tiers.",
      trustList: [
        { value: "5000+", text: "Members" },
        { value: "$0", text: "Intake Call" },
        { value: "Cancel", text: "Anytime" },
      ],
      disclaimerTitle: "Lite pricing note",
      disclaimerText:
        "Pricing reflects compounded options. Brand-name medication pricing varies by pharmacy.",
      ctaLabel: "Start My Lite Evaluation at $69",
    },

    reviews: {
      eyebrow: "LITE MEMBERS",
      headingMain: "Real Lite members,",
      headingAccent: "real reviews",
      subcopy:
        "Hear from Lite members who got clinician-led GLP-1 care without the eye-watering price tag.",
    },

    education: {
      headingMain: "Why pick",
      headingAccent: "MedClap Lite",
      subcopy:
        "MedClap Lite cuts the noise: honest clinician care, fair pricing, and no surprises.",
      miniStats: [
        { value: "Cancel", label: "Anytime" },
        { value: "100%", label: "Online" },
      ],
      ctaLabel: "Start My Lite Evaluation",
      ctaHref: "/weightloss-onboard",
    },

    doctors: {
      headingMain: "Your",
      headingAccent: "Lite Clinical Team",
      subcopy:
        "Same caliber of licensed clinicians, simpler pricing — that's the MedClap Lite promise.",
      ctaLabel: "Meet My Lite Clinician",
      ctaHref: "/weightloss-onboard",
      trustItems: [
        { value: "25+", label: "Licensed clinicians" },
        { value: "50", label: "States covered" },
      ],
    },

    faq: {
      eyebrow: "LITE · ANSWERED",
      headingMain: "Lite",
      headingAccent: "questions, plainly",
      headingSuffix: "answered.",
      subcopy:
        "Everything you should know about MedClap Lite. No marketing-speak — straight talk only.",
      contactBadge: "Lite Care Team",
      contactTitle: "Still wondering?",
      contactText:
        "Talk with a Lite care team member and ask anything before you commit.",
      contactCta: "Start My Free Lite Call →",
      faqs: [
        {
          question: "How does MedClap Lite keep costs lower?",
          answer:
            "Lite focuses on the essentials of clinician-led GLP-1 care without bolt-on concierge services, which keeps monthly pricing accessible.",
        },
        {
          question: "Do I still get a licensed clinician with MedClap Lite?",
          answer:
            "Yes. Lite members are evaluated and managed by licensed clinicians — the clinical bar is the same as our higher tiers.",
        },
        {
          question: "Can I use my own pharmacy with MedClap Lite?",
          answer:
            "Yes — Lite is pharmacy-agnostic. Use your local pharmacy, our partners, or whichever option is cheapest for you.",
        },
        {
          question: "Are MedClap Lite prescriptions still FDA-approved?",
          answer:
            "Approved GLP-1 medications retain their FDA approval. Some medications may be prescribed off-label when clinically appropriate.",
        },
        {
          question: "How much does MedClap Lite cost?",
          answer:
            "Lite evaluations are $69 with transparent monthly pricing thereafter. No surprise upgrades, no hidden tiers.",
        },
        {
          question: "Can I cancel MedClap Lite anytime?",
          answer:
            "Absolutely — pause or cancel before your next billing cycle. We always recommend talking with your clinician before stopping medication.",
        },
      ],
    },

    appCta: {
      headingMain: "Affordable GLP-1 care is",
      headingItalic: "one click away!",
      subcopy:
        "Start your MedClap Lite evaluation today — no membership traps, no surprise pricing.",
      ctaLabel: "Start My Lite Evaluation",
      ctaHref: "/weightloss-onboard",
    },

    onboarding: buildOnboarding({
      brand: "MedClap Lite",
      shortBrand: "Lite",
      tone: "affordable",
      ctaVerb: "Start",
      slug: "medclap3",
    }),
  },
};

export const organizationSlugs = Object.keys(organizations);

export function getOrganization(slug) {
  if (!slug) return null;
  return organizations[slug] ?? null;
}
