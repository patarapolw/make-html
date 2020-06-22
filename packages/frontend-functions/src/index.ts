import { hljsRegisterVue } from '@patarapolw/highlightjs-vue'
import imsize from '@patarapolw/markdown-it-imsize'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import HyperPug from 'hyperpug'
import MarkdownIt from 'markdown-it'
import mdContainer from 'markdown-it-container'
import emoji from 'markdown-it-emoji'
import externalLinks from 'markdown-it-external-links'
import { unescapeAll } from 'markdown-it/lib/common/utils'
import stylis from 'stylis'

import { compileCardComponent } from './components/card'

export class MakeHtml {
  md: MarkdownIt
  hp: HyperPug

  html = ''

  constructor(public id = Math.random().toString(36).substr(2)) {
    hljsRegisterVue(hljs)

    this.id = 'el-' + this.id
    this.md = MarkdownIt({
      breaks: true,
      html: true,
    })
      .use((md) => {
        const { fence } = md.renderer.rules

        md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
          const token = tokens[idx]
          const info = token.info ? unescapeAll(token.info).trim() : ''
          const content = token.content

          if (info === 'pug parsed') {
            return this._pugConvert(content)
          }

          return fence!(tokens, idx, options, env, slf)
        }
        return md
      })
      .use(emoji)
      .use(imsize)
      .use(externalLinks, {
        externalTarget: '_blank',
        externalRel: 'noopener nofollow noreferrer',
      })
      .use(mdContainer, 'spoiler', {
        validate: (params: string) => {
          return params.trim().match(/^spoiler(?:\s+(.*))?$/)
        },
        render: (tokens: any[], idx: number) => {
          const m = tokens[idx].info.trim().match(/^spoiler(?:\s+(.*))?$/)

          if (tokens[idx].nesting === 1) {
            // opening tag
            return (
              '<details><summary>' +
              this.md.utils.escapeHtml(m[1] || 'Spoiler') +
              '</summary>\n'
            )
          } else {
            // closing tag
            return '</details>\n'
          }
        },
      })

    this.hp = new HyperPug({
      markdown: (s: string) => this._mdConvert(s),
    })
  }

  render(s: string, safe?: boolean) {
    try {
      if (s.startsWith('---\n')) {
        s = s.substr(4).split(/---\n(.*)$/s)[1] || ''
      }

      this.html = this._mdConvert(s)
    } catch (e) {}

    const body = document.createElement('body')
    if (safe) {
      body.innerHTML = DOMPurify.sanitize(this.html, {
        ADD_TAGS: ['style'],
      })
    } else {
      body.innerHTML = this.html
    }

    body.querySelectorAll('style').forEach((el) => {
      el.innerHTML = stylis(`.${this.id}`, el.innerHTML)
    })

    body.querySelectorAll('iframe').forEach((el) => {
      const w = el.width
      const h = el.height

      el.style.width = w ? `${w}px` : ''
      el.style.height = h ? `${h}px` : ''
    })

    body.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightBlock(el as HTMLElement)
    })

    body.querySelectorAll('img, iframe').forEach((el) => {
      el.setAttribute('loading', 'lazy')
    })

    body.querySelectorAll('a[data-make-html="card"]').forEach((el) => {
      compileCardComponent(el as HTMLAnchorElement)
    })

    return `<div class="${this.id}">${body.innerHTML}</div>`
  }

  private _pugConvert(s: string) {
    return this.hp.parse(s)
  }

  private _mdConvert(s: string) {
    return this.md.render(s)
  }
}
