/* eslint-disable @typescript-eslint/camelcase */
import { MakeHtml } from '@/assets/make-html'
import axios from 'axios'
import { html_beautify } from 'js-beautify'
import { getMetadata } from 'page-metadata-parser'
import { Component, Vue } from 'vue-property-decorator'

@Component<App>({
  created () {
    this.queryMore().then(() => {
      setTimeout(() => {
        if (this.filelist.length > 0) {
          this.elList.select(0)
        } else {
          this.title = this.newTitle()
        }
      }, 100)
    })
  },
  mounted () {
    this.codemirror.setSize('100%', '100%')
    this.codemirror.addKeyMap({
      'Cmd-S': () => {
        this.saveFile()
      },
      'Ctrl-S': () => {
        this.saveFile()
      }
    })
    this.codemirror.on('change', (cm) => {
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
              id: string;
            }>('/api/media/upload', formData)

            ins.getDoc().replaceRange(`![${data.id}](/media/${data.id}.png)`, cursor)
          } else if (item.type === 'text/plain') {
            const cursor = ins.getCursor()
            item.getAsString(async (str) => {
              if (/^https?:\/\//.test(str)) {
                const doc = document.createElement('div')
                doc.innerHTML = (await axios.get('/api/scrape', {
                  params: {
                    url: str
                  }
                })).data

                const m = getMetadata(doc, str)

                const el = document.createElement('x-card')
                const aEl = document.createElement('a')
                el.appendChild(aEl)

                Object.assign(aEl, {
                  href: m.url,
                  textContent: `\n${m.title || m.url}\n`,
                  target: '_blank',
                  rel: 'noreferrer noopener'
                })

                if (m.image) {
                  aEl.setAttribute('data-image', m.image)
                }

                if (m.title) {
                  aEl.setAttribute('data-title', m.title)
                }

                if (m.description) {
                  aEl.setAttribute('data-description', m.description)
                }

                ins.getDoc().replaceRange(
                  html_beautify(el.outerHTML, {
                    indent_size: 2,
                    wrap_line_length: 1
                  }),
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

    this.elList.addEventListener('scroll', () => {
      if (this.elList.offsetHeight + this.elList.scrollTop >
          this.elList.scrollHeight - 100) {
        this.queryMore()
      }
    })
  }
})
export default class App extends Vue {
  isEditor = true
  isViewer = true

  q = ''

  _markdown = ''
  isEdited = false

  filelist: {
    id: string;
    title: string;
  }[] = []

  id = ''
  title = ''

  totalFileCount = 0

  get markdown () {
    return this._markdown
  }

  set markdown (s: string) {
    this.codemirror.setValue(s)
  }

  get codemirror () {
    return (this.$refs.cm as unknown as {
      codemirror: CodeMirror.Editor;
    }).codemirror
  }

  get makeHtml () {
    return new MakeHtml(this.id || undefined)
  }

  get elList () {
    return this.$refs.list as HTMLElement & {
      select(i: number): void;
      focusItemAtIndex(i: number): void;
    }
  }

  get elViewer () {
    return this.$refs.viewer as HTMLElement
  }

  getFocusedItem () {
    if (!this.id) {
      return null
    }

    return this.filelist.find((el) => el.id === this.id) || null
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

  newTitle () {
    return `Untitled (${new Date().toISOString().split('T')[0]})`
  }

  getHtml () {
    return this.elViewer.innerHTML
  }

  toggle () {
    this.isViewer = !this.isViewer
  }

  setTitle () {
    const current = this.getFocusedItem()

    if (current) {
      current.title = this.title
      const i = this.filelist.indexOf(current)

      if (i !== -1) {
        this.filelist = [
          ...this.filelist.slice(0, i),
          current,
          ...this.filelist.slice(i + 1)
        ]
      }

      axios.patch('/api/entry/title', {
        title: this.title
      }, {
        params: {
          id: this.id
        }
      })
    }
  }

  async queryMore () {
    const { data } = await axios.get<{
      result: {
        id: string;
        title: string;
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
    this.elList.select(-1)

    setTimeout(() => {
      this.id = ''
      this.title = this.newTitle()
      this.markdown = ''

      setTimeout(() => {
        this.isEdited = false
      }, 100)
    }, 100)
  }

  async loadFile (id: string) {
    if (id === this.id) {
      return
    }

    const { data } = await axios.get<{
      title: string;
      markdown: string;
    }>('/api/entry', {
      params: {
        id
      }
    })

    this.id = id
    this.title = data.title
    this.markdown = data.markdown

    setTimeout(() => {
      this.isEdited = false
    }, 100)
  }

  async saveFile () {
    if (this.id) {
      await axios.patch('/api/entry', {
        markdown: this.markdown,
        html: this.getHtml(),
        media: this.getMediaList()
      }, {
        params: {
          id: this.id
        }
      })
    } else {
      const { data } = await axios.put<{
        id: string;
      }>('/api/entry', {
        title: this.title,
        markdown: this.markdown,
        html: this.getHtml(),
        media: this.getMediaList()
      })

      this.id = data.id

      this.filelist = [
        {
          id: this.id,
          title: this.title
        },
        ...this.filelist
      ]
    }

    this.isEdited = false
  }

  async deleteFile (id: string) {
    await axios.delete('/api/entry', {
      params: {
        id
      }
    })

    const focusedItem = this.getFocusedItem()
    const i = focusedItem ? this.filelist.indexOf(focusedItem) : -1

    if (i !== -1) {
      this.filelist = [
        ...this.filelist.slice(0, i),
        ...this.filelist.slice(i + 1)
      ]

      if (i >= this.filelist.length) {
        this.elList.select(0)
      } else {
        this.elList.select(i)
      }

      return
    }

    this.newFile()
  }

  async doQuery () {
    this.filelist = []
    await this.queryMore()
    setTimeout(() => {
      const focusedItem = this.getFocusedItem()
      const i = focusedItem ? this.filelist.indexOf(focusedItem) : -1

      if (i !== -1) {
        this.elList.select(i)
      }
    }, 100)
  }
}
