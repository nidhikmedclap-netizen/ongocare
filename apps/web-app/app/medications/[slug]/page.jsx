import { notFound } from "next/navigation";
import MedicationPage from "@/components/medications/MedicationPage";
import { getMedication, getMedicationSlugs } from "@/lib/medications/content";

export function generateStaticParams() {
  return getMedicationSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const med = getMedication(params.slug);
  if (!med) return {};
  return {
    title: med.seo.title,
    description: med.seo.description,
  };
}

export default function MedicationRoutePage({ params }) {
  const med = getMedication(params.slug);
  if (!med || !med.live) notFound();
  return <MedicationPage med={med} />;
}
