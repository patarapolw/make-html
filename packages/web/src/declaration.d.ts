declare module 'vue-codemirror'
declare module 'markdown-it-container'
declare module 'markdown-it-emoji'
declare module 'markdown-it-external-links'

declare module 'scope-css' {
  function scopeCss(css: string, scope: string): string;
  export = scopeCss;
}

declare module 'pretty' {
  function pretty(html: string, opts?: {
    ocd?: boolean;
  }): string;
  export = pretty;
}

declare module 'page-metadata-parser' {
  export function getMetadata(doc: Document, url: string): string;
}
