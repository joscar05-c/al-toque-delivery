/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Color principal de la marca (ajústalo a tu identidad)
        primary: {
          DEFAULT: '#208AEF',
          dark: '#1565C0',
        },
      },
    },
  },
  plugins: [],
};
