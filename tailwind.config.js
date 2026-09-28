/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dusty: {
          DEFAULT: '#5B7C99',
          50: '#F4F7F9',
          100: '#EBF1F6',
          200: '#C5D6E3',
          300: '#9FBBD0',
          400: '#7AA0BE',
          500: '#5B7C99',
          600: '#46637D',
          700: '#334E68',
          800: '#233648',
          900: '#141F2B',
        },
        cream: {
          DEFAULT: '#FEF7DC',
          50: '#FFFEF7',
          100: '#FEFCEE',
          200: '#FEF7DC',
          300: '#FDF2C7',
          400: '#FCE7A2',
          border: '#EFE4B5',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
