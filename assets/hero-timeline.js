import { Component } from '@theme/component';

/**
 * @typedef {Object} HeroTimelineCarouselRefs
 * @property {HTMLElement} track - The slide track container
 * @property {HTMLElement[]} slides - Array of slide elements
 * @property {HTMLButtonElement} prevButton - Previous arrow button
 * @property {HTMLButtonElement} nextButton - Next arrow button
 * @property {HTMLButtonElement[]} dots - Array of dot indicator buttons
 */

/** @extends {Component<HeroTimelineCarouselRefs>} */
class HeroTimelineCarousel extends Component {
  /** @type {number} */
  #currentIndex = 0;

  /** @type {number|null} */
  #autoplayInterval = null;

  /** @type {AbortController|null} */
  #abortController = null;

  connectedCallback() {
    super.connectedCallback();
    this.#abortController = new AbortController();
    this.#currentIndex = 0;
    this.#updateUI();
    this.#initAutoplay();

    const signal = this.#abortController.signal;

    this.addEventListener('mouseenter', () => this.#pauseAutoplay(), { signal });
    this.addEventListener('mouseleave', () => this.#resumeAutoplay(), { signal });
    this.addEventListener('focusin', () => this.#pauseAutoplay(), { signal });
    this.addEventListener('focusout', () => this.#resumeAutoplay(), { signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#pauseAutoplay();
    this.#abortController?.abort();
    this.#abortController = null;
  }

  /** @returns {number} */
  get #slideCount() {
    return this.refs.slides?.length || 0;
  }

  /** @returns {boolean} */
  get #autoplayEnabled() {
    return this.dataset.autoplay === 'true';
  }

  /** @returns {number} */
  get #autoplaySpeed() {
    const speed = parseInt(this.dataset.autoplaySpeed, 10);
    return Number.isFinite(speed) && speed > 0 ? speed * 1000 : 5000;
  }

  /** Initializes autoplay if enabled */
  #initAutoplay() {
    if (!this.#autoplayEnabled) return;
    this.#startAutoplay();
  }

  #startAutoplay() {
    if (this.#autoplayInterval) return;

    this.#autoplayInterval = setInterval(() => {
      const nextIndex = this.#currentIndex + 1 < this.#slideCount
        ? this.#currentIndex + 1
        : 0;
      this.#goToSlide(nextIndex);
    }, this.#autoplaySpeed);
  }

  #pauseAutoplay() {
    if (this.#autoplayInterval) {
      clearInterval(this.#autoplayInterval);
      this.#autoplayInterval = null;
    }
  }

  #resumeAutoplay() {
    if (this.#autoplayEnabled) {
      this.#startAutoplay();
    }
  }

  /**
   * Navigate to a specific slide
   * @param {number} index
   */
  #goToSlide(index) {
    if (index < 0 || index >= this.#slideCount) return;

    this.#currentIndex = index;
    this.#updateUI();
  }

  /** Updates track position, button states, and active dot */
  #updateUI() {
    const { track, prevButton, nextButton, dots } = this.refs;

    if (track) {
      track.style.transform = `translateX(-${this.#currentIndex * 100}%)`;
    }

    if (prevButton) {
      prevButton.disabled = this.#currentIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled = this.#currentIndex >= this.#slideCount - 1;
    }

    if (dots) {
      for (const [i, dot] of dots.entries()) {
        const isActive = i === this.#currentIndex;
        dot.classList.toggle('hero-timeline__dot--active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      }
    }
  }

  /** Handles previous button click */
  handlePrev() {
    this.#pauseAutoplay();
    this.#goToSlide(this.#currentIndex - 1);
    this.#resumeAutoplay();
  }

  /** Handles next button click */
  handleNext() {
    this.#pauseAutoplay();
    this.#goToSlide(this.#currentIndex + 1);
    this.#resumeAutoplay();
  }

  /**
   * Handles dot indicator click
   * @param {MouseEvent} event
   */
  handleDotClick(event) {
    const button = /** @type {HTMLButtonElement} */ (event.currentTarget);
    const index = parseInt(button.dataset.index, 10);

    if (!Number.isFinite(index)) return;

    this.#pauseAutoplay();
    this.#goToSlide(index);
    this.#resumeAutoplay();
  }
}

if (!customElements.get('hero-timeline-carousel')) {
  customElements.define('hero-timeline-carousel', HeroTimelineCarousel);
}
