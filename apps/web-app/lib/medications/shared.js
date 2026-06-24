/** Shared blocks reused across medication landing pages. */

export const TRUST_LOGOS = [
  "HIPAA Compliant",
  "Licensed Physicians",
  "FDA-Approved Rx",
  "Telehealth Care",
];

export const FEATURE_CARDS = [
  {
    title: "Weight loss support",
    body: "GLP-1 therapy that works with your natural appetite signals for gradual, sustainable progress.",
  },
  {
    title: "Medical guidance",
    body: "Every patient is evaluated by a licensed clinician before any prescription is considered.",
  },
  {
    title: "Personalized plans",
    body: "Dosing schedules tailored to your tolerance, goals, and clinician recommendations.",
  },
  {
    title: "Ongoing coaching",
    body: "Care Team support from evaluation through delivery and beyond.",
  },
];

export const DOCTORS = [
  {
    name: "Dr. Miller",
    role: "Licensed Physician",
    image: "/images/johnathan-miller.webp",
    bio: "Physician-guided weight loss and metabolic health consultations.",
  },
  {
    name: "Dr. Niles",
    role: "Board-Certified Physician",
    image: "/images/Dr-vanessa-niles.webp",
    bio: "30+ years of clinical experience in patient-centered obesity care.",
  },
  {
    name: "Dr. Krasne",
    role: "Licensed Physician",
    image: "/images/dr-krasne .webp",
    bio: "Board-certified clinician focused on individualized treatment planning.",
  },
  {
    name: "Dr. Bugailiskis",
    role: "Board-Certified Physician",
    image: "/images/cheryl-bugailiskis.webp",
    bio: "Evaluates patients based on health history, goals, and clinical needs.",
  },
];

export const INJECTION_SITES = ["Abdomen", "Front of thigh", "Upper arm"];

export function processSteps(medName) {
  return [
    {
      n: "01",
      title: "Complete your free online evaluation",
      body: "Share your health history, goals, and BMI through our secure intake — takes about 5 minutes.",
    },
    {
      n: "02",
      title: "Meet with a licensed clinician",
      body: `A board-certified provider reviews your case via telehealth and determines if ${medName} is appropriate.`,
    },
    {
      n: "03",
      title: "Receive your personalized plan",
      body: "If prescribed, your clinician creates a titration schedule tailored to your tolerance and progress.",
    },
    {
      n: "04",
      title: "Medication delivered to your door",
      body: "Your prescription ships discreetly from a licensed U.S. pharmacy with ongoing Care Team support.",
    },
  ];
}

export function defaultTestimonials(medName) {
  return [
    {
      quote: `The appetite changes were noticeable within the first few weeks. Having a real doctor guide the dosing made me feel safe the whole way.`,
      name: "Sarah M.",
      detail: `Ongo patient · on ${medName}`,
      featured: true,
    },
    {
      quote:
        "I appreciated that nobody rushed me. The evaluation was thorough, and my care team answered every question before I started.",
      name: "James T.",
      detail: "Ongo patient · 4 months on program",
      featured: false,
    },
  ];
}

export function defaultEligibility() {
  return [
    "Adults with obesity (BMI ≥ 30)",
    "Adults overweight (BMI ≥ 27) with a weight-related condition",
    "Committed to nutrition and activity changes alongside medication",
    "No contraindications identified by your clinician",
  ];
}

export function defaultInjectionSteps() {
  return [
    "Wash hands and choose your injection site.",
    "Attach a new needle and check the pen flow if needed.",
    "Pinch skin, insert needle, and press until dose is delivered.",
    "Dispose of the needle safely and store the pen refrigerated.",
  ];
}
