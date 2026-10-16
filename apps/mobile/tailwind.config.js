/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta oficial - Sistema de Diseño Al Toque Delivery
        primary: {
          DEFAULT: '#F29F30',
          light: 'rgba(242, 159, 48, 0.15)',
          dark: '#D98218',
        },
        background: {
          app: '#FFFFFF',
          muted: '#F8F9FA',
          input: '#F3F4F6',
        },
        content: {
          primary: '#1C2433',
          secondary: '#8E98A8',
        },
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
};
