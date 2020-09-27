/* eslint-disable @typescript-eslint/camelcase */
import { MakeHtml } from '@/assets/make-html'
import { matter } from '@/assets/matter'
import axios from 'axios'
import dayjs from 'dayjs'
import { html_beautify } from 'js-beautify'
import { Component, Vue } from 'vue-property-decorator'

@Component<App>({
  watch: {
    id () {
      if (this.id) {
        this.$router.push({
          query: {
            id: this.id
          }
        })
      } else {
        this.$router.push('/')
      }
    }
  },
  created () {
    this.queryMore().then(() => {
      if (!this.$route.query.id) {
        setTimeout(() => {
          if (this.filelist.length > 0) {
            this.elList.select(0)
          } else {
            this.title = this.newTitle()
          }
        }, 100)
      }
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

            ins.getDoc().replaceRange(`![clipboard](/media/${data.id}.png)`, cursor)
          } else if (item.type === 'text/plain') {
            const cursor = ins.getCursor()
            item.getAsString(async (str) => {
              if (/^https?:\/\//.test(str)) {
                const { data: m } = await axios.get<{
                  mediaId?: string;
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

    this.elList.addEventListener('scroll', () => {
      if (this.elList.offsetHeight + this.elList.scrollTop >
          this.elList.scrollHeight - 100) {
        this.queryMore()
      }
    })

    const id = this.$route.query.id as string
    if (id) {
      this.loadFile(id)
    }
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

  get codemirror () {
    return (this.$refs.cm as HTMLElement & {
      codemirror: CodeMirror.Editor;
    }).codemirror
  }

  get makeHtml () {
    return new MakeHtml(this.id || undefined)
  }

  get elList () {
    return this.$refs.list as HTMLElement & {
      select(i: number): void;
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
    const { tag, date, ...meta } = this.frontmatter
    const payload = {
      markdown: this.markdown,
      html: this.getHtml(),
      media: this.getMediaList(),
      meta,
      tag,
      date
    }

    if (this.id) {
      await axios.patch('/api/entry', payload, {
        params: {
          id: this.id
        }
      })
    } else {
      const { data } = await axios.put<{
        id: string;
      }>('/api/entry', {
        title: this.title,
        ...payload
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
