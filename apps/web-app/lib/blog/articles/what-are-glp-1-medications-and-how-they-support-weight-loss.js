import { AUTHORS, REVIEWER } from "../authors";

const NATURAL_VS_SYNTHETIC_TABLE = {
  headers: ["Feature", "Natural GLP-1", "Synthetic GLP-1 Medications"],
  rows: [
    ["Source", "Human Gut", "Lab Engineered"],
    ["Life Span", "Very Short (1 to 2 minutes)", "Long Acting (Hours to Week)"],
    ["Strength", "Mild", "Strong, Sustained Therapeutic Effects"],
    ["Clinical Use", "Normal Metabolic Regulation", "Obesity and Diabetes"],
    [
      "Examples",
      "Body’s Own GLP-1 Hormone",
      "Semaglutide, Tirzepatide, Liraglutide, Dulaglutide",
    ],
  ],
};

export default {
  slug: "what-are-glp-1-medications-and-how-they-support-weight-loss",
  title: "What are GLP-1 Medications and How Do They Support Weight Loss?",
  metaTitle:
    "What Are GLP-1 Medications? How They Help With Weight Loss | Ongo",
  metaDescription:
    "Nearly 49.1% of U.S. adults struggle to lose weight. Learn what GLP-1 medications are, who is eligible, and how they support sustainable weight loss.",
  excerpt:
    "Tried everything, still unable to shed your pounds? You’re not alone. Nearly 49.1% of U.S. adults reported struggling to lose weight in the past 12 months.",
  image: "/images/form-welcome-bg.webp",
  imageAlt: "GLP-1 medications for weight loss",
  publishedAt: "2025-12-01",
  author: AUTHORS.marcus,
  reviewer: REVIEWER,
  group: "glp-1-medications",
  categories: ["weight-loss-tips"],
  tags: ["glp-1", "weight-management", "ozempic", "wegovy", "mounjaro", "zepbound"],
  featured: true,
  editorPick: true,
  readingTime: 13,
  keyTakeaways: [
    "GLP-1 medications mimic gut hormones to regulate appetite and blood sugar.",
    "FDA-approved options include Wegovy®, Zepbound®, and Saxenda® for weight management.",
    "Eligibility depends on BMI, health conditions, and clinician evaluation.",
  ],
  sections: [
    {
      id: "intro",
      title: "",
      paragraphs: [
        "Curious to know more about GLP-1 medications? In this guide, you’ll learn what GLP-1 medications are, eligibility criteria, FDA approvals, how they support weight loss, and how Ongo Weight Loss can assist you. Let’s start with understanding GLP-1 medications for weight loss.",
      ],
      images: [
        {
          src: "/images/form-welcome-bg.webp",
          alt: "GLP-1 weight loss treatment options",
        },
      ],
    },
    {
      id: "what-are-glp1",
      title: "What Are GLP-1 Medications?",
      paragraphs: [
        "These are a class of medications that mimic the action of a human gut hormone. These medications help in lowering blood sugar levels. Specifically designed for adults who have type 2 diabetes, obesity, or who are of higher weight.",
        "Now, let’s understand the difference between natural and synthetic GLP-1 medications.",
      ],
      cta: {
        label: "See Your Best GLP-1 Options",
        href: "/weightloss-onboard",
      },
    },
    {
      id: "natural-vs-synthetic",
      title: "Difference Between Natural and Synthetic GLP-1",
      table: NATURAL_VS_SYNTHETIC_TABLE,
    },
    {
      id: "why-prescribe",
      title: "Why Do Doctors Prescribe GLP-1 Medications?",
      paragraphs: [
        "Doctors prescribe these medications when they believe the treatment is medically necessary. This necessity is determined based on clinical factors such as BMI, existing medical conditions, and overall health goals. GLP-1 medications are a science-backed treatment option, and doctors prescribe them to help patients manage their weight and blood sugar levels effectively.",
        "All with results that are backed by strong clinical research.",
      ],
    },
    {
      id: "eligibility",
      title: "Who Is Eligible for GLP-1 Therapy?",
      paragraphs: [
        "Based on certain parameters, these medications are approved by licensed professionals.",
      ],
      columns: [
        {
          title: "Approved Criteria",
          items: [
            "BMI Requirements: Your BMI should be 30 (obesity) or 27 (higher weight).",
            "Health Conditions: At least one weight-related condition such as diabetes or hypertension.",
            "Diabetic Status: Both diabetics (Ozempic, Mounjaro) and non-diabetics (Wegovy, Zepbound) can be eligible.",
          ],
        },
        {
          title: "Who Should NOT Take GLP-1",
          variant: "cons",
          items: [
            "Personal or family history of MTC (Thyroid Carcinoma)",
            "MEN 2 Syndrome",
            "Severe hypersensitivity or allergy",
            "Pregnancy",
            "Severe gastrointestinal disease (e.g., gastroparesis)",
            "History of pancreatitis",
          ],
        },
      ],
    },
    {
      id: "fda-approved",
      title: "FDA-Approved GLP-1 Medications",
      cards: [
        {
          name: "Semaglutide",
          intro: "Ozempic® · Wegovy®",
          points: [
            {
              label: "Approvals",
              text: "Wegovy is approved for weight loss (adults & adolescents). Ozempic is for type 2 diabetes.",
            },
          ],
        },
        {
          name: "Tirzepatide",
          intro: "Zepbound® · Mounjaro®",
          points: [
            {
              label: "Approvals",
              text: "Zepbound approved for weight loss. Mounjaro approved for type 2 diabetes.",
            },
          ],
        },
        {
          name: "Liraglutide",
          intro: "Saxenda®",
          points: [
            {
              label: "Approvals",
              text: "Approved for weight management in adults and adolescents aged 12+.",
            },
          ],
        },
      ],
      images: [
        {
          src: "/images/Lose weight with GLP-1 drugs.webp",
          alt: "FDA-approved GLP-1 medications for weight loss",
        },
      ],
    },
    {
      id: "types",
      title: "Types of GLP-1 Medications",
      cards: [
        {
          name: "Weekly vs. Daily",
          intro:
            "Weekly: Semaglutide, Tirzepatide. Daily: Victoza® (liraglutide), Rybelsus® (oral).",
        },
        {
          name: "Administration",
          intro:
            "Injectable: Subcutaneous (Ozempic). Oral: Tablets (Rybelsus®).",
        },
      ],
    },
    {
      id: "how-they-work",
      title: "How Do They Support Weight Loss?",
      paragraphs: [
        "Medications specifically semaglutide and tirzepatide work by mimicking gut hormones.",
      ],
      lists: [
        {
          items: [
            "Helps balance blood sugar levels",
            "Slows down stomach emptying (feel full longer)",
            "Reduces cravings & supports appetite control",
            "Sends ‘fullness’ signals to the brain",
          ],
        },
      ],
    },
    {
      id: "clinical-results",
      title: "Did You Know?",
      stats: [
        {
          value: "15%",
          text: "In studies, semaglutide helped patients lose around 15% body weight in 68 weeks.",
        },
        {
          value: "20%",
          text: "Tirzepatide showed up to 20% weight loss in 72 weeks when paired with healthy lifestyle changes.",
        },
      ],
    },
    {
      id: "side-effects",
      title: "Common & Serious Side Effects",
      columns: [
        {
          title: "Common Side Effects",
          items: [
            "These side effects are easily manageable:",
            "Nausea",
            "Vomiting",
            "Diarrhea or constipation",
            "Decreased appetite",
            "Stomach pain",
            "Increased heart rate",
          ],
        },
        {
          title: "Serious Side Effects",
          variant: "cons",
          items: [
            "Contact your doctor immediately if you experience:",
            "Pancreatitis",
            "Gallbladder problems",
            "Kidney injury",
            "Severe allergic reactions",
          ],
        },
      ],
      paragraphsAfter: [
        "If you experience any serious symptoms, contact your doctor immediately for proper medical evaluation and guidance.",
      ],
    },
    {
      id: "cost",
      title: "GLP-1 Medication Cost: What to Expect?",
      lists: [
        {
          items: [
            "Many people in the U.S. find GLP-1 medications expensive. On average, brand-name options like Ozempic or Wegovy can cost $900 to $1,400 a month if it is not covered under insurance.",
            "Some plans pay for these medicines when used for diabetes, but they may not cover them for weight loss, leaving patients to pay the full cost.",
            "This is one reason compounded GLP-1 medications exist. They offer a similar treatment option at a much lower price, making it easier for patients to start and stay on therapy.",
            "Some clinics and programs also offer affordable plans or membership pricing, so patients can get safe treatment without the overwhelming cost.",
          ],
        },
      ],
    },
    {
      id: "ongo-program",
      title: "Ongo’s GLP-1 Weight Loss Program: How It Works",
      paragraphs: [
        "At Ongo Weight Loss, we make your journey smooth and simple. We connect you to a licensed doctor who evaluates your health condition and offers a personalized treatment plan.",
        "If you are found eligible, your licensed healthcare provider offers you a personalized evidence-based GLP-1 treatment plan. Additionally, your medication is mailed from a discrete dispensary within 3 to 5 business days.",
      ],
      cards: [
        {
          name: "Continuous Monitoring",
          intro:
            "Our GLP-1 weight loss program tracks your progress and adjusts your plan as needed.",
        },
        {
          name: "100% Online Process",
          intro:
            "Support, evaluation, and medication from the comfort of your home.",
        },
      ],
      cta: {
        label: "Check Your Eligibility Now",
        href: "/weightloss-onboard",
      },
    },
  ],
  disclaimer:
    "This content is for informational purposes and should not replace medical advice. Always consult with a licensed healthcare provider before starting any new medication or treatment plan.",
  faqs: [
    {
      question: "Who Is a Good Candidate for GLP-1 Treatment (For Weight Loss)?",
      answer:
        "People with BMI ≥ 30, or those with BMI ≥ 27 plus a weight-related condition (like diabetes or hypertension), are typically good candidates for GLP-1 weight-loss treatment. A licensed doctor must evaluate and prescribe the medication.",
    },
    {
      question: "Which GLP-1 Medications Are FDA-Approved for Weight Loss?",
      answer:
        "Wegovy and Zepbound are the only FDA-approved GLP-1 medications for weight loss. Some healthcare providers may also prescribe Ozempic or Mounjaro off-label to support weight loss, even though these medications are officially approved for treating Type 2 diabetes.",
    },
    {
      question: "Do GLP-1 Medications Help Suppress Appetite?",
      answer:
        "Yes. GLP-1 medications mimic natural gut hormones that help control hunger. They reduce appetite, slow down gastric emptying, and signal the brain that you feel full, which helps reduce calorie intake and support weight loss.",
    },
    {
      question: "How long does it take to see results with GLP-1 weight loss medications?",
      answer:
        "Most people begin noticing initial changes within 3 weeks. More visible weight-loss results typically appear within 1 to 3 months, especially when combined with a healthy diet, regular physical activity, and consistent dosing. However, results can vary from person to person based on metabolism, dosage, and overall lifestyle.",
    },
    {
      question: "Will I Regain Weight Once I Stop Taking GLP-1 Medications?",
      answer:
        "Yes, weight regain is possible after stopping GLP-1 medications. This happens because appetite and metabolism often return to their previous levels. If you’re thinking about stopping treatment, always consult your doctor first. Your healthcare provider can help create a safe plan to maintain your weight loss.",
    },
    {
      question: "Are GLP-1 Medications Safe, and What Are the Most Common Side Effects?",
      answer:
        "GLP-1 medications are considered safe when taken under a doctor’s supervision. The most common side effects include nausea, vomiting, stomach pain, diarrhea, and constipation. These effects are usually mild and improve as your body adjusts to the medication.",
    },
    {
      question: "What Additional Health Benefits Do GLP-1 Medications Offer Besides Weight Loss?",
      answer:
        "Along with weight loss, GLP-1 medications can support Type 2 diabetes management, improve cardiovascular health, help with chronic kidney disease, and reduce inflammation in metabolic dysfunction–associated steatotic liver disease (MASLD). These added benefits make GLP-1 therapy useful for people with multiple metabolic conditions.",
    },
    {
      question: "How Often Do You Take GLP-1 Medications (Daily or Weekly)?",
      answer:
        "Some GLP-1 medications, such as liraglutide (Saxenda) and lixisenatide (Adlyxin) are taken daily. Others, including semaglutide (Wegovy, Ozempic) and tirzepatide (Zepbound, Mounjaro), are taken once weekly. Your doctor will guide you on the correct dosing schedule.",
    },
    {
      question: "Are GLP-1 Medications Covered by Insurance, and How Much Do They Cost Without Coverage?",
      answer:
        "Yes, many insurance plans cover GLP-1 medications. Coverage varies by provider and medical necessity. At Ongo Weight Loss, we offer affordable plans for patients without insurance coverage: Semaglutide: $299/month, Tirzepatide: $399/month, Oral Semaglutide: $299/month, Oral Tirzepatide: $399/month. These options help make GLP-1 treatment accessible even if insurance does not cover the medication.",
    },
    {
      question: "How Can I Maximize Results While Taking GLP-1 Weight Loss Medications?",
      answer:
        "You can maximize your weight-loss results by following a balanced diet, maintaining proper nutrition, and adding regular physical activity to your routine. Staying consistent with your treatment and following your doctor’s instructions will also help you achieve better and faster results.",
    },
    {
      question: "Are GLP-1 Medications Safe for Long-Term Use?",
      answer:
        "GLP-1 medications are generally considered safe for long-term use, but they can carry potential risks. Long-term treatment should be monitored regularly by a healthcare provider to manage side effects and adjust dosing when needed. Research is still ongoing to better understand the long-term effects of GLP-1 therapy, so it’s important to consult your doctor before continuing treatment over an extended period.",
    },
  ],
  references: [
    {
      text: "Cleveland Clinic. GLP-1 Agonists. Cleveland Clinic Health Library. Published 2023.",
      href: "https://my.clevelandclinic.org",
    },
    {
      text: "Collins L, Costello RA. Glucagon-Like Peptide-1 Receptor Agonists. In: StatPearls [Internet]. Treasure Island (FL): StatPearls Publishing; 2024 Jan–.",
      href: "https://www.ncbi.nlm.nih.gov",
    },
    {
      text: "Nauck MA. GLP-1 receptor agonists in the treatment of type 2 diabetes. Diabetes Therapy. 2021;11(5):1013–1027.",
      href: "https://doi.org/10.1007/s12325-020-01579-5",
    },
    {
      text: "Wilding JPH, Batterham RL, Calanna S, et al. Once-weekly semaglutide in adults with overweight or obesity. N Engl J Med. 2021;384(11):989–1002.",
      href: "https://www.nejm.org",
    },
    {
      text: "Wadden TA, Chao AM, Machineni S, et al. Tirzepatide after intensive lifestyle intervention in adults with overweight or obesity: the SURMOUNT-3 phase 3 trial. Nat Med. 2023;29(11):2909–2918.",
      href: "https://www.nature.com",
    },
  ],
};
