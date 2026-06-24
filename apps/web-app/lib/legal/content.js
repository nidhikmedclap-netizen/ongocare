/** Shared legal/policy pages — same layout, different content per slug. */

export const LEGAL_NAV = [
  { slug: "privacy", label: "Privacy", href: "/privacy" },
  { slug: "refund", label: "Refund", href: "/refund" },
  { slug: "shipping", label: "Shipping", href: "/shipping" },
  { slug: "terms", label: "Terms", href: "/terms" },
  {
    slug: "medical-disclaimer",
    label: "Medical Disclaimer",
    href: "/medical-disclaimer",
  },
  { slug: "editorial", label: "Editorial", href: "/editorial" },
  { slug: "hipaa", label: "HIPAA", href: "/hipaa" },
  {
    slug: "privacy-practices",
    label: "Privacy Practices",
    href: "/privacy-practices",
  },
  {
    slug: "california-privacy",
    label: "California Privacy Statement",
    href: "/california-privacy",
  },
  { slug: "bill-of-rights", label: "Bill Of Rights", href: "/bill-of-rights" },
];

function placeholderSections(topic) {
  return [
    {
      id: "overview",
      title: "Overview",
      blocks: [
        {
          type: "paragraph",
          text: `This ${topic} page is being finalized. The full policy text will be published here shortly. If you have questions in the meantime, contact our care team.`,
        },
      ],
    },
    {
      id: "contact",
      title: "Questions",
      blocks: [
        {
          type: "paragraph",
          text: "For questions about this policy, email info@ongoweightloss.com or call +1 (888) 655-5267.",
        },
      ],
    },
  ];
}

