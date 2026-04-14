/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: "#1C1412",
        leather: "#6B3A2A",
        gold: "#C49A3C",
        cream: "#FAF7F4",
        ink: "#1A1A1A",
        success: "#2D6A4F",
        danger: "#B42318",
        neutral: {
          50: "#FDFBF9",
          100: "#F4EEE9",
          200: "#F0E8E0",
          300: "#EEE4DB",
          400: "#E8DED5",
          500: "#D7CBC1",
        },
        muted: {
          100: "#8A7A72",
          200: "#7F7068",
          300: "#6A5B54",
          400: "#5A4A44",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(28, 20, 18, 0.08)",
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
};
