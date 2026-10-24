/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff', 100: '#dbe4ff', 200: '#bac8ff', 300: '#91a7ff',
          400: '#748ffc', 500: '#5c7cfa', 600: '#4c6ef5', 700: '#3b5bdb',
          800: '#1e3a5f', 900: '#0f1e3d',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
