import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import HeroSection from "@/components/sections/HeroSection";
import LoseWeightSection from "@/components/sections/LoseWeightSection";
import Header from "@/components/Header";
import Cascade from "@/components/Cascade";
import ScrollProgress from "@/components/ScrollProgress";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import {
  getOrganizationData,
  listOrganizationSlugs,
} from "@/lib/getOrganizationData";

// Below-the-fold sections — code-split, still server-rendered
const HowItWorks = dynamic(() => import("@/components/sections/HowItWorks"));
const BMICalculator = dynamic(
  () => import("@/components/sections/BMICalculator")
);
const CreateGLP1Plan = dynamic(
  () => import("@/components/sections/CreateGLP1Plan")
);
const CTAButton = dynamic(() => import("@/components/sections/CTAButton"));
const Pricing = dynamic(() => import("@/components/sections/pricing"));
const ProductReviews = dynamic(
  () => import("@/components/sections/ProductReviews")
);
const GLP1Education = dynamic(
  () => import("@/components/sections/GLP1Education")
);
const OngoSolution = dynamic(
  () => import("@/components/sections/OngoSolution")
);
const Faq = dynamic(() => import("@/components/sections/Faq"));
const AppMobileCTA = dynamic(
  () => import("@/components/sections/AppMobileCTA")
);

const WelcomePopup = dynamic(() => import("@/components/WelcomePopup"));

export function generateStaticParams() {
  return listOrganizationSlugs().map((organization) => ({ organization }));
}

export async function generateMetadata({ params }) {
  const org = await getOrganizationData(params.organization);
  if (!org) {
    return { title: "Not found" };
  }
  const seo = org.seo || {};
  return {
    title: seo.title || org.name,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title || org.name,
      description: seo.description,
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
  };
}

// Rewrites any "/weightloss-onboard" hrefs in a section content slice to the
// org-scoped onboarding URL so CTAs land users on the branded flow.
function withOrgOnboardHref(section, slug) {
  if (!section || typeof section !== "object") return section;
  if (section.ctaHref !== "/weightloss-onboard") return section;
  return { ...section, ctaHref: `/${slug}/weightloss-onboard` };
}

export default async function OrganizationPage({ params }) {
  const org = await getOrganizationData(params.organization);

  if (!org) {
    notFound();
  }

  const basePath = `/${org.slug}`;
  const rewrite = (section) => withOrgOnboardHref(section, org.slug);

  return (
    <>
      <WelcomePopup />
      <ScrollProgress />
      <Header branding={org.branding} basePath={basePath} />
      <main className="flex flex-col w-full">
        <div id="hero">
          <HeroSection content={rewrite(org.hero)} />
        </div>

        <div id="lose-weight">
          <Cascade>
            <LoseWeightSection content={rewrite(org.loseWeight)} />
          </Cascade>
        </div>
        <div id="how-it-works">
          <Cascade from="right">
            <HowItWorks content={rewrite(org.howItWorks)} />
          </Cascade>
        </div>

        <div id="bmi">
          <Cascade from="left">
            <BMICalculator content={org.bmi} />
          </Cascade>
        </div>

        <div id="plans">
          <Cascade from="right">
            <CreateGLP1Plan content={rewrite(org.plans)} />
          </Cascade>
        </div>

        <div id="why-us">
          <Cascade from="left">
            <CTAButton content={org.cta} />
          </Cascade>
        </div>
        <div id="pricing">
          <Cascade from="right">
            <Pricing content={rewrite(org.pricing)} />
          </Cascade>
        </div>
        <div id="reviews">
          <Cascade from="left">
            <ProductReviews content={org.reviews} />
          </Cascade>
        </div>

        <div id="glpeducation">
          <Cascade from="right">
            <GLP1Education content={rewrite(org.education)} />
          </Cascade>
        </div>

        <div id="doctors">
          <Cascade from="left">
            <OngoSolution content={rewrite(org.doctors)} />
          </Cascade>
        </div>

        <div id="faq">
          <Cascade from="right">
            <Faq content={org.faq} />
          </Cascade>
        </div>

        <div id="get-started">
          <Cascade from="left">
            <AppMobileCTA content={rewrite(org.appCta)} />
          </Cascade>
        </div>
      </main>
      <Footer branding={org.branding} basePath={basePath} />
      <BackToTop />
    </>
  );
}
