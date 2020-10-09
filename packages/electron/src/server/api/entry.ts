import { spawnSync } from 'child_process'
import path from 'path'

import dayjs from 'dayjs'
import death from 'death'
import elunr from 'elasticlunr'
import { FastifyInstance } from 'fastify'
import fs from 'fs-extra'
import glob from 'globby'
import sanitize from 'sanitize-filename'

import { dataDir, userDataDir } from '../dir'
import { matter } from '../matter'

interface IdxDoc {
  filename: string
  title?: string
  tag?: string[]
  content: string
}

const docLookup = new Map<string, IdxDoc>()

death(() => {
  fs.writeFileSync(
    path.join(userDataDir, 'idx.json'),
    JSON.stringify(idx.toJSON())
  )
})

let idx: elunr.Index<IdxDoc>

try {
  idx = elunr.Index.load(
    JSON.parse(fs.readFileSync(path.join(userDataDir, 'idx.json'), 'utf-8'))
  )
} catch (_) {
  idx = elunr<IdxDoc>(function () {
    this.addField('title')
    this.addField('tag')
    this.addField('content')

    this.setRef('filename')
  })
}

glob('**/*.md', {
  cwd: dataDir
}).then((files) => {
  files.map(async (f) => {
    return addDoc(f)
  })
})

export default function (
  f: FastifyInstance,
  _: unknown,
  next: () => void
): void {
  f.get<{
    Querystring: {
      q?: string
      after?: string
      limit?: number
      sort?: 'updatedAt'
    }
  }>(
    '/q',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string' },
            after: { type: 'string' },
            limit: { type: 'integer' },
            sort: { enum: ['updatedAt'] }
          }
        }
      }
    },
    async (req) => {
      const { q, after, limit, sort } = req.query

      let result: {
        filename: string
        markdown?: string
        updatedAt?: string
      }[] = []

      if (q) {
        let lookup: (IdxDoc & {
          updatedAt?: string
        })[] = idx.search(q).map((r) => docLookup.get(r.ref)!)

        if (sort === 'updatedAt') {
          lookup = lookup
            .map((r) => {
              const stat = fs.statSync(path.join(dataDir, r.filename))
              const { mtime } = stat

              return {
                ...r,
                stat,
                updatedAt: dayjs(mtime)
                  .subtract(mtime.getTimezoneOffset(), 'minute')
                  .format('YYYY-MM-DDTHH:mmZ')
              }
            })
            .sort(({ stat: s1 }, { stat: s2 }) => s2.mtimeMs - s1.mtimeMs)
            .map((r) => {
              delete ((r as unknown) as { stat?: fs.Stats }).stat
              return r
            })
        }

        result = lookup.map((r) => ({
          filename: r.filename,
          updatedAt: r.updatedAt
        }))
      } else {
        result = Array.from(docLookup.values())
          .map((r) => {
            const stat = fs.statSync(path.join(dataDir, r.filename))
            const { mtime } = stat

            return {
              ...r,
              stat,
              updatedAt: dayjs(mtime)
                .subtract(mtime.getTimezoneOffset(), 'minute')
                .format('YYYY-MM-DDTHH:mmZ')
            }
          })
          .sort(({ stat: s1 }, { stat: s2 }) => s2.mtimeMs - s1.mtimeMs)
          .map((r) => {
            delete ((r as unknown) as { stat?: fs.Stats }).stat
            return r
          })
      }

      if (after) {
        const afterIndex = result.map(({ filename }) => filename).indexOf(after)
        result = result.slice(afterIndex + 1)
      }

      return {
        result: result.slice(0, limit).map((r) => {
          if (!r.updatedAt) {
            const stat = fs.statSync(path.join(dataDir, r.filename))
            const { mtime } = stat

            r.updatedAt = dayjs(mtime)
              .subtract(mtime.getTimezoneOffset(), 'minute')
              .format('YYYY-MM-DDTHH:mmZ')
          }

          r.markdown = fs.readFileSync(path.join(dataDir, r.filename), 'utf-8')

          return r
        })
      }
    }
  )

  f.put<{
    Querystring: {
      filename: string
    }
    Body: {
      markdown: string
    }
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['filename'],
          properties: {
            filename: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['markdown'],
          properties: {
            markdown: { type: 'string' }
          }
        }
      }
    },
    async (req, res) => {
      const { filename: _filename } = req.query
      const { markdown } = req.body

      const filepathBase = path.join(
        dataDir,
        _filename
          .split(path.sep)
          .map((f) => sanitize(f))
          .join(path.sep)
          .replace(/\.(md|markdown)$/, '')
      )
      let filepath = filepathBase + '.md'
      let i = 1

      while (fs.existsSync(filepath)) {
        filepath = filepathBase + `~${i}.md`
        i++
      }

      await fs.ensureFile(filepath)
      await fs.writeFile(filepath, markdown)

      const filename = path.relative(dataDir, filepath)

      spawnSync('git', ['add', path.join('data', filename)], {
        cwd: userDataDir,
        stdio: 'inherit'
      })
      spawnSync('git', ['update', '-m', `Create ${filename}`], {
        cwd: userDataDir,
        stdio: 'inherit'
      })

      addDoc(filename)

      res.status(201)

      return {
        filename
      }
    }
  )

  f.patch<{
    Querystring: {
      filename: string
    }
    Body: {
      markdown: string
    }
  }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['filename', 'markdown'],
          properties: {
            filename: { type: 'string' },
            markdown: { type: 'string' }
          }
        }
      }
    },
    async (req, res) => {
      const { filename } = req.query
      const { markdown } = req.body

      await fs.writeFile(path.join(dataDir, filename), markdown)
      addDoc(filename, true)

      spawnSync('git', ['add', path.join('data', filename)], {
        cwd: userDataDir,
        stdio: 'inherit'
      })
      spawnSync('git', ['update', '-m', `Update ${filename}`], {
        cwd: userDataDir,
        stdio: 'inherit'
      })

      res.status(201)

      return null
    }
  )

  f.delete<{
    Querystring: {
      filename: string
    }
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['filename'],
          properties: {
            filename: { type: 'string' }
          }
        }
      }
    },
    async (req, res) => {
      const { filename } = req.query

      fs.unlink(path.join(dataDir, filename))
      idx.removeDocByRef(filename)

      res.status(201)

      return null
    }
  )

  next()
}

async function addDoc(f: string, update?: boolean) {
  const markdown = await fs.readFile(path.join(dataDir, f), 'utf-8')
  const { data, content } = matter.parse(markdown)
  const doc: IdxDoc = {
    filename: f,
    title: data.title as string,
    tag: data.tag as string[],
    content
  }

  if (update) {
    idx.updateDoc(doc)
  } else {
    idx.addDoc(doc)
  }

  docLookup.set(f, doc)
}
