/* eslint-disable @typescript-eslint/camelcase */
import { MakeHtml } from '@/assets/make-html'
import { matter } from '@/assets/matter'
import { cmOptions } from '@/plugins/codemirror'
import axios from 'axios'
import CodeMirror from 'codemirror'
import dayjs from 'dayjs'
import { html_beautify } from 'js-beautify'
import { Component, Vue } from 'vue-property-decorator'

declare global {
  interface Window {
    codemirror: CodeMirror.Editor;
  }
}

@Component<App>({
  watch: {
    isDrawer () {
      const elList = (this.$refs.elList as Vue)?.$el as HTMLDivElement

      if (elList) {
        this.filelist = []
        this.queryMore()

        elList.addEventListener('scroll', () => {
          if (elList.offsetHeight + elList.scrollTop > elList.scrollHeight - 100) {
            this.queryMore()
          }
        })
      }
    },
    isEdited() {
      window.onbeforeunload = this.isEdited
        ? (evt: BeforeUnloadEvent) => {
          evt.returnValue = ' '
          return false
        }
        : null
    }
  },
  mounted () {
    this.codemirror = CodeMirror.fromTextArea(
      this.$refs.editor as HTMLTextAreaElement,
      cmOptions
    )
    window.codemirror = this.codemirror

    this.codemirror.setSize('100%', '100%')
    this.codemirror.addKeyMap({
      'Cmd-S': () => {
        this.saveFile()
      },
      'Ctrl-S': () => {
        this.saveFile()
      }
    })
    this.codemirror.on('change', () => {
      const cm = this.codemirror as CodeMirror.Editor

      this._markdown = cm.getValue()
      this.isEdited = true
      this.makeHtml.render(this._markdown, this.$refs.viewer as HTMLElement)
    })
    this.codemirror.on('paste', async (ins, evt) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { items } = evt.clipboardData!
      if (items) {
        for (const k of Object.keys(items)) {
          const item = items[k as unknown as number] as DataTransferItem
          if (item.kind === 'file') {
            evt.preventDefault()

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const blob = item.getAsFile()!
            const formData = new FormData()
            formData.append('file', blob)

            const cursor = ins.getCursor()

            const { data } = await axios.post<{
              url: string;
            }>('/api/media/upload', formData)

            ins.getDoc().replaceRange(`![clipboard](/media/${data.url}.png)`, cursor)
          } else if (item.type === 'text/plain') {
            const cursor = ins.getCursor()
            item.getAsString(async (str) => {
              if (/^https?:\/\//.test(str)) {
                const { data: m } = await axios.get<{
                  url: string;
                  title?: string;
                  description?: string;
                  image?: string;
                }>('/api/metadata', {
                  params: {
                    url: str
                  }
                })

                const uuid = Math.random().toString(36).substr(2)
                const el = document.createElement('x-card')
                const aEl = document.createElement('a')
                el.appendChild(aEl)

                Object.assign(aEl, {
                  href: m.url,
                  textContent: `\n${uuid}\n`,
                  target: '_blank',
                  rel: 'noreferrer noopener'
                })

                el.setAttribute('href', m.url)
                if (m.image) {
                  el.setAttribute('image', m.image)
                }
                if (m.title) {
                  el.setAttribute('title', m.title)
                }
                if (m.description) {
                  el.setAttribute('description', m.description)
                }

                ins.getDoc().replaceRange(
                  html_beautify(el.outerHTML, {
                    indent_size: 2,
                    wrap_line_length: 1
                  }).replace(uuid, m.title || m.url),
                  cursor,
                  {
                    line: cursor.line,
                    ch: cursor.ch + str.length
                  }
                )
              }
            })
          }
        }
      }
    })

    if (this.currentFilename) {
      this.loadFile(this.currentFilename, true)
    } else {
      this.queryMore().then(() => {
        const c = this.filelist[0]
        if (c) {
          this.loadFile(c.filename)
        } else {
          this.filename = this.newFilename()
        }
      })
    }
  }
})
export default class App extends Vue {
  isDrawer = false
  isViewer = true

  q = ''

  _markdown = ''
  isEdited = false

  filelist: {
    filename: string;
  }[] = []

  filename = ''

  totalFileCount = 0

  codemirror!: CodeMirror.Editor

  get currentFilename () {
    return this.$route.query.filename as string || ''
  }

  set currentFilename (f: string) {
    if (f && f !== this.currentFilename) {
      this.$router.push({ query: { filename: f } })
      return
    }

    if (!f && this.currentFilename) {
      this.$router.push('/')
    }
  }

  get markdown () {
    return this._markdown
  }

