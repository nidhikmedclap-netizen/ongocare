# GLP-1 Homepage — Next.js + Tailwind + CSS Modules

Scaffold of an 11-section CRO landing page.

## Approach

- **Tailwind** → structure only (flex, grid, padding, max-width, responsive breakpoints)
- **CSS Modules** → all design (colors, typography, hover effects, decorative styles)

Each section is self-contained: `SectionName.tsx` + `SectionName.module.css` living next to each other in `components/sections/`.

## Project structure

```
glp1-homepage/
├── app/
│   ├── globals.css        # Tailwind directives + base resets
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage — assembles all 11 sections
├── components/
│   └── sections/
│       ├── HeroSection.tsx + .module.css
│       ├── LoseWeightSection.tsx + .module.css
│       ├── BMICalculator.tsx + .module.css
│       ├── HowItWorks.tsx + .module.css
│       ├── CreateGLP1Plan.tsx + .module.css
│       ├── Services.tsx + .module.css
│       ├── CTAButton.tsx + .module.css
│       ├── ProductReviews.tsx + .module.css
│       ├── WhoIsItFor.tsx + .module.css
│       ├── OngoSolution.tsx + .module.css
│       └── AppMobileCTA.tsx + .module.css
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Customization pattern

Inside any section component:

- **Tailwind classes** on the JSX handle layout: `flex`, `grid grid-cols-1 md:grid-cols-3`, `gap-6`, `px-6 py-20`, `max-w-6xl`.
- **CSS Module classes** (imported from `./SectionName.module.css`) handle visual design: colors, fonts, borders, hover states, custom shapes.

To restyle a section, edit only its `.module.css` file. To restructure layout, edit Tailwind classes in the `.tsx` file.

## Sections (CRO purpose)

1. Hero — first impression
2. Lose Weight — value prop + visual proof
3. BMI Calculator — interactive lead capture
4. How It Works — reduce friction
5. Create GLP-1 Plan — education + eligibility
6. Services — 4 service blocks
7. CTA Button — primary conversion
8. Product Reviews — social proof
9. Who Is It For? — audience qualification
10. Ongo Solution — brand credibility
11. App / Mobile CTA — secondary conversion
