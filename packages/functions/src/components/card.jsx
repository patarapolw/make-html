/** @jsx h */
import he from 'he'
import yaml from 'js-yaml'
import h from 'vhtml'

/**
 *
 * @param {Cheerio} $el
 */
export function compileCardComponent($el) {
  /**
   * @type {IPageMetadata}
   */
  let meta = {}

  const dataMeta = $el.find('pre[data-template]').html()

  if (dataMeta) {
    meta = yaml.safeLoad(he.decode(dataMeta)) || {}
  }

  meta.url = $el.attr('href')

  $el.attr({
    rel: 'noreferrer nofollow noopener',
    target: '_blank',
    'data-html': ($el.html() || '')
      .replace(/<template>.+?<\/template>/gs, '')
      .trim(),
    class: Array.from(
      new Set([
        ...($el.attr('class') || '').split(' '),
        ...'tw-flex tw-m-4 tw-p-4 tw-shadow-lg tw-flex-row'.split(' '),
      ])
    ).join(' '),
  })

  const imgHtml = meta.image ? (
    <div
      className="tw-mr-4 tw-flex tw-items-center tw-content-center tw-overflow-hidden"
      style="width: 100px;"
    >
      <img
        className="tw-h-auto"
        src={meta.image}
        alt={meta.title || meta.url}
        style="width: 100px;"
      />
    </div>
  ) : (
    ''
  )

  $el.html(
    imgHtml +
    (
      <div>
        {meta.title ? (
          <h3
            className="tw-text-blue-700"
            style="margin-block-start: 0; margin-bottom: 0;"
          >
            {meta.title}
          </h3>
        ) : (
          <h4
            className="tw-text-blue-700"
            style="margin-block-start: 0; margin-bottom: 0;"
          >
            {meta.url}
          </h4>
        )}
        {meta.description ? (
          <div className="tw-mt-3">{meta.description}</div>
        ) : null}
      </div>
    )
  )
}
