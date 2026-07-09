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
        ink: "#000000",
        paper: "#ffffff",
        line: "#e5e5e5",
        mute: "#6b6b6b",
        faint: "#9c9c9c",
        accent: "#B3441E",
        cream: "#FBF6E0",
        green: {
          light: "#E6F0DF",
          DEFAULT: "#4C8C4A",
          dark: "#2F5D33",
        },
        pink: {
          light: "#FBE3EC",
          DEFAULT: "#E480A0",
          dark: "#C25478",
        },
        yellow: {
          light: "#FCF1CC",
          DEFAULT: "#EFC344",
          dark: "#B98F1E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
