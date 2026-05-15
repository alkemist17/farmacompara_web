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
        // Paleta FarmaCompara
        primary: {
          50:  "#edfaf4",
          100: "#d3f2e4",
          200: "#aae4cb",
          300: "#73cfad",
          400: "#3db38b",
          500: "#1f9871",  // Verde Esmeralda principal
          600: "#157a5b",
          700: "#126249",
          800: "#124e3b",
          900: "#104131",
          950: "#07261d",
        },
        secondary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#1e3a5f",  // Azul Profundo principal
          600: "#1a3254",
          700: "#162a47",
          800: "#12223a",
          900: "#0e1a2e",
          950: "#080f1c",
        },
        accent: {
          50:  "#fff8ed",
          100: "#ffefd3",
          200: "#ffdba5",
          300: "#ffc16d",
          400: "#ff9c33",
          500: "#f97316",  // Naranja Ahorro principal
          600: "#ea6500",
          700: "#c24e03",
          800: "#9a3f0c",
          900: "#7c350d",
          950: "#431805",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0e1a2e 0%, #1e3a5f 50%, #1f9871 100%)",
        "card-gradient": "linear-gradient(180deg, rgba(31,152,113,0.05) 0%, rgba(255,255,255,0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
