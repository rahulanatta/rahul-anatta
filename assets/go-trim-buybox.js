/**
 * GoTrim Buybox Component
 *
 * Handles:
 * 1. Subscription/one-time radio toggle — updates selling_plan hidden input,
 *    swaps displayed price, toggles CTA text, shows/hides subscription details.
 * 2. Quantity +/- buttons — increments/decrements quantity input, clamps to min 1.
 * 3. Delivery frequency pill selector — updates selling_plan hidden input,
 *    toggles active class on pills.
 *
 * Does NOT extend the theme's Component base class — uses plain HTMLElement
 * with connectedCallback and event delegation to avoid importmap complexity.
 */
class GoTrimBuyboxComponent extends HTMLElement {
  connectedCallback() {
    this._sellingPlanData = this._parseSellingPlanData();
    this._bindEvents();
    this._initState();
  }

  _parseSellingPlanData() {
    const script = this.querySelector('[data-selling-plans]');
    if (!script) return null;
    try {
      return JSON.parse(script.textContent);
    } catch {
      return null;
    }
  }

  _bindEvents() {
    this.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      if (action === 'quantity-minus') this._handleQuantityChange(-1);
      if (action === 'quantity-plus') this._handleQuantityChange(1);
      if (action === 'select-frequency') this._handleFrequencySelect(target);
    });

    this.addEventListener('change', (e) => {
      const target = e.target;
      if (target.name === 'purchase_option') {
        this._handlePurchaseOptionChange(target.value);
      }
    });
  }

  _initState() {
    const checkedRadio = this.querySelector('input[name="purchase_option"]:checked');
    if (checkedRadio) {
      this._handlePurchaseOptionChange(checkedRadio.value);
    } else if (this._sellingPlanData) {
      // Default to subscription when selling plans exist but no radio is checked
      const subRadio = this.querySelector('input[name="purchase_option"][value="subscription"]');
      if (subRadio) {
        subRadio.checked = true;
        this._handlePurchaseOptionChange('subscription');
      }
    }
  }

  _handleQuantityChange(delta) {
    const input = this.querySelector('[data-quantity-input]');
    if (!input) return;
    const current = parseInt(input.value, 10) || 1;
    const newVal = Math.max(1, current + delta);
    input.value = newVal;
  }

  _handlePurchaseOptionChange(value) {
    const sellingPlanInput = this.querySelector('input[name="selling_plan"]');
    const subscriptionPanel = this.querySelector('[data-subscription-details]');
    const onetimePanel = this.querySelector('[data-onetime-details]');
    const ctaText = this.querySelector('[data-cta-text]');
    const priceDisplay = this.querySelector('[data-active-price]');
    const comparePriceDisplay = this.querySelector('[data-compare-price]');

    const subscriptionCard = this.querySelector('[data-option="subscription"]');
    const onetimeCard = this.querySelector('[data-option="onetime"]');

    if (value === 'subscription') {
      if (sellingPlanInput && this._sellingPlanData) {
        const activePill = this.querySelector('.go-trim-buybox__frequency-pill.is-active');
        const planId = activePill
          ? activePill.dataset.planId
          : this._sellingPlanData.default_plan_id;
        sellingPlanInput.value = planId || '';
      }
      if (subscriptionPanel) subscriptionPanel.style.display = '';
      if (onetimePanel) onetimePanel.style.display = 'none';
      if (ctaText) ctaText.textContent = 'Subscribe';
      if (subscriptionCard) subscriptionCard.classList.add('is-selected');
      if (onetimeCard) onetimeCard.classList.remove('is-selected');

      if (priceDisplay && this._sellingPlanData) {
        priceDisplay.textContent = this._sellingPlanData.subscription_price_formatted || priceDisplay.textContent;
      }
      if (comparePriceDisplay) comparePriceDisplay.style.display = 'none';
    } else {
      if (sellingPlanInput) sellingPlanInput.value = '';
      if (subscriptionPanel) subscriptionPanel.style.display = 'none';
      if (onetimePanel) onetimePanel.style.display = '';
      if (ctaText) ctaText.textContent = 'Add to Cart';
      if (subscriptionCard) subscriptionCard.classList.remove('is-selected');
      if (onetimeCard) onetimeCard.classList.add('is-selected');

      if (priceDisplay && this._sellingPlanData) {
        priceDisplay.textContent = this._sellingPlanData.onetime_price_formatted || priceDisplay.textContent;
      }
      if (comparePriceDisplay) comparePriceDisplay.style.display = '';
    }
  }

  _handleFrequencySelect(pill) {
    const pills = this.querySelectorAll('.go-trim-buybox__frequency-pill');
    for (const p of pills) {
      p.classList.remove('is-active');
    }
    pill.classList.add('is-active');

    const planId = pill.dataset.planId;
    const sellingPlanInput = this.querySelector('input[name="selling_plan"]');
    if (sellingPlanInput) sellingPlanInput.value = planId || '';

    const priceDisplay = this.querySelector('[data-active-price]');
    if (priceDisplay && pill.dataset.price) {
      priceDisplay.textContent = pill.dataset.price;
    }
  }
}

if (!customElements.get('go-trim-buybox-component')) {
  customElements.define('go-trim-buybox-component', GoTrimBuyboxComponent);
}
