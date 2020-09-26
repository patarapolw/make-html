// @ts-check
const template = document.createElement('template')
template.innerHTML = /*html*/`
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.css">

<style>
* {
  font-family: sans-serif;
}

:host > a {
  text-decoration: none;
  display: flex;
  flex-direction: row;
  max-width: 600px;
  margin: 1rem;
  padding: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.figure {
  display: none; /* flex */
  margin-right: 1rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100px;
  min-width: 100px;
}

article {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

img {
  height: auto;
  width: 100px;
}

.header {
  color: #2b6cb0;
  margin-block-start: 0;
  margin-bottom: 0;
  font-size: 1.3rem;
  padding-bottom: 1rem;
}

.description {
  display: none; /* block */
  min-height: 4em;
}
</style>

<div class="figure">
  <img />
</div>
<article>
  <h3 class="header"></h3>
  <div class="description"></div>
</article>
`

export class XCard extends HTMLElement {
  async connectedCallback() {
    // Await a little for incremental dom to load
    await new Promise((resolve) => setTimeout(resolve, 50))

    /**
    * @type {HTMLElement & {
    *  ondatasrc: (function(string, HTMLImageElement): void) | null;
    *  isresized?: boolean;
    * }}
    */
    // @ts-ignore
    const self = this

    const aEl = /** @type {HTMLAnchorElement} */ (this.querySelector('a').cloneNode(true))
    if (aEl && aEl.textContent) {
      aEl.target = '_blank'

      const href = aEl.href
      const image = aEl.getAttribute('data-image')
      const title = aEl.getAttribute('data-title')
      const description = aEl.getAttribute('data-description')

      const shadow = this.attachShadow({ mode: 'open' })
      aEl.textContent = ''
      aEl.appendChild(template.content.cloneNode(true))

      if (image) {
        /** @type {HTMLDivElement} */ (aEl.querySelector('.figure')).style.display = 'flex'

        const imgEl = aEl.querySelector('img')
        imgEl.crossOrigin = 'anonymous'

        const canvasEl = document.createElement('canvas')

        imgEl.onload = () => {
          canvasEl.width = imgEl.naturalWidth > 100
            ? 100
            : imgEl.naturalWidth
          canvasEl.height = imgEl.naturalWidth > 100
            ? imgEl.naturalHeight * 100 / imgEl.naturalWidth
            : imgEl.naturalHeight

          canvasEl.getContext('2d').drawImage(
            imgEl,
            0,
            0,
            canvasEl.width,
            canvasEl.height
          )

          imgEl.onload = null
          imgEl.src = canvasEl.toDataURL('image/png')

          if (self.ondatasrc && !self.isresized) {
            self.isresized = true
            self.ondatasrc(imgEl.src, imgEl)
          }

          canvasEl.remove()
          imgEl.removeAttribute('crossorigin')
        }

        Object.assign(imgEl, {
          src: image,
          alt: title || href
        })
      }

      /** @type {HTMLDivElement} */ (aEl.querySelector('.header')).innerText = title || href

      if (description) {
        const descEl = /** @type {HTMLDivElement} */ (aEl.querySelector('.description'))
        descEl.innerText = description
        descEl.style.display = 'block'
      }

      shadow.appendChild(aEl)
    }
  }
}

customElements.define('x-card', XCard)