export const LEGAL_PAGES = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    metaTitle: "Privacy Policy — Ongo Weight Loss",
    metaDescription:
      "Learn how Ongo Weight Loss collects, uses, and protects your personal information when you use our website and services.",
    lastUpdated: "June 8, 2026",
    intro:
      "At Ongo Weight Loss, your privacy is very important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.",
    sections: [
      {
        id: "information-we-collect",
        title: "1. Information We Collect",
        blocks: [
          {
            type: "list",
            items: [
              "Personal Information: Name, date of birth, contact details (email, phone, address).",
              "Health Information: Details you provide during your consultation related to weight management and GLP-1 treatments.",
              "Payment Information: Billing details necessary to process consultation fees (handled via our payment processors).",
              "Technical Information: IP address, device and browser type, pages visited, and usage data collected via cookies or similar technologies.",
            ],
          },
        ],
      },
      {
        id: "how-we-use",
        title: "2. How We Use Your Information",
        blocks: [
          {
            type: "list",
            items: [
              "Provide and manage online medical consultations.",
              "Connect you with licensed partner dispensaries if a prescription is issued.",
              "Ongo Weight Loss processes payments for telehealth consultation services and, when medically approved, prescription medications that are dispensed and delivered by licensed partner pharmacies.",
              "Communicate with you about appointments, support, and service updates.",
              "Maintain, secure, and improve our website and user experience.",
            ],
          },
        ],
      },
      {
        id: "sharing-of-information",
        title: "3. Sharing of Information",
        blocks: [
          {
            type: "paragraph",
            text: "We do not sell, rent, or trade personal information. Information may be shared only as described below:",
          },
          {
            type: "list",
            items: [
              "Licensed Providers & Partner Dispensaries: To facilitate patient care and, where applicable, prescription fulfillment. Ongo Weight Loss does not sell medications. Prescription medications are dispensed and delivered by licensed partner pharmacies in accordance with applicable laws and regulations.",
              "Service Providers: Trusted vendors (e.g., payment processors, secure hosting providers, IT support) that process information on behalf of Ongo Weight Loss under strict confidentiality obligations.",
              "Legal Requirements: When required to comply with applicable law, regulation, legal process, or governmental request.",
            ],
          },
        ],
      },
      {
        id: "data-security",
        title: "4. Data Security",
        blocks: [
          {
            type: "paragraph",
            text: "We implement appropriate technical and organizational measures to safeguard your personal and health information (e.g., encryption in transit, access controls). However, no method of transmission or storage is 100% secure.",
          },
        ],
      },
      {
        id: "your-rights",
        title: "5. Your Rights",
        blocks: [
          {
            type: "paragraph",
            text: "Depending on your location, you may have rights to: Access and obtain a copy of your personal information; Request corrections to inaccurate or incomplete information; Request deletion of your data where legally permissible; Object to or restrict certain processing, and withdraw consent where processing is based on consent.",
          },
          {
            type: "paragraph",
            text: "To exercise your rights, contact us at info@ongoweightloss.com.",
          },
        ],
      },
      {
        id: "cookies",
        title: "6. Cookies & Tracking Technologies",
        blocks: [
          {
            type: "paragraph",
            text: "We use cookies and similar technologies to operate and improve our site, analyze usage, and remember your preferences. You can control cookies through your browser settings; disabling cookies may affect site functionality.",
          },
        ],
      },
      {
        id: "third-party-links",
        title: "7. Third-Party Links",
        blocks: [
          {
            type: "paragraph",
            text: "Our website may contain links to third-party sites (including partner dispensaries). Their privacy practices are governed by their own policies. We encourage you to review those policies before providing personal information.",
          },
        ],
      },
      {
        id: "childrens-privacy",
        title: "8. Children's Privacy",
        blocks: [
          {
            type: "paragraph",
            text: "Our services are intended for adults. We do not knowingly collect personal information from children under the age of 18. If you believe a minor has provided us information, please contact us to request deletion.",
          },
        ],
      },
      {
        id: "international-transfers",
        title: "9. International Transfers",
        blocks: [
          {
            type: "paragraph",
            text: "Your information may be processed in countries other than your own. Where required, we implement safeguards to protect your data when transferred internationally.",
          },
        ],
      },
      {
        id: "changes",
        title: "10. Changes to This Policy",
        blocks: [
          {
            type: "paragraph",
            text: "We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date. Your continued use of the website after changes signifies acceptance of the updated Policy.",
          },
        ],
      },
      {
        id: "contact-us",
        title: "11. Contact Us",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss",
          },
          {
            type: "list",
            items: [
              "Email: info@ongoweightloss.com",
              "Phone: +1 (888) 855-3287",
            ],
          },
        ],
      },
    ],
  },
  refund: {
    slug: "refund",
    title: "Refund Policy",
    metaTitle: "Refund Policy — Ongo Weight Loss",
    metaDescription:
      "Our policy on cancellations and refunds for telehealth consultations, prescription medications, billing errors, and chargeback resolution at Ongo Weight Loss.",
    lastUpdated: "June 8, 2026",
    intro:
      "At Ongo Weight Loss, we are committed to providing a transparent, ethical, and patient-centered telehealth experience. Our services include virtual medical evaluations conducted by licensed healthcare providers and, when medically appropriate, access to prescription medications as part of a supervised weight management program.",
    sections: [
      {
        id: "refund-and-cancellation-policy",
        title: "1. Refund and Cancellation Policy",
        blocks: [
          {
            type: "paragraph",
            text: "Because our services involve professional medical time and regulated prescription medications, the following policies apply regarding cancellations, refunds, and billing.",
          },
        ],
      },
      {
        id: "telehealth-consultation-fees",
        title: "2. Telehealth Consultation Fees",
        blocks: [
          {
            type: "paragraph",
            text: "Fees charged by Ongo Weight Loss for telehealth consultations and weight management services reflect the time, preparation, and professional expertise of licensed healthcare providers, as well as access to our secure telehealth platform.",
          },
          {
            type: "list",
            items: [
              "If a consultation has not yet taken place, patients may request a cancellation or refund in accordance with the cancellation policy below.",
              "Once a consultation has been completed, consultation fees are non-refundable, as the medical service has already been rendered and provider time has been reserved exclusively for the patient.",
            ],
          },
        ],
      },
      {
        id: "cancellations-and-rescheduling",
        title: "3. Cancellations and Rescheduling",
        blocks: [
          {
            type: "paragraph",
            text: "We understand that schedules may change.",
          },
          {
            type: "list",
            items: [
              "Patients may cancel or reschedule their consultation by notifying Ongo Weight Loss at least 24 hours prior to the scheduled appointment time.",
              "When timely notice is provided, we will make reasonable efforts to reschedule the appointment or issue an eligible refund.",
              "Cancellations made less than 24 hours before the scheduled consultation time may not be eligible for a refund, except in cases of technical issues or extraordinary circumstances, which are reviewed on a case-by-case basis.",
            ],
          },
        ],
      },
      {
        id: "prescription-medications",
        title: "4. Prescription Medications & Pharmacy Fulfillment",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss facilitates access to prescription medications only when a licensed healthcare provider determines that medication is medically appropriate as part of a patient's treatment plan.",
          },
          {
            type: "list",
            items: [
              "Fees charged for prescription medications are separate from consultation fees and may be billed by Ongo Weight Loss on behalf of the patient.",
              "Ongo Weight Loss does not enroll patients in automatic subscription programs unless explicitly stated at the time of purchase.",
              "Prescriptions are fulfilled by independent, state-licensed pharmacies, which are responsible solely for dispensing and shipping medications in compliance with applicable federal and state laws.",
              "Pharmacy partners do not process payments, issue refunds, or provide billing support directly to patients.",
            ],
          },
        ],
      },
      {
        id: "medication-refunds",
        title: "5. Medication Refunds, Cancellations, and Modifications",
        blocks: [
          {
            type: "paragraph",
            text: "Because prescription medications are regulated healthcare products, refund eligibility is limited.",
          },
          {
            type: "list",
            items: [
              "Medication orders may be canceled or modified only before the prescription has been transmitted to the pharmacy for fulfillment.",
              "Once a prescription has been dispensed, prepared, or shipped by the pharmacy, medication charges are non-refundable, except where required by law.",
              "Requests for medication-related cancellations, modifications, or refund inquiries must be submitted directly to Ongo Weight Loss, not the pharmacy.",
            ],
          },
        ],
      },
      {
        id: "technical-issues",
        title: "6. Technical Issues and Billing Errors",
        blocks: [
          {
            type: "paragraph",
            text: "If a technical issue—such as a platform malfunction or connectivity failure—prevents a consultation from taking place, or if you believe you were charged in error, please contact our support team promptly at info@ongoweightloss.com.",
          },
          {
            type: "paragraph",
            text: "We will review each situation carefully and, where appropriate, issue a refund or arrange an alternative consultation or resolution at no additional cost. Approved refunds are typically processed within 3–5 business days. Please note that your financial institution may require additional time to reflect the credit on your statement.",
          },
        ],
      },
      {
        id: "chargebacks",
        title: "7. Chargebacks and Dispute Resolution",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss is the merchant of record for all charges processed through our platform and is responsible for handling refunds, billing inquiries, and chargeback resolution.",
          },
          {
            type: "paragraph",
            text: "Patients are encouraged to contact our support team directly to resolve any concerns prior to initiating a chargeback with their financial institution.",
          },
        ],
      },
      {
        id: "our-commitment",
        title: "8. Our Commitment",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss is dedicated to delivering compassionate, evidence-based care through a secure and compliant telehealth platform. We strive to ensure that every patient feels informed, supported, and respected throughout their experience.",
          },
          {
            type: "paragraph",
            text: "If you have questions, concerns, or special circumstances, please contact us at info@ongoweightloss.com. Our team will review your inquiry with care and work to provide a fair and timely resolution.",
          },
        ],
      },
    ],
  },
  shipping: {
    slug: "shipping",
    title: "Shipping Policy",
    metaTitle: "Shipping Policy — Ongo Weight Loss",
    metaDescription:
      "How Ongo Weight Loss coordinates medication fulfillment and shipping through licensed partner pharmacies, including timelines, delays, and delivery support.",
    lastUpdated: "June 8, 2026",
    intro:
      "At Ongo Weight Loss, we specialize in connecting patients with licensed healthcare providers for professional support in achieving their weight management goals, including the use of GLP-1 medications when medically appropriate. Each patient is evaluated individually to determine the safest and most effective treatment plan based on medical history, current health status, and clinical guidelines.",
    sections: [
      {
        id: "fulfillment-policy",
        title: "1. Medication Fulfillment & Shipping Policy",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss does not directly manufacture medications. When a prescription is approved, it is fulfilled by a licensed partner pharmacy in compliance with applicable state and federal regulations.",
          },
          {
            type: "paragraph",
            text: "Although medications are dispensed and shipped by licensed pharmacy partners, Ongo Weight Loss actively coordinates with the pharmacy to ensure timely processing and delivery of your order.",
          },
        ],
      },
      {
        id: "shipping-timelines",
        title: "2. Shipping Timelines & Delivery",
        blocks: [
          {
            type: "paragraph",
            text: "Shipping timelines, delivery methods, and associated costs may vary depending on your geographic location, pharmacy processing times, prescription verification requirements, inventory availability, weather conditions, carrier delays, or other unforeseen circumstances beyond our control.",
          },
          {
            type: "paragraph",
            text: "While most orders are processed and shipped promptly, occasional delays may occur due to high demand, supply chain disruptions, regulatory requirements, or courier-related issues.",
          },
        ],
      },
      {
        id: "delivery-support",
        title: "3. Delivery Concerns & Support",
        blocks: [
          {
            type: "paragraph",
            text: "In the event of a shipping delay, tracking issue, or delivery concern, patients should contact Ongo Weight Loss directly at info@ongoweightloss.com so our team can coordinate with the pharmacy and shipping provider on your behalf and assist in resolving the matter as quickly as possible.",
          },
          {
            type: "paragraph",
            text: "We remain committed to supporting our patients throughout the fulfillment process and will work diligently with our pharmacy partners to address shipment-related concerns.",
          },
        ],
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    metaTitle: "Terms & Conditions — Ongo Weight Loss",
    metaDescription:
      "Terms and conditions governing your use of Ongo Weight Loss telehealth consultations, prescription coordination, payments, and related services.",
    lastUpdated: "June 8, 2026",
    intro:
      'Welcome to Ongo Weight Loss ("Ongo," "we," "us," or "our"). These Terms & Conditions ("Terms") govern your access to and use of our website, online consultation services, and related features (collectively, the "Services"). By accessing or using the Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use the Services.',
    sections: [
      {
        id: "about-our-services",
        title: "1. About Our Services",
        blocks: [
          {
            type: "list",
            items: [
              "Ongo provides online medical consultations for weight management, which may include evaluation for GLP-1 medications when clinically appropriate.",
              "Ongo does not manufacture medications. If a licensed provider issues a prescription, the medication is dispensed and delivered by a licensed partner pharmacy in accordance with applicable laws.",
              "Ongo coordinates prescription fulfillment and remains responsible for assisting with billing, shipping, delivery concerns, and related support matters throughout the process.",
            ],
          },
        ],
      },
      {
        id: "eligibility",
        title: "2. Eligibility & Patient Responsibilities",
        blocks: [
          {
            type: "list",
            items: [
              "You must be at least 18 years old and legally able to enter into these Terms.",
              "You agree to provide accurate, complete, and current information during registration, intake, and consultations, and to update information as needed.",
              "Eligibility for any prescription is determined solely by a licensed healthcare provider after clinical evaluation. No outcome or prescription is guaranteed.",
              "The Services are not for emergencies. If you are experiencing a medical emergency, call your local emergency number immediately.",
            ],
          },
        ],
      },
      {
        id: "telehealth-consent",
        title: "3. Telehealth Consent",
        blocks: [
          {
            type: "paragraph",
            text: "By using our Services, you consent to receive healthcare via telehealth, which may include audio, video, asynchronous chat, and electronic data transmission. You understand the potential benefits and limitations of telehealth, including risks related to data transmission and the absence of in-person examination. You may withdraw consent at any time by discontinuing use of the Services.",
          },
        ],
      },
      {
        id: "no-medical-advice-guarantee",
        title: "4. No Medical Advice Guarantee",
        blocks: [
          {
            type: "paragraph",
            text: "Information on the website is for general educational purposes and does not substitute for professional medical advice, diagnosis, or treatment. Always follow the advice of your healthcare provider. Individual results vary.",
          },
        ],
      },
      {
        id: "third-party-dispensaries",
        title: "5. Third-Party Dispensaries & Shipping",
        blocks: [
          {
            type: "paragraph",
            text: "If a prescription is issued, it is dispensed and delivered by a licensed partner pharmacy in accordance with applicable state and federal laws.",
          },
          {
            type: "paragraph",
            text: "Shipping timelines, costs, packaging requirements, cold-chain handling (if applicable), delivery carriers, and related logistics are determined by the licensed pharmacy. While fulfillment and shipment are performed by the pharmacy, Ongo coordinates the process and remains available to assist with shipping inquiries, delivery concerns, or related support matters.",
          },
          {
            type: "paragraph",
            text: "In the event of delays, losses, damage, or dispensing issues, patients should contact Ongo directly so the team can coordinate with the pharmacy to help resolve the matter as efficiently as possible.",
          },
          {
            type: "paragraph",
            text: "See our Shipping Policy for additional details.",
          },
        ],
      },
      {
        id: "fees-payments",
        title: "6. Fees, Payments, Cancellations & Refunds",
        blocks: [
          {
            type: "list",
            items: [
              "Consultation fees and any platform charges (if applicable) are disclosed at booking and are due at the time of scheduling.",
              "Once your consultation has been completed, consultation fees are non-refundable.",
              "If you need to cancel or reschedule, please do so at least 24 hours in advance where possible; additional terms may apply at booking.",
              "Medication charges, returns, and medication-related refunds are coordinated by Ongo Weight Loss in collaboration with the dispensing pharmacy under applicable policies and laws.",
              "Chargebacks and payment disputes may result in suspension or termination of access to the Services.",
            ],
          },
          {
            type: "paragraph",
            text: "See our Refund Policy for full details on refunds for consultation services.",
          },
        ],
      },
      {
        id: "accounts-security",
        title: "7. Accounts & Security",
        blocks: [
          {
            type: "list",
            items: [
              "You are responsible for safeguarding your login credentials and for all activity under your account.",
              "Notify us immediately of any unauthorized use or security breach.",
              "We may, in our discretion, suspend or terminate accounts for suspected fraud, abuse, or violation of these Terms.",
            ],
          },
        ],
      },
      {
        id: "user-conduct",
        title: "8. User Conduct",
        blocks: [
          {
            type: "list",
            items: [
              "Do not use the Services for any unlawful purpose or to obtain medications without a valid prescription.",
              "Do not interfere with the security or operation of the Services, attempt to access other users' data, or submit false or misleading information.",
              "Do not upload content that is defamatory, obscene, infringing, or otherwise objectionable or harmful.",
            ],
          },
        ],
      },
      {
        id: "intellectual-property",
        title: "9. Intellectual Property",
        blocks: [
          {
            type: "paragraph",
            text: "The website, its content, design, trademarks, service marks, and logos are owned by or licensed to Ongo and are protected by applicable laws. Except as expressly allowed, you may not copy, modify, distribute, or create derivative works from our content without prior written consent.",
          },
        ],
      },
      {
        id: "content-you-provide",
        title: "10. Content You Provide",
        blocks: [
          {
            type: "paragraph",
            text: "You represent that you have all rights to the information and materials you submit. You grant Ongo a limited, non-exclusive, royalty-free license to use such content solely to operate and provide the Services, consistent with our Privacy Policy.",
          },
        ],
      },
      {
        id: "privacy",
        title: "11. Privacy",
        blocks: [
          {
            type: "paragraph",
            text: "Our collection and use of personal and health information is described in our Privacy Policy. By using the Services, you consent to such processing and represent that all information provided is accurate.",
          },
        ],
      },
      {
        id: "third-party-services",
        title: "12. Third-Party Services & Links",
        blocks: [
          {
            type: "paragraph",
            text: "The Services may contain links to third-party websites or services (including dispensaries and payment processors). Ongo is not responsible for third-party content, policies, or practices. Your use of third-party services is at your own risk and subject to their terms.",
          },
        ],
      },
      {
        id: "disclaimers",
        title: "13. Disclaimers",
        blocks: [
          {
            type: "paragraph",
            text: 'The Services are provided on an "as is" and "as available" basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.',
          },
          {
            type: "paragraph",
            text: "We do not warrant that the Services will be uninterrupted, timely, secure, or error-free.",
          },
        ],
      },
      {
        id: "limitation-of-liability",
        title: "14. Limitation of Liability",
        blocks: [
          {
            type: "paragraph",
            text: "To the fullest extent permitted by law, Ongo and its affiliates, officers, employees, and providers will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, data, goodwill, or other intangible losses, arising from or relating to your use of (or inability to use) the Services. In no event will our total liability exceed the amount you paid to Ongo for the consultation giving rise to the claim in the twelve (12) months preceding the event.",
          },
        ],
      },
      {
        id: "indemnification",
        title: "15. Indemnification",
        blocks: [
          {
            type: "paragraph",
            text: "You agree to indemnify, defend, and hold harmless Ongo and its affiliates, officers, employees, contractors, and providers from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or related to: (a) your use of the Services; (b) your violation of these Terms; (c) your violation of any law or third-party right; or (d) any content you submit.",
          },
        ],
      },
      {
        id: "suspension-termination",
        title: "16. Suspension, Termination & Changes",
        blocks: [
          {
            type: "list",
            items: [
              "We may modify or discontinue any part of the Services at any time, with or without notice, where lawful.",
              "We may suspend or terminate your access for any violation of these Terms, suspected fraud, or to comply with law.",
              "We may update these Terms from time to time. Changes are effective when posted, and your continued use constitutes acceptance.",
            ],
          },
        ],
      },
      {
        id: "force-majeure",
        title: "17. Force Majeure",
        blocks: [
          {
            type: "paragraph",
            text: "We will not be liable for any delay or failure in performance resulting from events beyond our reasonable control, including but not limited to acts of God, labor disputes, acts of government, war, epidemics, pandemics, supply chain disruptions, carrier delays, or internet/service outages.",
          },
        ],
      },
      {
        id: "severability",
        title: "18. Severability & Entire Agreement",
        blocks: [
          {
            type: "paragraph",
            text: "If any provision of these Terms is held unenforceable, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect. These Terms, together with our Privacy Policy and any supplemental terms presented at the time of purchase or use, constitute the entire agreement between you and Ongo regarding the Services.",
          },
        ],
      },
      {
        id: "contact-us",
        title: "19. Contact Us",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss",
          },
          {
            type: "list",
            items: [
              "Email: info@ongoweightloss.com",
              "Phone: +1 (888) 655-5267",
            ],
          },
        ],
      },
    ],
  },
  "medical-disclaimer": {
    slug: "medical-disclaimer",
    title: "Medical Disclaimer",
    metaTitle: "Medical Disclaimer — Ongo Weight Loss",
    metaDescription:
      "Important medical disclaimer for Ongo Weight Loss telehealth consultations, GLP-1 evaluations, and educational website content.",
    lastUpdated: "June 8, 2026",
    intro:
      'Ongo Weight Loss ("we," "our," or "us") provides telehealth consultations and related weight management services, including evaluations for FDA-approved GLP-1 medications, exclusively through licensed healthcare professionals. The information on our website is for educational purposes only and should not replace professional medical advice, diagnosis, or treatment.',
    sections: [
      {
        id: "glp1-treatment",
        title: "1. GLP-1 Treatment & Prescription Fulfillment",
        blocks: [
          {
            type: "paragraph",
            text: "During consultations, licensed healthcare providers review your medical history and determine whether a GLP-1 treatment, such as semaglutide, tirzepatide, or liraglutide, is clinically appropriate. If prescribed, medications are dispensed and shipped by licensed U.S. pharmacies in accordance with applicable state and federal laws. Ongo Weight Loss coordinates the fulfillment process and provides ongoing support throughout treatment. Individual results may vary, and all medications carry potential risks and side effects.",
          },
        ],
      },
      {
        id: "emergency-care",
        title: "2. Not for Emergency Care",
        blocks: [
          {
            type: "paragraph",
            text: "Our telehealth services are not intended for emergency care. If you experience a medical emergency, call 911 or contact your local emergency services immediately.",
          },
        ],
      },
      {
        id: "acknowledgment",
        title: "3. Your Acknowledgment",
        blocks: [
          {
            type: "paragraph",
            text: "By using our services, you acknowledge and agree to this medical disclaimer.",
          },
        ],
      },
    ],
  },
  "privacy-practices": {
    slug: "privacy-practices",
    title: "Notice of Privacy Practices",
    metaTitle: "Notice of Privacy Practices — Ongo Weight Loss",
    metaDescription:
      "How Ongo Weight Loss uses, shares, and protects your protected health information under HIPAA and applicable privacy laws.",
    lastUpdated: "June 8, 2026",
    intro:
      "This notice describes how your medical information may be used and shared, and how you can access it. Please review it carefully.",
    sections: [
      {
        id: "who-we-are",
        title: "1. Who We Are",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss provides telehealth services in coordination with licensed clinicians and affiliated healthcare providers. These providers are responsible for delivering your medical care and maintaining your health information. Ongo Weight Loss supports the technology platform, coordination, and administrative services.",
          },
        ],
      },
      {
        id: "our-responsibilities",
        title: "2. Our Responsibilities",
        blocks: [
          {
            type: "paragraph",
            text: "We are required by law to protect your Protected Health Information (PHI) and maintain its privacy and security. We use and disclose only the minimum necessary information required to provide services and comply with legal obligations.",
          },
          {
            type: "paragraph",
            text: "We do not sell your health information.",
          },
          {
            type: "paragraph",
            text: "We follow applicable healthcare privacy laws, including HIPAA, and maintain safeguards to protect your data. We will notify you if a breach occurs that may compromise your information.",
          },
        ],
      },
      {
        id: "how-we-use-and-share",
        title: "3. How We Use and Share Your Information",
        blocks: [
          {
            type: "paragraph",
            text: "We may use and share your health information for the following purposes:",
          },
          {
            type: "list",
            items: [
              "Treatment: To provide, coordinate, and manage your care, including consultations, evaluations, and prescriptions.",
              "Payment: To process payments for services, including consultation fees and related charges.",
              "Healthcare Operations: To support quality improvement, compliance, and internal operations.",
            ],
          },
        ],
      },
      {
        id: "sharing-with-care-partners",
        title: "4. Sharing with Care Partners",
        blocks: [
          {
            type: "paragraph",
            text: 'We may share your information with licensed clinicians, pharmacies, and service providers involved in your care. We may also share information with trusted vendors ("Business Associates") who help operate our services. These parties are required to safeguard your information and use it only as permitted by law.',
          },
        ],
      },
      {
        id: "other-permitted-uses",
        title: "5. Other Permitted Uses and Disclosures",
        blocks: [
          {
            type: "paragraph",
            text: "We may disclose your information when required or permitted by law, including for public health activities, regulatory oversight, legal proceedings, law enforcement requests, or to prevent serious threats to health or safety.",
          },
        ],
      },
      {
        id: "uses-requiring-authorization",
        title: "6. Uses Requiring Your Authorization",
        blocks: [
          {
            type: "paragraph",
            text: "Certain uses, such as marketing or disclosures outside standard care purposes, require your written authorization. You may withdraw your authorization at any time.",
          },
        ],
      },
      {
        id: "your-rights",
        title: "7. Your Rights",
        blocks: [
          {
            type: "paragraph",
            text: "You have the right to:",
          },
          {
            type: "list",
            items: [
              "Access and obtain a copy of your health information",
              "Request corrections to your records",
              "Request limits on how your information is used or shared",
              "Request confidential communications",
              "Receive a list of certain disclosures",
            ],
          },
          {
            type: "paragraph",
            text: "To exercise your rights, contact us at info@ongoweightloss.com.",
          },
          {
            type: "paragraph",
            text: "You may file a complaint if you believe your rights have been violated. We will not retaliate against you. You may also file a complaint with the U.S. Department of Health and Human Services.",
          },
        ],
      },
      {
        id: "data-security",
        title: "8. Data Security",
        blocks: [
          {
            type: "paragraph",
            text: "We use administrative, technical, and physical safeguards to protect your information, including secure systems and restricted access. However, no system is completely secure, and electronic communication may carry inherent risks.",
          },
        ],
      },
      {
        id: "telehealth-considerations",
        title: "9. Telehealth Considerations",
        blocks: [
          {
            type: "paragraph",
            text: "By using telehealth services, you acknowledge that your information may be transmitted electronically. While we use secure systems, there are inherent risks associated with digital communication.",
          },
        ],
      },
      {
        id: "changes-to-notice",
        title: "10. Changes to This Notice",
        blocks: [
          {
            type: "paragraph",
            text: "We may update this Notice periodically. Updates will be posted on this page with a revised effective date.",
          },
        ],
      },
      {
        id: "contact-information",
        title: "11. Contact Information",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss",
          },
          {
            type: "list",
            items: [
              "Email: info@ongoweightloss.com",
              "Phone: +1 (888) 655-5267",
            ],
          },
        ],
      },
    ],
  },
  "california-privacy": {
    slug: "california-privacy",
    title: "California Privacy Statement",
    metaTitle: "California Privacy Statement — Ongo Weight Loss",
    metaDescription:
      "California resident privacy rights under the CCPA and CPRA, including access, deletion, correction, and data sharing practices at Ongo Weight Loss.",
    lastUpdated: "June 8, 2026",
    intro:
      "This California Privacy Statement applies to California residents and supplements our Privacy Policy. It explains your rights under applicable California privacy laws, including the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA).",
    sections: [
      {
        id: "information-we-collect",
        title: "1. Information We Collect",
        blocks: [
          {
            type: "paragraph",
            text: "We may collect personal information that identifies or relates to you, including:",
          },
          {
            type: "list",
            items: [
              "Identifiers (such as name, email, phone number, address)",
              "Health-related information provided during consultations",
              "Payment and billing information",
              "Internet or device information (such as IP address, browser type, and usage data)",
              "Inferences based on your interactions with our platform",
            ],
          },
          {
            type: "paragraph",
            text: "This information is collected directly from you, automatically through your use of our website, or from service providers involved in delivering our services.",
          },
        ],
      },
      {
        id: "how-we-use",
        title: "2. How We Use Your Information",
        blocks: [
          {
            type: "paragraph",
            text: "We use your personal information to:",
          },
          {
            type: "list",
            items: [
              "Provide telehealth services and connect you with licensed clinicians",
              "Process payments and manage your account",
              "Communicate with you regarding your care and services",
              "Improve our platform, services, and user experience",
              "Comply with legal and regulatory requirements",
            ],
          },
        ],
      },
      {
        id: "sharing",
        title: "3. Sharing of Personal Information",
        blocks: [
          {
            type: "paragraph",
            text: "We may share your information with:",
          },
          {
            type: "list",
            items: [
              "Licensed clinicians and healthcare providers involved in your care",
              "Licensed pharmacies for prescription fulfillment, when applicable",
              "Service providers (such as payment processors, hosting providers, and support services)",
              "Authorities when required by law",
            ],
          },
          {
            type: "paragraph",
            text: "We do not sell your personal information.",
          },
        ],
      },
      {
        id: "california-rights",
        title: "4. Your California Privacy Rights",
        blocks: [
          {
            type: "paragraph",
            text: "If you are a California resident, you have the right to:",
          },
          {
            type: "list",
            items: [
              "Request access to the personal information we collect about you",
              "Request deletion of your personal information, subject to legal exceptions",
              "Request correction of inaccurate personal information",
              "Request information about how your data is collected, used, and shared",
              "Request to limit the use of certain sensitive personal information, where applicable",
            ],
          },
          {
            type: "paragraph",
            text: "We will not discriminate against you for exercising your rights.",
          },
        ],
      },
      {
        id: "exercising-rights",
        title: "5. Exercising Your Rights",
        blocks: [
          {
            type: "paragraph",
            text: "To exercise your rights, you may contact us at info@ongoweightloss.com.",
          },
          {
            type: "paragraph",
            text: "We may need to verify your identity before processing your request.",
          },
        ],
      },
      {
        id: "response-timing",
        title: "6. Response Timing",
        blocks: [
          {
            type: "paragraph",
            text: "We aim to respond to verified requests within a reasonable timeframe. If additional time is required, we will notify you accordingly.",
          },
        ],
      },
      {
        id: "changes",
        title: "7. Changes to This Statement",
        blocks: [
          {
            type: "paragraph",
            text: "We may update this California Privacy Statement from time to time. Updates will be posted on this page with a revised effective date.",
          },
        ],
      },
      {
        id: "contact-us",
        title: "8. Contact Us",
        blocks: [
          {
            type: "paragraph",
            text: "Ongo Weight Loss",
          },
          {
            type: "list",
            items: [
              "Email: info@ongoweightloss.com",
              "Phone: +1 (888) 655-5267",
            ],
          },
        ],
      },
    ],
  },
  "bill-of-rights": {
    slug: "bill-of-rights",
    title: "Weight Loss Bill of Rights",
    metaTitle: "Weight Loss Bill of Rights — Ongo Weight Loss",
    metaDescription:
      "The rights you can expect at Ongo Weight Loss — clear information, professional evaluation, transparent pricing, personalized care, and respect for your privacy.",
    lastUpdated: "June 8, 2026",
    intro:
      "At Ongo Weight Loss, we believe your care should be clear, personalized, and grounded in trust. These principles define the rights you can expect throughout your experience with us.",
    sections: [
      {
        id: "clear-information",
        title: "1. The Right to Clear Information",
        blocks: [
          {
            type: "paragraph",
            text: "You deserve to fully understand your treatment options, including how your plan works and what each step involves.",
          },
        ],
      },
      {
        id: "professional-evaluation",
        title: "2. The Right to a Professional Evaluation",
        blocks: [
          {
            type: "paragraph",
            text: "Your care begins with a licensed healthcare provider who evaluates your health before recommending any treatment.",
          },
        ],
      },
      {
        id: "ask-and-understand",
        title: "3. The Right to Ask and Understand",
        blocks: [
          {
            type: "paragraph",
            text: "You can ask questions at any time about your program, including nutrition, lifestyle guidance, and treatment options.",
          },
        ],
      },
      {
        id: "transparent-pricing",
        title: "4. The Right to Transparent Pricing",
        blocks: [
          {
            type: "paragraph",
            text: "You will always have access to clear, upfront pricing for services, treatments, and any additional support.",
          },
        ],
      },
      {
        id: "personalized-care",
        title: "5. The Right to Personalized Care",
        blocks: [
          {
            type: "paragraph",
            text: "Your plan is tailored to your health profile, goals, and progress — never one-size-fits-all.",
          },
        ],
      },
      {
        id: "know-your-provider",
        title: "6. The Right to Know Your Provider",
        blocks: [
          {
            type: "paragraph",
            text: "You can know who is guiding your care, including their qualifications and credentials.",
          },
        ],
      },
      {
        id: "ongoing-guidance",
        title: "7. The Right to Ongoing Guidance",
        blocks: [
          {
            type: "paragraph",
            text: "You receive continued support and adjustments to your plan as your needs evolve.",
          },
        ],
      },
      {
        id: "make-your-own-choices",
        title: "8. The Right to Make Your Own Choices",
        blocks: [
          {
            type: "paragraph",
            text: "You are always in control of your decisions and can choose what feels right for your health and goals.",
          },
        ],
      },
      {
        id: "responsible-care",
        title: "9. The Right to Responsible Care",
        blocks: [
          {
            type: "paragraph",
            text: "Your treatment follows established medical standards, with a focus on safety and long-term well-being.",
          },
        ],
      },
      {
        id: "respect-and-privacy",
        title: "10. The Right to Respect and Privacy",
        blocks: [
          {
            type: "paragraph",
            text: "Your personal and health information is handled with care, respect, and confidentiality.",
          },
        ],
      },
      {
        id: "our-commitment",
        title: "Our Commitment to You",
        blocks: [
          {
            type: "paragraph",
            text: "We're here to support your progress with care that is thoughtful, transparent, and built around you.",
          },
        ],
      },
    ],
  },
};

export function getLegalPage(slug) {
  const page = LEGAL_PAGES[slug];
  if (!page) {
    throw new Error(`Unknown legal page slug: ${slug}`);
  }
  return page;
}

export function getAllLegalSlugs() {
  return Object.keys(LEGAL_PAGES);
}
