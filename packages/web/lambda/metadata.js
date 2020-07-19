import { metadataParser } from '@patarapolw/make-html-server-fn/lib/metadata-parser'

export const handler = async (evt) => {
  const { href } = evt.queryStringParameters || {}
  if (!href) {
    return {
      statusCode: 404,
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(await metadataParser(href))
  }
}
