/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LinkForty teal, as in the dashboard: primary buttons, selected
        // options, links and focus rings.
        brand: {
          DEFAULT: '#26adae',
          dark: '#145757',
          light: '#92d5d6',
        },
      },
    },
  },
  plugins: [],
}
