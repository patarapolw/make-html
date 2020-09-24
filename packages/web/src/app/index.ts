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
  }
})
export default class App extends Vue {
  isEditor = true
  isViewer = true

  markdown = ''

  get codemirror () {
    return (this.$refs.cm as unknown as {
      codemirror: CodeMirror.Editor;
    }).codemirror
  }

  toggle () {
    this.isViewer = !this.isViewer
  }
}
