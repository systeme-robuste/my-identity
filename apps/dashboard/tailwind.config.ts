import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "mi-bg": "var(--mi-bg)",
        "mi-fg": "var(--mi-fg)",
        "mi-primary": "var(--mi-primary)",
        "mi-accent": "var(--mi-accent)",
        "mi-muted": "var(--mi-muted)",
      },
      borderRadius: {
        mi: "var(--mi-radius)",
      },
    },
  },
  plugins: [],
} satisfies Config;
