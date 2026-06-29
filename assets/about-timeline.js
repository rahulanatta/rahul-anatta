import { Component } from '@theme/component';

class AboutTimelineComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    this.currentIndex = 0;
    this.entries = this.querySelectorAll('.about-timeline__entry');
    this.yearButtons = this.querySelectorAll('.about-timeline__year-btn');
    this.totalEntries = this.entries.length;
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
    for (const entry of this.entries) {
      entry.hidden = true;
    }

    for (const btn of this.yearButtons) {
      btn.classList.remove('about-timeline__year-btn--active');
      const dot = btn.querySelector('.about-timeline__dot');

      if (dot) {
        dot.classList.remove('about-timeline__dot--active');
      }
    }

    if (this.entries[index]) {
      this.entries[index].hidden = false;
    }

    if (this.yearButtons[index]) {
      this.yearButtons[index].classList.add('about-timeline__year-btn--active');
      const dot = this.yearButtons[index].querySelector('.about-timeline__dot');

      if (dot) {
        dot.classList.add('about-timeline__dot--active');
      }
    }

    this.currentIndex = index;
  }
}

if (!customElements.get('about-timeline-component')) {
  customElements.define('about-timeline-component', AboutTimelineComponent);
}
