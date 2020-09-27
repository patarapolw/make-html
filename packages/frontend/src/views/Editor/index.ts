/* eslint-disable @typescript-eslint/camelcase */
import { elDrawer, elList, filelist, id, newFile, queryMore } from '@/app'
import { MakeHtml } from '@/assets/make-html'
import { matter } from '@/assets/matter'
import { codemirrorOpts } from '@/plugins/codemirror'
import axios from 'axios'
import CodeMirror from 'codemirror'
import dayjs from 'dayjs'
import { html_beautify } from 'js-beautify'
import { defineComponent, onMounted, onUpdated, ref } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  setup () {
    let codemirror: CodeMirror.Editor | null = null

    const title = ref('')
    const isEdited = ref(false)
    const isViewer = ref(true)
    const elCm = ref(null as HTMLTextAreaElement | null)
    const elViewer = ref(null as HTMLElement | null)

    const route = useRoute()
    const newTitle = () => `Untitled (${new Date().toISOString().split('T')[0]})`

    async function loadFile () {
      const selectedId = route.query.id as string

      if (!selectedId) {
        id.value = ''
        title.value = newTitle()
        return
      }

      if (selectedId === id.value) {
        return
      }

      const { data } = await axios.get<{
        title: string;
        markdown: string;
      }>('/api/entry', {
        params: {
          id: selectedId
        }
      })

      id.value = selectedId
      title.value = data.title

      if (codemirror) {
        codemirror.setValue(data.markdown)
      }

      setTimeout(() => {
        isEdited.value = false
      }, 100)
    }

    async function saveFile () {
      const markdown = codemirror ? codemirror.getValue() : ''

      let { tag, date, ...meta } = matter.parse(markdown).data as {
        tag?: string[];
        date?: string;
      }

      tag = (() => {
        if (Array.isArray(tag) && tag.every((t) => typeof t === 'string')) {
          return tag
        }
      })()

      date = (() => {
        if (typeof date !== 'string') return
        if (/^\d+(\.\d+)?$/.test(date)) return

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
      })()

      if (tag) {
        Object.assign(meta, { tag })
      }

      if (date) {
        Object.assign(meta, { date })
      }

      const payload = {
        markdown,
        html: elViewer.value ? elViewer.value.innerHTML : '',
        media: (() => {
          const prefix = '/media/'
          const suffix = '.png'

          if (!elViewer.value) {
            return []
          }

          const imgs = [
            ...Array.from(elViewer.value.querySelectorAll('img')),
            ...Array.from(elViewer.value.querySelectorAll('*')).flatMap((el) => {
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
        })(),
        meta,
        tag,
        date
      }

      if (id.value) {
        await axios.patch('/api/entry', payload, {
          params: {
            id: id.value
          }
        })
      } else {
        const { data } = await axios.put<{
          id: string;
        }>('/api/entry', {
          title: title.value,
          ...payload
        })

        id.value = data.id

        filelist.value = [
          {
            id: id.value,
            title: title.value
          },
          ...filelist.value
        ]
      }

      isEdited.value = false
    }

    onMounted(() => {
      queryMore().then((n) => {
        if (n === 0) {
          title.value = newTitle()
        } else if (elList.value) {
          elList.value.select(0)
          loadFile()
        }
      })

      if (elCm.value) {
        codemirror = CodeMirror.fromTextArea(elCm.value, codemirrorOpts.options)
        codemirror.setSize('100%', '100%')
        codemirror.addKeyMap({
          'Cmd-S': () => {
            saveFile()
          },
          'Ctrl-S': () => {
            saveFile()
          }
        })
        codemirror.on('change', () => {
          isEdited.value = true

          if (codemirror && elViewer.value) {
            new MakeHtml(id.value || undefined)
              .render(codemirror.getValue(), elViewer.value)
          }
        })
        codemirror.on('paste', async (ins, evt) => {
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
      }
    })

    onUpdated(() => {
      loadFile()
    })

    return {
      id,
      title,
      isEdited,
      isViewer,
      elCm,
      elViewer,
      toggleDrawer () {
        if (elDrawer.value) {
          elDrawer.value.open = !elDrawer.value.open
        }
      },
      newFile,
      saveFile,
      async setTitle () {
        if (!id.value) {
          return
        }

        const focusedItem = filelist.value.find((el) => el.id === id.value)
        const i = focusedItem ? filelist.value.indexOf(focusedItem) : -1

        await axios.patch('/api/entry/title', {
          title: title.value
        }, {
          params: {
            id: id.value
          }
        })

        if (focusedItem) {
          focusedItem.title = title.value

          if (i !== -1) {
            filelist.value = [
              ...filelist.value.slice(0, i),
              focusedItem,
              ...filelist.value.slice(i + 1)
            ]
          }
        }
      }
    }
  }
})
