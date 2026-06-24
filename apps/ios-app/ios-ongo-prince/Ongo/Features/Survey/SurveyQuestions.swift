import Foundation

// MARK: - Master question list (mirrors prototype JS `questions` array)
// Questions are ordered exactly as in the prototype.
// `showIf` closures handle all conditional branching.
enum SurveyQuestions {
    static let all: [SurveyQuestion] = [

        // ============ GOALS ============
        .init(id: "weight-loss-goal", section: .goals, type: .singleSelect,
              eyebrow: "2 minute quiz",
              headline: "How much weight would you like to lose?",
              options: [
                .init(id: "1-15",   label: "1–15 lbs",          description: "Slim down. Tone up. Stay on track."),
                .init(id: "16-50",  label: "16–50 lbs",          description: "Lose weight & keep it off — no more yo-yo cycles."),
                .init(id: "50+",    label: "50+ lbs",             description: "Bigger goal? We'll match you with the right plan."),
                .init(id: "unsure", label: "I'm not sure yet",    description: "That's okay — we'll help you figure it out.")
              ]),

        .init(id: "motivation", section: .goals, type: .multiSelect,
              eyebrow: "Almost there",
              headline: "What's driving you right now?",
              sub: "Tell us what matters most so we can tailor your plan. Select all that apply.",
              options: [
                .init(id: "confidence", label: "I want to feel more confident"),
                .init(id: "energy",     label: "I want more energy"),
                .init(id: "health",     label: "I want to improve my overall health"),
                .init(id: "cravings",   label: "I want fewer cravings"),
                .init(id: "diabetes",   label: "I want to reduce my risk of diabetes"),
                .init(id: "mobility",   label: "I want to move more freely"),
                .init(id: "longevity",  label: "I want to live longer"),
                .init(id: "appearance", label: "I want to look better")
              ]),

        .init(id: "celebrate-1", section: .goals, type: .celebrate,
              headline: "Great start!",
              sub: "You've taken the first step. Let's get to know you better.",
              isRequired: false),

        // ============ IDENTITY ============
        .init(id: "first-name", section: .identity, type: .text,
              eyebrow: "About you",
              headline: "What should we call you?"),

        .init(id: "welcome-name", section: .identity, type: .celebrate,
              headline: "Hi {firstName} 👋",  // resolved at render time
              sub: "Great to meet you. A few quick questions and we'll know if Ongo is right for you.",
              isRequired: false),

        .init(id: "email", section: .identity, type: .text,
              eyebrow: "Stay connected",
              headline: "What's your email?",
              sub: "We'll use this to save your progress and send your care plan."),

        // ============ BODY ============
        .init(id: "height-weight", section: .body, type: .heightWeight,
              eyebrow: "Step 1 · Eligibility check",
              headline: "Let's check if GLP-1 is right for you",
              sub: "We use your height and weight to calculate your BMI and determine clinical eligibility."),

        .init(id: "goal-weight", section: .body, type: .number,
              eyebrow: "Almost done",
              headline: "What's your goal weight?",
              sub: "Enter your target weight in pounds."),

        // ============ WEIGHT HISTORY ============
        .init(id: "celebrate-weight-history", section: .weightHistory, type: .celebrate,
              headline: "Now a few questions about your weight journey",
              isRequired: false),

        .init(id: "weight-concern-duration", section: .weightHistory, type: .singleSelect,
              eyebrow: "Weight history",
              headline: "How long has your weight been a concern for you?",
              options: [
                .init(id: "less-1",  label: "Less than 1 year"),
                .init(id: "1-5",     label: "1–5 years"),
                .init(id: "5-10",    label: "5–10 years"),
                .init(id: "10plus",  label: "More than 10 years"),
                .init(id: "always",  label: "My whole life")
              ]),

        .init(id: "past-attempts", section: .weightHistory, type: .multiSelect,
              eyebrow: "Weight history",
              headline: "What have you tried before to lose weight?",
              sub: "Select all that apply.",
              options: [
                .init(id: "diet",        label: "Diet / calorie counting"),
                .init(id: "exercise",    label: "Exercise programs"),
                .init(id: "keto",        label: "Keto or low-carb diets"),
                .init(id: "intermittent",label: "Intermittent fasting"),
                .init(id: "weight-watchers", label: "Weight Watchers / Noom"),
                .init(id: "prescription",label: "Prescription weight loss pills"),
                .init(id: "surgery",     label: "Weight loss surgery"),
                .init(id: "glp1-past",   label: "GLP-1 medications"),
                .init(id: "nothing",     label: "I haven't tried much yet", isExclusive: true)
              ]),

        // ============ MEDICAL HISTORY ============
        .init(id: "has-used-glp1", section: .medicalHistory, type: .singleSelect,
              eyebrow: "GLP-1 history",
              headline: "Have you taken any GLP-1 medications before or are you taking one now?",
              options: [
                .init(id: "yes-current", label: "Yes, I'm currently taking one"),
                .init(id: "yes-past",    label: "Yes, I've taken one before"),
                .init(id: "no",          label: "No, never")
              ]),

        .init(id: "which-glp1", section: .medicalHistory, type: .singleSelect,
              eyebrow: "GLP-1 history",
              headline: "Which GLP-1 medication have you used or are currently using?",
              options: [
                .init(id: "wegovy",    label: "Wegovy (semaglutide)"),
                .init(id: "ozempic",   label: "Ozempic (semaglutide)"),
                .init(id: "mounjaro",  label: "Mounjaro (tirzepatide)"),
                .init(id: "zepbound",  label: "Zepbound (tirzepatide)"),
                .init(id: "saxenda",   label: "Saxenda (liraglutide)"),
                .init(id: "victoza",   label: "Victoza (liraglutide)"),
                .init(id: "trulicity", label: "Trulicity (dulaglutide)"),
                .init(id: "other",     label: "Other / not sure")
              ],
              showIf: { $0.hasUsedGlp1 != "no" && $0.hasUsedGlp1 != nil }),

        .init(id: "glp1-dose", section: .medicalHistory, type: .doseSelect,
              eyebrow: "GLP-1 history",
              headline: "What dose are you currently taking?",  // dynamic prefix with med name
              showIf: { p in
                  p.hasUsedGlp1 == "yes-current"
              }),

        .init(id: "glp1-experience", section: .medicalHistory, type: .singleSelect,
              eyebrow: "GLP-1 history",
              headline: "How was your experience with GLP-1 medications?",
              options: [
                .init(id: "great",     label: "Great — significant weight loss"),
                .init(id: "good",      label: "Good — some weight loss"),
                .init(id: "ok",        label: "OK — minimal weight loss"),
                .init(id: "side-effects", label: "I had side effects"),
                .init(id: "stopped",   label: "I stopped taking it")
              ],
              showIf: { $0.hasUsedGlp1 != "no" && $0.hasUsedGlp1 != nil }),

        .init(id: "glp1-last-injection", section: .medicalHistory, type: .dateInput,
              eyebrow: "GLP-1 history",
              headline: "What was the date of your last injection?",
              showIf: { $0.hasUsedGlp1 != "no" && $0.hasUsedGlp1 != nil }),

        .init(id: "glp1-photo-upload", section: .medicalHistory, type: .fileUpload,
              eyebrow: "GLP-1 history",
              headline: "Have a photo of your medication or prescription?",
              sub: "This helps your doctor continue your care seamlessly. You can skip this.",
              isRequired: false,
              showIf: { $0.hasUsedGlp1 != "no" && $0.hasUsedGlp1 != nil }),

        .init(id: "phase-2-complete", section: .medicalHistory, type: .celebrate,
              headline: "Thanks, {firstName}!",
              sub: "Now let's gather your health background so your doctor has everything they need.",
              isRequired: false),

        // ============ ID VERIFICATION ============
        .init(id: "photo-id-upload", section: .idVerification, type: .photoID,
              eyebrow: "Identity verification",
              headline: "Upload your photo ID",
              sub: "A government-issued ID (driver's license, passport, or state ID) helps verify your identity.",
              isRequired: false),

        // ============ SURGERY ============
        .init(id: "past-surgeries", section: .surgery, type: .multiSelect,
              eyebrow: "Surgical history",
              headline: "Have you had any weight loss surgery in the past?",
              sub: "Select all that apply.",
              options: [
                .init(id: "lap-band",        label: "Lap band"),
                .init(id: "gastric-sleeve",  label: "Gastric sleeve"),
                .init(id: "gastric-bypass",  label: "Gastric bypass"),
                .init(id: "none",            label: "None of these", isExclusive: true)
              ],
              isRequired: false),

        .init(id: "surgery-details", section: .surgery, type: .text,
              eyebrow: "Surgical history",
              headline: "When was your {surgeryType} surgery?",
              sub: "Approximate dates are fine — month and year of each surgery will help your doctor.",
              isRequired: false,
              placeholder: "e.g., Gastric sleeve in March 2019",
              showIf: { !$0.pastSurgeries.isEmpty && !$0.pastSurgeries.contains("none") }),

        // ============ MEDICAL ============
        .init(id: "diagnosed-conditions", section: .medical, type: .multiSelect,
              eyebrow: "Medical history",
              headline: "Have you been diagnosed with any of these health conditions?",
              sub: "Select all that apply.",
              options: [
                .init(id: "high-blood-pressure",  label: "High blood pressure"),
                .init(id: "high-cholesterol",     label: "High cholesterol"),
                .init(id: "type2-diabetes",       label: "Type 2 diabetes"),
                .init(id: "prediabetes",          label: "Pre-diabetes"),
                .init(id: "metabolic-syndrome",   label: "Metabolic syndrome"),
                .init(id: "asthma-copd",          label: "Asthma or COPD"),
                .init(id: "sleep-apnea",          label: "Sleep apnea"),
                .init(id: "joint-pain",           label: "Joint pain or arthritis"),
                .init(id: "hiv-aids",             label: "HIV or AIDS"),
                .init(id: "cancer",               label: "Cancer"),
                .init(id: "heart-disease",        label: "Heart disease"),
                .init(id: "vascular-disease",     label: "Vascular disease (stroke, blood clots, etc)"),
                .init(id: "irregular-heartbeat",  label: "Irregular heart beat"),
                .init(id: "none",                 label: "None of the above", isExclusive: true)
              ],
              isRequired: false),

        .init(id: "other-conditions", section: .medical, type: .multiSelect,
              eyebrow: "Medical history",
              headline: "Do you have any other health conditions we should know about?",
              sub: "Select all that apply.",
              options: [
                .init(id: "pcos",              label: "PCOS"),
                .init(id: "thyroid",           label: "Thyroid condition"),
                .init(id: "acid-reflux",       label: "Acid reflux"),
                .init(id: "fatty-liver",       label: "Fatty liver disease"),
                .init(id: "anxiety-depression",label: "Anxiety or depression"),
                .init(id: "kidney-disease",    label: "Kidney disease"),
                .init(id: "other",             label: "Other"),
                .init(id: "none",              label: "None", isExclusive: true)
              ],
              isRequired: false),

        // ============ SAFETY ============
        .init(id: "safety-conditions", section: .safety, type: .multiSelect,
              eyebrow: "Safety screening",
              headline: "Are you currently dealing with any of the following?",
              sub: "Select all that apply. Your honest answers help your doctor keep you safe.",
              options: [
                .init(id: "eating-disorder",  label: "Eating disorder (Anorexia, Nervosa, or other)"),
                .init(id: "suicidal-ideation",label: "Suicidal thoughts or attempts"),
                .init(id: "gallbladder",      label: "Gallbladder disease"),
                .init(id: "glp1-allergy",     label: "Allergy to GLP-1 medications"),
                .init(id: "digestive-issues", label: "Serious digestive issues"),
                .init(id: "gastroparesis",    label: "Severe gastroparesis"),
                .init(id: "kidney-dialysis",  label: "Kidney disease requiring dialysis"),
                .init(id: "none",             label: "None", isExclusive: true)
              ],
              isRequired: false),

        .init(id: "family-thyroid", section: .safety, type: .singleSelect,
              eyebrow: "Safety screening",
              headline: "Have you or a close family member had medullary thyroid cancer or MEN2 syndrome?",
              options: [
                .init(id: "yes",   label: "Yes"),
                .init(id: "no",    label: "No"),
                .init(id: "unsure",label: "I'm not sure")
              ]),

        // Crisis screen — shown if suicidal-ideation selected in safety-conditions
        .init(id: "crisis-support", section: .safety, type: .crisis,
              headline: "We're here for you",
              isRequired: false,
              showIf: { $0.safetyConditions.contains("suicidal-ideation") }),

        // ============ LIFESTYLE ============
        .init(id: "sex-at-birth", section: .lifestyle, type: .singleSelect,
              eyebrow: "Lifestyle & safety",
              headline: "What was your sex assigned at birth?",
              sub: "This affects the body fat formula and some medication dosing protocols.",
              options: [
                .init(id: "male",   label: "Male"),
                .init(id: "female", label: "Female"),
                .init(id: "prefer-not", label: "Prefer not to say")
              ]),

        .init(id: "pregnancy", section: .lifestyle, type: .singleSelect,
              eyebrow: "Lifestyle & safety",
              headline: "Are you pregnant, planning to become pregnant, or breastfeeding?",
              options: [
                .init(id: "pregnant",   label: "I'm currently pregnant"),
                .init(id: "planning",   label: "I'm planning to become pregnant"),
                .init(id: "nursing",    label: "I'm breastfeeding"),
                .init(id: "no",         label: "No")
              ],
              showIf: { $0.sexAtBirth == "female" }),

        .init(id: "pregnancy-consent", section: .lifestyle, type: .consent,
              eyebrow: "Important notice",
              headline: "A note about GLP-1 and pregnancy",
              sub: "GLP-1 medications are not recommended during pregnancy. Your doctor will discuss alternatives with you.",
              showIf: { p in
                  p.sexAtBirth == "female" && (p.isPregnant == "pregnant" || p.isPregnant == "planning" || p.isPregnant == "nursing")
              }),

        .init(id: "pancreatitis", section: .lifestyle, type: .singleSelect,
              eyebrow: "Lifestyle & safety",
              headline: "Have you ever had pancreatitis?",
              options: [
                .init(id: "yes",           label: "Yes"),
                .init(id: "yes-resolved",  label: "Yes, but it's resolved"),
                .init(id: "no",            label: "No")
              ]),

        .init(id: "alcohol", section: .lifestyle, type: .singleSelect,
              eyebrow: "Lifestyle",
              headline: "How many alcoholic drinks do you have in a week?",
              options: [
                .init(id: "none",   label: "0 — I don't drink"),
                .init(id: "1-3",    label: "1–3 drinks"),
                .init(id: "4-7",    label: "4–7 drinks"),
                .init(id: "8-14",   label: "8–14 drinks"),
                .init(id: "15plus", label: "15+ drinks")
              ]),

        .init(id: "recreational-drugs", section: .lifestyle, type: .multiSelect,
              eyebrow: "Lifestyle",
              headline: "Do you use any recreational drugs?",
              sub: "This is confidential and for medical safety only.",
              options: [
                .init(id: "marijuana",  label: "Marijuana / cannabis"),
                .init(id: "cocaine",    label: "Cocaine"),
                .init(id: "stimulants", label: "Stimulants (e.g. Adderall misuse)"),
                .init(id: "opioids",    label: "Opioids"),
                .init(id: "other",      label: "Other"),
                .init(id: "none",       label: "None", isExclusive: true)
              ]),

        .init(id: "celebrate-routine", section: .lifestyle, type: .celebrate,
              headline: "Almost done, {firstName}!",
              sub: "Just a few lifestyle questions to personalize your plan.",
              isRequired: false),

        .init(id: "meals-per-day", section: .lifestyle, type: .dropdown,
              eyebrow: "Daily routine",
              headline: "How many meals do you have per day?",
              options: [
                .init(id: "1", label: "1 meal"),
                .init(id: "2", label: "2 meals"),
                .init(id: "3", label: "3 meals"),
                .init(id: "4", label: "4 meals"),
                .init(id: "5plus", label: "5+ meals / grazing")
              ]),

        .init(id: "exercise-days", section: .lifestyle, type: .dropdown,
              eyebrow: "Daily routine",
              headline: "How many days a week do you exercise?",
              options: [
                .init(id: "0", label: "0 — I don't exercise"),
                .init(id: "1-2", label: "1–2 days"),
                .init(id: "3-4", label: "3–4 days"),
                .init(id: "5-6", label: "5–6 days"),
                .init(id: "7",   label: "Every day")
              ]),

        .init(id: "sleep-hours", section: .lifestyle, type: .dropdown,
              eyebrow: "Daily routine",
              headline: "How many hours of sleep do you typically get per night?",
              options: [
                .init(id: "less-5", label: "Less than 5 hours"),
                .init(id: "5-6",    label: "5–6 hours"),
                .init(id: "7-8",    label: "7–8 hours"),
                .init(id: "9plus",  label: "9+ hours")
              ]),

        .init(id: "fast-food", section: .lifestyle, type: .dropdown,
              eyebrow: "Daily routine",
              headline: "How often do you eat fast food in a week?",
              options: [
                .init(id: "never",  label: "Never"),
                .init(id: "1-2",    label: "1–2 times"),
                .init(id: "3-4",    label: "3–4 times"),
                .init(id: "5plus",  label: "5+ times (most days)")
              ]),

        .init(id: "sugary-drinks", section: .lifestyle, type: .dropdown,
              eyebrow: "Daily routine",
              headline: "How many sugary drinks do you have per week?",
              options: [
                .init(id: "none",   label: "None"),
                .init(id: "1-3",    label: "1–3"),
                .init(id: "4-7",    label: "4–7"),
                .init(id: "8plus",  label: "8+")
              ]),

        .init(id: "water-intake", section: .lifestyle, type: .dropdown,
              eyebrow: "Daily routine",
              headline: "How much water do you drink daily?",
              options: [
                .init(id: "less-4cups", label: "Less than 4 cups (32 oz)"),
                .init(id: "4-6cups",    label: "4–6 cups"),
                .init(id: "6-8cups",    label: "6–8 cups"),
                .init(id: "8plus",      label: "8+ cups (64 oz or more)")
              ]),

        .init(id: "stress-level", section: .lifestyle, type: .stressSlider,
              eyebrow: "Daily routine",
              headline: "What's your average stress level lately?"),

        // ============ WRAP-UP ============
        .init(id: "ethnicity", section: .wrapUp, type: .singleSelect,
              eyebrow: "Demographics",
              headline: "What is your ethnicity?",
              sub: "This helps us identify health disparities and tailor care.",
              options: [
                .init(id: "white",              label: "White / Caucasian"),
                .init(id: "hispanic",           label: "Hispanic or Latino"),
                .init(id: "black",              label: "Black or African American"),
                .init(id: "asian",              label: "Asian"),
                .init(id: "pacific-islander",   label: "Pacific Islander"),
                .init(id: "native-american",    label: "Native American or Alaska Native"),
                .init(id: "multiracial",        label: "Multiracial"),
                .init(id: "prefer-not",         label: "Prefer not to say")
              ],
              isRequired: false),

        .init(id: "meds-allergies", section: .wrapUp, type: .medsAllergiesForm,
              eyebrow: "Medical info",
              headline: "Are you currently taking any medications or supplements?",
              sub: "Include all prescriptions, OTC medications, and supplements."),

        // Eligibility routing — celebrate + handoff to booking
        .init(id: "eligibility-routing", section: .wrapUp, type: .eligibilityRouting,
              headline: "You're matched, {firstName}!",
              sub: "We'll match you with a top doctor from our care team. First, pick a time for your initial consultation.",
              isRequired: false,
              showIf: { !$0.hasHardContraindication }),

        // Hard exit — shown when ineligible
        .init(id: "safety-exit", section: .safety, type: .safetyExit,
              headline: "We can't safely prescribe GLP-1 for you right now",
              showIf: { $0.hasHardContraindication },
              isHardExit: true)
    ]
}
