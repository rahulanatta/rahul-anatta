import { Component } from '@theme/component';

/**
 * @typedef {Object} PcpMediaCarouselRefs
 * @property {HTMLElement} track - The scrollable card track
 * @property {HTMLElement} dots - The pagination dots container
 */

/** @extends {Component<PcpMediaCarouselRefs>} */
class PcpMediaCarousel extends Component {
  /** @type {number} */
  #cardsPerView = 2;

  /** @type {number} */
  #totalPages = 1;

  /** @type {number} */
  #activePage = 0;

  /** @type {ResizeObserver|null} */
  #resizeObserver = null;

  connectedCallback() {
    super.connectedCallback();

    if (!this.refs.track || !this.refs.dots) return;

    this.#calculateCardsPerView();
    this.#buildDots();

    this.refs.track.addEventListener('scroll', this.#handleScroll.bind(this), { passive: true });

    this.#resizeObserver = new ResizeObserver(() => {
      const prevPerView = this.#cardsPerView;
      this.#calculateCardsPerView();

      if (prevPerView !== this.#cardsPerView) {
        this.#buildDots();
      }
    });

    this.#resizeObserver.observe(this.refs.track);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
  }

  /** Determines cards per view based on viewport width */
  #calculateCardsPerView() {
    this.#cardsPerView = window.innerWidth >= 1024 ? 2 : 1;
  }

  /** Builds dot elements into the dots container */
  #buildDots() {
    const { track, dots } = this.refs;

    if (!track || !dots) return;

    const cardCount = track.querySelectorAll('.pmc__card').length;
    this.#totalPages = Math.max(1, Math.ceil(cardCount / this.#cardsPerView));

    dots.innerHTML = '';

    for (let i = 0; i < this.#totalPages; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'pmc__dot';
      dot.dataset.index = String(i);
      dot.setAttribute('aria-label', `Page ${i + 1}`);

      if (i === 0) {
        dot.classList.add('pmc__dot--active');
      }

      dot.addEventListener('click', this.#handleDotClick.bind(this));
      dots.appendChild(dot);
    }

    this.#activePage = 0;
  }

  /** Handles scroll events to update active dot */
  #handleScroll() {
    const { track } = this.refs;

    if (!track) return;

    const cards = track.querySelectorAll('.pmc__card');

    if (cards.length === 0) return;

    const firstCard = /** @type {HTMLElement} */ (cards[0]);
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const cardWidth = firstCard.offsetWidth + gap;
    const pageWidth = cardWidth * this.#cardsPerView;
    const newPage = Math.round(track.scrollLeft / pageWidth);
    const clampedPage = Math.min(Math.max(newPage, 0), this.#totalPages - 1);

    if (clampedPage !== this.#activePage) {
      this.#activePage = clampedPage;
      this.#updateDots();
    }
  }

  /** Updates dot active states */
  #updateDots() {
    const { dots } = this.refs;

    if (!dots) return;

    const allDots = dots.querySelectorAll('.pmc__dot');

    for (const dot of allDots) {
      const index = Number(/** @type {HTMLElement} */ (dot).dataset.index);
      dot.classList.toggle('pmc__dot--active', index === this.#activePage);
    }
  }

  /**
   * Handles dot click to scroll to the target page
   * @param {MouseEvent} event
   */
  #handleDotClick(event) {
    const dot = /** @type {HTMLElement} */ (event.currentTarget);
    const index = Number(dot.dataset.index);

    if (isNaN(index)) return;

    const { track } = this.refs;

    if (!track) return;

    const cards = track.querySelectorAll('.pmc__card');

    if (cards.length === 0) return;

    const firstCard = /** @type {HTMLElement} */ (cards[0]);
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const cardWidth = firstCard.offsetWidth + gap;
    const pageWidth = cardWidth * this.#cardsPerView;
    const scrollTarget = index * pageWidth;

    track.scrollTo({ left: scrollTarget, behavior: 'smooth' });
  }
}

if (!customElements.get('pcp-media-carousel')) {
  customElements.define('pcp-media-carousel', PcpMediaCarousel);
}
