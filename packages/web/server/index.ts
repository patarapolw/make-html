import path from 'path'

import fastify from 'fastify'
import fStatic from 'fastify-static'
// @ts-ignore
import { Builder, Nuxt } from 'nuxt'

import getConfig from '../nuxt.config'

import metadataRouter from './api/metadata'
import postRouter from './api/post'
import uploadRouter from './api/upload'

async function start() {
  const config = getConfig()
  config.dev = process.env.NODE_ENV !== 'production'

  // Instantiate nuxt.js
  const nuxt = new Nuxt(config)

  const {
    host = process.env.HOST || '127.0.0.1',
    port = process.env.PORT || 3000,
  } = nuxt.options.server

  await nuxt.ready()
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  const app = fastify({
    logger: {
      prettyPrint: true,
      level: 'warn',
    },
  })

  app.use((req, res, next) => {
    if (
      req.url &&
      !req.url.startsWith('/api/') &&
      !req.url.startsWith('/media/')
    ) {
      nuxt.render(req, res, next)
      return
    }
    next()
  })

  app.register(
    (f, _, next) => {
      f.register(uploadRouter, { prefix: '/upload' })
      f.register(metadataRouter, { prefix: '/metadata' })
      f.register(postRouter, { prefix: '/post' })

      f.register(fStatic, {
        prefix: '/media',
        root: path.join(__dirname, '../content/media'),
      })

      next()
    },
    {
      logLevel: 'info',
      prefix: '/api',
    }
  )

  app.listen(port, host, (err, addr) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    } else {
      app.log.warn(`Please go to ${addr}`)
    }
  })
}

if (require.main === module) {
  start()
}
