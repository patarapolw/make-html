module.exports = {
  prefix: 'tw-',
  purge: {
    content: [
      './components/**/*.{js,jsx,ts,tsx,vue}',
      './layouts/**/*.{js,jsx,ts,tsx,vue}',
      './pages/**/*.{js,jsx,ts,tsx,vue}',
      './node_modules/@patarapolw/make-html-frontend-function/**/*.jsx',
    ],
  },
  theme: {
    extend: {},
    screens: {
      mobile: {
        max: '600px',
      },
      tablet: '601px',
      desktop: '1024px',
    },
  },
  variants: {},
  plugins: [],
}
