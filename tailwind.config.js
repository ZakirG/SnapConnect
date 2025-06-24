/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#f0f0f3',
        'background-secondary': '#e6e6e9',
        'shadow-light': 'rgba(255, 255, 255, 0.7)',
        'shadow-dark': 'rgba(0, 0, 0, 0.1)',
        'accent-primary': '#FFFC00', // To be defined
      },
    },
  },
  plugins: [],
}; 