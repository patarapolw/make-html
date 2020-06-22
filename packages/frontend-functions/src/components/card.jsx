/** @jsx h */
import h from 'vhtml'

/**
 *
 * @param {HTMLAnchorElement} el
 */
export function compileCardComponent(el) {
  const sMetadata = el.getAttribute('data-metadata')
  const imgPos = el.getAttribute('data-image-position')

  /**
   * @type {IPageMetadata}
   */
  const meta = sMetadata
    ? JSON.parse(sMetadata)
    : {
        url: el.href,
      }

  el.rel = 'noreferrer nofollow noopener'
  el.target = '_blank'
  el.setAttribute('data-html', el.innerHTML.trim())

  el.classList.add(
    ...(
      'tw-flex tw-m-4 tw-p-4 tw-shadow-lg' +
      (imgPos === 'left' ? ' tw-flex-row' : ' tw-flex-col')
    ).split(' ')
  )

  const imgHtml = meta.image ? (
    <div
      className={
        (imgPos !== 'top' ? 'tw-w-64 tw-mr-4 ' : 'tw-h-64 ') +
        'tw-flex tw-items-center tw-content-center tw-overflow-hidden'
      }
    >
      <img
        className={
          (imgPos !== 'top' ? 'tw-w-64 tw-mr-4 ' : 'tw-mb-4 tw-w-full ') +
          'tw-h-auto'
        }
        src={meta.image}
        alt={meta.title || meta.url}
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
          <h3 className="tw-text-blue-700" style="margin-block-start: 0;">
            {meta.title}
          </h3>
        ) : (
          <h6 className="tw-text-blue-700" style="margin-block-start: 0;">
            {meta.url}
          </h6>
        )}
        {meta.description}
      </div>
    )
}
