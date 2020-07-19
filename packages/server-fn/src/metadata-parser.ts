import { URL } from 'url'

import axios from 'axios'
import cheerio from 'cheerio'

interface IRuleSet {
  rules: [string, ($el: Cheerio) => string | null | undefined][]
  scorers?: (($el: Cheerio, score: number) => number | null)[]
  defaultValue?: (ctx: { url: string }) => string
  processors?: ((value: any, ctx: { url: string }) => any)[]
}

const metadataRuleSets: Record<string, IRuleSet> = {
  description: {
    rules: [
      ['meta[property="og:description"]', ($) => $.attr('content')],
      ['meta[name="description" i]', ($) => $.attr('content')],
    ],
  },

  icon: {
    rules: [
      ['link[rel="apple-touch-icon"]', ($) => $.attr('href')],
      ['link[rel="apple-touch-icon-precomposed"]', ($) => $.attr('href')],
      ['link[rel="icon" i]', ($) => $.attr('href')],
      ['link[rel="fluid-icon"]', ($) => $.attr('href')],
      ['link[rel="shortcut icon"]', ($) => $.attr('href')],
      ['link[rel="Shortcut Icon"]', ($) => $.attr('href')],
      ['link[rel="mask-icon"]', ($) => $.attr('href')],
    ],
    scorers: [
      // Handles the case where multiple icons are listed with specific sizes ie
      // <link rel="icon" href="small.png" sizes="16x16">
      // <link rel="icon" href="large.png" sizes="32x32">
      ($) => {
        const sizes = $.attr('sizes')

        if (sizes) {
          const sizeMatches = sizes.match(/\d+/g)
          if (sizeMatches) {
            return parseInt(sizeMatches[0])
          }
        }

        return null
      },
    ],
    defaultValue: () => 'favicon.ico',
    processors: [(iconUrl, context) => new URL(iconUrl, context.url).href],
  },

  image: {
    rules: [
      ['meta[property="og:image:secure_url"]', ($) => $.attr('content')],
      ['meta[property="og:image:url"]', ($) => $.attr('content')],
      ['meta[property="og:image"]', ($) => $.attr('content')],
      ['meta[name="twitter:image"]', ($) => $.attr('content')],
      ['meta[property="twitter:image"]', ($) => $.attr('content')],
      ['meta[name="thumbnail"]', ($) => $.attr('content')],
    ],
    processors: [(imageUrl, context) => new URL(imageUrl, context.url).href],
  },

  keywords: {
    rules: [['meta[name="keywords" i]', ($) => $.attr('content')]],
    processors: [
      (keywords: string) =>
        keywords.split(',').map((keyword) => keyword.trim()),
    ],
  },

  title: {
    rules: [
      ['meta[property="og:title"]', ($) => $.attr('content')],
      ['meta[name="twitter:title"]', ($) => $.attr('content')],
      ['meta[property="twitter:title"]', ($) => $.attr('content')],
      ['meta[name="hdl"]', ($) => $.attr('content')],
      ['title', ($) => $.text()],
    ],
  },

  language: {
    rules: [
      ['html[lang]', ($) => $.attr('lang')],
      ['meta[name="language" i]', ($) => $.attr('content')],
    ],
    processors: [(language) => language.split('-')[0]],
  },

  type: {
    rules: [['meta[property="og:type"]', ($) => $.attr('content')]],
  },

  url: {
    rules: [
      ['a.amp-canurl', ($) => $.attr('href')],
      ['link[rel="canonical"]', ($) => $.attr('href')],
      ['meta[property="og:url"]', ($) => $.attr('content')],
    ],
    defaultValue: (context) => context.url,
    processors: [(url, context) => new URL(url, context.url).href],
  },

  provider: {
    rules: [['meta[property="og:site_name"]', ($) => $.attr('content')]],
    defaultValue: (context) =>
      new URL(context.url).href
        .replace(/www[a-zA-Z0-9]*\./, '')
        .replace('.co.', '.')
        .split('.')
        .slice(0, -1)
        .join(' '),
  },
}

function buildRuleSet(ruleSet: IRuleSet) {
  return ($: CheerioStatic, context: { url: string }) => {
    let maxScore = 0
    let maxValue

    for (let currRule = 0; currRule < ruleSet.rules.length; currRule++) {
      const [query, handler] = ruleSet.rules[currRule]

      $(query).each((_, el) => {
        const $el = $(el)
        let score = ruleSet.rules.length - currRule

        if (ruleSet.scorers) {
          for (const scorer of ruleSet.scorers) {
            const newScore = scorer($el, score)

            if (newScore) {
              score = newScore
            }
          }
        }

        if (score > maxScore) {
          maxScore = score
          maxValue = handler($el)
        }
      })
    }

    if (!maxValue && ruleSet.defaultValue) {
      maxValue = ruleSet.defaultValue(context)
    }

    if (maxValue) {
      if (ruleSet.processors) {
        for (const processor of ruleSet.processors) {
          maxValue = processor(maxValue, context)
        }
      }

      if (maxValue.trim) {
        maxValue = maxValue.trim()
      }

      return maxValue
    }
  }
}

function getMetadata(
  doc: CheerioStatic,
  url: string,
  ruleSets = metadataRuleSets
) {
  const metadata: Record<string, any> = {}
  const context = {
    url,
  }

  Object.keys(ruleSets).map((ruleSetKey) => {
    const ruleSet = ruleSets[ruleSetKey]
    const builtRuleSet = buildRuleSet(ruleSet)
    metadata[ruleSetKey] = builtRuleSet(doc, context)
  })

  return metadata
}

export interface IPageMetadata {
  description?: string
  icon: string
  // icon?: string
  image?: string
  keywords?: string[]
  title?: string
  language?: string
  type?: string
  url: string
  provider: string
  // provider?: string
}

export async function metadataParser(url: string) {
  const r = await axios.get(url, {
    transformResponse: (d) => d,
  })

  const $ = cheerio.load(r.data)
  const { image, title, description } = getMetadata($, url) as IPageMetadata

  return {
    image,
    title,
    description,
  }
}
