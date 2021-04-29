const colors = require('tailwindcss/colors')

module.exports = {
  purge: ['layouts/**/*.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
      extend: {
          colors: {
               blue: "rgb(10, 61, 213)",
               white: "#dfeafc",
               black: "#0f0f0f",
               red: "rgb(106, 3, 100)",
               pink: colors.fuchsia,
          },
          fontFamily: {
              sans: ['Graphik', 'sans-serif'],
              serif: ['Merriweather', 'serif'],
          },
      },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
