const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: colors.stone,
        blue: colors.indigo,
      },
      maxWidth: {
        '1/3':'33%',
        '60':'60%',
        '40':'40%'
      },
      gridTemplateColumns: {
        'autoTile':'repeat(auto-fit, minmax(14rem,20rem))'
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
