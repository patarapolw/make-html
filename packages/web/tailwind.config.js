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
  },
  variants: {},
  plugins: [],
}
