/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      colors: {
        brand: {
          50: '#e6f4ed',
          100: '#c9e7d6',
          200: '#9fd6b6',
          300: '#52b788',
          400: '#1f9c5c',
          500: '#008737',
          600: '#007530',
          700: '#005a24',
          800: '#003d18',
          900: '#002b11',
        },
        // Claude (Anthropic) coral / clay palette — secondary accent
        claude: {
          50: '#fdf4f0',
          100: '#fae6dd',
          200: '#f2c9b6',
          300: '#e8a588',
          400: '#dd8563',
          500: '#d97757', // signature Claude coral
          600: '#c25e3f',
          700: '#9e4a31',
          800: '#7a3a27',
          900: '#5c2c1e',
        },
        // Claude paper / cream background
        cream: '#f0eee6',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s ease-out forwards',
        slideIn: 'slideIn 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
