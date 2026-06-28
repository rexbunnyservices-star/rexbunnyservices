import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://rexbunnyservices.com",
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [preact(), tailwind(), sitemap(), mdx()],
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  vite: {
    ssr: {
      noExternal: ["pocketbase"],
    },
  },
});
