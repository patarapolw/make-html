declare module 'page-metadata-parser'
declare module 'markdown-it-container'
declare module 'markdown-it-external-links'
declare module 'markdown-it-emoji'

declare interface IPageMetadata {
  description?: string
  // icon: string
  icon?: string
  image?: string
  keywords?: string[]
  title?: string
  language?: string
  type?: string
  url: string
  // provider: string
  provider?: string
}
