export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#010203",
          900: "#05080d",
          850: "#080d14",
          800: "#0f1620",
          700: "#1d2733"
        }
      },
      boxShadow: {
        panel: "0 22px 70px rgba(0, 0, 0, 0.32)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 80px rgba(0,0,0,0.28)"
      }
    }
  },
  plugins: []
};
