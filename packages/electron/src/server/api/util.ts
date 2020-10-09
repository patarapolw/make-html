import domino from 'domino'
import { FastifyInstance } from 'fastify'
import fetch from 'node-fetch'
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

export default function (
  f: FastifyInstance,
  _: unknown,
  next: () => void
): void {
  f.get<{
    Querystring: {
      url: string
    }
  }>(
    '/metadata',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string' }
          }
        }
      }
    },
    async (req) => {
      const { url } = req.query
      const data = await fetch(url).then((r) => r.text())
      const doc = domino.createWindow(data).document
      const { image, title, description }: IPageMetadata = await getMetadata(
        doc,
        url
      )

      return {
        url,
        title,
        image,
        description
      }
    }
  )

  next()
}
