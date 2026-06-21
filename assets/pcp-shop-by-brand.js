import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';
import { CartAddEvent } from '@theme/events';

/**
 * @typedef {Object} PcpShopByBrandRefs
 * @property {HTMLElement[]} tabButtons - Tab button elements
 * @property {HTMLElement[]} tabPanels - Tab panel elements
 */

/** @extends {Component<PcpShopByBrandRefs>} */
class PcpShopByBrand extends Component {
  connectedCallback() {
    super.connectedCallback();
  }

  /**
   * Handles tab button click — activates the corresponding tab panel
   * @param {MouseEvent} event
   */
  handleTabClick(event) {
    const button = /** @type {HTMLButtonElement} */ (event.currentTarget);
    const index = button.dataset.index;

    if (!index) return;

    // Update tab buttons
    const tabButtons = this.querySelectorAll('[role="tab"]');

    for (const btn of tabButtons) {
      btn.setAttribute('aria-selected', 'false');
      btn.classList.remove('sbb__tab--active');
    }

    button.setAttribute('aria-selected', 'true');
    button.classList.add('sbb__tab--active');

    // Update tab panels
    const tabPanels = this.querySelectorAll('[role="tabpanel"]');

    for (const panel of tabPanels) {
      panel.hidden = true;
    }

    const targetPanel = this.querySelector(`[data-panel-index="${index}"]`);

    if (targetPanel) {
      targetPanel.hidden = false;
    }
  }

  /**
   * Handles add to cart form submission
   * @param {Event} event
   */
  async handleAddToCart(event) {
    event.preventDefault();

    const form = /** @type {HTMLFormElement} */ (event.currentTarget);

    if (!form) return;

    const addButton = form.querySelector('.sbb-card__add-btn');

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

      if (!data.status) {
        // Success — dispatch CartAddEvent so cart drawer opens
        document.dispatchEvent(
          new CartAddEvent(undefined, this.id, {
            source: 'pcp-shop-by-brand',
            itemCount: Number(formData.get('quantity')) || 1,
            sections: data.sections,
          })
        );
      }
    } catch (error) {
      console.error('Shop by brand add to cart error:', error);
    } finally {
      if (addButton) {
        addButton.disabled = false;
      }
    }
  }
}

if (!customElements.get('pcp-shop-by-brand')) {
  customElements.define('pcp-shop-by-brand', PcpShopByBrand);
}
