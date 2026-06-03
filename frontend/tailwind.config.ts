import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f5f0ff",
          100: "#ede5ff",
          200: "#dccaff",
          300: "#c4a8ff",
          400: "#a87fff",
          500: "#8234FE",
          600: "#7320e6",
          700: "#6418cc",
          800: "#5210b0",
          900: "#400d8a",
          950: "#2e0866",
        },
      },
    },
  },
  plugins: [],
};

export default config;
