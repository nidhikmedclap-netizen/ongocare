import { formatUsDate } from "@/lib/dates/usDate";

/** Estimate reading time from word count (~220 wpm). */
export function readingTimeMinutes(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function formatPublishDate(iso) {
  return formatUsDate(iso, "");
}

export function filterArticles(articles, { category = "all" } = {}) {
  if (category === "all") return articles;
  return articles.filter((article) => article.group === category);
}
