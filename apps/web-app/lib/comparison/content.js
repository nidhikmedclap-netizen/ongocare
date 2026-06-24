export const TRUST_ITEMS = [
  { icon: "💳", label: "No Insurance Required" },
  { icon: "🩺", label: "Board-Certified Clinicians" },
  { icon: "💊", label: "Prescription Included" },
  { icon: "📦", label: "Free Shipping" },
];

export const INTRO_BULLETS = [
  "Active ingredient and mechanism of action",
  "Dosing frequency and titration schedule",
  "Average clinical trial weight-loss results",
  "Common and serious side effects",
  "Eligibility and contraindications",
];

export const COMPARISON_ROWS = [
  {
    feature: "FDA Approval",
    wegovy: { type: "check", text: "Approved for chronic weight management" },
    zepbound: { type: "check", text: "Approved for chronic weight management" },
  },
  {
    feature: "Active Ingredient",
    wegovy: { type: "text", text: "Semaglutide (GLP-1)" },
    zepbound: { type: "text", text: "Tirzepatide (GLP-1/GIP)" },
  },
  {
    feature: "Administration",
    wegovy: { type: "text", text: "Subcutaneous injection" },
    zepbound: { type: "text", text: "Subcutaneous injection" },
  },
  {
    feature: "Dosing Frequency",
    wegovy: { type: "text", text: "Once weekly" },
    zepbound: { type: "text", text: "Once weekly" },
  },
  {
    feature: "Avg. Weight Loss",
    wegovy: { type: "text", text: "≈ 15% at 68 weeks*" },
    zepbound: { type: "text", text: "≈ 22.5% at 72 weeks*" },
  },
  {
    feature: "Max Maintenance Dose",
    wegovy: { type: "text", text: "2.4 mg weekly" },
    zepbound: { type: "text", text: "15 mg weekly" },
  },
  {
    feature: "Common Side Effects",
    wegovy: {
      type: "text",
      text: "Nausea, diarrhea, constipation, vomiting",
    },
    zepbound: {
      type: "text",
      text: "Nausea, diarrhea, vomiting, constipation",
    },
  },
];

export const HOW_IT_WORKS = [
  {
    icon: "🫁",
    title: "Slows down digestion",
    body: "GLP-1 medications delay gastric emptying so you feel fuller longer after smaller meals.",
  },
  {
    icon: "🧠",
    title: "Reduces appetite",
    body: "Signals to the brain help quiet hunger cues and reduce cravings between meals.",
  },
  {
    icon: "🩸",
    title: "Regulates blood sugar",
    body: "Improved insulin response supports metabolic health alongside gradual weight loss.",
  },
];

export const COMMON_SIDE_EFFECTS = [
  "Nausea",
  "Diarrhea",
  "Constipation",
  "Vomiting",
  "Injection-site reactions",
  "Fatigue",
];

export const SERIOUS_SIDE_EFFECTS = [
  "Pancreatitis",
  "Gallbladder disease",
  "Kidney problems",
  "Severe allergic reactions",
  "Thyroid C-cell tumors (in rodents)",
  "Suicidal thoughts or behavior",
];

export const COST_PROVIDERS = [
  { name: "Traditional clinic", cost: 450, highlight: false },
  { name: "Retail pharmacy", cost: 380, highlight: false },
  { name: "Ongo Care", cost: 199, highlight: true },
];

export const PROCESS_STEPS = [
  {
    n: "01",
    icon: "📝",
    title: "Complete your free assessment",
    body: "Share your health history, goals, and BMI through our secure intake — takes about 5 minutes.",
  },
  {
    n: "02",
    icon: "🎥",
    title: "Consult with a licensed provider",
    body: "A board-certified clinician reviews your case via telehealth and recommends the right GLP-1 option.",
  },
  {
    n: "03",
    icon: "📋",
    title: "Receive your personalized plan",
    body: "If prescribed, your clinician creates a titration schedule tailored to your tolerance and progress.",
  },
  {
    n: "04",
    icon: "📦",
    title: "Medication delivered to your door",
    body: "Your prescription ships discreetly from a licensed U.S. pharmacy with cold-chain handling when needed.",
  },
  {
    n: "05",
    icon: "💬",
    title: "Ongoing support",
    body: "Your Care Team checks in, adjusts dosing, and is available 24/7 through secure messaging.",
  },
];

export const WHY_CHOOSE = [
  {
    icon: "🩺",
    title: "Personalized plans",
    body: "Every plan is built around your health history, goals, and clinician recommendations.",
  },
  {
    icon: "👨‍⚕️",
    title: "Expert medical team",
    body: "Board-certified physicians review every case before any prescription is considered.",
  },
  {
    icon: "💸",
    title: "Affordable pricing",
    body: "Transparent monthly pricing with no hidden visit fees or surprise add-ons.",
  },
  {
    icon: "🔒",
    title: "Secure and private",
    body: "HIPAA-compliant telehealth with discreet pharmacy delivery to your door.",
  },
  {
    icon: "⚡",
    title: "Same-day visits",
    body: "Connect with a licensed clinician quickly — no waiting rooms required.",
  },
  {
    icon: "📦",
    title: "Fast delivery",
    body: "Medication ships from a licensed U.S. pharmacy, typically within 3–5 business days.",
  },
  {
    icon: "💚",
    title: "Ongoing coaching",
    body: "Care Team support from evaluation through delivery and beyond.",
  },
  {
    icon: "✅",
    title: "FDA-approved options",
    body: "Wegovy, Zepbound, and other GLP-1 medications when clinically appropriate.",
  },
];

export const HERO_MEDS = [
  {
    name: "Wegovy",
    ingredient: "Semaglutide",
    videoSrc: "/images/wegovy-inj.mp4",
    stat: "15%",
    href: "/medications/wegovy",
  },
  {
    name: "Zepbound",
    ingredient: "Tirzepatide",
    videoSrc: "/images/zepbound-inj.mp4",
    stat: "22.5%",
    href: "/medications/zepbound",
  },
];
