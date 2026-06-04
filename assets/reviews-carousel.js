import { Component } from '@theme/component';

/**
 * @typedef {Object} ReviewsCarouselRefs
 * @property {HTMLElement} track - The scrollable track
 * @property {HTMLButtonElement} prevButton - Previous button
 * @property {HTMLButtonElement} nextButton - Next button
 */

/** @extends {Component<ReviewsCarouselRefs>} */
class ReviewsCarousel extends Component {
  /** @type {NodeListOf<HTMLElement>|null} */
  #dots = null;

  /** @type {number} */
  #currentIndex = 0;

  /** @type {number} */
  #totalSlides = 0;

  connectedCallback() {
    super.connectedCallback();

    this.#dots = this.querySelectorAll('.reviews-carousel__dot');
    this.#totalSlides = this.querySelectorAll('.reviews-carousel__slide').length;

    if (this.refs.track) {
      this.refs.track.addEventListener('scroll', this.#handleScroll.bind(this), { passive: true });
    }

    this.#updateState();
  }

  /** Handles scroll events to update active dot and button states */
  #handleScroll() {
    const { track } = this.refs;

    if (!track) return;

    const slideWidth = track.clientWidth;

    if (slideWidth === 0) return;

    const newIndex = Math.round(track.scrollLeft / slideWidth);

    if (newIndex !== this.#currentIndex) {
      this.#currentIndex = newIndex;
      this.#updateState();
    }
  }

  /** Updates dot indicators and button disabled states */
  #updateState() {
    const { prevButton, nextButton } = this.refs;

    if (this.#dots) {
      for (const [index, dot] of this.#dots.entries()) {
        dot.classList.toggle('reviews-carousel__dot--active', index === this.#currentIndex);
      }
    }

    if (prevButton) {
      prevButton.disabled = this.#currentIndex <= 0;
    }

    if (nextButton) {
      nextButton.disabled = this.#currentIndex >= this.#totalSlides - 1;
    }
  }

  /** Scrolls to the previous review */
  handlePrev() {
    const { track } = this.refs;

    if (!track) return;

    const slideWidth = track.clientWidth;
    track.scrollBy({ left: -slideWidth, behavior: 'smooth' });
  }

  /** Scrolls to the next review */
  handleNext() {
    const { track } = this.refs;

    if (!track) return;

    const slideWidth = track.clientWidth;
    track.scrollBy({ left: slideWidth, behavior: 'smooth' });
  }
}

if (!customElements.get('reviews-carousel')) {
  customElements.define('reviews-carousel', ReviewsCarousel);
}
