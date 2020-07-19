// @ts-check
import { MakeHtml } from '@patarapolw/make-html-frontend-fn'
import CodeMirror from 'codemirror'
// @ts-ignore
import example from './example.md'

import '@patarapolw/make-html-x-card'
import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/mode/python/python.js'
import 'codemirror/mode/yaml-frontmatter/yaml-frontmatter.js'
import 'codemirror/mode/pug/pug.js'
import 'codemirror/mode/css/css.js'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/clike/clike.js'
import 'codemirror/mode/php/php.js'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/mode/htmlmixed/htmlmixed.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/comment/comment.js'
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/brace-fold.js'
import 'codemirror/addon/fold/indent-fold.js'
import 'codemirror/addon/fold/comment-fold.js'
import 'codemirror/addon/fold/markdown-fold.js'

import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/theme/monokai.css'

/**
 * @type {HTMLTextAreaElement}
 */
// @ts-ignore
const editorEl = document.getElementById('editor')
const outputEl = document.getElementById('output')
const makeHtml = new MakeHtml()
const urlMetadata = new Map()

const cm = CodeMirror.fromTextArea(editorEl, {
  mode: {
    name: 'yaml-frontmatter',
    base: 'markdown',
  },
  theme: 'monokai',
  lineNumbers: true,
  autoCloseBrackets: true,
  gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
  lineWrapping: true,
  tabSize: 2,
  extraKeys: {
    'Cmd-/': 'toggleComment',
    'Ctrl-/': 'toggleComment',
    Tab: (cm) => {
      const spaces = Array(cm.getOption('indentUnit') + 1).join(' ')
      cm.getDoc().replaceSelection(spaces)
    },
  },
  foldGutter: true,
})
cm.setSize('100%', '100%')

cm.on('change', () => {
  outputEl.innerHTML = makeHtml.render(cm.getValue(), true)
})

// cm.addKeyMap({
//   'Cmd-S': () => {
//     doSave()
//   },
//   'Ctrl-S': () => {
//     doSave()
//   },
// })

// cm.on('cursorActivity', (instance) => {
//   cursor = instance.getCursor().line
// })

cm.on('paste', async (ins, evt) => {
  const { items } = evt.clipboardData || {}
  if (items) {
    /**
     * Don't await, but allow premature return
     */
    Object.entries(items).map(async ([k, item]) => {
      const cursor = ins.getCursor()

      // if (process.env.NODE_ENV === 'development') {
      //   if (item.kind === 'file') {
      //     evt.preventDefault()
      //     const blob = item.getAsFile()
      //     const formData = new FormData()
      //     formData.append('file', blob)
      //     const { filename, url } = await fetch(
      //       '/api/upload',
      //       {
      //         method: 'POST',
      //         body: formData
      //       }
      //     ).then((r) => r.json())
      //     ins.getDoc().replaceRange(`![${filename}](${url})`, cursor)
      //     return
      //   }
      // }

      item.getAsString(async (str) => {
        if (/^https?:\/\/[^ ]+$/.test(str)) {
          evt.preventDefault()
          const xCardEl = document.createElement('x-card')
          /**
           * @type {HTMLAnchorElement}
           */
          const aEl = Object.assign(document.createElement('a'), {
            href: str,
            target: '_blank',
            rel: 'noopener noreferrer',
            innerText: str
          })
          xCardEl.appendChild(aEl)

          const unloadedXCardElLength = xCardEl.outerHTML.length

          ins.getDoc().replaceRange(xCardEl.outerHTML, cursor, {
            line: cursor.line,
            ch: cursor.ch + str.length,
          })
          const href = str
          if (href) {
            if (!urlMetadata.has(href)) {
              urlMetadata.set(href, {})
              const metadata = await fetch(`/.netlify/functions/metadata?href=${encodeURIComponent(href)}`, {
                method: 'POST'
              }).then((r) => r.json())
              urlMetadata.set(href, metadata)
            }

            const meta = urlMetadata.get(href)
            aEl.setAttribute('data-image', meta.image)
            aEl.setAttribute('data-title', meta.title)
            aEl.setAttribute('data-description', meta.description)

            ins.getDoc().replaceRange(
              xCardEl.outerHTML,
              cursor,
              {
                line: cursor.line,
                ch: cursor.ch + unloadedXCardElLength,
              }
            )
          }
        }
      })
    })
  }
})

cm.setValue(example)
