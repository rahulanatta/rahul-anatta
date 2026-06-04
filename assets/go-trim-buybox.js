/**
 * GoTrim Buybox Component
 *
 * Handles:
 * 1. Subscription/one-time radio toggle — updates selling_plan hidden input,
 *    swaps displayed price, toggles CTA text, shows/hides subscription details.
 * 2. Quantity +/- buttons — increments/decrements quantity input, clamps to min 1.
 * 3. Delivery frequency pill selector — updates selling_plan hidden input,
 *    toggles active class on pills.
 * 4. Variant selection — updates price, compare price, installments,
 *    subscription prices, URL, and media gallery scroll.
 * 5. AJAX add-to-cart — prevents default form POST, submits via fetch,
 *    dispatches cart:update event to open cart drawer.
 *
 * Does NOT extend the theme's Component base class — uses plain HTMLElement
 * with connectedCallback and event delegation to avoid importmap complexity.
 */
class GoTrimBuyboxComponent extends HTMLElement {
  connectedCallback() {
    this._sellingPlanData = this._parseSellingPlanData();
    this._variantData = this._parseVariantData();
    this._bindEvents();
    this._initState();
    this._initVariantFromUrl();
    this._bindAccordionExclusive();
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

  _parseVariantData() {
    const script = this.querySelector('[data-variants]');
    if (!script) return [];
    try {
      return JSON.parse(script.textContent);
    } catch {
      return [];
    }
  }

  _bindEvents() {
    this.addEventListener('click', (e) => {
      const actionTarget = e.target.closest('[data-action]');
      if (actionTarget) {
        const action = actionTarget.dataset.action;
        if (action === 'quantity-minus') this._handleQuantityChange(-1);
        if (action === 'quantity-plus') this._handleQuantityChange(1);
        if (action === 'select-frequency') this._handleFrequencySelect(actionTarget);
        if (action === 'open-supplement-drawer') this._openSupplementDrawer();
        if (action === 'close-supplement-drawer') this._closeSupplementDrawer();
        return;
      }

      const variantCard = e.target.closest('.go-trim-buybox__variant-card');
      if (variantCard) {
        this._handleVariantSelect(variantCard);
      }
    });

    this.addEventListener('change', (e) => {
      if (e.target.name === 'purchase_option') {
        this._handlePurchaseOptionChange(e.target.value);
      }
    });

    // AJAX form submit
    const form = this.querySelector('form[action="/cart/add"]');
    if (form) {
      form.addEventListener('submit', (e) => this._handleFormSubmit(e));
    }

    // Supplement drawer dialog events
    const dialog = this.querySelector('.go-trim-buybox__supplement-drawer');
    if (dialog) {
      dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        const isOutside =
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom;
        if (isOutside) this._closeSupplementDrawer();
      });

      dialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        this._closeSupplementDrawer();
      });
    }
  }

  _initState() {
    const checkedRadio = this.querySelector('input[name="purchase_option"]:checked');
    if (checkedRadio) {
      this._handlePurchaseOptionChange(checkedRadio.value);
    } else if (this._sellingPlanData) {
      const subRadio = this.querySelector('input[name="purchase_option"][value="subscription"]');
      if (subRadio) {
        subRadio.checked = true;
        this._handlePurchaseOptionChange('subscription');
      }
    }
  }

  _initVariantFromUrl() {
    if (!this._variantData.length) return;
    const url = new URL(window.location.href);
    const variantId = url.searchParams.get('variant');
    if (!variantId) return;

    const card = this.querySelector(`.go-trim-buybox__variant-card[data-variant-id="${variantId}"]`);
    if (card && !card.classList.contains('is-selected')) {
      this._handleVariantSelect(card);
    }
  }

  _handleQuantityChange(delta) {
    const input = this.querySelector('[data-quantity-input]');
    if (!input) return;
    const current = parseInt(input.value, 10) || 1;
    input.value = Math.max(1, current + delta);
  }

  /**
   * Handles variant card selection — updates prices, form input, URL, and media scroll.
   * @param {HTMLElement} card - The clicked variant card element
   */
  _handleVariantSelect(card) {
    const variantId = card.dataset.variantId;
    const variant = this._variantData.find((v) => String(v.id) === String(variantId));
    if (!variant) return;

    // Update selected state on variant cards
    const allCards = this.querySelectorAll('.go-trim-buybox__variant-card');
    for (const c of allCards) {
      c.classList.remove('is-selected');
    }
    card.classList.add('is-selected');

    // Update hidden variant ID input
    const variantInput = this.querySelector('input[name="id"]');
    if (variantInput) variantInput.value = variant.id;

    // Determine current purchase option
    const checkedRadio = this.querySelector('input[name="purchase_option"]:checked');
    const isSubscription = checkedRadio && checkedRadio.value === 'subscription';

    // Update main displayed price
    const priceDisplay = this.querySelector('[data-active-price]');
    const comparePriceDisplay = this.querySelector('[data-compare-price]');

    if (isSubscription && variant.selling_plan_allocations.length > 0) {
      // Find allocation matching current selling plan input
      const sellingPlanInput = this.querySelector('input[name="selling_plan"]');
      const currentPlanId = sellingPlanInput ? sellingPlanInput.value : '';
      let matchingAlloc = variant.selling_plan_allocations.find(
        (a) => String(a.selling_plan_id) === String(currentPlanId)
      );
      if (!matchingAlloc) matchingAlloc = variant.selling_plan_allocations[0];

      if (priceDisplay) priceDisplay.textContent = matchingAlloc.per_delivery_price_formatted;
      if (comparePriceDisplay) comparePriceDisplay.style.display = 'none';
    } else {
      if (priceDisplay) priceDisplay.textContent = variant.price_formatted;
      if (comparePriceDisplay) {
        if (variant.compare_at_price_raw > variant.price_raw) {
          comparePriceDisplay.style.display = '';
          const sTag = comparePriceDisplay.querySelector('s');
          if (sTag) {
            sTag.textContent = variant.compare_at_price_formatted;
          }
        } else {
          comparePriceDisplay.style.display = 'none';
        }
      }
    }

    // Update installments price (price / 4)
    const installmentsSpan = this.querySelector('.go-trim-buybox__installments > span:first-child');
    if (installmentsSpan) {
      const installmentCents = Math.floor(variant.price_raw / 4);
      installmentsSpan.textContent = 'or 4 payments of ' + this._formatMoney(installmentCents) + ' with';
    }

    // Update one-time price in purchase option card
    const onetimePrice = this.querySelector('[data-option="onetime"] .go-trim-buybox__option-price');
    if (onetimePrice) onetimePrice.textContent = variant.price_formatted;

    // Update subscription price in purchase option card
    if (variant.selling_plan_allocations.length > 0) {
      const subPriceEl = this.querySelector('[data-option="subscription"] .go-trim-buybox__option-price');
      if (subPriceEl) {
        const sellingPlanInput = this.querySelector('input[name="selling_plan"]');
        const currentPlanId = sellingPlanInput ? sellingPlanInput.value : '';
        let matchingAlloc = variant.selling_plan_allocations.find(
          (a) => String(a.selling_plan_id) === String(currentPlanId)
        );
        if (!matchingAlloc) matchingAlloc = variant.selling_plan_allocations[0];
        subPriceEl.textContent = matchingAlloc.per_delivery_price_formatted;
      }
    }

    // Update _sellingPlanData to reflect new variant's prices
    if (this._sellingPlanData) {
      this._sellingPlanData.onetime_price_formatted = variant.price_formatted;
      if (variant.selling_plan_allocations.length > 0) {
        const firstAlloc = variant.selling_plan_allocations[0];
        this._sellingPlanData.subscription_price_formatted = firstAlloc.per_delivery_price_formatted;

        if (this._sellingPlanData.plans) {
          for (const plan of this._sellingPlanData.plans) {
            const alloc = variant.selling_plan_allocations.find(
              (a) => String(a.selling_plan_id) === String(plan.id)
            );
            if (alloc) {
              plan.price_formatted = alloc.per_delivery_price_formatted;
            }
          }
        }
      } else {
        this._sellingPlanData.subscription_price_formatted = variant.price_formatted;
      }
    }

    // Update URL with variant parameter
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    history.replaceState({}, '', url.toString());

    // Scroll media gallery to variant's featured media
    if (variant.featured_media_id) {
      const mediaItem = this.querySelector(
        `.go-trim-buybox__media-item[data-variant-id="${variant.id}"]`
      );
      if (mediaItem) {
        mediaItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
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

      // Show compare price only if current variant has one
      if (comparePriceDisplay) {
        const currentVariantId = this.querySelector('input[name="id"]')?.value;
        const currentVariant = this._variantData.find((v) => String(v.id) === String(currentVariantId));
        if (currentVariant && currentVariant.compare_at_price_raw > currentVariant.price_raw) {
          comparePriceDisplay.style.display = '';
          const sTag = comparePriceDisplay.querySelector('s');
          if (sTag) sTag.textContent = currentVariant.compare_at_price_formatted;
        } else if (this._variantData.length > 0) {
          comparePriceDisplay.style.display = 'none';
        } else {
          // No variant data — use existing server-rendered behavior
          comparePriceDisplay.style.display = '';
        }
      }
    }
  }

  /**
   * Handles AJAX form submission for add-to-cart.
   * @param {SubmitEvent} e
   */
  async _handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');
    const ctaText = form.querySelector('[data-cta-text]');
    const liveRegion = form.querySelector('[role="status"]');
    const originalCtaLabel = ctaText ? ctaText.textContent : '';

    if (submitBtn) submitBtn.disabled = true;
    if (ctaText) ctaText.textContent = 'Adding...';

    try {
      const formData = new FormData(form);
      const rootPath = window.Shopify?.routes?.root || '/';

      const response = await fetch(rootPath + 'cart/add.js', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.description || errorData.message || 'Could not add item to cart');
      }

      // Fetch updated cart for the event detail
      const cartResponse = await fetch(rootPath + 'cart.js');
      const cart = cartResponse.ok ? await cartResponse.json() : undefined;

      // Re-enable button
      if (submitBtn) submitBtn.disabled = false;
      if (ctaText) ctaText.textContent = originalCtaLabel;

      // Dispatch cart:update event — the Horizon cart drawer listens for this
      // event name (ThemeEvents.cartUpdate = 'cart:update') to auto-open and refresh
      document.dispatchEvent(
        new CustomEvent('cart:update', {
          bubbles: true,
          detail: {
            resource: cart,
            sourceId: 'go-trim-buybox',
            data: {
              source: 'go-trim-buybox',
            },
          },
        })
      );

      // Fallback: explicitly open cart drawer if auto-open didn't trigger
      requestAnimationFrame(() => {
        const cartDrawer = document.querySelector('cart-drawer-component');
        if (cartDrawer) {
          const drawerDialog = cartDrawer.querySelector('dialog');
          if (drawerDialog && !drawerDialog.open) {
            if (typeof cartDrawer.open === 'function') {
              cartDrawer.open();
            } else if (typeof cartDrawer.showDialog === 'function') {
              cartDrawer.showDialog();
            }
          }
        }
      });
    } catch (error) {
      if (submitBtn) submitBtn.disabled = false;
      if (ctaText) ctaText.textContent = originalCtaLabel;
      if (liveRegion) liveRegion.textContent = error.message;
    }
  }

  /**
   * Formats cents into a currency string.
   * Uses Intl.NumberFormat with the store's active currency when available.
   * @param {number} cents
   * @returns {string}
   */
  _formatMoney(cents) {
    const amount = (cents / 100).toFixed(2);
    if (window.Shopify?.currency?.active) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: window.Shopify.currency.active,
        }).format(cents / 100);
      } catch {
        return '$' + amount;
      }
    }
    return '$' + amount;
  }

  _openSupplementDrawer() {
    const dialog = this.querySelector('.go-trim-buybox__supplement-drawer');
    if (!dialog || dialog.open) return;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    // Double rAF ensures showModal() has rendered before the transition starts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dialog.classList.add('is-open');
      });
    });
  }

  _closeSupplementDrawer() {
    const dialog = this.querySelector('.go-trim-buybox__supplement-drawer');
    if (!dialog || !dialog.open) return;

    dialog.classList.remove('is-open');

    const cleanup = () => {
      dialog.close();
      document.body.style.overflow = '';
    };

    dialog.addEventListener('transitionend', cleanup, { once: true });

    // Fallback in case transitionend doesn't fire (e.g. reduced-motion)
    const fallback = setTimeout(() => {
      dialog.removeEventListener('transitionend', cleanup);
      if (dialog.open) cleanup();
    }, 400);

    // If transitionend fires, clear the fallback
    dialog.addEventListener('transitionend', () => clearTimeout(fallback), { once: true });
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

  /**
   * Binds exclusive (single-open) behavior to accordion `<details>` elements
   * inside `.go-trim-buybox__accordions`. When one item opens, all siblings
   * are closed. Uses a re-entrancy guard to prevent infinite toggle loops
   * caused by programmatically removing the `open` attribute.
   */
  _bindAccordionExclusive() {
    const accordions = this.querySelectorAll('.go-trim-buybox__accordions > .go-trim-buybox__accordion');
    if (!accordions.length) return;

    this._isClosingOthers = false;

    // Initial pass: if multiple <details> have `open`, keep only the first
    let foundOpen = false;
    for (const details of accordions) {
      if (details.open) {
        if (foundOpen) {
          details.open = false;
        } else {
          foundOpen = true;
        }
      }
    }

    // Attach toggle listeners for exclusive behavior
    for (const details of accordions) {
      details.addEventListener('toggle', () => {
        if (this._isClosingOthers) return;
        if (!details.open) return;

        this._isClosingOthers = true;
        for (const sibling of accordions) {
          if (sibling !== details && sibling.open) {
            sibling.open = false;
          }
        }
        this._isClosingOthers = false;
      });
    }
  }
}

if (!customElements.get('go-trim-buybox-component')) {
  customElements.define('go-trim-buybox-component', GoTrimBuyboxComponent);
}
