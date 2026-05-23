export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#070a0f",
          900: "#0c111a",
          850: "#101722",
          800: "#151d2a",
          700: "#253143"
        }
      },
      boxShadow: {
        panel: "0 18px 50px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};
