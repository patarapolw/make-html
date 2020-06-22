<template>
  <section class="tw-p-6 tw-h-full tw-absolute tw-overflow-y-scroll">
    <img v-if="image" class="tw-w-full" :src="image" :alt="title" />

    <div class="unreset">
      <h1>{{ title }}</h1>
      <div ref="excerpt" />
    </div>

    <div v-show="hasRemaining" class="tw--mx-6">
      <div
        class="tw-cursor-pointer tw-flex tw-bg-orange-200 tw-p-4"
        @click="isRemainingShown = !isRemainingShown"
        @keypress="isRemainingShown = !isRemainingShown"
      >
        <span>{{ isRemainingShown ? 'Hide' : 'Show' }} remaining</span>
        <div class="tw-flex-grow" />
        <span>
          <span v-if="isRemainingShown">▲</span>
          <span v-else>▼</span>
        </span>
      </div>

      <div v-show="isRemainingShown" ref="remaining" class="unreset tw-m-4" />
    </div>
  </section>
</template>

<script lang="ts">
import { MakeHtml } from '@patarapolw/make-html-frontend-functions'
import { elementClose, elementOpen, patch } from 'incremental-dom'
import { Component, Prop, Vue, Watch } from 'nuxt-property-decorator'

import { makeIncremental } from '../assets/make-incremental'
import { Matter } from '../assets/util'

import 'highlight.js/styles/default.css'

@Component
export default class EditorPreview extends Vue {
  @Prop({ required: true }) title!: string
  @Prop({ required: true }) markdown!: string
  @Prop() id?: string
  @Prop({ default: 0 }) scrollSize!: number
  guid = ''

  isRemainingShown = true
  hasRemaining = false
  matter = new Matter()

  urlMetadata: Map<string, any> = new Map()

  get image() {
    return this.matter.header.image || ''
  }

  get makeHtml() {
    return new MakeHtml(this.guid)
  }

  created() {
    this.onIdChanged()
  }

  mounted() {
    this.onMarkdownChanged()
  }

  @Watch('id')
  onIdChanged() {
    this.guid = this.id || Math.random().toString(36).substr(2)
  }

  @Watch('markdown')
  async onMarkdownChanged() {
    const { excerpt, remaining } = this.$refs as Record<string, HTMLDivElement>
    const { content: md } = this.matter.parse(this.markdown)
    // @ts-ignore
    const [excerptMd, remainingMd = ''] = md.split(
      /\n<!-- excerpt(?:_separator)? -->\n/
    )

    patch(excerpt, () => {
      elementOpen('div', this.guid)
      makeIncremental(
        this.makeHtml.render(excerptMd, !!process.env.sanitizeHtml)
      )()
      elementClose('div')
    })
    this.$emit('excerpt', excerpt.innerHTML)

    patch(remaining, () => {
      elementOpen('div', this.guid)
      makeIncremental(
        this.makeHtml.render(remainingMd, !!process.env.sanitizeHtml)
      )()
      elementClose('div')
    })
    this.$emit('remaining', remaining.innerHTML)
    this.hasRemaining = !!remainingMd

    await Promise.all([
      (async () => {
        if (await this.parseForXCard(excerpt)) {
          patch(excerpt, () => {
            elementOpen('div', this.guid, ['class', this.guid])
            makeIncremental(excerpt.innerHTML)()
            elementClose('div')
          })
          this.$emit('excerpt', excerpt.innerHTML)
        }
      })(),
      (async () => {
        if (await this.parseForXCard(remaining)) {
          patch(remaining, () => {
            elementOpen('div', this.guid, ['class', this.guid])
            makeIncremental(remaining.innerHTML)()
            elementClose('div')
          })
          this.$emit('excerpt', remaining.innerHTML)
        }
      })(),
    ])
  }

  @Watch('scrollSize')
  onEditorScroll() {
    this.$el.scrollTop =
      this.scrollSize * (this.$el.scrollHeight - this.$el.clientHeight)
  }

  async parseForXCard(ref?: HTMLDivElement) {
    if (!ref) {
      return
    }

    const rs = await Promise.all(
      Array.from(ref.querySelectorAll('a[is="x-card"]')).map(async (el) => {
        if (process.static) {
          return false
        }

        const href = el.getAttribute('href')
        if (href) {
          if (!this.urlMetadata.has(href)) {
            this.urlMetadata.set(href, {})

            const metadata = await this.$axios.get(
              '/serverMiddleware/metadata',
              {
                params: {
                  url: href,
                },
              }
            )

            this.urlMetadata.set(href, metadata)
          }

          const existingMetadata = el.getAttribute('data-metadata')
          if (!existingMetadata) {
            el.setAttribute(
              'data-metadata',
              JSON.stringify(this.urlMetadata.get(href))
            )

            return true
          }
        }

        return false
      })
    )

    if (rs.filter((el) => el).length > 0) {
      return true
    }

    return false
  }
}
</script>
