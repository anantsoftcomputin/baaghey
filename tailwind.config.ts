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
        ink: "#141414",
        paper: "#FAFAF7",
        kora: "#FFFFFF",
        line: "#E6E6E3",
        mute: "#767676",
        faint: "#A3A3A3",
        accent: "#B3441E",
        cream: "#EFEFEC",
        green: {
          light: "#EEF2E6",
          DEFAULT: "#4E6A31",
          dark: "#3A5024",
        },
        pink: {
          light: "#FCE7E7",
          DEFAULT: "#F4898B",
          dark: "#D45F66",
        },
        yellow: {
          light: "#FBF6DC",
          DEFAULT: "#F2E46B",
          dark: "#A8901A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        deva: ["var(--font-deva)", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.16em",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
