---
title: Awesome title
date: Invalid date
tag:
  - polv
  - demo
isCool: true
numbers:
  - a-list: 1
---

## Extended syntaxes

These are options of [Markdown-it](https://github.com/markdown-it/markdown-it), which I have enabled.

- [emoji](https://github.com/markdown-it/markdown-it-emoji)

:smile: :100:

- Table

| h1    |    h2   |      h3 |
|:------|:-------:|--------:|
| 100   | [a][1]  | ![b][2] |
| *foo* | **bar** | ~~baz~~ |

<!-- excerpt -->

## Custom syntaxes

These are supported, unlike <https://github.com/patarapolw/showdown-extra/tree/master/example.md> (Please view on GitHub to see differences.)

CSS is supported, but is scoped to prevent leakage.

```html
<style>
h2 {
  color: red;
}
</style>
```

<style>
h2 {
  color: red;
}
</style>

JavaScript is totally allowed, as well as HTML. (But, I purified if for GitHub Pages.)

```html
<script>
alert('hello')
</script>
```

## Spoiler

The question still remains, how do I add **spoiler**?

I prepared that in advance, with [markdown-it-container](https://github.com/markdown-it/markdown-it-container), so that syntax highlighting still remains.

::: spoiler
Something else

```yaml
title: Awesome front matter
isCool: true
numbers:
  - a-list: 1
```

:::

You can also do it the [HyperPug](https://github.com/patarapolw/hyperpug) way, but there won't be syntax highlighting.

```pug parsed
details
  summary Aforementioned matter
  :markdown
    Something else

    ```yaml
    title: Awesome front matter
    isCool: true
    numbers:
      - a-list: 1
    ```
```

## HyperPug / Pug.js

It is proved that HyperPug / [Pug](https://pugjs.org/api/getting-started.html), being a indentation-based syntax, [mixes well with Markdown](https://dev.to/patarapolw/pug-with-markdown-is-magic-yet-underrated-4dla). The above spoiler is indeed an example.
