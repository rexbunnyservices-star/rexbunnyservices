import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import netlify from "@astrojs/netlify";

export default defineConfig({
  site: "https://rexbunnyservices.online",
  output: "static",
  adapter: netlify(),
  integrations: [preact(), tailwind(), sitemap(), mdx()],
});
