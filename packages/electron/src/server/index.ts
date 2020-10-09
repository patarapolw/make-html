import path from 'path'

import death from 'death'
import fastify from 'fastify'
import cors from 'fastify-cors'
import fStatic from 'fastify-static'

import { ROOT } from '../shared'
import apiRouter from './api'
import { dataDir, mediaDir } from './dir'

const app = fastify()

if (process.env.CONCURRENTLY) {
  app.register(cors)
}

app.register(fStatic, {
  root: path.join(ROOT, 'public')
})

app.register(fStatic, {
  root: path.resolve(mediaDir),
  prefix: '/media/',
  decorateReply: false
})

app.register(fStatic, {
  root: path.resolve(dataDir),
  prefix: '/data/',
  decorateReply: false
})

app.register(apiRouter, {
  prefix: '/api'
})

app.listen(parseInt(process.env.PORT || '0'), (err, addr) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  if (process.send) {
    process.send({
      type: 'started',
      url: addr
    })
  }

  console.info(`Server is listening on ${addr}`)
})

death(() => {
  app.close()
})
