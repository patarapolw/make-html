import sanitize from 'sanitize-filename'

export function isUrl(s: string) {
  if (/^https?:\/\/[^ ]+$/.test(s)) {
    try {
      // eslint-disable-next-line no-new
      new URL(s)
      return true
    } catch (_) {}
  }

  return false
}

export function styleSizeToNumber(s: string) {
  return s && s.endsWith('px') ? parseInt(s) : null
}

export function extractFilenameFromUrl(
  u: string,
  fallback: string,
  opts?: {
    preferredExt?: string[]
  }
) {
  try {
    const { pathname } = new URL(u)
    const unsafeFilename = decodeURIComponent(
      pathname.split('/').pop() || fallback
    )

    const safeFilename = sanitize(unsafeFilename)
    if (opts?.preferredExt && opts.preferredExt.length > 0) {
      const ext = (safeFilename.match(/\..+?$/) || [])[0]
      if (!ext || !opts.preferredExt.includes(ext)) {
        return safeFilename + opts.preferredExt[0]
      }
    }

    return safeFilename
  } catch (_) {}

  return fallback
}
