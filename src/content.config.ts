import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default("RexBunny"),
    tags: z.array(z.string()).default([]),
  }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/portfolio" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    clientName: z.string(),
    serviceType: z.string(),
    description: z.string(),
    results: z.object({
      lighthouse: z.number().optional(),
      trafficIncrease: z.string().optional(),
      lcp: z.string().optional(),
      conversionLift: z.string().optional(),
    }),
    testimonial: z.string().optional(),
    testimonialAuthor: z.string().optional(),
    liveUrl: z.string().optional(),
  }),
});

export const collections = { blog, portfolio };
