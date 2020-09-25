import { MakeHtml } from '@/assets/make-html'
import { SelectedEvent } from '@material/mwc-list/mwc-list-foundation'
import { Component, Vue } from 'vue-property-decorator'

@Component<App>({
  mounted () {
    this.codemirror.setSize('100%', '100%')
    this.codemirror.addKeyMap({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      'Cmd-S': () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      'Ctrl-S': () => {}
    })
    this.codemirror.on('change', (cm) => {
      this.markdown = cm.getValue()
    })

    const elList = this.$refs.list as HTMLElement & {
      select(i: number): void;
    }

    elList.addEventListener('selected', (evt) => {
      this.filelistIndex = (evt as SelectedEvent).detail.index as number
    })

    elList.addEventListener('scroll', () => {
      if (elList.offsetHeight + elList.scrollTop > elList.scrollHeight - 100) {
        this.filelist = [
          ...this.filelist,
          ...Array(20).fill(null).map(() => Math.random().toString(36).substr(2))
        ]
      }
    })

    setTimeout(() => {
      elList.select(0)
    }, 100)
  }
})
export default class App extends Vue {
  isEditor = true
  isViewer = true

  markdown = ''

  filelist = Array(20).fill(null).map(() => Math.random().toString(36).substr(2))
  filelistIndex = 0
  filename = this.filelist[0]

  console = console

  tmFilenameSetter: number | null = null

  get codemirror () {
    return (this.$refs.cm as unknown as {
      codemirror: CodeMirror.Editor;
    }).codemirror
  }

  get makeHtml () {
    return new MakeHtml(this.filename)
  }

  get html () {
    return this.makeHtml.render(this.markdown)
  }

  toggle () {
    this.isViewer = !this.isViewer
  }

  validateFilename (evt: KeyboardEvent) {
    const el = evt.target as HTMLInputElement

    const oldname = this.filename
    const { selectionStart, selectionEnd } = el

    setTimeout(() => {
      if (!this.filename || /\s/.test(this.filename)) {
        this.filename = oldname
        setTimeout(() => {
          el.selectionStart = selectionStart
          el.selectionEnd = selectionEnd
        })
      }

      if (this.tmFilenameSetter !== null) {
        clearTimeout(this.tmFilenameSetter)
      }

      this.tmFilenameSetter = setTimeout(() => {
        this.filelist = [
          ...this.filelist.slice(0, this.filelistIndex),
          this.filename,
          ...this.filelist.slice(this.filelistIndex + 1)
        ]
        this.tmFilenameSetter = null
      }, 1000)
    }, 100)
  }
}
