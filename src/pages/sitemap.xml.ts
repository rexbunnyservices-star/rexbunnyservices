import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const site = "https://rexbunnyservices.online";

const staticPages = [
  { url: "/", priority: 1.0, changefreq: "weekly" },
  { url: "/services/web-development", priority: 0.9, changefreq: "monthly" },
  { url: "/services/seo", priority: 0.9, changefreq: "monthly" },
  { url: "/services/ai-search-optimization", priority: 0.9, changefreq: "monthly" },
  { url: "/lead-engine", priority: 0.8, changefreq: "weekly" },
  { url: "/portfolio", priority: 0.7, changefreq: "monthly" },
  { url: "/about", priority: 0.6, changefreq: "monthly" },
  { url: "/contact", priority: 0.6, changefreq: "monthly" },
  { url: "/blog", priority: 0.7, changefreq: "weekly" },
  { url: "/privacy", priority: 0.3, changefreq: "yearly" },
  { url: "/terms", priority: 0.3, changefreq: "yearly" },
];

export const GET: APIRoute = async () => {
  const blogPosts = await getCollection("blog");
  const portfolioProjects = await getCollection("portfolio");

  const dynamicPages = [
    ...blogPosts.map((post) => ({
      url: `/blog/${post.id}`,
      priority: 0.6,
      changefreq: "monthly",
    })),
    ...portfolioProjects.map((project) => ({
      url: `/portfolio/${project.id}`,
      priority: 0.6,
      changefreq: "monthly",
    })),
  ];

  const allPages = [...staticPages, ...dynamicPages];

  const urls = allPages
    .map(
      (page) => `
  <url>
    <loc>${site}${page.url}</loc>
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
