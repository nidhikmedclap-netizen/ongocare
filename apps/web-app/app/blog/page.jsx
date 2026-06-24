import BlogPage from "@/components/blog/BlogPage";
import { BLOG_META } from "@/lib/blog/content";

export const metadata = {
  title: BLOG_META.title,
  description: BLOG_META.description,
  alternates: {
    canonical: "/blog",
  },
};

export default function Page() {
  return <BlogPage />;
}
