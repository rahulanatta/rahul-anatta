import { DialogComponent, DialogCloseEvent } from '@theme/dialog';

/**
 * @typedef {Object} IngredientDrawerRefs
 * @property {HTMLDialogElement} dialog - The dialog element
 * @property {HTMLElement} drawerTitle - Title text element in header
 * @property {HTMLElement} drawerContent - Content container in body
 */

/** @extends {DialogComponent} */
class IngredientDrawerComponent extends DialogComponent {
  /** @type {AbortController | null} */
  #sectionAbortController = null;

  connectedCallback() {
    super.connectedCallback();

    this.#sectionAbortController = new AbortController();
    const signal = this.#sectionAbortController.signal;

    this.addEventListener('click', this.#handleCardClick, { signal });
    this.addEventListener(DialogCloseEvent.eventName, this.#handleDialogClose, { signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#sectionAbortController?.abort();
    this.#sectionAbortController = null;
  }

  /**
   * Handles click events delegated from ingredient cards
   * @param {MouseEvent} event
   */
  #handleCardClick = (event) => {
    const trigger = /** @type {HTMLElement} */ (event.target).closest('[data-ingredient-drawer]');
    if (!trigger) return;

    event.preventDefault();
    const blockId = trigger.getAttribute('data-ingredient-drawer');
    if (blockId) {
      this.#openIngredient(blockId);
    }
  };

  /**
   * Opens the drawer with content from a matching template
   * @param {string} blockId - The block ID to find the template for
   */
  #openIngredient(blockId) {
    const template = /** @type {HTMLTemplateElement | null} */ (
      this.querySelector(`template[data-ingredient="${blockId}"]`)
    );

    if (!template) return;

    const { drawerTitle, drawerContent } = this.refs;

    if (drawerContent) {
      drawerContent.innerHTML = '';
      const clone = template.content.cloneNode(true);
      drawerContent.appendChild(clone);
      this.#initGallery(drawerContent);
    }

    if (drawerTitle) {
      drawerTitle.textContent = template.dataset.title || 'Ingredient';
    }

    this.showDialog();
  }

  /**
   * Initializes gallery thumbnail click and scroll behavior
   * @param {HTMLElement} container
   */
  #initGallery(container) {
    const gallery = container.querySelector('.ingredient-drawer__gallery');
    if (!gallery) return;

    const thumbs = gallery.querySelectorAll('.ingredient-drawer__gallery-thumb');
    const nextBtn = gallery.querySelector('.ingredient-drawer__gallery-next');

    for (const thumb of thumbs) {
      thumb.addEventListener('click', () => {
        for (const t of thumbs) {
          t.classList.remove('is-active');
        }
        thumb.classList.add('is-active');
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const firstThumb = gallery.querySelector('.ingredient-drawer__gallery-thumb');
        if (!firstThumb) return;
        const scrollAmount = firstThumb.offsetWidth + 16;
        gallery.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  }

  /**
   * Clears drawer content after the dialog closes
   */
  #handleDialogClose = () => {
    const { drawerContent, drawerTitle } = this.refs;
    if (drawerContent) {
      drawerContent.innerHTML = '';
    }
    if (drawerTitle) {
      drawerTitle.textContent = 'Ingredient';
    }
  };
}

if (!customElements.get('ingredient-drawer-component')) {
  customElements.define('ingredient-drawer-component', IngredientDrawerComponent);
}
