import { CacheMedia } from '@patarapolw/make-html-functions'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
// @ts-ignore
import fileUpload from 'fastify-file-upload'
import fs from 'fs-extra'

import { contentPath } from '../shared'

export default function (f: FastifyInstance, _: any, next: () => void) {
  // f.get(
  //   '/',
  //   {
  //     schema: {
  //       querystring: {
  //         type: 'object',
  //         required: ['q'],
  //         properties: {
  //           q: { type: 'string' },
  //         },
  //       },
  //     },
  //   },
  //   async (req, reply) => {
  //     const { q } = req.query
  //     if (fs.existsSync(q)) {
  //       reply.send(fs.createReadStream(q))
  //       return
  //     }

  //     reply.status(404).send()
  //   }
  // )

  f.register(fileUpload)

  const cacheMedia = new CacheMedia(contentPath('media'))

  f.post(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['file'],
          properties: {
            file: { type: 'object' },
          },
        },
      },
    },
    async (req) => {
      const { file } = req.body

      let filename = file.name.replace(/\..+$/, '')
      if (filename === 'image') {
        filename = dayjs().format('YYYYMMDD-HHmm') + '.webp'
      }

      const fullPath = contentPath('media', file.md5, filename)

      fs.ensureFileSync(fullPath)
      fs.writeFileSync(fullPath, await cacheMedia.minimizeImage(file.data))

      return {
        filename,
        url: `/media/${file.md5}/${filename}`,
      }
    }
  )

  next()
}
