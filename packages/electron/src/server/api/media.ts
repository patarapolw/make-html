import { spawnSync } from 'child_process'
import path from 'path'

import dayjs from 'dayjs'
import type { UploadedFile } from 'express-fileupload'
import { FastifyInstance } from 'fastify'
import fileUpload from 'fastify-file-upload'
import fs from 'fs-extra'

import { mediaDir, userDataDir } from '../dir'

export default function (
  f: FastifyInstance,
  _: unknown,
  next: () => void
): void {
  f.register(fileUpload)

  f.post<{
    Body: {
      file: UploadedFile
    }
  }>(
    '/upload',
    {
      schema: {
        body: {
          type: 'object',
          required: ['file'],
          properties: {
            file: { type: 'object' }
          }
        }
      }
    },
    async (req) => {
      const { file } = req.body

      const f = file.name.split(/(\.[A-Z0-9]+)$/i)
      if (f[0] === 'image') {
        f[0] = dayjs().format('YYYYMMDD-HHmm')
      }

      let i = 0
      while (fs.existsSync(path.join(mediaDir, f.join('')))) {
        f[0] = f[0] + `~${i}`
        i++
      }

      const fullPath = path.join(mediaDir, f.join(''))

      await file.mv(fullPath)

      spawnSync('git', ['add', path.join('media', f.join(''))], {
        cwd: userDataDir,
        stdio: 'inherit'
      })
      spawnSync('git', ['update', '-m', `Upload media ${f.join('')}`], {
        cwd: userDataDir,
        stdio: 'inherit'
      })

      return {
        filename: f.join(''),
        url: `/media/${f.join('')}`
      }
    }
  )

  next()
}
