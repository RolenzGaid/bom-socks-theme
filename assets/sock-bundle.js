/**
 * <sock-bundle>
 *
 * Tiered pack-size selector for the product page.
 *
 *  - "Single" keeps the theme's normal add-to-cart form.
 *  - A multi-pack tier (2 / 3 / 4) reveals N slots and opens the sock picker
 *    that lives in the product media column, so the customer chooses which
 *    socks fill the pack.
 *  - Each multi-pack tier can carry a Shopify discount code, set in the theme
 *    editor. It is applied via /discount/CODE after the items are added.
 */

if (!customElements.get('sock-bundle')) {
  customElements.define(
    'sock-bundle',
    class SockBundle extends HTMLElement {
      constructor() {
        super();

        this.sectionId = this.dataset.sectionId;
        this.picker = document.querySelector(`[data-sock-bundle-picker="${this.sectionId}"]`);
        this.infoContainer = this.closest('.product__info-container');
        this.mediaContainer = document.querySelector(
          `[data-section-id="${this.sectionId}"] .product__media_container`
        );

        this.tierButtons = Array.from(this.querySelectorAll('[data-sock-tier]'));
        this.slotsWrap = this.querySelector('[data-sock-bundle-slots-wrap]');
        this.slotsEl = this.querySelector('[data-sock-bundle-slots]');
        this.progressEl = this.querySelector('[data-sock-bundle-progress]');
        this.summaryEl = this.querySelector('[data-sock-bundle-summary]');
        this.totalEl = this.querySelector('[data-sock-bundle-total]');
        this.atcButton = this.querySelector('[data-sock-bundle-atc]');
        this.errorEl = this.querySelector('[data-sock-bundle-error]');

        this.pickerReplacesGallery = this.dataset.pickerReplacesGallery === 'true';
        this.prefillCurrent = this.dataset.prefillCurrent === 'true';
        this.hideDefaultAtc = this.dataset.hideDefaultAtc === 'true';
        this.afterAdd = this.dataset.afterAdd || 'cart';
        this.cartUrl = this.dataset.cartUrl || '/cart';
        this.moneyFormat = this.dataset.moneyFormat || '${{amount}}';

        try {
          this.variantData = JSON.parse(
            this.querySelector('[data-sock-bundle-variants]')?.textContent || '[]'
          );
        } catch (error) {
          this.variantData = [];
        }

        this.quantity = 1;
        this.discountCode = '';
        /** @type {Array<{variantId: string, productId: string, title: string, variantTitle: string, image: string, price: number}|null>} */
        this.slots = [];

        this.onTierClick = this.onTierClick.bind(this);
        this.onPickerClick = this.onPickerClick.bind(this);
        this.onSlotsClick = this.onSlotsClick.bind(this);
        this.onAddToCart = this.onAddToCart.bind(this);
        this.onVariantChange = this.onVariantChange.bind(this);
      }

      connectedCallback() {
        this.tierButtons.forEach((button) => button.addEventListener('click', this.onTierClick));
        this.slotsEl?.addEventListener('click', this.onSlotsClick);
        this.atcButton?.addEventListener('click', this.onAddToCart);
        this.picker?.addEventListener('click', this.onPickerClick);

        // The theme's variant picker writes the id into this input and fires a
        // bubbling `change`, so that is what keeps the pre-filled slot in sync.
        this.variantInput = document.querySelector(`#product-form-${this.sectionId} [name="id"]`);
        this.variantInput?.addEventListener('change', this.onVariantChange);
      }

      disconnectedCallback() {
        this.variantInput?.removeEventListener('change', this.onVariantChange);
      }

      /* ------------------------------------------------------------------ */
      /* Tier selection                                                      */
      /* ------------------------------------------------------------------ */

      onTierClick(event) {
        const button = event.currentTarget;
        this.selectTier(button);
      }

      selectTier(button) {
        this.tierButtons.forEach((tier) => {
          tier.setAttribute('aria-checked', String(tier === button));
        });

        this.quantity = parseInt(button.dataset.qty, 10) || 1;
        this.discountCode = button.dataset.code || '';
        this.setError('');

        if (this.quantity <= 1) {
          this.exitBundleMode();
          return;
        }

        this.enterBundleMode();
      }

      enterBundleMode() {
        // Resize the slot array, keeping anything already chosen.
        const next = new Array(this.quantity).fill(null);
        this.slots.slice(0, this.quantity).forEach((slot, index) => {
          next[index] = slot;
        });
        this.slots = next;

        if (this.prefillCurrent && !this.slots[0]) {
          this.slots[0] = this.currentProductSlot();
        }

        this.slotsWrap.hidden = false;
        this.slotsEl.style.setProperty('--sb-slot-count', String(this.quantity));

        if (this.hideDefaultAtc) {
          this.infoContainer?.classList.add('sock-bundle-mode');
          document.body.classList.add('sock-bundle-mode');
        }
        this.picker?.classList.add('is-visible');
        if (this.pickerReplacesGallery) {
          this.mediaContainer?.classList.add('sock-bundle-gallery-hidden');
        }

        this.render();
      }

      exitBundleMode() {
        this.slotsWrap.hidden = true;
        this.infoContainer?.classList.remove('sock-bundle-mode');
        document.body.classList.remove('sock-bundle-mode');
        this.picker?.classList.remove('is-visible');
        this.mediaContainer?.classList.remove('sock-bundle-gallery-hidden');
      }

      currentProductSlot() {
        const variant = this.variantData.find(
          (item) => String(item.id) === String(this.dataset.variantId)
        );
        return {
          variantId: this.dataset.variantId,
          productId: this.dataset.productId,
          title: this.dataset.productTitle,
          variantTitle: variant ? variant.title : '',
          image: variant?.image || this.dataset.productImage,
          price: variant ? variant.price : parseInt(this.dataset.productPrice, 10) || 0,
        };
      }

      onVariantChange() {
        const newId = this.variantInput?.value;
        if (!newId) return;
        this.dataset.variantId = newId;

        const variant = this.variantData.find((item) => String(item.id) === String(newId));
        if (variant) {
          this.dataset.productPrice = String(variant.price);
          if (variant.image) this.dataset.productImage = variant.image;
        }

        // Only the pre-filled first slot tracks the main variant picker.
        if (this.prefillCurrent && this.slots[0]?.productId === this.dataset.productId) {
          this.slots[0] = {
            ...this.slots[0],
            variantId: newId,
            price: variant ? variant.price : this.slots[0].price,
            variantTitle: variant ? variant.title : this.slots[0].variantTitle,
            image: variant?.image || this.slots[0].image,
          };
          this.render();
        }
      }

      /* ------------------------------------------------------------------ */
      /* Picker                                                              */
      /* ------------------------------------------------------------------ */

      onPickerClick(event) {
        const backButton = event.target.closest('[data-picker-back]');
        if (backButton) {
          const hidden = this.mediaContainer?.classList.toggle('sock-bundle-gallery-hidden');
          backButton.textContent = hidden
            ? backButton.dataset.showText || 'Back to product photos'
            : backButton.dataset.hideText || 'Hide product photos';
          return;
        }

        const addButton = event.target.closest('[data-picker-add]');
        if (!addButton) return;

        const card = addButton.closest('[data-picker-card]');
        if (!card) return;

        const index = this.firstEmptySlot();
        if (index === -1) {
          this.setError(`Your ${this.quantity}-pack is full. Remove a sock to swap it out.`);
          return;
        }

        const variantField = card.querySelector('[data-picker-variant]');
        const option =
          variantField && variantField.tagName === 'SELECT'
            ? variantField.options[variantField.selectedIndex]
            : variantField;

        if (!variantField || !variantField.value) return;

        let data = {};
        try {
          data = JSON.parse(card.querySelector('[data-picker-data]')?.textContent || '{}');
        } catch (error) {
          data = {};
        }

        this.slots[index] = {
          variantId: variantField.value,
          productId: card.dataset.productId,
          title: data.title || '',
          variantTitle: (option?.dataset.variantTitle || '').replace(/^Default Title$/, ''),
          image: option?.dataset.variantImage || data.image || '',
          price: parseInt(option?.dataset.variantPrice, 10) || 0,
        };

        this.setError('');
        this.render();
      }

      firstEmptySlot() {
        return this.slots.findIndex((slot) => !slot);
      }

      /* ------------------------------------------------------------------ */
      /* Slots                                                               */
      /* ------------------------------------------------------------------ */

      onSlotsClick(event) {
        const remove = event.target.closest('[data-slot-remove]');
        if (!remove) return;

        const index = parseInt(remove.dataset.slotRemove, 10);
        this.slots[index] = null;
        this.setError('');
        this.render();
      }

      render() {
        const filled = this.slots.filter(Boolean).length;

        this.slotsEl.innerHTML = this.slots
          .map((slot, index) => {
            if (!slot) {
              return `
                <div class="sock-bundle__slot" role="listitem">
                  <span class="sock-bundle__slot-media"><span class="sock-bundle__slot-plus">+</span></span>
                  <span class="sock-bundle__slot-title">${this.escape(
                    `Sock ${index + 1}`
                  )}</span>
                </div>`;
            }

            return `
              <div class="sock-bundle__slot sock-bundle__slot--filled" role="listitem">
                <button type="button" class="sock-bundle__slot-remove" data-slot-remove="${index}" aria-label="Remove ${this.escape(
              slot.title
            )}">&times;</button>
                <span class="sock-bundle__slot-media">
                  ${slot.image ? `<img src="${slot.image}" alt="" loading="lazy">` : ''}
                </span>
                <span class="sock-bundle__slot-title">${this.escape(slot.title)}</span>
                ${
                  slot.variantTitle
                    ? `<span class="sock-bundle__slot-variant">${this.escape(
                        slot.variantTitle
                      )}</span>`
                    : ''
                }
              </div>`;
          })
          .join('');

        if (this.progressEl) {
          this.progressEl.textContent = `${filled} / ${this.quantity} selected`;
        }

        if (this.picker) {
          const progress = this.picker.querySelector('[data-picker-progress]');
          if (progress) progress.textContent = `${filled} / ${this.quantity} selected`;

          const counts = {};
          this.slots.filter(Boolean).forEach((slot) => {
            counts[slot.productId] = (counts[slot.productId] || 0) + 1;
          });

          this.picker.querySelectorAll('[data-picker-card]').forEach((card) => {
            const count = counts[card.dataset.productId] || 0;
            card.dataset.picked = String(count);
            const badge = card.querySelector('[data-picker-count]');
            if (badge) badge.textContent = String(count);
          });
        }

        if (this.summaryEl && this.totalEl) {
          const total = this.slots
            .filter(Boolean)
            .reduce((sum, slot) => sum + (slot.price || 0), 0);
          this.summaryEl.hidden = filled === 0;
          this.totalEl.textContent = this.formatMoney(total);
        }

        this.atcButton.disabled = filled !== this.quantity;
      }

      /* ------------------------------------------------------------------ */
      /* Add to cart                                                         */
      /* ------------------------------------------------------------------ */

      async onAddToCart() {
        const items = this.slots
          .filter(Boolean)
          .map((slot) => ({ id: Number(slot.variantId), quantity: 1 }));

        if (items.length !== this.quantity) {
          this.setError(`Pick ${this.quantity} socks to continue.`);
          return;
        }

        this.atcButton.disabled = true;
        this.atcButton.classList.add('loading');
        this.setError('');

        const cartNotification = document.querySelector('cart-notification');
        const body = { items };

        // Ask for the notification's sections so we can render it without a reload.
        if (cartNotification && typeof cartNotification.getSectionsToRender === 'function') {
          body.sections = cartNotification.getSectionsToRender().map((section) => section.id);
          body.sections_url = window.location.pathname;
        }

        try {
          const response = await fetch(window.routes?.cart_add_url || '/cart/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(body),
          });

          const result = await response.json();

          if (!response.ok || result.status) {
            this.setError(result.description || result.message || 'Could not add to cart.');
            return;
          }

          await this.applyDiscountAndFinish(result, cartNotification);
        } catch (error) {
          console.error(error);
          this.setError('Something went wrong. Please try again.');
        } finally {
          this.atcButton.classList.remove('loading');
          this.atcButton.disabled = false;
        }
      }

      async applyDiscountAndFinish(result, cartNotification) {
        const code = this.discountCode.trim();

        // Redirecting through /discount/CODE is the reliable way to attach a
        // discount to the cart, so that path wins whenever a code is set.
        if (code) {
          const target = this.afterAdd === 'checkout' ? '/checkout' : this.cartUrl;
          window.location.href = `/discount/${encodeURIComponent(
            code
          )}?redirect=${encodeURIComponent(target)}`;
          return;
        }

        if (this.afterAdd === 'checkout') {
          window.location.href = '/checkout';
          return;
        }

        if (this.afterAdd === 'stay') {
          if (cartNotification && typeof cartNotification.renderContents === 'function') {
            cartNotification.setActiveElement?.(this.atcButton);
            cartNotification.renderContents(result);
          } else {
            window.location.href = this.cartUrl;
          }
          return;
        }

        window.location.href = this.cartUrl;
      }

      /* ------------------------------------------------------------------ */
      /* Helpers                                                             */
      /* ------------------------------------------------------------------ */

      setError(message) {
        if (this.errorEl) this.errorEl.textContent = message;
      }

      escape(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
      }

      /**
       * Minimal money formatter covering the four Shopify money_format tokens.
       * Falls back to a plain decimal if the format string is unrecognised.
       */
      formatMoney(cents) {
        const value = (cents || 0) / 100;

        const withDelimiter = (number, decimals, thousands, decimal) => {
          const fixed = number.toFixed(decimals);
          const parts = fixed.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
          return parts.join(decimal);
        };

        return this.moneyFormat.replace(
          /\{\{\s*(\w+)\s*\}\}/g,
          (match, token) => {
            switch (token) {
              case 'amount':
                return withDelimiter(value, 2, ',', '.');
              case 'amount_no_decimals':
                return withDelimiter(value, 0, ',', '.');
              case 'amount_with_comma_separator':
                return withDelimiter(value, 2, '.', ',');
              case 'amount_no_decimals_with_comma_separator':
                return withDelimiter(value, 0, '.', ',');
              case 'amount_with_apostrophe_separator':
                return withDelimiter(value, 2, "'", '.');
              default:
                return value.toFixed(2);
            }
          }
        );
      }
    }
  );
}
