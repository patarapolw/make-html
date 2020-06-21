<template>
  <section
    class="tw-grid tw-w-screen tw-h-screen"
    :class="hasPreview ? 'tw-grid-cols-2' : 'tw-grid-cols-1'"
  >
    <section class="editor-column" @scroll="onScroll">
      <nav
        class="tw-pr-4 tw-flex tw-p-2 tw-bg-indigo-100 tw-items-center tw-font-sans"
      >
        <span v-if="isLoading || title">{{ title }}</span>
        <span v-else class="tw-text-red-600">{{ noTitle }}</span>

        <div class="tw-flex-grow" />

        <button
          class="button tw-bg-yellow-300 tw-text-gray-800 tw-mr-2 hover:tw-bg-yellow-500"
          @click="hasPreview = !hasPreview"
          @keypress="hasPreview = !hasPreview"
        >
          {{ hasPreview ? 'Hide' : 'Show' }} Preview
        </button>

        <button
          class="button tw-bg-red-300 tw-text-gray-800 hover:tw-bg-red-500"
          :disabled="!title || !isEdited"
          @click="save"
          @keypress="save"
        >
          Save
        </button>
      </nav>

      <client-only>
        <codemirror
          ref="codemirror"
          v-model="markdown"
          class="tw-flex-grow"
          @input="onCmCodeChange"
        />
      </client-only>
    </section>

    <section v-if="hasPreview" class="editor-column">
      <EditorPreview
        :title="title"
        :markdown="markdown"
        :scroll-size="scrollSize"
      />
    </section>
  </section>
</template>

<script lang="ts">
import {} from 'codemirror'
import dayjs from 'dayjs'
import Swal from 'sweetalert2'
import * as z from 'zod'
import { Component, Vue } from 'nuxt-property-decorator'

import { Matter } from '~/assets/util'
import EditorPreview from '~/components/EditorPreview.vue'

declare global {
  namespace CodeMirror {
    interface Editor {
      on(
        type: 'paste',
        handler: (editor: CodeMirror.Editor, evt: ClipboardEvent) => void
      ): void
    }
  }
}
@Component<Editor>({
  beforeRouteLeave(_, __, next) {
    const msg = this.canSave ? 'Please save before leaving.' : null
    if (msg) {
      Swal.fire({
        text: msg,
        icon: 'warning',
        showCancelButton: true,
        cancelButtonColor: '#d33',
      })
        .then((r) => {
          r.value ? next() : next(false)
        })
        .catch(() => next(false))
    } else {
      next()
    }
  },
  components: {
    EditorPreview,
  },
})
export default class Editor extends Vue {
  filename = ''

  markdown = ''
  hasPreview = true
  isLoading = false
  isEdited = false
  cursor = 0
  scrollSize = 0

  readonly noTitle = 'Title must not be empty'
  readonly matter = new Matter()

  get title() {
    return this.matter.header.title || ''
  }

  get type() {
    return this.matter.header.type || ''
  }

  get codemirror(): CodeMirror.Editor | null {
    return (this.$refs.codemirror as any)?.codemirror || null
  }

  get canSave() {
    return this.title && this.isEdited
  }

  created() {
    this.load()
  }

  mounted() {
    this.isEdited = false
    window.onbeforeunload = (e: any) => {
      const msg = this.canSave ? 'Please save before leaving.' : null
      if (msg) {
        e.returnValue = msg
        return msg
      }
    }

    if (this.codemirror) {
      this.codemirror.addKeyMap({
        'Cmd-S': () => {
          this.save()
        },
        'Ctrl-S': () => {
          this.save()
        },
      })
      this.codemirror.on('cursorActivity', (instance) => {
        this.cursor = instance.getCursor().line
      })
      this.codemirror.on('paste', async (ins, evt) => {
        const { items } = evt.clipboardData || ({} as any)
        if (items) {
          for (const k of Object.keys(items)) {
            const item = items[k] as DataTransferItem
            if (!process.static && item.kind === 'file') {
              evt.preventDefault()

              const blob = item.getAsFile()!
              const formData = new FormData()
              formData.append('file', blob)

              const cursor = ins.getCursor()
              const { filename, url } = await this.$axios.$post(
                '/serverMiddleware/upload',
                formData
              )

              ins.getDoc().replaceRange(`![${filename}](${url})`, cursor)
            } else if (item.type === 'text/plain') {
              // evt.preventDefault()

              const cursor = ins.getCursor()
              item.getAsString((str) => {
                if (/^https?:\/\/[^ ]+$/.test(str)) {
                  const unloadedXCard = `<a is="x-card" href="${encodeURI(
                    str
                  )}">${encodeURI(str)}</a>`

                  ins.getDoc().replaceRange(unloadedXCard, cursor, {
                    line: cursor.line,
                    ch: cursor.ch + str.length,
                  })
                }
              })
            }
          }
        }
      })
    }
  }

