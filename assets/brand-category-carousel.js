import { Component } from '@theme/component';

/**
 * @typedef {Object} BrandCategoryCarouselRefs
 * @property {HTMLElement} track - The scrollable carousel track
 * @property {HTMLButtonElement} prevBtn - Previous arrow button
 * @property {HTMLButtonElement} nextBtn - Next arrow button
 * @property {HTMLElement} arrowsWrap - Wrapper for arrow buttons
 */

/** @extends {Component<BrandCategoryCarouselRefs>} */
class BrandCategoryCarousel extends Component {
  /** @type {number|null} */
  #scrollRafId = null;

  /** @type {ResizeObserver|null} */
  #resizeObserver = null;

  connectedCallback() {
    super.connectedCallback();

    if (this.refs.track) {
      this.refs.track.addEventListener('scroll', this.#handleScroll, { passive: true });
    }

    this.#resizeObserver = new ResizeObserver(() => {
      this.#updateArrowVisibility();
      this.#updateArrows();
    });

    if (this.refs.track) {
      this.#resizeObserver.observe(this.refs.track);
    }

    this.#updateArrowVisibility();
    this.#updateArrows();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.refs.track) {
      this.refs.track.removeEventListener('scroll', this.#handleScroll);
    }

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }

    if (this.#scrollRafId !== null) {
      cancelAnimationFrame(this.#scrollRafId);
      this.#scrollRafId = null;
    }
  }

  /** Scrolls the track to the previous card */
  handlePrev() {
    const { track } = this.refs;
    if (!track) return;

    const scrollAmount = this.#getScrollAmount();
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  /** Scrolls the track to the next card */
  handleNext() {
    const { track } = this.refs;
    if (!track) return;

    const scrollAmount = this.#getScrollAmount();
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  /**
   * Calculates scroll amount based on first card width + gap.
   * @returns {number}
   */
  #getScrollAmount() {
    const { track } = this.refs;
    if (!track) return 0;

    const firstCard = track.firstElementChild;
    if (!firstCard) return track.clientWidth;

    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return firstCard.offsetWidth + gap;
  }

  /** Hides arrows when track content does not overflow */
  #updateArrowVisibility() {
    const { track, arrowsWrap } = this.refs;
    if (!track || !arrowsWrap) return;

    const isScrollable = track.scrollWidth > track.clientWidth + 1;
    arrowsWrap.style.display = isScrollable ? 'flex' : 'none';
  }

  /** Updates arrow disabled state based on scroll position */
  #updateArrows = () => {
    const { track, prevBtn, nextBtn } = this.refs;
    if (!track) return;

    const scrollLeft = Math.round(track.scrollLeft);
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (prevBtn) {
      prevBtn.disabled = scrollLeft <= 1;
    }

    if (nextBtn) {
      nextBtn.disabled = scrollLeft >= maxScroll - 1;
    }
  };

  /** Handles scroll events with requestAnimationFrame throttling */
  #handleScroll = () => {
    if (this.#scrollRafId !== null) return;

    this.#scrollRafId = requestAnimationFrame(() => {
      this.#scrollRafId = null;
      this.#updateArrows();
    });
  };
}

if (!customElements.get('brand-category-carousel')) {
  customElements.define('brand-category-carousel', BrandCategoryCarousel);
}
