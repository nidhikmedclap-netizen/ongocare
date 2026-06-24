import localFont from "next/font/local";

/**
 * Site-wide font — change ONLY here (+ matching files in app/fonts/).
 *
 * 1. Replace .woff2 files in app/fonts/
 * 2. Update `src` paths and `variable` below if needed
 * 3. Update SITE_FONT_NAME in globals.css (--font-site) to match
 *
 * All pages inherit via html/body in globals.css — do not set font-family
 * in component CSS unless you have a rare exception (e.g. Stripe iframe).
 *
 * DevTools shows a hashed name like __siteFont_abc123 — that IS Teachers
 * (next/font never displays the human-readable family name in inspect).
 */

export const SITE_FONT_NAME = "Teachers";

export const siteFont = localFont({
  src: [
    {
      path: "../../app/fonts/Teachers-Latin-Roman.woff2",
      weight: "400 800",
      style: "normal",
    },
    {
      path: "../../app/fonts/Teachers-Latin-Italic.woff2",
      weight: "400 800",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-teachers",
  fallback: ["sans-serif"],
});

/** Use in JS contexts that cannot read CSS variables (e.g. Stripe Elements). */
export const siteFontFamily = `"${SITE_FONT_NAME}", sans-serif`;
