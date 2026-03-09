/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./react-ui/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./pages/**/*.{js,jsx}", "./phaser-game/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brandBg: "#080b14",
        brandCard: "#121827",
        brandYellow: "#facc15",
        brandWin: "#22c55e"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(250,204,21,.45), 0 10px 40px rgba(250,204,21,.15)"
      },
      keyframes: {
        floatSlow: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        }
      },
      animation: {
        floatSlow: "floatSlow 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};