  beforeDestroy() {
    window.onbeforeunload = null
  }

  formatDate(d: Date) {
    return dayjs(d).format('YYYY-MM-DD HH:mm Z')
  }

  validateHeader(): boolean {
    const { header } = this.matter.parse(this.markdown)
    let valid = true
    if (header.date) {
      const d = dayjs(header.date)
      valid = d.isValid()
      if (!valid) {
        Swal.fire({
          toast: true,
          icon: 'warning',
          timer: 3000,
          text: `Invalid Date: ${header.date}`,
          position: 'top-end',
          showConfirmButton: false,
        })
        return false
      }
    }
    if (!header.title) {
      Swal.fire({
        toast: true,
        timer: 3000,
        icon: 'warning',
        text: 'Title is required',
        position: 'top-end',
        showConfirmButton: false,
      })
      return false
    }
    try {
      z.object({
        title: z.string(),
        date: z.string().optional(),
        tag: z.array(z.string()).optional(),
        image: z.string().optional(),
      }).parse(header)
      return true
    } catch (e) {
      Swal.fire({
        toast: true,
        timer: 3000,
        icon: 'warning',
        text: e.message,
        position: 'top-end',
        showConfirmButton: false,
      })
      return false
    }
  }

  async load() {
    this.isLoading = true

    const { filename } = process.env

    if (filename && !process.static) {
      const { data } = await this.$axios.$get('/serverMiddleware/post', {
        params: {
          filename,
        },
      })
      this.markdown = data
      this.filename = filename
      this.matter.parse(this.markdown)
      setTimeout(() => {
        this.isEdited = false
      }, 100)
    }

    this.isLoading = false
  }

  async save() {
    if (!this.canSave) {
      return
    }

    if (!this.validateHeader()) {
      return
    }

    if (process.static) {
      Swal.fire({
        toast: true,
        timer: 3000,
        icon: 'warning',
        text: 'Cannot save in preview mode',
        position: 'top-end',
        showConfirmButton: false,
      })
    } else {
      const { filename, markdown } = await this.$axios.$put(
        '/serverMiddleware/post',
        {
          data: this.markdown,
          filename: this.filename,
        }
      )

      if (this.codemirror) {
        this.codemirror.setValue(markdown)
      }
      this.filename = filename

      Swal.fire({
        toast: true,
        timer: 3000,
        icon: 'success',
        text: 'Saved',
        position: 'top-end',
        showConfirmButton: false,
      })
    }

    setTimeout(() => {
      this.isEdited = false
    }, 100)
  }

  onCmCodeChange() {
    this.isEdited = true
    this.matter.parse(this.markdown)
  }

  onScroll(evt: any) {
    this.scrollSize =
      evt.target.scrollTop / (evt.target.scrollHeight - evt.target.clientHeight)
    this.$forceUpdate()
  }
}
</script>

<style scoped>
.vue-codemirror >>> .CodeMirror {
  height: 100% !important;
}

.vue-codemirror >>> .CodeMirror-lines {
  padding-bottom: 100px;
}

.vue-codemirror >>> .CodeMirror-line {
  word-break: break-all !important;
}

.button {
  @apply tw-py-2 tw-px-4 tw-rounded;
}

.button:disabled {
  @apply tw-bg-gray-500 tw-cursor-not-allowed;
}

.editor-column {
  @apply tw-h-screen tw-overflow-y-scroll tw-flex tw-flex-col;
}
</style>
