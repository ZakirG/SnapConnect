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
        'neuro-bg': '#f0f0f3',
        'neuro-bg-secondary': '#e6e6e9',
        'neuro-shadow-light': 'rgba(255, 255, 255, 0.7)',
        'neuro-shadow-dark': 'rgba(0, 0, 0, 0.1)',
      },
      boxShadow: {
        'neuro-outset': '4px 4px 8px rgba(0, 0, 0, 0.1), -2px -2px 6px rgba(255, 255, 255, 0.8)',
        'neuro-inset': 'inset 2px 2px 4px rgba(0, 0, 0, 0.15), inset -2px -2px 4px rgba(255, 255, 255, 0.8)',
      },
    },
  },
  plugins: [],
}; 