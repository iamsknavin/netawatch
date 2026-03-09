import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "#111118",
        "surface-2": "#1a1a24",
        accent: "#e8c547",
        "accent-dim": "#b8982e",
        danger: "#e53e3e",
        "danger-dim": "#9b2c2c",
        warning: "#ed8936",
        safe: "#38a169",
        "safe-dim": "#276749",
        border: "#2a2a3a",
        text: {
          primary: "#f0ede6",
          secondary: "#8a8a9a",
          muted: "#555566",
        },
      },
      fontFamily: {
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
        sans: ["var(--font-ibm-plex-sans)", "sans-serif"],
      },
      fontSize: {
        "2xs": "0.65rem",
      },
    },
  },
  plugins: [],
};

export default config;
