import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080B16",
        night: "#11162A",
        aura: "#6D4BD0",
        gold: "#D8A850",
        jade: "#5FC9A4",
        rose: "#C57A9B"
      },
      boxShadow: {
        glow: "0 0 42px rgba(109, 75, 208, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
