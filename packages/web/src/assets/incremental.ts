import { Parser } from 'htmlparser2'
import { elementClose, elementOpen, text } from 'incremental-dom'

import { ser } from './util'

export function makeIncremental (s: string): () => void {
  const open = (name: string, attr: Record<string, string> = {}) => {
    elementOpen(name, name + '-' + ser.hash(attr), Object.entries(attr).flat())
  }

  const close = (name: string) => {
    elementClose(name)
  }

  const iDOMParser = new Parser(
    {
      onopentag: open,
      ontext: text,
      onclosetag: close
    },
    {
      decodeEntities: true,
      lowerCaseAttributeNames: false,
      lowerCaseTags: false,
      recognizeSelfClosing: true
    }
  )

  return () => {
    iDOMParser.write(s)
  }
}
