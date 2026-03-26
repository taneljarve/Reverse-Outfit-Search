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
        canvas: "#f5efe6",
        ink: "#171413",
        accent: "#bf5b38",
        moss: "#5a6c57",
        paper: "#fffaf2",
        fog: "#ddd2c3"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["'Trebuchet MS'", "sans-serif"]
      },
      boxShadow: {
        card: "0 24px 80px rgba(23, 20, 19, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
