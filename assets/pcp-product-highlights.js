import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';
import { CartAddEvent } from '@theme/events';

/**
 * @typedef {Object} PcpProductHighlightsRefs
 * @property {HTMLButtonElement[]} tabButtons - Tab button elements
 * @property {HTMLElement[]} tabPanels - Tab panel elements
 */

/** @extends {Component<PcpProductHighlightsRefs>} */
class PcpProductHighlights extends Component {
  /** @type {string[]} */
  #descriptions = [];

  /** @type {HTMLSelectElement|null} */
  #dropdown = null;

  /** @type {HTMLParagraphElement|null} */
  #mobileDesc = null;

  connectedCallback() {
    super.connectedCallback();

    this.#dropdown = this.querySelector('.phl__dropdown');
    this.#mobileDesc = this.querySelector('.phl__mobile-desc');

    // Cache tab descriptions for mobile sync
    const tabs = this.querySelectorAll('[role="tab"]');

    for (const tab of tabs) {
      this.#descriptions.push(tab.dataset.description || '');
    }

    // Bind dropdown change event
    if (this.#dropdown) {
      this.#dropdown.addEventListener('change', this.#handleDropdownChange.bind(this));
    }
  }

  /**
   * Handles tab button click — activates the corresponding tab panel
   * @param {MouseEvent} event
   */
  handleTabClick(event) {
    const button = /** @type {HTMLButtonElement} */ (event.currentTarget);
    const index = button.dataset.index;

    if (index == null) return;

    this.#switchTab(parseInt(index, 10));
  }

  /**
   * Handles mobile dropdown change
   * @param {Event} event
   */
  #handleDropdownChange(event) {
    const select = /** @type {HTMLSelectElement} */ (event.currentTarget);
    this.#switchTab(parseInt(select.value, 10));
  }

  /**
   * Switches active tab, panel, dropdown, and mobile description
   * @param {number} index
   */
  #switchTab(index) {
    // Update tab buttons
    const tabButtons = this.querySelectorAll('[role="tab"]');

    for (const btn of tabButtons) {
      btn.setAttribute('aria-selected', 'false');
      btn.classList.remove('phl__tab--active');
    }

    const activeTab = tabButtons[index];

    if (activeTab) {
      activeTab.setAttribute('aria-selected', 'true');
      activeTab.classList.add('phl__tab--active');
    }

    // Update tab panels
    const tabPanels = this.querySelectorAll('[role="tabpanel"]');

    for (const panel of tabPanels) {
      panel.hidden = true;
    }

    const targetPanel = this.querySelector(`[data-panel-index="${index}"]`);

    if (targetPanel) {
      targetPanel.hidden = false;
    }

    // Sync dropdown selection
    if (this.#dropdown) {
      this.#dropdown.value = String(index);
    }

    // Update mobile description
    if (this.#mobileDesc) {
      const desc = this.#descriptions[index] || '';

      if (desc) {
        this.#mobileDesc.textContent = desc;
        this.#mobileDesc.hidden = false;
      } else {
        this.#mobileDesc.textContent = '';
        this.#mobileDesc.hidden = true;
      }
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

    const addButton = form.querySelector('.phl-card__add-btn');

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
            source: 'pcp-product-highlights',
            itemCount: Number(formData.get('quantity')) || 1,
            sections: data.sections,
          })
        );
      }
    } catch (error) {
      console.error('Product highlights add to cart error:', error);
    } finally {
      if (addButton) {
        addButton.disabled = false;
      }
    }
  }
}

if (!customElements.get('pcp-product-highlights')) {
  customElements.define('pcp-product-highlights', PcpProductHighlights);
}
