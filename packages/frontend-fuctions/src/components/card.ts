import he from 'he'

export interface IMetadata {
  description?: string
  // icon: string
  icon?: string
  image?: string
  keywords?: string[]
  title?: string
  language?: string
  type?: string
  url: string
  // provider: string
  provider?: string
}

export function compileCardComponent(el: HTMLAnchorElement) {
  const sMetadata = el.getAttribute('data-metadata')
  const imgPos = el.getAttribute('data-image-position')

  const meta: IMetadata = sMetadata
    ? (JSON.parse(sMetadata) as IMetadata)
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

  let imgHtml = ''
  if (meta.image) {
    imgHtml = /* html */ `
    <div class="${
      imgPos === 'left' ? 'tw-w-64 tw-mr-4 ' : ''
    }tw-flex tw-items-center tw-content-center tw-overflow-hidden">
      <img class="tw-h-auto ${
        imgPos === 'left' ? 'tw-w-64 tw-mr-4 ' : 'tw-mb-4 tw-w-full'
      }" src="${encodeURI(meta.image)}" alt="${he.encode(
      meta.title || meta.url
    )}" />
    </div>
    `
  }
}
