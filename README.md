# make-html

My wanted Markdown features

- [Markdown-it](https://github.com/markdown-it/markdown-it) extended with [HyperPug](https://github.com/patarapolw/hyperpug)
- CSS is allowed (inside `<style></style>` tags, [scoped-by-default via scope-css](https://www.npmjs.com/package/scope-css))
- [Emoji](https://github.com/markdown-it/markdown-it-emoji), [Image resize](https://github.com/tatsy/markdown-it-imsize), and more

Also, the editor will auto-create images and [x-card](/packages/x-card/index.js) on clipboard paste (i.e. Ctrl+V).

To use `x-card` webcomponent, simply include

```html
<script src="https://unpkg.com/@patarapolw/make-html-x-card"></script>
```

To support old browsers, you might also need [@webcomponents/webcomponentsjs](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs)

```html
<script src="https://unpkg.com/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
<script type="module" src="https://unpkg.com/@patarapolw/make-html-x-card"></script>
```
