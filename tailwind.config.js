/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#111827',
          soft: '#1f2937',
          accent: '#d97706',
          light: '#f59e0b'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
};
