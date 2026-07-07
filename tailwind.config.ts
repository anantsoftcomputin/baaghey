import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neem: "#4E6A31",
        mehendi: "#24351d",
        kesar: "#FEEC6D",
        gulal: "#F4898B",
        sindoor: "#9f302c",
        indigo: "#203a63",
        ivory: "#fff7e6",
        brass: "#b9883d",
        ink: "#000000",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        textile: "0 30px 90px rgba(34, 56, 35, 0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
