// @ts-check
import { LitElement, html, css } from 'lit-element'
import yaml from 'js-yaml'

export class XCard extends LitElement {
  constructor() {
    super()

    this.href = (this.querySelector('a') || {}).href
    /**
     * @type {*}
     */
    // @ts-ignore
    this.meta = yaml.safeLoad(this.querySelector('#yaml').innerText) || {}
  }

  static get styles() {
    return css`
      * {
        font-family: sans-serif;
      }

      #Card {
        text-decoration: none;
        display: flex;
        flex-direction: row;
        max-width: 600px;
        margin: 1rem;
        padding: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }

      .figure {
        display: flex;
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
        min-height: 4em;
      }
    `;
  }

  render() { 
    return html`
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.css">
      <a id="Card" href="https://github.com/patarapolw/encodeuri-plus" target="_blank" rel="noopener noreferrer">
        ${ this.meta.image && html`
          <div class="figure">
            <img src="${this.meta.image}" alt="$${this.meta.title || this.meta.url}" />
          </div>
        ` }
        <article>
          <h3 class="header">${ this.meta.title || this.meta.url || this.href }</h3>
          ${ this.meta.description && html`
            <div class="description">${ this.meta.description }</div>
          ` }
        </article>
      </a>
    `;
  }
}

customElements.define('x-card', XCard)
