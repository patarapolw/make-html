import { hljsRegisterVue } from '@patarapolw/highlightjs-vue'
import imsize from '@patarapolw/markdown-it-imsize'
import cheerio from 'cheerio'
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

  constructor(public id = Math.random().toString(36)) {
    hljsRegisterVue(hljs)

    this.id = 'el-' + hashFnv32a(this.id)
    this.md = MarkdownIt({
      breaks: true,
      html: true,
      highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return (
              '<pre class="hljs"><code>' +
              hljs.highlight(lang, str, true).value +
              '</code></pre>'
            )
          } catch (__) {}
        }

        return (
          '<pre class="hljs"><code>' +
          this.md.utils.escapeHtml(str) +
          '</code></pre>'
        )
      },
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

  render(s: string) {
    try {
      if (s.startsWith('---\n')) {
        s = s.substr(4).split(/---\n(.*)$/s)[1] || ''
      }

      this.html = this._mdConvert(s)
    } catch (e) {}

    const $ = cheerio.load(this.html)

    $('style').each((_, el) => {
      const $el = $(el)
      const innerHTML = $el.html()
      if (innerHTML) {
        $el.html(stylis(`.${this.id}`, innerHTML))
      } else {
        $el.remove()
      }
    })

    $('iframe').each((_, el) => {
      const $el = $(el)

      const w = $el.attr('width')
      const h = $el.attr('height')

      $el.css({
        width: w ? `${w}px` : undefined,
        height: h ? `${h}px` : undefined,
      })
    })

    $('img, iframe').each((_, el) => {
      $(el).attr('loading', 'lazy')
    })

    $('a[data-make-html="card"]').each((_, el) => {
      compileCardComponent($(el))
    })

    return `<div class="${this.id}">${$('body').html() || ''}</div>`
  }

  private _pugConvert(s: string) {
    return this.hp.parse(s)
  }

  private _mdConvert(s: string) {
    return this.md.render(s)
  }
}

/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {string}
 */
function hashFnv32a(str: string, seed?: number): string {
  /* jshint bitwise:false */
  var i
  var l
  var hval = seed === undefined ? 0x811c9dc5 : seed

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i)
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
  }

  return (hval >>> 0).toString(36)
}
