import 'prismjs/themes/prism.css'

import imsize from '@patarapolw/markdown-it-imsize'
import axios from 'axios'
import CodeMirror from 'codemirror'
import HyperPug from 'hyperpug'
import { patch } from 'incremental-dom'
import MarkdownIt from 'markdown-it'
import mdContainer from 'markdown-it-container'
import emoji from 'markdown-it-emoji'
import externalLinks from 'markdown-it-external-links'
import { unescapeAll } from 'markdown-it/lib/common/utils'
import Prism from 'prismjs'
import scopeCss from 'scope-css'

import { makeIncremental } from './incremental'
import { matter } from './matter'

declare global {
  interface Window {
    CodeMirror: typeof import('codemirror');
    Prism: typeof import('prismjs');
  }
}

window.CodeMirror = CodeMirror
window.Prism = Prism

function getLang (
  lib: string,
  ver: string,
  parser: RegExp,
  prev = new Set<string>()
) {
  const alias: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    md: 'markdown',
    html: 'xml',
    pug: 'jade'
  }

  const lang: Record<string, string> = {}
  axios.get<{
    files: string[];
  }>(`https://api.cdnjs.com/libraries/${lib}/${ver}?fields=files`)
    .then(({ data }) => {
      data.files
        .map((f) => {
          const m = parser.exec(f)
          if (m?.groups?.lang) {
            lang[m.groups.lang] =
              `https://cdnjs.cloudflare.com/ajax/libs/${lib}/${ver}/${f}`
          }
        })
    })

  return {
    get (ln: string) {
      if (prev.has(ln)) return null

      const url = lang[ln]
      if (url) return url
      if (!alias[ln]) return null
      if (prev.has(alias[ln])) return null

      return lang[alias[ln]] || null
    }
  }
}

const prismLang = getLang(
  'prism',
  '1.21.0',
  /^components\/prism-(?<lang>\S+)\.min\.js$/
)

const cmLang = getLang(
  'codemirror',
  '5.58.1',
  /^mode\/(?<lang>\S+)\/.+\.min\.js$/,
  new Set(['yaml', 'markdown', 'pug', 'html', 'xml', 'css'])
)

export class MakeHtml {
  private md: MarkdownIt
  private hp: HyperPug

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onCmChanged = () => {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPrismChanged = () => {}

  constructor (public id = Math.random().toString(36)) {
    this.id = 'el-' + hashFnv32a(this.id)
    this.md = MarkdownIt({
      breaks: true,
      html: true
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

          let url: string | null
          url = prismLang.get(info)
          if (url && !document.querySelector(`script[src="${url}"]`)) {
            const script = document.createElement('script')
            script.src = url
            script.setAttribute('data-highlight', 'prism')
            script.onload = () => {
              this.onPrismChanged()
              script.onload = null
            }

            document.body.appendChild(script)
          }

          url = cmLang.get(info)
          if (url && !document.querySelector(`script[src="${url}"]`)) {
            const script = document.createElement('script')
            script.src = url
            script.setAttribute('data-highlight', 'codemirror')
            script.onload = () => {
              this.onCmChanged()
              script.onload = null
            }

            document.body.appendChild(script)
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fence!(tokens, idx, options, env, slf)
        }
        return md
      })
      .use(emoji)
      .use(imsize)
      .use(externalLinks, {
        externalTarget: '_blank',
        externalRel: 'noopener nofollow noreferrer'
      })
      .use(mdContainer, 'spoiler', {
        validate: (params: string) => {
          return params.trim().match(/^spoiler(?:\s+(.*))?$/)
        },
        render: (tokens: {
          info: string;
          nesting: number;
        }[], idx: number) => {
          const m = tokens[idx].info.trim().match(/^spoiler(?:\s+(.*))?$/)

          if (m && tokens[idx].nesting === 1) {
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
        }
      })

    this.hp = new HyperPug({
      markdown: (s: string) => this._mdConvert(s)
    })
  }

  render (s: string, dom: HTMLElement) {
    try {
      const body = document.createElement('div')
      body.className = this.id
      body.innerHTML = this._mdConvert(matter.split(s).content)

      body.querySelectorAll('style').forEach((el) => {
        el.innerHTML = scopeCss(el.innerHTML, `.${this.id}`)
      })

      body.querySelectorAll('img, iframe').forEach((el) => {
        el.setAttribute('loading', 'lazy')
      })

      patch(dom, makeIncremental(body.outerHTML))

      this.onPrismChanged = () => {
        Prism.highlightAllUnder(dom)
      }
      this.onPrismChanged()

      dom.querySelectorAll('x-card').forEach((el) => {
        const el0 = (el as HTMLElement & {
          onimg: (imgEl: HTMLImageElement) => void;
        })

        el0.onimg = async (el) => {
          if (el.src.startsWith('/')) {
            return
          }

          try {
            // eslint-disable-next-line no-new
            new URL(el.src)
          } catch (_) {
            return
          }

          const downloadAttr = el.getAttribute('data-download')
          if (!downloadAttr) {
            return
          }

          let attr: {
            maxWidth?: number;
          } = {}

          try {
            attr = JSON.parse(downloadAttr)
          } catch (_) {}

          const { data } = await axios.post<{
            id: string;
          }>('/api/media/cache', attr, {
            params: {
              url: el.src
            }
          })

          el.src = `/media/${data.id}.png`
        }
      })
    } catch (_) {}
  }

  private _pugConvert (s: string) {
    return this.hp.parse(s)
  }

  private _mdConvert (s: string) {
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
function hashFnv32a (str: string, seed?: number): string {
  /* jshint bitwise:false */
  let i
  let l
  let hval = seed === undefined ? 0x811c9dc5 : seed

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i)
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
  }

  return (hval >>> 0).toString(36)
}

function getIndent (s: string) {
  const indents: number[] = []
  for (const r of s.split(/\r?\n/g)) {
    if (r.trim()) {
      const m = /^ +/.exec(r)
      if (m) {
        indents.push(m[0].length)
      }
    }
  }

  return indents.length ? Math.min(...indents) : 0
}

export function stripIndent (s: string, indent = getIndent(s)) {
  return s
    .split('\n')
    .map((r) => r.replace(new RegExp(`^ {1,${indent}}`), ''))
    .join('\n')
}
