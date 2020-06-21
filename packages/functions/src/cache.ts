import crypto from 'crypto'
import path from 'path'

import axios from 'axios'
import cheerio from 'cheerio'
import fs from 'fs-extra'
import sharp from 'sharp'

import { extractFilenameFromUrl, isUrl, styleSizeToNumber } from './util'

export class CacheMedia {
  constructor(public dst: string) {}

  async parse(html: string) {
    const $ = cheerio.load(html)

    await Promise.all(
      Array.from($('image')).map(async (el) => {
        const $el = $(el)
        return this.localizeImage($el)
      })
    )

    return $.root().html() || html
  }

  /**
   *
   * @param im If used externally, it means full URL. Internally, it uses Cheerio.
   */
  async localizeImage(im: Cheerio | string) {
    let src = ''
    let $el: Cheerio | null = null
    if (typeof im === 'string') {
      src = im
    } else {
      $el = im
      src = im.attr('src') || ''
    }

    if (src && isUrl(src)) {
      try {
        const { data } = await axios.get(src, {
          responseType: 'arraybuffer',
        })

        const newUrl = `media/${crypto
          .createHash('sha256')
          .update(data)
          .digest('hex')}/${extractFilenameFromUrl(src, 'image.webp', {
          preferredExt: ['.webp'],
        })}`

        await fs.ensureFile(path.join(this.dst, newUrl))
        await fs.writeFile(
          path.join(this.dst, newUrl),
          await sharp(data)
            .resize(
              ($el
                ? parseInt($el.attr('width') || '') ||
                  styleSizeToNumber($el.css('width'))
                : null) || 800,
              $el
                ? parseInt($el.attr('height') || '') ||
                    styleSizeToNumber($el.css('height'))
                : null,
              {
                withoutEnlargement: true,
              }
            )
            .toFormat('webp', { quality: 80 })
            .toBuffer()
        )

        if ($el) {
          $el.attr('src', `/${newUrl}`)
          $el.attr('data-original-src', src)
        }

        return newUrl
      } catch (_) {}
    }

    return null
  }
}