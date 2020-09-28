declare module 'vue-codemirror'
declare module 'markdown-it-container'
declare module 'markdown-it-emoji'
declare module 'markdown-it-external-links'
declare module 'vue-material/dist/components'

declare module 'scope-css' {
  function scopeCss(css: string, scope: string): string;
  export = scopeCss;
}
