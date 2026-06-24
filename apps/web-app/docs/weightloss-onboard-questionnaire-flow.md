# Weightloss Onboarding — Questionnaire Flow


1. How much weight would you like to lose?

a. 1–15 lbs.
b. 16–50 lbs.
c. 50+ lbs.
d. I’m not sure yet


2. What’s making you want to start now?
Select all that apply.

a. I want to feel more confident
b. I want more energy
c. I want to improve my overall health
d. I want fewer cravings
e. I want to reduce my risk of diabetes
f. I want better health results (labs)
g. I want to feel better day to day


3. Find the right treatment for you (Email capture)
Enter your email to see options tailored to your goals and health history.

a. Email address
b. ☑ I agree to the HIPAA Authorization
c. ☑ I agree to the Telehealth Consent, Terms of Use and Privacy Policy


Let's check if GLP-1 is right for you (BMI Calculator)
Enter Height and Weight (toggle: Imperial ft/lbs  OR  Metric cm/kg)

if
  { user is Healthy (BMI < 27),
    → Disqualified screen "We want to keep you safe"
    → "We'll send helpful resources to {email}. In the meantime, please reach out to your primary care provider for personalised guidance."
    → END OF FLOW
  }

else if
  { BMI is high (BMI ≥ 27) — you may be eligible for GLP-1 treatment.
    → Show personalised weight projection chart (current → goal in 3 months)
    → "Great! Now a few questions"
    → Continue to WEIGHT section
  }


====WEIGHT====


1. Can you share a little about your weight journey so far?
This helps your doctor understand your journey.

a. Highest adult weight (lbs)
b. Lowest weight, past 5 yrs (lbs)
c. Goal weight (lbs)
d. Waist circumference (inches) — optional


2. How long has your weight been a concern for you?

a. Less than 1 year
b. 1–3 years
c. 3–5 years
d. More than 5 years


3. What have you tried before to lose weight?
Select all that apply.

a. Tracking calories
b. Weight loss programs
c. Low-carb or keto diets
d. Intermittent fasting
e. Regular exercise
f. Prescription medications
g. Something else


====MEDS====


1. Have you taken any GLP-1 medications before or are you taking one now?

a. Yes
b. No

if { user selected "Yes" — ask all the medication detail questions below (1.1 to 1.5) }
else { skip directly to ====IDENTITY==== (Photo ID upload) }


   1.1 Which GLP-1 medication have you used or currently using?

   a. Wegovy
   b. Ozempic
   c. Rybelsus
   d. Zepbound
   e. Mounjaro
   f. Saxenda or Victoza


   1.2 What dose of {selected medication} are you taking or have you taken?
   (Dose options change based on the medication picked in 1.1)

   if Wegovy:
     a. 0.25 mg (starting dose)
     b. 0.5 mg
     c. 1 mg
     d. 1.7 mg
     e. 2.4 mg (maximum dose)
     f. I'm not sure

   if Ozempic:
     a. 0.25 mg (starting dose)
     b. 0.5 mg
     c. 1 mg
     d. 2 mg (higher dose)
     e. I'm not sure

   if Rybelsus:
     a. 1.5 mg (starting dose)
     b. 4 mg
     c. 9 mg (higher dose)
     d. I'm not sure

   if Zepbound:
     a. 2.5 mg (starting dose)
     b. 5 mg
     c. 7.5 mg
     d. 10 mg
     e. 12.5 mg
     f. 15 mg (maximum dose)
     g. I'm not sure

   if Mounjaro:
     a. 2.5 mg (starting dose)
     b. 5 mg
     c. 7.5 mg
     d. 10 mg
     e. 12.5 mg
     f. 15 mg (maximum dose)
     g. I'm not sure

   if Saxenda or Victoza:
     a. 0.6 mg (starting dose)
     b. 1.2 mg
     c. 1.8 mg
     d. 2.4 mg
     e. 3 mg (higher dose)
     f. I'm not sure

   PLUS free-text field:
   "Please share how many units of medication you are drawing up with each injection, and how often you inject."


   1.3 How was your experience with GLP-1 medications?

   a. I tolerated it well with little to no side effects
   b. I tolerated it okay but had some side effects
   c. I'm not sure / I don't remember


   1.4 What was the date of your last injection (Month/Day/Year)?

   a. Date input (cannot be in the future)


   1.5 Upload a photo of your current medication or prescription
   (Make sure your name and dosing details are visible. Optional — JPG/PNG/HEIC/WEBP, max 10 MB)

   a. Upload file


====IDENTITY====


