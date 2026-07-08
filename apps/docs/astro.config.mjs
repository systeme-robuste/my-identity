import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [
    starlight({
      title: "My Identity",
      description: "Documentation de My Identity — la plateforme no-code professionnelle.",
      defaultLocale: "fr",
      locales: {
        fr: { label: "Français", lang: "fr" },
        en: { label: "English", lang: "en" },
      },
      sidebar: [
        { label: "Démarrage", slug: "getting-started" },
        { label: "Architecture", slug: "architecture" },
        { label: "API", slug: "api" },
        { label: "Déploiement", slug: "deployment" },
      ],
    }),
    tailwind(),
  ],
});
