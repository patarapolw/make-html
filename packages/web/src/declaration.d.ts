declare module 'vue-codemirror'
declare module 'markdown-it-container'
declare module 'markdown-it-emoji'
declare module 'markdown-it-external-links'

declare module 'scope-css' {
  function scopeCss(css: string, scope: string): string;
  export = scopeCss;
}

declare module 'page-metadata-parser' {
  export function getMetadata(doc: HTMLElement, url: string): {
    description?: string;
    icon: string;
    image?: string;
    keywords?: string;
    provider: string;
    title?: string;
    type?: string;
    url: string;
  };
}
