/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cod: {
          orange: '#FF6B00',
          black: '#0A0A0A',
          gray: '#1A1A1A',
          green: '#00FF41',
          blue: '#00D4FF',
        }
      },
      fontFamily: {
        'cod': ['Rajdhani', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}