import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';
import { CartAddEvent } from '@theme/events';

/**
 * @typedef {Object} ProductBundleRefs
 * @property {HTMLButtonElement} addBundleBtn - The add bundle to cart button
 * @property {HTMLElement} btnText - The button text element
 * @property {HTMLElement} liveRegion - Aria live region for screen reader announcements
 */

/** @extends {Component<ProductBundleRefs>} */
class ProductBundleSection extends Component {
  /** @type {AbortController|null} */
  #abortController = null;

  connectedCallback() {
    super.connectedCallback();
    this.#abortController = new AbortController();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
    this.#abortController = null;
  }

  /**
   * Handles the add bundle to cart button click
   * @param {MouseEvent} event
   */
  async handleAddBundle(event) {
    event.preventDefault();

    const variantIds = this.dataset.variantIds;

    if (!variantIds) return;

    const ids = variantIds.split(',').filter(Boolean);

    if (ids.length === 0) return;

    const addButton = this.refs.addBundleBtn;
    const btnText = this.refs.btnText;
    const originalText = btnText?.textContent || '';

    if (addButton) {
      addButton.disabled = true;
    }

    if (btnText) {
      btnText.textContent = 'Adding...';
    }

    const sectionId = this.dataset.sectionId || '';
    const items = ids.map((id) => ({
      id: Number(id),
      quantity: 1,
      properties: {
        _bundle: sectionId,
      },
    }));

    // Get cart drawer section IDs for section rendering
    const cartItemsComponents = document.querySelectorAll('cart-items-component');
    const sectionIds = [];

    for (const item of cartItemsComponents) {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        sectionIds.push(item.dataset.sectionId);
      }
    }

    const body = { items };

    if (sectionIds.length > 0) {
      body.sections = sectionIds.join(',');
    }

    const config = fetchConfig('json', {
      body: JSON.stringify(body),
    });

    try {
      const response = await fetch(window.Theme?.routes?.cart_add_url || '/cart/add.js', config);
      const data = await response.json();

      if (data.status) {
        // Error response
        if (this.refs.liveRegion) {
          this.refs.liveRegion.textContent = data.message || 'Error adding to cart';
        }

        if (btnText) {
          btnText.textContent = 'Try again';
          setTimeout(() => {
            btnText.textContent = originalText;
          }, 3000);
        }
      } else {
        // Fetch updated cart to get accurate item_count for cart icon
        let cart = null;
        try {
          const cartResponse = await fetch('/cart.js');
          cart = await cartResponse.json();
        } catch (_) {
          // fallback: item_count won't be exact but drawer still opens
        }

        // Dispatch CartAddEvent — opens cart drawer (auto-open) and updates cart icon + items
        document.dispatchEvent(
          new CartAddEvent(cart, this.id, {
            source: 'product-bundle',
            itemCount: cart?.item_count ?? ids.length,
            sections: data.sections,
          })
        );

        // Direct fallback: open cart drawer if it hasn't responded to the event
        const cartDrawer = document.querySelector('cart-drawer-component');
        if (cartDrawer && typeof cartDrawer.showDialog === 'function') {
          cartDrawer.showDialog();
        }

        if (btnText) {
          btnText.textContent = 'Added!';
          setTimeout(() => {
            btnText.textContent = originalText;
          }, 3000);
        }

        if (this.refs.liveRegion) {
          this.refs.liveRegion.textContent = 'Bundle added to cart';
          setTimeout(() => {
            if (this.refs.liveRegion) {
              this.refs.liveRegion.textContent = '';
            }
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Product bundle add to cart error:', error);

      if (btnText) {
        btnText.textContent = 'Try again';
        setTimeout(() => {
          btnText.textContent = originalText;
        }, 3000);
      }
    } finally {
      if (addButton) {
        addButton.disabled = false;
      }
    }
  }
}

if (!customElements.get('product-bundle-section')) {
  customElements.define('product-bundle-section', ProductBundleSection);
}
