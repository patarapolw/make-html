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
  constructor() {
    super()

    const aEl = this.querySelector('a')
    if (aEl) {
      const href = aEl.href
      const image = aEl.getAttribute('data-image')
      const title = aEl.getAttribute('data-title')
      const description = aEl.getAttribute('data-description')

      const shadow = this.attachShadow({ mode: 'closed' })
      aEl.textContent = ''
      aEl.appendChild(template.content.cloneNode(true))

      if (image) {
        aEl.querySelector('.figure').style.display = 'flex'

        Object.assign(aEl.querySelector('img'), {
          src: image,
          alt: title || href
        })
      }

      aEl.querySelector('.header').innerText = title || href

      if (description) {
        const descEl = aEl.querySelector('.description')
        descEl.innerText = description
        descEl.style.display = 'block'
      }

      shadow.appendChild(aEl)
    }
  }
}

customElements.define('x-card', XCard)
