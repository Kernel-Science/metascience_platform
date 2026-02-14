const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cormorant Garamond", "Garamond", "Times New Roman", "serif"],
        mono: ["Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      defaultTheme: "light",
      themes: {
        light: {
          extend: "light",
          layout: {
            radius: {
              small: "0.45rem",
              medium: "0.9rem",
              large: "1.4rem",
            },
          },
          colors: {
            background: "#FCFCF7",
            foreground: "#1D1D1B",
            focus: "#E4D344",
            primary: {
              50: "#FBF9E8",
              100: "#F8F1C2",
              200: "#F3E99F",
              300: "#EEDF7B",
              400: "#E9D95F",
              500: "#E4D344",
              600: "#C9B936",
              700: "#A3982B",
              800: "#7D7422",
              900: "#575018",
              DEFAULT: "#E4D344",
              foreground: "#1D1D1B",
            },
            secondary: {
              DEFAULT: "#1D1D1B",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          extend: "dark",
          colors: {
            focus: "#E4D344",
            primary: {
              500: "#E4D344",
              DEFAULT: "#E4D344",
              foreground: "#1D1D1B",
            },
            secondary: {
              DEFAULT: "#F2EFE0",
              foreground: "#1D1D1B",
            },
          },
        },
      },
    }),
  ],
};

module.exports = config;
