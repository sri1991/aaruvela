/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00796B', // Teal/Green from image
          dark: '#004D40',
          light: '#4DB6AC',
        },
        secondary: {
          DEFAULT: '#0288D1', // Blue/Cyan from navbar
          dark: '#01579B',
          light: '#4FC3F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
