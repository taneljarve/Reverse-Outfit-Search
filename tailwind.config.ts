import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F2F0E9", // Cream
        ink: "#1A1A1A", // Charcoal
        accent: "#CC5833", // Clay
        moss: "#2E4036", // Moss
        paper: "#FAF9F5", 
        fog: "#E8E5DF"
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"], // Drama
        body: ['"Plus Jakarta Sans"', "sans-serif"], // Normal
        heading: ['"Outfit"', "sans-serif"], // Headings
        mono: ['"IBM Plex Mono"', "monospace"], // Data
      },
      boxShadow: {
        card: "0 24px 80px rgba(0, 0, 0, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
