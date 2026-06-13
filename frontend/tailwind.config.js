
module.exports = {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          light: '#40916C',
          dark: '#1B4332',
        },
        secondary: {
          DEFAULT: '#8B6914',
          light: '#A67C00',
        },
        accent: {
          DEFAULT: '#D4A843',
        },
        background: {
          DEFAULT: '#FAFAF5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
