const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily : {
      'sans':['-apple-system', 'BlinkMacSystemFont'],
      'serif':['Georgia', 'Times New Roman','ui-serif']
    },
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
