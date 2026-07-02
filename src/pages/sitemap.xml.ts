import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const site = "https://rexbunnyservices.online";
const today = new Date().toISOString().split("T")[0];

const staticPages = [
  { url: "/", priority: 1.0, changefreq: "weekly", lastmod: today },
  { url: "/services/web-development", priority: 0.9, changefreq: "monthly", lastmod: today },
  { url: "/services/seo", priority: 0.9, changefreq: "monthly", lastmod: today },
  { url: "/services/ai-search-optimization", priority: 0.9, changefreq: "monthly", lastmod: today },
  { url: "/services/aeo", priority: 0.9, changefreq: "monthly", lastmod: today },
  { url: "/pricing", priority: 0.8, changefreq: "monthly", lastmod: today },
  { url: "/lead-engine", priority: 0.8, changefreq: "weekly", lastmod: today },
  { url: "/portfolio", priority: 0.7, changefreq: "monthly", lastmod: today },
  { url: "/about", priority: 0.6, changefreq: "monthly", lastmod: today },
  { url: "/contact", priority: 0.6, changefreq: "monthly", lastmod: today },
  { url: "/blog", priority: 0.7, changefreq: "weekly", lastmod: today },
  { url: "/geo-checklist", priority: 0.7, changefreq: "monthly", lastmod: today },
  { url: "/ai-search-statistics", priority: 0.8, changefreq: "monthly", lastmod: today },
  { url: "/privacy", priority: 0.3, changefreq: "yearly", lastmod: today },
  { url: "/terms", priority: 0.3, changefreq: "yearly", lastmod: today },
];

export const GET: APIRoute = async () => {
  const blogPosts = await getCollection("blog");
  const portfolioProjects = await getCollection("portfolio");

  const dynamicPages = [
    ...blogPosts.map((post) => ({
      url: `/blog/${post.id}`,
      priority: 0.6,
      changefreq: "monthly",
      lastmod: post.data.pubDate.toISOString().split("T")[0],
    })),
    ...portfolioProjects.map((project) => ({
      url: `/portfolio/${project.id}`,
      priority: 0.6,
      changefreq: "monthly",
      lastmod: today,
    })),
  ];

  const allPages = [...staticPages, ...dynamicPages];

  const urls = allPages
    .map(
      (page) => `
  <url>
    <loc>${site}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
};
