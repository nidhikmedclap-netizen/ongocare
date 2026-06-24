import dynamic from "next/dynamic";
import HeroSection from "@/components/sections/HeroSection";
import LoseWeightSection from "@/components/sections/LoseWeightSection";
import Header from "@/components/Header";
import Cascade from "@/components/Cascade";
import ScrollProgress from "@/components/ScrollProgress";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

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

// Not needed for initial paint — lazy
const WelcomePopup = dynamic(() => import("@/components/WelcomePopup"));

export default function HomePage() {
  return (
    <>
      <WelcomePopup />
      <ScrollProgress />
      <Header />
      <main className="flex flex-col w-full">
        {/* Hero — no animation, loads in immediately */}
        <div id="hero"><HeroSection /></div>

     <div id="lose-weight">
  <Cascade ><LoseWeightSection /></Cascade>
</div>
<div id="how-it-works">
  <Cascade from="right"><HowItWorks /></Cascade>
</div>

<div id="bmi">
  <Cascade from="left"><BMICalculator /></Cascade>
</div>


<div id="plans">
  <Cascade from="right"><CreateGLP1Plan /></Cascade>
</div>

<div id="why-us">
  <Cascade from="left"><CTAButton /></Cascade>
</div>
<div id="pricing">
  <Cascade from="right"><Pricing /></Cascade>
</div>
<div id="reviews">
  <Cascade from="left"><ProductReviews /></Cascade>
</div>

<div id="glpeducation">
  <Cascade from="right"><GLP1Education /></Cascade>
</div>

<div id="doctors">
  <Cascade from="left"><OngoSolution /></Cascade>
</div>

<div id="faq">
  <Cascade from="right"><Faq /></Cascade>
</div>

<div id="get-started">
  <Cascade from="left"><AppMobileCTA /></Cascade>
</div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
