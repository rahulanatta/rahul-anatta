import { Component } from '@theme/component';

class AboutTimelineComponent extends Component {
  #dragging = false;
  #dragStartX = 0;
  #boundMouseUp = null;
  #boundMouseMove = null;

  connectedCallback() {
    super.connectedCallback();
    this.currentIndex = 0;
    this.imageSlides = this.querySelectorAll('.about-timeline__image-slide');
    this.contentSlides = this.querySelectorAll('.about-timeline__content-slide');
    this.yearButtons = this.querySelectorAll('.about-timeline__year-btn');
    this.trackFill = this.querySelector('.about-timeline__track-fill');
    this.media = this.querySelector('.about-timeline__media');
    this.totalEntries = this.imageSlides.length;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.classList.add('no-motion');
    }

    this.updateProgress(0);
    this.#setupSwipeHandlers();
    this.#setupDragHandlers();
    this.#setupKeyboardHandlers();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#boundMouseUp) {
      document.removeEventListener('mouseup', this.#boundMouseUp);
    }

    if (this.#boundMouseMove) {
      document.removeEventListener('mousemove', this.#boundMouseMove);
    }
  }

  handleYearClick(event) {
    const button = event.currentTarget;
    const index = parseInt(button.dataset.index, 10);

    if (isNaN(index) || index === this.currentIndex) return;
    this.goToEntry(index);
  }

  handlePrev() {
    if (this.currentIndex > 0) {
      this.goToEntry(this.currentIndex - 1);
    }
  }

  handleNext() {
    if (this.currentIndex < this.totalEntries - 1) {
      this.goToEntry(this.currentIndex + 1);
    }
  }

  goToEntry(index) {
    for (const slide of this.imageSlides) {
      slide.classList.remove('about-timeline__image-slide--active');
    }

    if (this.imageSlides[index]) {
      this.imageSlides[index].classList.add('about-timeline__image-slide--active');
    }

    for (const slide of this.contentSlides) {
      slide.classList.remove('about-timeline__content-slide--active');
    }

    if (this.contentSlides[index]) {
      this.contentSlides[index].classList.add('about-timeline__content-slide--active');
    }

    for (const btn of this.yearButtons) {
      btn.classList.remove('about-timeline__year-btn--active');
      const dot = btn.querySelector('.about-timeline__dot');

      if (dot) {
        dot.classList.remove('about-timeline__dot--active');
      }
    }

    if (this.yearButtons[index]) {
      this.yearButtons[index].classList.add('about-timeline__year-btn--active');
      const dot = this.yearButtons[index].querySelector('.about-timeline__dot');

      if (dot) {
        dot.classList.add('about-timeline__dot--active');
      }
    }

    this.currentIndex = index;
    this.updateProgress(index);
  }

  updateProgress(index) {
    if (this.totalEntries <= 1) return;
    const fillWidth = (index / (this.totalEntries - 1)) * 100;
    this.style.setProperty('--at-fill-width', `${fillWidth}%`);
  }

  #setupSwipeHandlers() {
    if (!this.media) return;

    let startX = 0;
    let startY = 0;

    this.media.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    this.media.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          this.handleNext();
        } else {
          this.handlePrev();
        }
      }
    }, { passive: true });
  }

  #setupDragHandlers() {
    if (!this.media) return;

    this.#boundMouseUp = this.#handleMouseUp.bind(this);
    this.#boundMouseMove = this.#handleMouseMove.bind(this);

    this.media.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.#dragging = true;
      this.#dragStartX = e.clientX;
      this.media.style.cursor = 'grabbing';
      document.addEventListener('mouseup', this.#boundMouseUp);
      document.addEventListener('mousemove', this.#boundMouseMove);
    });
  }

  #handleMouseMove(e) {
    if (!this.#dragging) return;
    e.preventDefault();
  }

  #handleMouseUp(e) {
    if (!this.#dragging) return;
    this.#dragging = false;
    this.media.style.cursor = '';

    const deltaX = e.clientX - this.#dragStartX;

    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        this.handleNext();
      } else {
        this.handlePrev();
      }
    }

    document.removeEventListener('mouseup', this.#boundMouseUp);
    document.removeEventListener('mousemove', this.#boundMouseMove);
  }

  #setupKeyboardHandlers() {
    this.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.handleNext();
      }
    });
  }
}

if (!customElements.get('about-timeline-component')) {
  customElements.define('about-timeline-component', AboutTimelineComponent);
}
