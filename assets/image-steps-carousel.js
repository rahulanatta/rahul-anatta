import { Component } from '@theme/component';

/**
 * @typedef {Object} ImageStepsCarouselRefs
 * @property {HTMLElement} track - The scrollable slide track
 * @property {HTMLButtonElement} prevButton - Previous arrow button
 * @property {HTMLButtonElement} nextButton - Next arrow button
 */

/** @extends {Component<ImageStepsCarouselRefs>} */
class ImageStepsCarousel extends Component {
  /** @type {number} */
  #currentIndex = 0;

  /** @type {NodeListOf<HTMLElement>|null} */
  #slides = null;

  /** @type {NodeListOf<HTMLElement>|null} */
  #steps = null;

  /** @type {boolean} */
  #isScrolling = false;

  /** @type {number|null} */
  #scrollEndTimer = null;

  /** @type {AbortController|null} */
  #abortController = null;

  connectedCallback() {
    super.connectedCallback();

    this.#abortController = new AbortController();
    this.#slides = this.querySelectorAll('[data-slide-index]');
    this.#steps = this.querySelectorAll('[data-step-index]');
    this.#currentIndex = 0;

    if (this.refs.track) {
      this.refs.track.addEventListener('scroll', this.#handleScroll.bind(this), {
        passive: true,
        signal: this.#abortController.signal,
      });
    }

    this.#syncStepHighlight();
    this.#updateButtons();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#scrollEndTimer) {
      clearTimeout(this.#scrollEndTimer);
      this.#scrollEndTimer = null;
    }

    this.#abortController?.abort();
    this.#abortController = null;
  }

  /** @returns {number} */
  get #totalSlides() {
    return this.#slides?.length ?? 0;
  }

  /** @returns {number} */
  get #totalSteps() {
    return this.#steps?.length ?? 0;
  }

  /** @returns {number} */
  get #maxIndex() {
    return Math.max(0, Math.min(this.#totalSlides, this.#totalSteps) - 1);
  }

  /** Handles scroll events on the track to detect which slide is visible */
  #handleScroll() {
    if (this.#isScrolling) return;

    const { track } = this.refs;

    if (!track || this.#totalSlides === 0) return;

    /* Debounce: treat the last scroll event within 100ms as "scroll end" */
    if (this.#scrollEndTimer) {
      clearTimeout(this.#scrollEndTimer);
    }

    this.#scrollEndTimer = setTimeout(() => {
      this.#onScrollEnd();
    }, 100);
  }

  /** Called when scroll settles — computes the nearest visible slide */
  #onScrollEnd() {
    const { track } = this.refs;

    if (!track || !this.#slides || this.#totalSlides === 0) return;

    const slideWidth = this.#slides[0].offsetWidth;

    if (slideWidth === 0) return;

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const newIndex = Math.round(track.scrollLeft / (slideWidth + gap));
    const clampedIndex = Math.max(0, Math.min(newIndex, this.#maxIndex));

    if (clampedIndex !== this.#currentIndex) {
      this.#currentIndex = clampedIndex;
      this.#syncStepHighlight();
      this.#updateButtons();
    }
  }

  /**
   * Handles step click — scrolls carousel to the matching slide
   * @param {MouseEvent} event
   */
  goToStep(event) {
    const step = /** @type {HTMLElement} */ (event.currentTarget);
    const index = parseInt(step.dataset.stepIndex, 10);

    if (!Number.isFinite(index) || index === this.#currentIndex) return;

    const clampedIndex = Math.max(0, Math.min(index, this.#maxIndex));
    this.#currentIndex = clampedIndex;
    this.#scrollToSlide(clampedIndex);
    this.#syncStepHighlight();
    this.#updateButtons();
  }

  /** Scrolls to the previous slide */
  scrollPrev() {
    if (this.#currentIndex <= 0) return;

    this.#currentIndex -= 1;
    this.#scrollToSlide(this.#currentIndex);
    this.#syncStepHighlight();
    this.#updateButtons();
  }

  /** Scrolls to the next slide */
  scrollNext() {
    if (this.#currentIndex >= this.#maxIndex) return;

    this.#currentIndex += 1;
    this.#scrollToSlide(this.#currentIndex);
    this.#syncStepHighlight();
    this.#updateButtons();
  }

  /**
   * Programmatically scrolls the track to a given slide index
   * @param {number} index
   */
  #scrollToSlide(index) {
    const { track } = this.refs;

    if (!track || !this.#slides || !this.#slides[index]) return;

    /* Set lock to prevent the scroll handler from re-syncing */
    this.#isScrolling = true;

    const slide = this.#slides[index];
    const scrollTarget = slide.offsetLeft - track.offsetLeft;

    track.scrollTo({ left: scrollTarget, behavior: 'smooth' });

    /* Release lock after the smooth scroll finishes (~400ms is a safe upper bound) */
    setTimeout(() => {
      this.#isScrolling = false;
    }, 450);
  }

  /** Toggles the --active class on steps to match #currentIndex */
  #syncStepHighlight() {
    if (!this.#steps) return;

    for (const [i, step] of this.#steps.entries()) {
      step.classList.toggle('image-steps-carousel__step--active', i === this.#currentIndex);
    }
  }

  /** Disables prev at 0, next at last index */
  #updateButtons() {
    const { prevButton, nextButton } = this.refs;

    if (prevButton) {
      prevButton.disabled = this.#currentIndex <= 0;
    }

    if (nextButton) {
      nextButton.disabled = this.#currentIndex >= this.#maxIndex;
    }
  }
}

if (!customElements.get('image-steps-carousel')) {
  customElements.define('image-steps-carousel', ImageStepsCarousel);
}
