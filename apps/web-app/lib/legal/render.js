import LegalPage from "@/components/legal/LegalPage";
import { getLegalPage } from "./content";

export function buildLegalPage(slug) {
  const page = getLegalPage(slug);

  return {
    metadata: {
      title: page.metaTitle,
      description: page.metaDescription,
    },
    Page: function LegalRoutePage() {
      return <LegalPage page={page} />;
    },
  };
}