  set markdown (s: string) {
    this.codemirror.setValue(s)
  }

  get frontmatter (): {
    tag?: string[];
    date?: string;
    } {
    const { tag, date, ...m } = matter.parse(this._markdown).data as {
      tag?: string[];
      date?: string;
    }

    function validateTag (): string[] | null {
      if (Array.isArray(tag) && tag.every((t) => typeof t === 'string')) {
        return tag
      }

      return null
    }

    function validateDate (): string | null {
      if (typeof date !== 'string') return null
      if (/^\d+(\.\d+)?$/.test(date)) return null

      const dateFormat = 'YYYY-MM-DDTHH:mm:ssZ'
      // const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ'
      let d: dayjs.Dayjs

      d = dayjs(date, [
        'YYYY-MM-DD',
        'YYYY-MM-DD H:mm',
        'YYYY-MM-DD HH:mm',
        'YYYY-MM-DDTHH:mm'
      ])

      if (d.isValid()) {
        return d
          .subtract(new Date().getTimezoneOffset(), 'minute')
          .format(dateFormat)
      }

      d = dayjs(date)

      if (d.isValid()) return d.format(dateFormat)

      return null
    }

    if (validateTag()) {
      Object.assign(m, { tag })
    }

    const d = validateDate()
    if (d) {
      Object.assign(m, { date: d })
    }

    return m
  }

  get makeHtml () {
    const mk = new MakeHtml(this.currentFilename || undefined)
    mk.onCmChanged = () => {
      this.codemirror.setOption('mode', cmOptions.mode)
    }

    return mk
  }

  get elViewer () {
    return this.$refs.viewer as HTMLElement
  }

  getMediaList () {
    const prefix = '/media/'
    const suffix = '.png'

    const imgs = [
      ...Array.from(this.elViewer.querySelectorAll('img')),
      ...Array.from(this.elViewer.querySelectorAll('*')).flatMap((el) => {
        if (el.tagName.toLocaleLowerCase().startsWith('x-') && el.shadowRoot) {
          return Array.from(el.shadowRoot.querySelectorAll('img'))
        }
        return []
      })
    ]

    return imgs.map((el) => {
      if (el.src.startsWith(prefix) && el.src.endsWith(suffix)) {
        return el.src.slice(prefix.length, -suffix.length)
      }
      return ''
    }).filter((src) => src).filter((el, i, arr) => arr.indexOf(el) === i)
  }

  newFilename () {
    return dayjs()
      .subtract(new Date().getTimezoneOffset(), 'minute')
      .format('YYYY-MM-DDTHH:mmZ')
  }

  getHtml () {
    return this.elViewer.innerHTML
  }

  toggle () {
    this.isViewer = !this.isViewer
  }

  setFilename () {
    axios.patch('/api/entry/filename', {
      filename: this.filename
    }, {
      params: {
        filename: this.currentFilename
      }
    })
  }

  async queryMore () {
    const { data } = await axios.get<{
      result: {
        filename: string;
        updatedAt: string;
      }[];
      count: number;
    }>('/api/entry/q', {
      params: {
        q: this.q,
        after: this.filelist[this.filelist.length - 1]
      }
    })

    this.totalFileCount = data.count
    this.filelist = [
      ...this.filelist,
      ...data.result
    ]
  }

  newFile () {
    setTimeout(() => {
      this.currentFilename = ''
      this.filename = this.newFilename()
      this.markdown = ''

      setTimeout(() => {
        this.isEdited = false
      }, 100)
    }, 100)
  }

  async loadFile (f: string, force?: boolean) {
    if (!force && f === this.currentFilename) {
      return
    }

    const { data } = await axios.get<{
      markdown: string;
    }>('/api/entry', {
      params: {
        filename: f
      }
    })

    this.currentFilename = f
    this.markdown = data.markdown

    setTimeout(() => {
      this.isEdited = false
    }, 100)
  }

  async saveFile () {
    const { tag, date, ...meta } = this.frontmatter
    const payload = {
      markdown: this.markdown
    }

    if (this.currentFilename) {
      await axios.patch('/api/entry', payload, {
        params: {
          filename: this.currentFilename
        }
      })
    } else {
      const { data } = await axios.put<{
        filename: string;
      }>('/api/entry', {
        filename: this.filename,
        ...payload
      })

      this.filename = data.filename
      this.currentFilename = data.filename
      this.filelist = [
        {
          filename: this.filename
        },
        ...this.filelist
      ]
    }

    this.isEdited = false
  }

  async deleteFile (f: string) {
    await axios.delete('/api/entry', {
      params: {
        filename: f
      }
    })

    if (f === this.currentFilename) {
      this.newFile()
    }
  }
}
