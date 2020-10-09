import { FastifyInstance } from 'fastify'

import entryRouter from './entry'
import mediaRouter from './media'
import utilRouter from './util'

export default function (
  f: FastifyInstance,
  _: unknown,
  next: () => void
): void {
  f.register(entryRouter, {
    prefix: '/entry'
  })
  f.register(mediaRouter, {
    prefix: '/media'
  })

  f.register(utilRouter)

  next()
}
