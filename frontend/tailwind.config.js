export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#050608",
          900: "#0b0d12",
          850: "#11151d",
          800: "#171b24",
          700: "#2a303b"
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
