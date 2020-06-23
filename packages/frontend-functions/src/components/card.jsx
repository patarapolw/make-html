/** @jsx h */
import he from 'he'
import yaml from 'js-yaml'
import h from 'vhtml'

/**
 *
 * @param {HTMLAnchorElement} el
 */
export function compileCardComponent(el) {
  /**
   * @type {IPageMetadata}
   */
  let meta = {}

  const dataMetaEl = el.querySelector('pre[data-template]')

  if (dataMetaEl && dataMetaEl.innerHTML) {
    meta = yaml.safeLoad(he.decode(dataMetaEl.innerHTML))
  }

  meta.url = el.href

  el.rel = 'noreferrer nofollow noopener'
  el.target = '_blank'
  el.setAttribute(
    'data-html',
    el.innerHTML.replace(/<template>.+?<\/template>/gs, '').trim()
  )

  el.classList.add(
    ...'tw-flex tw-m-4 tw-p-4 tw-shadow-lg tw-flex-row'.split(' ')
  )

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

  el.innerHTML =
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
}
