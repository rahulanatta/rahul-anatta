import { Component } from '@theme/component';

/**
 * @typedef {Object} ImagesCuratedReviewsRefs
 * @property {HTMLElement} track - The scrollable track
 * @property {HTMLButtonElement} [prevButton] - Previous button
 * @property {HTMLButtonElement} [nextButton] - Next button
 */

/** @extends {Component<ImagesCuratedReviewsRefs>} */
class ImagesCuratedReviews extends Component {
  /** @type {NodeListOf<HTMLElement>|null} */
  #dots = null;

  /** @type {number} */
  #currentIndex = 0;

  /** @type {number} */
  #totalSlides = 0;

  connectedCallback() {
    super.connectedCallback();

    this.#dots = this.querySelectorAll('.images-curated-reviews__dot');
    this.#totalSlides = this.querySelectorAll('.images-curated-reviews__slide').length;

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
        dot.classList.toggle('images-curated-reviews__dot--active', index === this.#currentIndex);
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

    track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
  }

  /** Scrolls to the next review */
  handleNext() {
    const { track } = this.refs;

    if (!track) return;

    track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
  }
}

if (!customElements.get('images-curated-reviews')) {
  customElements.define('images-curated-reviews', ImagesCuratedReviews);
}