1. Upload your photo ID
A government-issued ID (driver's license, passport, or state ID) helps verify your identity.

a. Select photo (from device)
b. Take photo (camera)


====BARIATRIC====


1. Have you had any weight loss surgery in the past?
Select all that apply.

a. Lap band
b. Gastric sleeve
c. Gastric bypass
d. None of these

if { user selected "None of these" — skip to ====MEDICAL==== }
else { continue to question 2 below }


2. When was your {surgery list} {surgery / surgeries}?

a. Free-text date(s)


====MEDICAL====


1. Have you been diagnosed with any of these health conditions?
Select all that apply.

a. High blood pressure
b. High cholesterol
c. Type 2 diabetes
d. Pre-diabetes
e. Metabolic syndrome
f. Asthma or COPD
g. Sleep apnea
h. Joint pain or arthritis
i. HIV or AIDS
j. Cancer
k. Heart disease
l. Vascular disease (stroke, blood clots, etc)
m. Irregular heart beat
n. None of the above


2. Do you have any other health conditions we should know about?
Select all that apply.

a. PCOS
b. Thyroid condition
c. Acid reflux
d. Fatty liver disease
e. Anxiety or depression
f. Kidney disease
g. None
h. Other

PLUS optional free-text: "Any other conditions?"


====SAFETY====


1. Are you currently dealing with any of the following?
Select all that apply.

a. Eating disorder (Anorexia, Nervosa, or other)
b. Suicidal thoughts or attempts
c. Gallbladder disease
d. Allergy to GLP-1 medications
e. Serious digestive issues
f. Severe gastroparesis
g. Kidney disease requiring dialysis
h. None


2. Have you or a close family member had medullary thyroid cancer or MEN2 syndrome?

a. No
b. Yes
c. I'm not sure

if { user selected "Yes" —
     → Disqualified screen "We want to keep you safe"
     → END OF FLOW
   }
else { continue to question 3 }


3. What was your sex assigned at birth?

a. Male
b. Female
c. Prefer not to say

if { user selected "Male" — skip to question 5 (Pancreatitis) }
else { continue to question 4 (Pregnancy) }


4. Are you pregnant, planning to become pregnant, or breastfeeding?

a. No
b. Yes

if { user selected "Yes" — show consent screen below (4.1) before continuing }
else { continue to question 5 }


   4.1 Pregnancy consent
   "By selecting 'I Understand' you understand that any prescribed treatment must
    be discontinued prior to attempting pregnancy, becoming pregnant, or upon
    beginning breastfeeding."

   a. ☑ I understand


5. Have you ever had pancreatitis?

a. No
b. Yes

if { user selected "Yes" —
     → Disqualified screen "We want to keep you safe"
     → END OF FLOW
   }
else { continue to ====LIFESTYLE==== }


====LIFESTYLE====


1. How many alcoholic drinks do you have in a week?

a. None
b. 0–1
c. 1–6
d. More than 6


2. Do you use any recreational drugs?
Your answer is private. Select all that apply.

a. Cannabis
b. Cocaine or crack
c. Amyl nitrate or butyl nitrite
d. Other
e. I don't use any

if { user selected "Other" — show free-text "Please specify" field (required) }


3. Can you tell us a bit about your daily routine and habits?
This helps your doctor build the right plan for you.

a. Meals per day            (1–2 / 3 / 4+)
b. Exercise days / week     (0 / 1–2 / 3–4 / 5+)
c. Sleep hours / night      (Less than 5 / 5–6 / 7–8 / 9+)
d. Fast food / week         (0 / 1–2 / 3–4 / 5+)
e. Sugary drinks / week     (0 / 1–3 / 4–7 / 8+)
f. Water intake daily       (Less than 4 cups / 4–6 / 7–8 / More than 8 cups)
g. Stress level             (Slider 1–10, default 5)


====PROFILE====


1. What is your ethnicity?
We ask this to better tailor treatment options to you. Select all that apply.

a. Asian or South Asian
b. African American
c. Caucasian
d. Hispanic or Latin
e. Native American or Alaskan
f. Pacific Islander
g. Prefer not to say


2. Complete your profile
Your healthcare team will need this for treatment and prescriptions.

a. First name      (min 2 characters)
b. Last name       (min 2 characters)
c. Date of birth   (must be 18 years or older)
d. ZIP code        (5 digits)
e. Phone number    (10–12 digits)
f. Street address


3. Are you currently taking any medications or supplements?
Include all prescriptions, OTC medications, and supplements.

a. Free-text — e.g. "Metformin 500mg, Fish Oil, Aspirin 81mg" — or type None


4. Do you have any allergies?

a. Free-text — e.g. "Penicillin" — or type None


5. Which pharmacy would you like to use? (optional)

a. Free-text — e.g. "CVS, 123 Main St"


6. Meet your physician
Your consultation will be with a licensed, board-certified physician who
specialises in metabolic health and GLP-1 therapy. Tap the card to confirm.

a. ☑ Dr. Vanessa Niles  (MD · Board-Certified Internal Medicine)


7. When would you like to meet your physician?
Appointments are 15–20 minutes via secure video call.
(System auto-generates the next 3 weekdays, 2 slots per day = 6 total slots.)

a. Day 1 — 9:00 AM
b. Day 1 — 2:00 PM
c. Day 2 — 9:00 AM
d. Day 2 — 2:00 PM
e. Day 3 — 9:00 AM
f. Day 3 — 2:00 PM


====PAYMENT====


1. Choose your plan

a. 1 month  — $69
b. 3 months — $219
c. 6 months — $499


2. Secure your plan (Stripe payment)
Complete your one-time payment to activate your plan.

a. Card number
b. Expiry date
c. CVC

if { payment success —
     → "You're all set!" confirmation screen
     → Shows booked consultation slot
     → "Go to your patient portal" CTA
     → END OF FLOW
   }
else { error shown inline, user can retry }


====END SCREENS====


SUCCESS (iConfirm):
"You're all set!
 Your consultation is booked. Check your email for prep instructions.
 Your doctor will review your intake before the call."

DISQUALIFIED (dHard) — reached when:
- BMI < 27, OR
- MTC / MEN2 family history = Yes, OR
- Pancreatitis history = Yes
"We want to keep you safe.
 Based on your answers, GLP-1 medications may not be appropriate for you at
 this time. Please speak with your primary care physician for personalised
 guidance."
→ User leaves email → IThanks ("Thanks — you're on the list")
