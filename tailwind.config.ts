import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 32, 0.05), 0 8px 24px rgba(15, 23, 32, 0.04)"
      },
      borderRadius: {
        lg: "14px"
      },
      transitionDuration: {
        soft: "160ms"
      }
    }
  },
  plugins: []
} satisfies Config;
