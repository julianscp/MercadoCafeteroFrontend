/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        text: "#000000",
        background: {
          light: "#FFEAEA",
          DEFAULT: "#FFF5F5",
        },
        primary: {
          DEFAULT: "#B33A3A",
          light: "#E99696",
          dark: "#7A1F1F",
        },
        secondary: {
          DEFAULT: "#6B4226",
          light: "#A67C52",
          dark: "#40210D",
        },
        neutral: {
          DEFAULT: "#171717",
        },
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
