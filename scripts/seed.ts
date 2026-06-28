import PocketBase from "pocketbase";

const PB_URL = process.env.POCKETBASE_URL || "http://localhost:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "admin@rexbunnyservices.com";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || "changeme";

async function seed() {
  const pb = new PocketBase(PB_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  } catch {
    console.log("Creating admin user...");
    await pb.admins.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      passwordConfirm: ADMIN_PASSWORD,
    });
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  }

  // Seed services
  const services = [
    {
      title: "Web Engineering",
      slug: "web-development",
      tagline: "Lighthouse 95+ guaranteed. Sub-second load times. LLM-optimized.",
      description: "High-performance websites built with Astro, edge-deployed, and engineered for AI crawlers.",
      icon: "🚀",
      order: 1,
      features: JSON.stringify(["Lighthouse 95+", "Sub-second LCP", "Edge deployment", "LLM-crawlable HTML"]),
      faqs: JSON.stringify([]),
      metaTitle: "Next-Gen Web Development",
      metaDescription: "High-performance websites engineered for Lighthouse 95+ and AI search crawlability.",
    },
    {
      title: "Technical & Local SEO",
      slug: "seo",
      tagline: "Programmatic local SEO at scale. 500+ city pages. Automated.",
      description: "Scalable local SEO infrastructure with automated city-page generation and entity optimization.",
      icon: "🔍",
      order: 2,
      features: JSON.stringify(["Programmatic city pages", "Local schema generation", "GSC integration", "Rank tracking"]),
      faqs: JSON.stringify([]),
      metaTitle: "Technical & Local SEO Services",
      metaDescription: "Programmatic local SEO infrastructure at scale for multi-location businesses.",
    },
    {
      title: "AI Search Optimization (GEO)",
      slug: "ai-search-optimization",
      tagline: "Engineer your brand into ChatGPT, Gemini, Perplexity, and Copilot.",
      description: "Generative Engine Optimization — entity engineering, LLM citation optimization, and AI crawl strategy.",
      icon: "🤖",
      order: 3,
      features: JSON.stringify(["Entity optimization", "LLM citation engineering", "AI crawl optimization", "Source score boosting"]),
      faqs: JSON.stringify([]),
      metaTitle: "AI Search Optimization (GEO)",
      metaDescription: "Generative Engine Optimization — get your brand cited in ChatGPT, Gemini, Perplexity, and Copilot.",
    },
  ];

  for (const service of services) {
    try {
      await pb.collection("services").create(service);
      console.log(`Created service: ${service.title}`);
    } catch (err) {
      console.log(`Service ${service.title} may already exist:`, err);
    }
  }

  // Seed settings
  const settings = [
    {
      key: "site_name",
      value: JSON.stringify("REX Bunny Services"),
    },
    {
      key: "social_links",
      value: JSON.stringify({
        linkedin: "https://linkedin.com/company/rexbunnyservices",
        twitter: "https://twitter.com/rexbunnyservices",
      }),
    },
    {
      key: "geo_areas",
      value: JSON.stringify(["United States", "Canada", "United Kingdom"]),
    },
  ];

  for (const setting of settings) {
    try {
      await pb.collection("settings").create(setting);
      console.log(`Created setting: ${setting.key}`);
    } catch (err) {
      console.log(`Setting ${setting.key} may already exist:`, err);
    }
  }

  console.log("✅ Seed complete!");
}

seed().catch(console.error);
