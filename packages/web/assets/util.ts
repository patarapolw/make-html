import { Serialize } from 'any-serialize'
import yaml from 'js-yaml'

export const ser = new Serialize()

export function normalizeArray<T>(a: T | T[]): T | undefined {
  if (Array.isArray(a)) {
    return a[0]
  }
  return a
}

export function stringSorter(a: any, b: any) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())
  }
  return 0
}

export class Matter {
  header = {} as any

  parse(s: string) {
    if (s.startsWith('---\n')) {
      const [h, c = ''] = s.substr(3).split(/\n---(\n.*)?$/s)

      try {
        this.header =
          yaml.safeLoad(h, {
            schema: yaml.JSON_SCHEMA,
          }) || {}
      } catch (_) {}

      return {
        header: this.header,
        content: c,
      }
    }

    return {
      header: null,
      content: s,
    }
  }

  stringify(content: string, header: any) {
    if (header) {
      try {
        return `---\n${yaml.safeDump(header, {
          schema: yaml.JSON_SCHEMA,
          skipInvalid: true,
        })}---\n${content}`
      } catch (e) {
        // console.error(e)
      }
    }

    return content
  }
}
