/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "variable-collection-color": "var(--variable-collection-color)",
        "variable-collection-warm-apricot":
          "var(--variable-collection-warm-apricot)",
      },
    },
  },
  plugins: [],
};
