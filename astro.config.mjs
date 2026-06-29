import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://rexbunnyservices.online",
  output: "static",
  integrations: [preact(), tailwind(), sitemap(), mdx()],
});
