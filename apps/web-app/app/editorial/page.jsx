import EditorialPage from "@/components/editorial/EditorialPage";
import { EDITORIAL_META } from "@/lib/editorial/content";

export const metadata = {
  title: EDITORIAL_META.metaTitle,
  description: EDITORIAL_META.metaDescription,
};

export default function Page() {
  return <EditorialPage />;
}
