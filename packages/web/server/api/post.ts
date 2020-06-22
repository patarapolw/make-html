import { FastifyInstance } from 'fastify'
import fs from 'fs-extra'
import sanitize from 'sanitize-filename'

import { contentPath } from '../shared'

const filename =
  process.env.filename || `${sanitize(new Date().toISOString())}.md`

export default function (f: FastifyInstance, _: any, next: () => void) {
  f.get('/', async () => {
    const fullPath = contentPath('post', filename)
    return {
      data: fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '',
    }
  })

  f.put(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: { type: 'string' },
          },
        },
      },
    },
    async (req) => {
      const { data } = req.body
      const fullPath = contentPath('post', filename)

      if (fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, data)

        return {
          data,
        }
      }

      fs.ensureFileSync(fullPath)
      fs.writeFileSync(fullPath, data)

      return {
        data,
      }
    }
  )

  next()
}
