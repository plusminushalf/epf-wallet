/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: [
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/index.html',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/popup/index.html',
    './src/popup/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
};
