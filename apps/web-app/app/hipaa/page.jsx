import HipaaPage from "@/components/hipaa/HipaaPage";
import { HIPAA_META } from "@/lib/hipaa/content";

export const metadata = {
  title: HIPAA_META.metaTitle,
  description: HIPAA_META.metaDescription,
};

export default function Page() {
  return <HipaaPage />;
}
