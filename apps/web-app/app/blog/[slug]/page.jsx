import { notFound } from "next/navigation";
import BlogArticlePage from "@/components/blog/BlogArticlePage";
import { getBlogArticle, getAllBlogSlugs } from "@/lib/blog/content";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const article = getBlogArticle(params.slug);
  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      images: [{ url: article.image }],
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author.name],
    },
  };
}

export default function Page({ params }) {
  let article;
  try {
    article = getBlogArticle(params.slug);
  } catch {
    notFound();
  }
  return <BlogArticlePage article={article} />;
}
