const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ...colors,
        gray: colors.stone,
        blue: colors.indigo,
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
