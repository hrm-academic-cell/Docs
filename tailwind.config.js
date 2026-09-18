/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a1128',
          900: '#0f1a3c',
          800: '#142452',
          700: '#1c3170',
          600: '#26418f',
        },
        gold: {
          400: '#e8c874',
          500: '#d4af37',
          600: '#b8942c',
        },
      },
      fontFamily: {
        thai: ['"Prompt"', '"Sarabun"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
