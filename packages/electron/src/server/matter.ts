import yaml from 'js-yaml'

export const matter = {
  split(
    s: string
  ): {
    matter: string
    content: string
  } {
    try {
      const pre = '---\n'

      if (s.startsWith(pre)) {
        const m = s.substr(pre.length).split(/---\n(.*)$/s)
        return {
          matter: m[0],
          content: m[1] || ''
        }
      }
    } catch (_) {}

    return {
      matter: '',
      content: s
    }
  },
  parse<T>(
    s: string
  ): {
    data: Record<string, T>
    content: string
  } {
    const { matter, content } = this.split(s)

    if (matter) {
      const data = yaml.safeLoad(matter, {
        schema: yaml.JSON_SCHEMA
      })

      if (typeof data === 'object' && !Array.isArray(data)) {
        return { data: data as Record<string, T>, content }
      }
    }

    return { data: {}, content }
  },
  stringify<T>(content: string, data?: Record<string, T>): string {
    let matter = ''

    if (data) {
      try {
        matter = yaml.safeDump(data, {
          skipInvalid: true
        })
      } catch (_) {}
    }

    if (matter) {
      return `---\n${matter}---\n\n${content.replace(/^\n+/, '')}`
    }

    return content
  }
}
