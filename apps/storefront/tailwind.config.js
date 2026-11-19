module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}",
    "../../node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        "8xl": "100rem",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
      },
      keyframes: {
        "accordion-open": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-close": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        // Home page pond: the aerator rides the water, bubbles rise, waves drift.
        "pond-bob": {
          "0%, 100%": { transform: "translateY(0) rotate(-0.6deg)" },
          "50%": { transform: "translateY(-10px) rotate(0.6deg)" },
        },
        "pond-bubble": {
          "0%": { transform: "translateY(0) scale(0.6)", opacity: 0 },
          "15%": { opacity: 0.8 },
          "100%": { transform: "translateY(-320px) scale(1.1)", opacity: 0 },
        },
        "pond-wave": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pond-ripple": {
          "0%": { transform: "translateX(-50%) scale(0.7)", opacity: 0.7 },
          "100%": { transform: "translateX(-50%) scale(1.25)", opacity: 0 },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "night-glow": {
          "0%, 100%": { opacity: 0.55 },
          "50%": { opacity: 0.9 },
        },
      },
      animation: {
        "accordion-open": "accordion-open 0.3s ease-out",
        "accordion-close": "accordion-close 0.3s ease-out",
        "pond-bob": "pond-bob 5s ease-in-out infinite",
        "pond-bubble": "pond-bubble 8s ease-in infinite",
        "pond-wave": "pond-wave 12s linear infinite",
        "pond-ripple": "pond-ripple 3.2s ease-out infinite",
        marquee: "marquee 45s linear infinite",
        "night-glow": "night-glow 5s ease-in-out infinite",
      },
    },
  },
}
