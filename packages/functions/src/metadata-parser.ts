import axios from 'axios'
import domino from 'domino'
import { getMetadata } from 'page-metadata-parser'

export interface IPageMetadata {
  description?: string
  icon: string
  // icon?: string
  image?: string
  keywords?: string[]
  title?: string
  language?: string
  type?: string
  url: string
  provider: string
  // provider?: string
}

export async function metadataParser(url: string): Promise<IPageMetadata> {
  const r = await axios.get(url, {
    transformResponse: (d) => d,
  })

  const doc = domino.createWindow(r.data).document
  return getMetadata(doc, url)
}
