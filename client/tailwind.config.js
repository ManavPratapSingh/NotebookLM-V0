/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        glass: "rgba(255, 255, 255, 0.08)",
        "glass-border": "rgba(255, 255, 255, 0.15)",
      },
    },
  },
  plugins: [],
}
