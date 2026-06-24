/** Blog content migrated from https://ongoweightloss.com/blog/ */

import exercisesArticle from "./articles/10-research-backed-exercises-for-weight-loss-fat-burning";
import wegovyArticle from "./articles/beyond-the-hype-how-wegovy-really-impacts-weight-loss";
import hiddenReasonsArticle from "./articles/hidden-reasons-youre-not-losing-weight-even-with-a-healthy-diet-and-exercise";
import healthyWeightLossArticle from "./articles/healthy-weight-loss-step-by-step-guide-to-losing-weight-safely";
import mounjaroArticle from "./articles/staying-slim-with-mounjaro-how-the-maintenance-dose-works";
import zepboundArticle from "./articles/starting-zepbound";
import glp1Article from "./articles/what-are-glp-1-medications-and-how-they-support-weight-loss";
import ozempicArticle from "./articles/how-ozempic-works-for-diabetes-and-weight-loss";
import { AUTHORS, REVIEWER } from "./authors";

export { AUTHORS, REVIEWER };

export const BLOG_META = {
  title: "Ongo Weight Loss Blog: Tips, Guides & Updates",
  description:
    "Read the latest articles on medical weight loss, GLP-1 medications, and healthy living from Ongo Weight Loss.",
};

export const BLOG_HERO = {
  headline: "Explore Expert",
  headlineEm: "Weight Loss Insights",
  subcopy:
    "Read the latest articles on medical weight loss, GLP-1 medications, and healthy living.",
  primaryCta: {
    label: "Start Your Consultation Now",
    href: "/weightloss-onboard",
  },
};

export const BLOG_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "glp-1-medications", label: "GLP-1 Medications" },
  { id: "healthy-living", label: "Healthy Living" },
  { id: "weight-loss", label: "Weight Loss" },
];

export const EDITOR_PICKS_TITLE = "Editor's Picks: Top Weight Loss Resources";

export const EDITOR_PICKS_INTRO =
  "Our editorial team curates the most practical, science-based articles to empower patients on their weight loss journey. Dive into expert guides on using GLP-1 therapies effectively, understand the biology behind metabolic health, and discover actionable insights on nutrition, movement, mindset, and long-term wellness.";

export const SIDEBAR_JOURNEY = {
  title: "Start Your Medical Weight Loss Journey Today",
  copy: "Ready to transform your health with medically supervised weight loss? Our expert team is here to guide you every step of the way.",
  cta: { label: "Start Consultation", href: "/weightloss-onboard" },
};

export const NEWSLETTER = {
  title: "Get Weekly Weight Loss Tips",
  copy: "Subscribe to receive expert insights and exclusive content.",
  cta: "Subscribe",
  success: "You're on the list. Check your inbox.",
};

export const MID_CTA = {
  title: "Take the Next Step in Your Weight Loss Journey",
  copy: "Turn your goals into results with personalized medical weight loss support.",
  cta: { label: "Start Your Application Now", href: "/weightloss-onboard" },
};

export const BOTTOM_CTA = {
  title: "Start Your Weight Loss Journey Today",
  copy: "Feel lighter, healthier, and more confident – your journey starts with one click.",
  cta: { label: "Book Your Consultation Today", href: "/weightloss-onboard" },
};

export const CONTACT_CARDS = [
  {
    title: "Call Us Now",
    copy: "Connect instantly with our friendly customer care team.",
    cta: "Call Now",
    href: "tel:+18886555267",
  },
  {
    title: "Email Support",
    copy: "Get clear, expert answers delivered straight to your inbox.",
    cta: "Email Us",
    href: "mailto:info@ongoweightloss.com",
  },
  {
    title: "Live Chat",
    copy: "24/7 customer support, just a click away.",
    cta: "Start Chat",
    href: "/contact",
  },
];

export const BLOG_ARTICLES = [
  exercisesArticle,
  wegovyArticle,
  hiddenReasonsArticle,
  healthyWeightLossArticle,
  mounjaroArticle,
  zepboundArticle,
  glp1Article,
  ozempicArticle,
];

export const FEATURED_SLUGS = [
  "10-research-backed-exercises-for-weight-loss-fat-burning",
  "beyond-the-hype-how-wegovy-really-impacts-weight-loss",
  "what-are-glp-1-medications-and-how-they-support-weight-loss",
];

export function getBlogArticle(slug) {
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) throw new Error(`Unknown blog slug: ${slug}`);
  return article;
}

export function getAllBlogSlugs() {
  return BLOG_ARTICLES.map((a) => a.slug);
}

export function getFeaturedArticles() {
  return FEATURED_SLUGS.map((slug) => getBlogArticle(slug));
}
