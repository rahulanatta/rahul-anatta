import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';
import { CartAddEvent } from '@theme/events';

/**
 * @typedef {Object} PcpProductCardRefs
 * @property {HTMLElement} priceDisplay - The sale price element
 * @property {HTMLElement} comparePriceDisplay - The compare-at price element
 * @property {HTMLInputElement} variantInput - The hidden variant ID input
 * @property {HTMLElement} liveRegion - The live region for screen reader announcements
 * @property {HTMLButtonElement} addButton - The add to cart button
 */

/** @extends {Component<PcpProductCardRefs>} */
class PcpProductCard extends Component {
  /** @type {Array<{id: number, title: string, price: number, compare_at_price: number|null, options: string[], available: boolean}>} */
  #variants = [];

  /** @type {AbortController|null} */
  #abortController = null;

  connectedCallback() {
    super.connectedCallback();
    this.#abortController = new AbortController();

    const jsonScript = this.querySelector('script[type="application/json"]');

    if (jsonScript) {
      try {
        this.#variants = JSON.parse(jsonScript.textContent || '[]');
      } catch {
        this.#variants = [];
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  /**
   * Handles variant size button click
   * @param {MouseEvent} event
   */
  handleVariantSelect(event) {
    const button = /** @type {HTMLButtonElement} */ (event.currentTarget);
    const variantId = button.dataset.variantId;

    if (!variantId) return;

    const variant = this.#variants.find((v) => String(v.id) === variantId);

    if (!variant) return;

    // Update active state on all size buttons
    const allButtons = this.querySelectorAll('.ppc-card__size-btn');

    for (const btn of allButtons) {
      btn.classList.remove('ppc-card__size-btn--selected');
      btn.setAttribute('aria-pressed', 'false');
    }

    button.classList.add('ppc-card__size-btn--selected');
    button.setAttribute('aria-pressed', 'true');

    // Update hidden variant input
    if (this.refs.variantInput) {
      this.refs.variantInput.value = variantId;
    }

    // Update price display
    this.#updatePrice(variant);
  }

  /**
   * Updates the displayed price
   * @param {{price: number, compare_at_price: number|null}} variant
   */
  #updatePrice(variant) {
    if (this.refs.priceDisplay) {
      this.refs.priceDisplay.textContent = this.#formatMoney(variant.price);
    }

    if (this.refs.comparePriceDisplay) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        this.refs.comparePriceDisplay.textContent = this.#formatMoney(variant.compare_at_price);
        this.refs.comparePriceDisplay.style.display = '';
      } else {
        this.refs.comparePriceDisplay.style.display = 'none';
      }
    }
  }

  /**
   * Simple money formatter
   * @param {number} cents
   * @returns {string}
   */
  #formatMoney(cents) {
    const amount = (cents / 100).toFixed(2);
    return `$${amount}`;
  }

  /**
   * Handles add to cart form submission
   * @param {Event} event
   */
  async handleAddToCart(event) {
    event.preventDefault();

    const form = /** @type {HTMLFormElement|null} */ (event.currentTarget);

    if (!form) return;

    const addButton = this.refs.addButton;

    if (addButton) {
      addButton.disabled = true;
    }

    const formData = new FormData(form);

    // Get cart drawer section IDs for section rendering
    const cartItemsComponents = document.querySelectorAll('cart-items-component');
    const sectionIds = [];

    for (const item of cartItemsComponents) {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        sectionIds.push(item.dataset.sectionId);
      }
    }

    if (sectionIds.length > 0) {
      formData.append('sections', sectionIds.join(','));
    }

    const config = fetchConfig('javascript', { body: formData });

    try {
      const response = await fetch(window.Theme?.routes?.cart_add_url || '/cart/add.js', {
        ...config,
        headers: {
          ...config.headers,
          Accept: 'text/html',
        },
      });

      const data = await response.json();

      if (data.status) {
        // Error
        if (this.refs.liveRegion) {
          this.refs.liveRegion.textContent = data.message || 'Error adding to cart';
        }
      } else {
        // Success — dispatch CartAddEvent so cart drawer opens
        document.dispatchEvent(
          new CartAddEvent(undefined, this.id, {
            source: 'pcp-product-card',
            itemCount: Number(formData.get('quantity')) || 1,
            productId: this.dataset.productId,
            sections: data.sections,
          })
        );

        if (this.refs.liveRegion) {
          this.refs.liveRegion.textContent = window.Theme?.translations?.added || 'Added to cart';
          setTimeout(() => {
            if (this.refs.liveRegion) {
              this.refs.liveRegion.textContent = '';
            }
          }, 5000);
        }
      }
    } catch (error) {
      console.error('PCP product card add to cart error:', error);
    } finally {
      if (addButton) {
        addButton.disabled = false;
      }
    }
  }
}

if (!customElements.get('pcp-product-card')) {
  customElements.define('pcp-product-card', PcpProductCard);
}

/**
 * @typedef {Object} PcpProductCarouselRefs
 * @property {HTMLElement} track - The scrollable track
 * @property {HTMLButtonElement} prevButton - Previous button
 * @property {HTMLButtonElement} nextButton - Next button
 */

/** @extends {Component<PcpProductCarouselRefs>} */
class PcpProductCarousel extends Component {
  connectedCallback() {
    super.connectedCallback();

    if (this.refs.track) {
      this.refs.track.addEventListener('scroll', this.#updateButtons.bind(this), { passive: true });
      this.#updateButtons();
    }
  }

  /** Updates prev/next button visibility based on scroll position */
  #updateButtons() {
    const { track, prevButton, nextButton } = this.refs;

    if (!track || !prevButton || !nextButton) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;

    prevButton.disabled = scrollLeft <= 0;
    nextButton.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
  }

  /** Scrolls to the previous set of cards */
  handlePrev() {
    const { track } = this.refs;

    if (!track) return;

    const cardWidth = track.querySelector('.ppc-card')?.offsetWidth || 237;
    track.scrollBy({ left: -(cardWidth + 12), behavior: 'smooth' });
  }

  /** Scrolls to the next set of cards */
  handleNext() {
    const { track } = this.refs;

    if (!track) return;

    const cardWidth = track.querySelector('.ppc-card')?.offsetWidth || 237;
    track.scrollBy({ left: cardWidth + 12, behavior: 'smooth' });
  }
}

if (!customElements.get('pcp-product-carousel')) {
  customElements.define('pcp-product-carousel', PcpProductCarousel);
}
