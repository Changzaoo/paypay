export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#000000",
          900: "#050608",
          850: "#0b0d10",
          800: "#12161b",
          700: "#242a32"
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
