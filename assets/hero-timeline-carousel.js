/**
 * Hero Timeline Carousel
 *
 * Lightweight custom element that manages a horizontal CSS scroll-snap container.
 * Provides prev/next arrow click handlers and disables arrows at scroll boundaries.
 */
class HeroTimelineCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-carousel-track]');
    this.prevBtn = this.querySelector('[data-carousel-prev]');
    this.nextBtn = this.querySelector('[data-carousel-next]');

    if (!this.track) return;

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.scrollPrev());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.scrollNext());
    }

    this.track.addEventListener('scroll', () => this.updateButtons(), { passive: true });

    this._resizeObserver = new ResizeObserver(() => this.updateButtons());
    this._resizeObserver.observe(this.track);

    this.updateButtons();
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  scrollPrev() {
    if (!this.track) return;

    const slide = this.track.querySelector('.hero-timeline__slide');
    if (!slide) return;

    const gap = parseInt(getComputedStyle(this.track).gap) || 24;
    this.track.scrollBy({ left: -(slide.offsetWidth + gap), behavior: 'smooth' });
  }

  scrollNext() {
    if (!this.track) return;

    const slide = this.track.querySelector('.hero-timeline__slide');
    if (!slide) return;

    const gap = parseInt(getComputedStyle(this.track).gap) || 24;
    this.track.scrollBy({ left: slide.offsetWidth + gap, behavior: 'smooth' });
  }

  updateButtons() {
    if (!this.track) return;

    const { scrollLeft, scrollWidth, clientWidth } = this.track;

    if (this.prevBtn) {
      this.prevBtn.disabled = scrollLeft <= 2;
    }

    if (this.nextBtn) {
      this.nextBtn.disabled = scrollLeft + clientWidth >= scrollWidth - 2;
    }
  }
}

customElements.define('hero-timeline-carousel', HeroTimelineCarousel);
