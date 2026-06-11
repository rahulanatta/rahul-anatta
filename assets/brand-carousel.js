import { Component } from '@theme/component';

/**
 * @typedef {Object} BrandCarouselRefs
 * @property {HTMLElement} track - The scrollable carousel track
 * @property {HTMLButtonElement} prevBtn - Previous arrow button
 * @property {HTMLButtonElement} nextBtn - Next arrow button
 */

/** @extends {Component<BrandCarouselRefs>} */
class BrandCarouselComponent extends Component {
  /** @type {number|null} */
  #autoPlayInterval = null;

  /** @type {boolean} */
  #isPaused = false;

  connectedCallback() {
    super.connectedCallback();

    if (this.refs.track) {
      this.refs.track.addEventListener('scroll', this.#handleScroll, { passive: true });
    }

    this.#updateArrows();
    this.#initAutoPlay();

    this.addEventListener('mouseenter', this.#handleMouseEnter);
    this.addEventListener('mouseleave', this.#handleMouseLeave);
    this.addEventListener('focusin', this.#handleMouseEnter);
    this.addEventListener('focusout', this.#handleMouseLeave);

    if (this.refs.track) {
      this.refs.track.addEventListener('touchstart', this.#handleTouchStart, { passive: true });
      this.refs.track.addEventListener('touchend', this.#handleTouchEnd, { passive: true });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopAutoPlay();

    if (this.refs.track) {
      this.refs.track.removeEventListener('scroll', this.#handleScroll);
      this.refs.track.removeEventListener('touchstart', this.#handleTouchStart);
      this.refs.track.removeEventListener('touchend', this.#handleTouchEnd);
    }

    this.removeEventListener('mouseenter', this.#handleMouseEnter);
    this.removeEventListener('mouseleave', this.#handleMouseLeave);
    this.removeEventListener('focusin', this.#handleMouseEnter);
    this.removeEventListener('focusout', this.#handleMouseLeave);
  }

  /** Scrolls the track to the previous page of items */
  handlePrev() {
    const { track } = this.refs;
    if (!track) return;

    const scrollAmount = this.#getPageScrollAmount();
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  /** Scrolls the track to the next page of items */
  handleNext() {
    const { track } = this.refs;
    if (!track) return;

    const scrollAmount = this.#getPageScrollAmount();
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  /**
   * Calculates the scroll amount for one page of items.
   * @returns {number}
   */
  #getPageScrollAmount() {
    const { track } = this.refs;
    if (!track) return 0;
    return track.clientWidth;
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

  /** @type {number|null} */
  #scrollRafId = null;

  /** Handles scroll events on the track */
  #handleScroll = () => {
    if (this.#scrollRafId !== null) return;

    this.#scrollRafId = requestAnimationFrame(() => {
      this.#scrollRafId = null;
      this.#updateArrows();
    });
  };

  /** Initializes auto-play if enabled */
  #initAutoPlay() {
    const autoPlay = this.dataset.autoPlay === 'true';
    if (!autoPlay) return;

    const speed = parseInt(this.dataset.speed, 10) || 3;
    const intervalMs = speed * 1000;

    this.#autoPlayInterval = setInterval(() => {
      if (this.#isPaused) return;
      this.#autoAdvance();
    }, intervalMs);
  }

  /** Stops auto-play */
  #stopAutoPlay() {
    if (this.#autoPlayInterval !== null) {
      clearInterval(this.#autoPlayInterval);
      this.#autoPlayInterval = null;
    }
  }

  /** Auto-advances the carousel; wraps to start when reaching the end */
  #autoAdvance() {
    const { track } = this.refs;
    if (!track) return;

    const scrollLeft = Math.round(track.scrollLeft);
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (scrollLeft >= maxScroll - 1) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      const scrollAmount = this.#getPageScrollAmount();
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  /** Pauses auto-play on hover/focus */
  #handleMouseEnter = () => {
    this.#isPaused = true;
  };

  /** Resumes auto-play on mouse-leave/focus-out */
  #handleMouseLeave = () => {
    this.#isPaused = false;
  };

  /** Pauses auto-play on touch start */
  #handleTouchStart = () => {
    this.#isPaused = true;
  };

  /** Resumes auto-play after touch end */
  #handleTouchEnd = () => {
    this.#isPaused = false;
  };
}

if (!customElements.get('brand-carousel-component')) {
  customElements.define('brand-carousel-component', BrandCarouselComponent);
}
