import {
  TRUST_LOGOS,
  FEATURE_CARDS,
  DOCTORS,
  INJECTION_SITES,
  processSteps,
  defaultTestimonials,
  defaultEligibility,
  defaultInjectionSteps,
} from "./shared";

const LIFESTYLE_IMAGE = "/images/about-bg.png";

const MEDICATIONS = {
  wegovy: {
    slug: "wegovy",
    live: true,
    name: "Wegovy",
    brandName: "Wegovy®",
    ingredient: "Semaglutide",
    seo: {
      title: "Wegovy — FDA-Approved Weight Loss Medication | Ongo Weight Loss",
      description:
        "Learn how Wegovy (semaglutide) works, clinical results, dosing, safety, and how Ongo connects you with licensed clinicians for physician-guided care.",
    },
    hero: {
      eyebrow: "Wegovy® · Semaglutide",
      headingMain: "Your solution for",
      headingAccent: "weight loss",
      subcopy:
        "A once-weekly GLP-1 injection that works with your appetite signals — prescribed and monitored by licensed clinicians through secure telehealth.",
      videoSrc: "/images/wegovy-inj.mp4",
      stats: [
        { value: "15%", label: "Avg. weight loss at 68 wks" },
        { value: "83%", label: "Patients lost ≥5% body weight" },
        { value: "2.4 mg", label: "Max weekly maintenance dose" },
      ],
    },
    rotatingBadge:
      "FDA-APPROVED · GLP-1 · CLINICAL CARE · FDA-APPROVED ·",
    about: {
      eyebrow: "About Wegovy",
      title: "What is Wegovy?",
      body: "Wegovy is a prescription GLP-1 medication containing semaglutide, FDA-approved for chronic weight management. It mimics a natural hormone that helps regulate appetite and food intake — supporting gradual, medically supervised weight loss when combined with lifestyle changes and ongoing clinician oversight.",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "How does Wegovy work?",
      body: "Wegovy activates GLP-1 receptors to slow gastric emptying, reduce appetite signals, and help you feel fuller sooner. It is not a stimulant — it works with your biology under clinician supervision.",
    },
    processSteps: processSteps("Wegovy"),
    eligibility: {
      title: "Is Wegovy right for you?",
      items: defaultEligibility(),
      image: LIFESTYLE_IMAGE,
      imageAlt: "Person celebrating a health milestone",
    },
    safety: [
      {
        icon: "⚠",
        title: "Common side effects",
        body: "Nausea, diarrhea, constipation, and vomiting may occur — especially during dose increases. Most improve over time.",
      },
      {
        icon: "◆",
        title: "Serious risks",
        body: "Wegovy may cause thyroid tumors in rodents. It is not for people with a personal or family history of medullary thyroid carcinoma or MEN 2.",
      },
      {
        icon: "✕",
        title: "Do not use if",
        body: "You are pregnant, breastfeeding, or have a history of severe allergic reactions to semaglutide or any Wegovy ingredient.",
      },
      {
        icon: "ℹ",
        title: "Talk to your doctor",
        body: "Share your full medication list and medical history. Your Ongo clinician will review risks and benefits before prescribing.",
      },
    ],
    clinical: {
      title: "Clinical trial results",
      tableHeaders: ["Measure", "Wegovy", "Placebo"],
      rows: [
        ["Avg. weight change (68 weeks)", "−15.0%", "−2.4%"],
        ["Patients losing ≥5% body weight", "83.5%", "31.1%"],
        ["Patients losing ≥10% body weight", "66.1%", "11.8%"],
      ],
      stats: [
        { value: "15%", label: "Average weight loss at 68 weeks*" },
        { value: "83%", label: "Patients lost ≥5% body weight*" },
        { value: "2.4 mg", label: "Maximum weekly maintenance dose" },
      ],
      finePrint:
        "*Based on STEP 1 trial data. Individual results vary. Prescription required.",
    },
    videoSection: { title: "Watch our Wegovy overview" },
    injection: {
      title: "How to inject Wegovy",
      steps: defaultInjectionSteps(),
      note: "Rotate injection sites each week. Your clinician will walk you through your first dose during your visit.",
      sites: INJECTION_SITES,
    },
    dosage: {
      title: "Dosage & administration",
      intro:
        "Wegovy is titrated gradually to reduce side effects. Your Ongo clinician personalizes this schedule based on your response.",
      steps: [
        "Weeks 1–4: 0.25 mg once weekly (starting dose)",
        "Weeks 5–8: 0.5 mg once weekly",
        "Weeks 9–12: 1 mg once weekly",
        "Weeks 13–16: 1.7 mg once weekly",
        "Week 17+: 2.4 mg once weekly (maintenance)",
      ],
    },
    testimonials: {
      eyebrow: "Social proof",
      title: "Patient testimonials",
      lead: "Real stories from patients on physician-guided Wegovy care.",
      items: defaultTestimonials("Wegovy"),
    },
    faq: {
      eyebrow: "Wegovy · FAQ",
      headingMain: "Your",
      headingAccent: "frequently asked",
      headingSuffix: "questions, answered.",
      subcopy:
        "Everything you need to know about Wegovy and the Ongo program. Can't find your answer? Our care team is here to help.",
      contactBadge: "Licensed Clinicians",
      contactTitle: "Still have questions?",
      contactText:
        "Speak with our care team to understand if Wegovy is right for your health goals.",
      contactCta: "Get Started →",
      items: [
        {
          question: "What is Wegovy used for?",
          answer:
            "Wegovy is FDA-approved for chronic weight management in adults with obesity (BMI ≥ 30) or overweight (BMI ≥ 27) with at least one weight-related condition, alongside a reduced-calorie diet and increased physical activity.",
        },
        {
          question: "How is Wegovy different from Ozempic?",
          answer:
            "Both contain semaglutide. Wegovy is FDA-approved for chronic weight management at doses up to 2.4 mg weekly. Ozempic is approved for type 2 diabetes. Your clinician determines which is appropriate.",
        },
        {
          question: "How quickly will I see results?",
          answer:
            "Many patients notice appetite changes within weeks. Meaningful weight loss typically builds over months as dosing is titrated. Individual results vary.",
        },
        {
          question: "Is Wegovy covered by insurance?",
          answer:
            "Coverage varies by plan. Your Ongo care team can help you understand options. Brand-name and compounded alternatives may differ in cost.",
        },
        {
          question: "Can I get Wegovy through Ongo?",
          answer:
            "Yes — if clinically appropriate. Every patient completes a licensed clinician evaluation before any prescription is considered.",
        },
      ],
    },
    cta: {
      heading: "Ready to see if Wegovy is",
      headingAccent: "right for you?",
      subcopy:
        "Take a free evaluation. A licensed clinician will review your history and recommend a plan — only prescribing when clinically appropriate.",
    },
    disclaimer:
      "Wegovy® is a registered trademark of Novo Nordisk. This page is for educational purposes and does not constitute medical advice. Side effects may occur. Prescriptions are issued only when medically appropriate. Individual results vary.",
  },

  ozempic: {
    slug: "ozempic",
    live: true,
    name: "Ozempic",
    brandName: "Ozempic®",
    ingredient: "Semaglutide",
    seo: {
      title:
        "Ozempic — Type 2 Diabetes & Weight Loss Prescription | Ongo Weight Loss",
      description:
        "Learn how Ozempic (semaglutide) supports type 2 diabetes and weight management, dosing, safety, and how Ongo connects you with licensed clinicians.",
    },
    hero: {
      eyebrow: "Ozempic® · Semaglutide",
      headingMain: "Prescription for",
      headingAccent: "type 2 diabetes & weight loss",
      subcopy:
        "A once-weekly GLP-1 injection FDA-approved for type 2 diabetes — often prescribed off-label for weight management when clinically appropriate, with ongoing physician oversight through Ongo.",
      videoSrc: "/images/ozmepic-inj.mp4",
      stats: [
        { value: "14.9%", label: "Avg. weight loss in trials*" },
        { value: "1.0 mg", label: "Common maintenance dose" },
        { value: "Weekly", label: "Single injection schedule" },
      ],
    },
    rotatingBadge:
      "GLP-1 · TYPE 2 DIABETES · CLINICAL CARE · GLP-1 ·",
    about: {
      eyebrow: "About Ozempic",
      title: "What is Ozempic?",
      body: "Ozempic is a prescription GLP-1 medication containing semaglutide, FDA-approved to improve blood sugar in adults with type 2 diabetes alongside diet and exercise. It also slows digestion and reduces appetite — which is why clinicians may consider it for weight management when medically appropriate.",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "How does Ozempic work?",
      body: "Ozempic mimics the GLP-1 hormone your body naturally produces. It helps the pancreas release insulin when blood sugar is high, slows gastric emptying, and signals fullness to the brain — supporting both glycemic control and appetite regulation under clinician supervision.",
    },
    processSteps: processSteps("Ozempic"),
    eligibility: {
      title: "Is Ozempic right for you?",
      items: [
        "Adults with type 2 diabetes needing glycemic support",
        "Adults overweight (BMI ≥ 27) where a clinician determines benefit",
        "Willing to combine medication with nutrition and activity changes",
        "No contraindications identified during your evaluation",
      ],
      image: LIFESTYLE_IMAGE,
      imageAlt: "Person checking progress on a bathroom scale",
    },
    safety: [
      {
        icon: "⚠",
        title: "Common side effects",
        body: "Nausea, vomiting, diarrhea, constipation, and stomach pain are most common — especially when starting or increasing dose.",
      },
      {
        icon: "◆",
        title: "Serious risks",
        body: "Ozempic may cause thyroid tumors in rodents. It is not for people with a personal or family history of medullary thyroid carcinoma or MEN 2.",
      },
      {
        icon: "✕",
        title: "Do not use if",
        body: "You are pregnant, breastfeeding, or have had a serious allergic reaction to semaglutide or any Ozempic ingredient.",
      },
      {
        icon: "ℹ",
        title: "Talk to your doctor",
        body: "Ozempic is not FDA-approved for weight loss alone. Your Ongo clinician evaluates whether it is medically appropriate for your goals.",
      },
    ],
    clinical: {
      title: "Clinical trial highlights",
      tableHeaders: ["Measure", "Ozempic", "Placebo"],
      rows: [
        ["Avg. weight change (68 weeks)", "−14.9%", "−2.4%"],
        ["HbA1c reduction", "Up to 1.8%", "—"],
        ["Patients losing ≥5% body weight", "69%", "—"],
      ],
      stats: [
        { value: "14.9%", label: "Average weight change at 68 weeks*" },
        { value: "1.0 mg", label: "Typical maintenance dose" },
        { value: "Weekly", label: "Once-weekly injection" },
      ],
      finePrint:
        "*Based on published semaglutide trial data. Ozempic is FDA-approved for type 2 diabetes; weight outcomes may vary. Prescription required.",
    },
    videoSection: { title: "Watch our Ozempic overview" },
    injection: {
      title: "How to inject Ozempic",
      steps: defaultInjectionSteps(),
      note: "Rotate injection sites each week. Store unused pens refrigerated. Your clinician guides your first injection.",
      sites: INJECTION_SITES,
    },
    dosage: {
      title: "Dosage & administration",
      intro:
        "Ozempic is started low and increased gradually. Your Ongo clinician adjusts dosing based on tolerance and treatment goals.",
      steps: [
        "Weeks 1–4: 0.25 mg once weekly (starting dose)",
        "Weeks 5–8: 0.5 mg once weekly",
        "Week 9+: 1 mg once weekly (maintenance for most patients)",
        "Some patients may increase to 2 mg weekly per clinician guidance",
      ],
    },
    testimonials: {
      eyebrow: "Social proof",
      title: "Read what our customers say",
      lead: "Real stories from patients on physician-guided Ozempic care.",
      items: defaultTestimonials("Ozempic"),
    },
    faq: {
      eyebrow: "Ozempic · FAQ",
      headingMain: "Your",
      headingAccent: "frequently asked",
      headingSuffix: "questions, answered.",
      subcopy:
        "Everything you need to know about Ozempic and the Ongo program. Can't find your answer? Our care team is here to help.",
      contactBadge: "Licensed Clinicians",
      contactTitle: "Still have questions?",
      contactText:
        "Speak with our care team to understand if Ozempic is appropriate for your health goals.",
      contactCta: "Get Started →",
      items: [
        {
          question: "What is Ozempic used for?",
          answer:
            "Ozempic is FDA-approved to improve blood sugar in adults with type 2 diabetes, along with diet and exercise. Clinicians may also prescribe it off-label for weight management when medically appropriate.",
        },
        {
          question: "How is Ozempic different from Wegovy?",
          answer:
            "Both contain semaglutide. Wegovy is FDA-approved specifically for chronic weight management at higher doses. Ozempic is approved for type 2 diabetes. Your clinician recommends the right option for you.",
        },
        {
          question: "How quickly will I see results?",
          answer:
            "Many patients notice appetite and blood sugar changes within weeks. Weight loss typically builds over months. Individual results vary.",
        },
        {
          question: "Is Ozempic covered by insurance?",
          answer:
            "Coverage varies by plan and indication. Your Ongo care team can help you understand options for brand-name and compounded alternatives.",
        },
        {
          question: "Can I get Ozempic through Ongo?",
          answer:
            "Yes — if clinically appropriate. Every patient completes a licensed clinician evaluation before any prescription is considered.",
        },
      ],
    },
    cta: {
      heading: "Ready to see if Ozempic is",
      headingAccent: "right for you?",
      subcopy:
        "Take a free evaluation. A licensed clinician will review your history and recommend a plan — only prescribing when clinically appropriate.",
    },
    disclaimer:
      "Ozempic® is a registered trademark of Novo Nordisk. This page is for educational purposes and does not constitute medical advice. Ozempic is not FDA-approved for weight loss alone. Side effects may occur. Prescriptions are issued only when medically appropriate.",
  },

  mounjaro: {
    slug: "mounjaro",
    live: true,
    name: "Mounjaro",
    brandName: "Mounjaro®",
    ingredient: "Tirzepatide",
    seo: {
      title: "Mounjaro — GLP-1/GIP Medication | Ongo Weight Loss",
      description:
        "Learn how Mounjaro (tirzepatide) works for type 2 diabetes and weight management, dosing, safety, and Ongo's physician-guided telehealth program.",
    },
    hero: {
      eyebrow: "Mounjaro® · Tirzepatide",
      headingMain: "Dual-action therapy for",
      headingAccent: "metabolic health",
      subcopy:
        "A once-weekly injection that activates GLP-1 and GIP receptors — supporting blood sugar balance and appetite control under licensed clinician supervision.",
      videoSrc: "/images/ozmepic-inj.mp4",
      stats: [
        { value: "22.5%", label: "Avg. weight loss in trials*" },
        { value: "15 mg", label: "Max weekly dose" },
        { value: "Weekly", label: "Single injection schedule" },
      ],
    },
    rotatingBadge:
      "GLP-1/GIP · CLINICAL CARE · METABOLIC HEALTH ·",
    about: {
      eyebrow: "About Mounjaro",
      title: "What is Mounjaro?",
      body: "Mounjaro (tirzepatide) is a prescription medication FDA-approved for type 2 diabetes. It is the first dual GIP and GLP-1 receptor agonist, helping regulate blood sugar and appetite. Clinicians may consider it for weight management when medically appropriate.",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "How does Mounjaro work?",
      body: "Mounjaro activates both GLP-1 and GIP receptors — enhancing insulin response, slowing digestion, and reducing hunger signals. This dual mechanism supports metabolic health under ongoing clinician oversight.",
    },
    processSteps: processSteps("Mounjaro"),
    eligibility: {
      title: "Is Mounjaro right for you?",
      items: [
        "Adults with type 2 diabetes or metabolic health needs",
        "Adults where a clinician determines tirzepatide may help",
        "Committed to lifestyle changes alongside medication",
        "No contraindications identified by your clinician",
      ],
      image: LIFESTYLE_IMAGE,
      imageAlt: "Person focused on healthy lifestyle goals",
    },
    safety: [
      {
        icon: "⚠",
        title: "Common side effects",
        body: "Nausea, diarrhea, decreased appetite, vomiting, and constipation — especially during dose escalation.",
      },
      {
        icon: "◆",
        title: "Serious risks",
        body: "Thyroid tumor risk observed in rodents. Not for people with personal or family history of medullary thyroid carcinoma or MEN 2.",
      },
      {
        icon: "✕",
        title: "Do not use if",
        body: "You are pregnant, breastfeeding, or allergic to tirzepatide or any Mounjaro ingredient.",
      },
      {
        icon: "ℹ",
        title: "Talk to your doctor",
        body: "Mounjaro is not FDA-approved for weight loss alone. Your clinician evaluates risks and benefits before prescribing.",
      },
    ],
    clinical: {
      title: "Clinical trial highlights",
      tableHeaders: ["Measure", "Mounjaro", "Placebo"],
      rows: [
        ["Avg. weight change (72 weeks)", "−22.5%", "−2.0%"],
        ["HbA1c reduction", "Up to 2.4%", "—"],
        ["Patients losing ≥15% body weight", "36%", "—"],
      ],
      stats: [
        { value: "22.5%", label: "Average weight change at 72 weeks*" },
        { value: "15 mg", label: "Maximum weekly dose" },
        { value: "Weekly", label: "Once-weekly injection" },
      ],
      finePrint:
        "*Based on SURMOUNT trial data. Mounjaro is FDA-approved for type 2 diabetes. Individual results vary.",
    },
    videoSection: { title: "Watch our Mounjaro overview" },
    injection: {
      title: "How to inject Mounjaro",
      steps: defaultInjectionSteps(),
      note: "Rotate injection sites weekly. Your clinician walks you through proper pen use.",
      sites: INJECTION_SITES,
    },
    dosage: {
      title: "Dosage & administration",
      intro:
        "Mounjaro is titrated gradually over several months. Your Ongo clinician personalizes the schedule.",
      steps: [
        "Weeks 1–4: 2.5 mg once weekly",
        "Weeks 5–8: 5 mg once weekly",
        "Weeks 9–12: 7.5 mg once weekly",
        "Further increases to 10 mg, 12.5 mg, or 15 mg per clinician guidance",
      ],
    },
    testimonials: {
      eyebrow: "Social proof",
      title: "Patient testimonials",
      lead: "Real stories from patients on physician-guided Mounjaro care.",
      items: defaultTestimonials("Mounjaro"),
    },
    faq: {
      eyebrow: "Mounjaro · FAQ",
      headingMain: "Your",
      headingAccent: "frequently asked",
      headingSuffix: "questions, answered.",
      subcopy:
        "Everything you need to know about Mounjaro and the Ongo program.",
      contactBadge: "Licensed Clinicians",
      contactTitle: "Still have questions?",
      contactText:
        "Speak with our care team to understand if Mounjaro is appropriate for you.",
      contactCta: "Get Started →",
      items: [
        {
          question: "What is Mounjaro used for?",
          answer:
            "Mounjaro is FDA-approved for type 2 diabetes. It may be prescribed off-label for weight management when a clinician determines it is medically appropriate.",
        },
        {
          question: "How is Mounjaro different from Ozempic?",
          answer:
            "Mounjaro activates both GIP and GLP-1 receptors (dual agonist), while Ozempic targets GLP-1 only. Your clinician recommends the best fit for your health profile.",
        },
        {
          question: "Can I get Mounjaro through Ongo?",
          answer:
            "Yes — if clinically appropriate after a licensed clinician evaluation.",
        },
      ],
    },
    cta: {
      heading: "Ready to see if Mounjaro is",
      headingAccent: "right for you?",
      subcopy:
        "Take a free evaluation. A licensed clinician will review your history and recommend a plan.",
    },
    disclaimer:
      "Mounjaro® is a registered trademark of Eli Lilly and Company. Educational content only — not medical advice. Prescriptions issued when medically appropriate.",
  },

  zepbound: {
    slug: "zepbound",
    live: true,
    name: "Zepbound",
    brandName: "Zepbound®",
    ingredient: "Tirzepatide",
    seo: {
      title: "Zepbound — FDA-Approved Weight Loss Medication | Ongo Weight Loss",
      description:
        "Learn how Zepbound (tirzepatide) works for chronic weight management, clinical results, dosing, and Ongo's physician-guided program.",
    },
    hero: {
      eyebrow: "Zepbound® · Tirzepatide",
      headingMain: "Your solution for",
      headingAccent: "weight loss",
      subcopy:
        "A once-weekly dual GIP/GLP-1 injection FDA-approved for chronic weight management — prescribed and monitored by licensed clinicians through Ongo.",
      videoSrc: "/images/zepbound-inj.mp4",
      stats: [
        { value: "22.5%", label: "Avg. weight loss at 72 wks" },
        { value: "15 mg", label: "Max weekly maintenance dose" },
        { value: "Weekly", label: "Single injection schedule" },
      ],
    },
    rotatingBadge:
      "FDA-APPROVED · GLP-1/GIP · CLINICAL CARE ·",
    about: {
      eyebrow: "About Zepbound",
      title: "What is Zepbound?",
      body: "Zepbound is a prescription tirzepatide medication FDA-approved for chronic weight management in adults with obesity or overweight with a weight-related condition. It activates GLP-1 and GIP receptors to help regulate appetite alongside lifestyle changes.",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "How does Zepbound work?",
      body: "Zepbound's dual-action mechanism slows digestion, improves insulin sensitivity, and reduces hunger signals — helping you feel satisfied with less food under clinician supervision.",
    },
    processSteps: processSteps("Zepbound"),
    eligibility: {
      title: "Is Zepbound right for you?",
      items: defaultEligibility(),
      image: LIFESTYLE_IMAGE,
      imageAlt: "Person celebrating a health milestone",
    },
    safety: [
      {
        icon: "⚠",
        title: "Common side effects",
        body: "Nausea, diarrhea, vomiting, constipation, and injection-site reactions — most common during dose increases.",
      },
      {
        icon: "◆",
        title: "Serious risks",
        body: "Thyroid tumor risk in rodents. Not for people with medullary thyroid carcinoma history or MEN 2.",
      },
      {
        icon: "✕",
        title: "Do not use if",
        body: "Pregnant, breastfeeding, or allergic to tirzepatide or any Zepbound ingredient.",
      },
      {
        icon: "ℹ",
        title: "Talk to your doctor",
        body: "Share your full medical history. Your Ongo clinician reviews risks before prescribing.",
      },
    ],
    clinical: {
      title: "Clinical trial results",
      tableHeaders: ["Measure", "Zepbound", "Placebo"],
      rows: [
        ["Avg. weight change (72 weeks)", "−22.5%", "−2.0%"],
        ["Patients losing ≥5% body weight", "89%", "—"],
        ["Patients losing ≥15% body weight", "55%", "—"],
      ],
      stats: [
        { value: "22.5%", label: "Average weight loss at 72 weeks*" },
        { value: "15 mg", label: "Maximum weekly dose" },
        { value: "Weekly", label: "Once-weekly injection" },
      ],
      finePrint:
        "*Based on SURMOUNT-1 trial data. Individual results vary. Prescription required.",
    },
    videoSection: { title: "Watch our Zepbound overview" },
    injection: {
      title: "How to inject Zepbound",
      steps: defaultInjectionSteps(),
      note: "Rotate sites weekly. Your clinician guides your first injection.",
      sites: INJECTION_SITES,
    },
    dosage: {
      title: "Dosage & administration",
      intro:
        "Zepbound is titrated gradually. Your Ongo clinician personalizes the schedule.",
      steps: [
        "Weeks 1–4: 2.5 mg once weekly",
        "Weeks 5–8: 5 mg once weekly",
        "Weeks 9–12: 7.5 mg once weekly",
        "Further increases to 10 mg, 12.5 mg, or 15 mg per clinician guidance",
      ],
    },
    testimonials: {
      eyebrow: "Social proof",
      title: "Patient testimonials",
      lead: "Real stories from patients on physician-guided Zepbound care.",
      items: defaultTestimonials("Zepbound"),
    },
    faq: {
      eyebrow: "Zepbound · FAQ",
      headingMain: "Your",
      headingAccent: "frequently asked",
      headingSuffix: "questions, answered.",
      subcopy: "Everything you need to know about Zepbound and the Ongo program.",
      contactBadge: "Licensed Clinicians",
      contactTitle: "Still have questions?",
      contactText:
        "Speak with our care team to understand if Zepbound is right for your goals.",
      contactCta: "Get Started →",
      items: [
        {
          question: "What is Zepbound used for?",
          answer:
            "Zepbound is FDA-approved for chronic weight management in adults with obesity (BMI ≥ 30) or overweight (BMI ≥ 27) with a weight-related condition.",
        },
        {
          question: "How is Zepbound different from Mounjaro?",
          answer:
            "Both contain tirzepatide. Zepbound is FDA-approved for weight management; Mounjaro is approved for type 2 diabetes. Dosing may differ by indication.",
        },
        {
          question: "Can I get Zepbound through Ongo?",
          answer:
            "Yes — if clinically appropriate after a licensed clinician evaluation.",
        },
      ],
    },
    cta: {
      heading: "Ready to see if Zepbound is",
      headingAccent: "right for you?",
      subcopy:
        "Take a free evaluation. A licensed clinician will review your history and recommend a plan.",
    },
    disclaimer:
      "Zepbound® is a registered trademark of Eli Lilly and Company. Educational content only — not medical advice.",
  },

  liraglutide: {
    slug: "liraglutide",
    live: true,
    name: "Liraglutide",
    brandName: "Liraglutide",
    ingredient: "Liraglutide",
    seo: {
      title: "Liraglutide — Daily GLP-1 Injection | Ongo Weight Loss",
      description:
        "Learn how liraglutide supports appetite control and weight management, dosing, safety, and Ongo's physician-guided telehealth program.",
    },
    hero: {
      eyebrow: "Liraglutide · GLP-1",
      headingMain: "Daily injection for",
      headingAccent: "appetite control",
      subcopy:
        "A once-daily GLP-1 injection that helps regulate hunger signals — prescribed off-label for weight management when clinically appropriate, with ongoing physician oversight.",
      videoSrc: "/images/liraglutide-inj.mp4",
      stats: [
        { value: "8%", label: "Avg. weight loss in trials*" },
        { value: "3.0 mg", label: "Max daily dose (Saxenda®)" },
        { value: "Daily", label: "Injection schedule" },
      ],
    },
    rotatingBadge: "GLP-1 · DAILY CARE · CLINICAL SUPPORT ·",
    about: {
      eyebrow: "About Liraglutide",
      title: "What is Liraglutide?",
      body: "Liraglutide is a GLP-1 receptor agonist available under brand names including Victoza® (for type 2 diabetes) and Saxenda® (FDA-approved for weight management). It mimics a natural hormone to slow digestion and reduce appetite.",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "How does Liraglutide work?",
      body: "Liraglutide activates GLP-1 receptors to slow gastric emptying and signal fullness to the brain — helping reduce calorie intake under clinician supervision.",
    },
    processSteps: processSteps("liraglutide"),
    eligibility: {
      title: "Is liraglutide right for you?",
      items: defaultEligibility(),
      image: LIFESTYLE_IMAGE,
      imageAlt: "Person focused on wellness goals",
    },
    safety: [
      {
        icon: "⚠",
        title: "Common side effects",
        body: "Nausea, vomiting, diarrhea, and constipation — especially when starting or increasing dose.",
      },
      {
        icon: "◆",
        title: "Serious risks",
        body: "Thyroid tumor risk in rodents. Not for medullary thyroid carcinoma or MEN 2 history.",
      },
      {
        icon: "✕",
        title: "Do not use if",
        body: "Pregnant, breastfeeding, or allergic to liraglutide.",
      },
      {
        icon: "ℹ",
        title: "Talk to your doctor",
        body: "Brand and indication vary. Your Ongo clinician determines the appropriate option.",
      },
    ],
    clinical: {
      title: "Clinical trial highlights",
      tableHeaders: ["Measure", "Liraglutide", "Placebo"],
      rows: [
        ["Avg. weight change (56 weeks)", "−8.0%", "−2.6%"],
        ["Patients losing ≥5% body weight", "63%", "27%"],
        ["Patients losing ≥10% body weight", "33%", "10%"],
      ],
      stats: [
        { value: "8%", label: "Average weight loss at 56 weeks*" },
        { value: "3.0 mg", label: "Maximum daily dose" },
        { value: "Daily", label: "Once-daily injection" },
      ],
      finePrint: "*Based on SCALE trial data. Individual results vary.",
    },
    videoSection: { title: "Watch our liraglutide overview" },
    injection: {
      title: "How to inject liraglutide",
      steps: [
        "Wash hands and attach a new needle to the pen.",
        "Select your dose per clinician instructions.",
        "Inject into abdomen, thigh, or upper arm.",
        "Dispose of the needle safely after each use.",
      ],
      note: "Rotate injection sites daily. Store pen refrigerated before first use.",
      sites: INJECTION_SITES,
    },
    dosage: {
      title: "Dosage & administration",
      intro:
        "Liraglutide is started at a low dose and increased weekly. Your clinician personalizes the schedule.",
      steps: [
        "Week 1: 0.6 mg once daily",
        "Week 2: 1.2 mg once daily",
        "Week 3: 1.8 mg once daily",
        "Week 4: 2.4 mg once daily",
        "Week 5+: 3.0 mg once daily (maintenance)",
      ],
    },
    testimonials: {
      eyebrow: "Social proof",
      title: "Patient testimonials",
      lead: "Real stories from patients on physician-guided liraglutide care.",
      items: defaultTestimonials("liraglutide"),
    },
    faq: {
      eyebrow: "Liraglutide · FAQ",
      headingMain: "Your",
      headingAccent: "frequently asked",
      headingSuffix: "questions, answered.",
      subcopy: "Everything you need to know about liraglutide and the Ongo program.",
      contactBadge: "Licensed Clinicians",
      contactTitle: "Still have questions?",
      contactText: "Speak with our care team about whether liraglutide fits your goals.",
      contactCta: "Get Started →",
      items: [
        {
          question: "What is liraglutide used for?",
          answer:
            "Saxenda® (liraglutide 3.0 mg) is FDA-approved for weight management. Victoza® is approved for type 2 diabetes. Your clinician determines the right option.",
        },
        {
          question: "How is liraglutide different from Wegovy?",
          answer:
            "Liraglutide is injected daily; Wegovy (semaglutide) is weekly. Both are GLP-1 agonists with different molecules and dosing.",
        },
        {
          question: "Can I get liraglutide through Ongo?",
          answer: "Yes — if clinically appropriate after evaluation.",
        },
      ],
    },
    cta: {
      heading: "Ready to see if liraglutide is",
      headingAccent: "right for you?",
      subcopy:
        "Take a free evaluation. A licensed clinician will review your history and recommend a plan.",
    },
    disclaimer:
      "Victoza® and Saxenda® are registered trademarks of Novo Nordisk. Educational content only — not medical advice.",
  },

  rybelsus: {
    slug: "rybelsus",
    live: true,
    name: "Rybelsus",
    brandName: "Rybelsus®",
    ingredient: "Semaglutide",
    seo: {
      title: "Rybelsus — Oral GLP-1 Medication | Ongo Weight Loss",
      description:
        "Learn how Rybelsus (oral semaglutide) works for type 2 diabetes, dosing, safety, and Ongo's physician-guided telehealth program.",
    },
    hero: {
      eyebrow: "Rybelsus® · Oral Semaglutide",
      headingMain: "The first daily",
      headingAccent: "oral GLP-1 tablet",
      subcopy:
        "A once-daily oral semaglutide tablet FDA-approved for type 2 diabetes — clinicians may consider it for metabolic health goals when appropriate, with ongoing physician oversight.",
      videoSrc: "/images/ryb-tab.mp4",
      stats: [
        { value: "Oral", label: "No injection required" },
        { value: "14 mg", label: "Max daily maintenance dose" },
        { value: "Daily", label: "Morning tablet routine" },
      ],
    },
    rotatingBadge: "ORAL GLP-1 · TYPE 2 DIABETES · CLINICAL CARE ·",
    about: {
      eyebrow: "About Rybelsus",
      title: "What is Rybelsus?",
      body: "Rybelsus is the first oral GLP-1 medication, containing semaglutide in tablet form. It is FDA-approved to improve blood sugar in adults with type 2 diabetes alongside diet and exercise. It may be prescribed off-label for weight-related goals when a clinician determines benefit.",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "How does Rybelsus work?",
      body: "Rybelsus activates GLP-1 receptors to help regulate blood sugar and reduce appetite. Taken on an empty stomach with water, it is absorbed through the stomach lining — offering GLP-1 benefits without injection.",
    },
    processSteps: processSteps("Rybelsus"),
    eligibility: {
      title: "Is Rybelsus right for you?",
      items: [
        "Adults with type 2 diabetes needing glycemic support",
        "Patients who prefer oral medication over injections",
        "Willing to follow specific dosing instructions (empty stomach)",
        "No contraindications identified by your clinician",
      ],
      image: LIFESTYLE_IMAGE,
      imageAlt: "Person taking daily medication as part of a health routine",
    },
    safety: [
      {
        icon: "⚠",
        title: "Common side effects",
        body: "Nausea, stomach pain, diarrhea, decreased appetite, and vomiting — especially when starting.",
      },
      {
        icon: "◆",
        title: "Serious risks",
        body: "Thyroid tumor risk in rodents. Not for medullary thyroid carcinoma or MEN 2 history.",
      },
      {
        icon: "✕",
        title: "Do not use if",
        body: "Pregnant, breastfeeding, or allergic to semaglutide. Must take on empty stomach with plain water only.",
      },
      {
        icon: "ℹ",
        title: "Talk to your doctor",
        body: "Rybelsus is not FDA-approved for weight loss alone. Follow dosing instructions precisely for absorption.",
      },
    ],
    clinical: {
      title: "Clinical trial highlights",
      tableHeaders: ["Measure", "Rybelsus", "Placebo"],
      rows: [
        ["HbA1c reduction", "Up to 1.3%", "—"],
        ["Avg. weight change", "Moderate reduction", "—"],
        ["Oral absorption", "Requires empty stomach", "—"],
      ],
      stats: [
        { value: "Oral", label: "Tablet — no injection" },
        { value: "14 mg", label: "Maximum daily dose" },
        { value: "Daily", label: "Morning dosing routine" },
      ],
      finePrint:
        "*Rybelsus is FDA-approved for type 2 diabetes. Individual results vary.",
    },
    videoSection: { title: "Watch our Rybelsus overview" },
    injection: {
      title: "How to take Rybelsus",
      steps: [
        "Take on an empty stomach when you first wake up.",
        "Swallow with no more than 4 oz of plain water.",
        "Wait at least 30 minutes before eating, drinking, or other medications.",
        "Take at the same time each day for best results.",
      ],
      note: "Do not split, crush, or chew tablets. Your clinician explains proper administration.",
      sites: [],
    },
    dosage: {
      title: "Dosage & administration",
      intro:
        "Rybelsus is started at 3 mg daily for 30 days, then increased. Your clinician guides titration.",
      steps: [
        "Days 1–30: 3 mg once daily",
        "Days 31–60: 7 mg once daily",
        "Day 61+: 14 mg once daily (maintenance)",
      ],
    },
    testimonials: {
      eyebrow: "Social proof",
      title: "Patient testimonials",
      lead: "Real stories from patients on physician-guided Rybelsus care.",
      items: defaultTestimonials("Rybelsus"),
    },
    faq: {
      eyebrow: "Rybelsus · FAQ",
      headingMain: "Your",
      headingAccent: "frequently asked",
      headingSuffix: "questions, answered.",
      subcopy: "Everything you need to know about Rybelsus and the Ongo program.",
      contactBadge: "Licensed Clinicians",
      contactTitle: "Still have questions?",
      contactText: "Speak with our care team about whether Rybelsus fits your goals.",
      contactCta: "Get Started →",
      items: [
        {
          question: "What is Rybelsus used for?",
          answer:
            "Rybelsus is FDA-approved for type 2 diabetes. It may be considered off-label for weight-related goals when clinically appropriate.",
        },
        {
          question: "How is Rybelsus different from Ozempic?",
          answer:
            "Both contain semaglutide. Rybelsus is an oral daily tablet; Ozempic is a weekly injection.",
        },
        {
          question: "Why must I take it on an empty stomach?",
          answer:
            "Semaglutide in tablet form requires specific stomach conditions for absorption. Food and other drinks reduce effectiveness.",
        },
        {
          question: "Can I get Rybelsus through Ongo?",
          answer: "Yes — if clinically appropriate after evaluation.",
        },
      ],
    },
    cta: {
      heading: "Ready to see if Rybelsus is",
      headingAccent: "right for you?",
      subcopy:
        "Take a free evaluation. A licensed clinician will review your history and recommend a plan.",
    },
    disclaimer:
      "Rybelsus® is a registered trademark of Novo Nordisk. Educational content only — not medical advice.",
  },
};

export function getMedication(slug) {
  return MEDICATIONS[slug] ?? null;
}

export function getMedicationSlugs() {
  return Object.keys(MEDICATIONS);
}

export function getLiveMedications() {
  return Object.values(MEDICATIONS).filter((m) => m.live);
}

export { TRUST_LOGOS, FEATURE_CARDS, DOCTORS };
