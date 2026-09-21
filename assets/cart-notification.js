class CartRemoveButton2 extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      event.preventDefault();
      this.closest("cart-notification").updateQuantity(this.dataset.index, 0);
      this.closest(".cart-notification-product").classList.add("loading");
      this.closest(
        ".cart-notification-product"
      ).firstElementChild.classList.remove("hidden");
    });
  }
}
customElements.define("cart-remove-button-2", CartRemoveButton2);

class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById("offcanvas__mini_cart");
    this.cartItemConatiner = document.getElementById(
      "cart-notification-product"
    );

    this.emptyCartItem = document.getElementById("min-cart-items");
    this.cartItemMessageShow = document.querySelector(".empty__cart__item");
    this.emptyCartButtonDisable = document.getElementById(
      "empty__cart__button"
    );

    this.cartAddSuccess = document.querySelector(".item__success_message ");
    this.cartEmptyHead = document.querySelector(".item__empty_message");

    this.header = document.querySelector("sticky-header");
    this.onBodyClick = this.handleBodyClick.bind(this);
    this.b3g1ProductTagCache = new Map();
    this.b3g1RefreshToken = 0;

    this.notification.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close()
    );

    this.querySelector(
      'button[type="button"].cart-notification__close'
    ).addEventListener("click", this.close.bind(this));

    this.currentItemCount = Array.from(
      this.querySelectorAll('[name="updates[]"]')
    ).reduce(
      (total, quantityInput) => total + parseInt(quantityInput.value),
      0
    );

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener("change", this.debouncedOnChange.bind(this));
  }

  onChange(event) {
    if (!event.target.closest("select")) {
      this.updateQuantity(
        event.target.dataset.index,
        event.target.value,
        document.activeElement.getAttribute("name"),
        event.target.dataset.quantityVariantId
      );
      // document
      //   .querySelector(".cart_action_drawer_overlay")
      //   .classList.add("active");
    }
  }

  open() {
    this.notification.classList.add("animate", "active");
    document.querySelector("body").classList.add("added__overlay");

    this.notification.addEventListener(
      "transitionend",
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true }
    );

    document.body.addEventListener("click", this.onBodyClick);
  }

  close() {
    document.getElementById("offcanvas__mini_cart").classList.remove("active");
    document.querySelector("body").classList.remove("added__overlay");

    document.body.removeEventListener("click", this.onBodyClick);

    //removeTrapFocus(document.querySelector(".header__actions_btn--cart"));
  }

  renderContents(parsedState) {
    this.getSectionsToRender().forEach((section) => {
      this.replaceSectionContent(section, parsedState);
    });

    // Toggle Class
    this.emptyCartItem.classList.toggle(
      "no-js-inline",
      parsedState.item_count === 0
    );

    if (parsedState.item_count === 0) {
      this.emptyCartItem.classList.add("no-js-inline");
      this.emptyCartButtonDisable.classList.add("no-js-inline");
      this.cartItemMessageShow.classList.remove("no-js-inline");
      this.cartAddSuccess.classList.add("no-js-inline");
      this.cartEmptyHead.classList.remove("no-js-inline");
    } else {
      this.emptyCartItem.classList.remove("no-js-inline");
      this.emptyCartButtonDisable.classList.remove("no-js-inline");
      this.cartItemMessageShow.classList.add("no-js-inline");
      this.cartAddSuccess.classList.remove("no-js-inline");
      this.cartEmptyHead.classList.add("no-js-inline");
    }

    // The promo is intentionally outside #cart-notification-discount so
    // Shopify's AJAX section replacement cannot remove it. Refresh only its
    // text/progress after every add/remove/quantity update.
    this.refreshBuy3Get1Promo(parsedState);

    if (this.header) this.header.reveal();
    this.open();
  }

  replaceSectionContent(section, parsedState) {
    const elementToReplace = document.getElementById(section.id);
    const sectionHtml = parsedState.sections && parsedState.sections[section.id];

    if (!elementToReplace || !sectionHtml) return;

    const parsedHtml = new DOMParser().parseFromString(sectionHtml, "text/html");
    const matchingElement = parsedHtml.getElementById(section.id);
    const shopifySection = parsedHtml.querySelector(".shopify-section");
    const sourceElement = matchingElement || shopifySection;

    if (sourceElement) {
      elementToReplace.innerHTML = sourceElement.innerHTML;
    }
  }

  async refreshBuy3Get1Promo(cartState) {
    const promo = document.getElementById("b3g1-cart-promo");
    if (!promo) return;

    const refreshToken = ++this.b3g1RefreshToken;
    let cart = cartState;

    // cart/change.js returns the full cart, but cart/add.js responses can be
    // partial. Fetch cart.js when we do not have the complete line-item list.
    if (!cart || !Array.isArray(cart.items) || typeof cart.item_count === "undefined") {
      try {
        const root =
          window.Shopify && window.Shopify.routes && window.Shopify.routes.root
            ? window.Shopify.routes.root
            : "/";
        const response = await fetch(`${root}cart.js`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        cart = await response.json();
      } catch (error) {
        return;
      }
    }

    if (refreshToken !== this.b3g1RefreshToken) return;

    const oneTimeOnly = promo.dataset.oneTimeOnly === "true";
    const eligibleTag = (promo.dataset.eligibleTag || "").trim();
    let eligibleQuantity = 0;

    for (const item of cart.items || []) {
      if (oneTimeOnly && item.selling_plan_allocation) continue;

      if (eligibleTag) {
        const matchesTag = await this.itemMatchesBuy3Get1Tag(item, eligibleTag);
        if (refreshToken !== this.b3g1RefreshToken) return;
        if (!matchesTag) continue;
      }

      eligibleQuantity += Number(item.quantity) || 0;
    }

    if (refreshToken !== this.b3g1RefreshToken) return;
    this.updateBuy3Get1PromoUI(promo, eligibleQuantity);
  }

  async itemMatchesBuy3Get1Tag(item, eligibleTag) {
    const handle = item.handle || item.product_handle;
    if (!handle) return false;

    if (!this.b3g1ProductTagCache.has(handle)) {
      const root =
        window.Shopify && window.Shopify.routes && window.Shopify.routes.root
          ? window.Shopify.routes.root
          : "/";

      const tagPromise = fetch(`${root}products/${encodeURIComponent(handle)}.js`, {
        headers: { Accept: "application/json" },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((product) => {
          if (!product || !product.tags) return [];
          if (Array.isArray(product.tags)) return product.tags;
          return String(product.tags)
            .split(",")
            .map((tag) => tag.trim());
        })
        .catch(() => []);

      this.b3g1ProductTagCache.set(handle, tagPromise);
    }

    const tags = await this.b3g1ProductTagCache.get(handle);
    const wantedTag = eligibleTag.toLowerCase();
    return tags.some((tag) => String(tag).toLowerCase() === wantedTag);
  }

  updateBuy3Get1PromoUI(promo, eligibleQuantity) {
    const buyQty = Math.max(1, parseInt(promo.dataset.buyQty, 10) || 3);
    const getQty = Math.max(1, parseInt(promo.dataset.getQty, 10) || 1);
    const maxUses = Math.max(1, parseInt(promo.dataset.maxUses, 10) || 10);
    const groupSize = buyQty + getQty;

    let completedGroups = Math.floor(eligibleQuantity / groupSize);
    completedGroups = Math.min(completedGroups, maxUses);

    const freeItems = completedGroups * getQty;
    const remainder = eligibleQuantity % groupSize;
    const maxReached = completedGroups >= maxUses;
    const progressItems =
      eligibleQuantity > 0 && remainder === 0 ? groupSize : remainder;
    const progressPercent = maxReached
      ? 100
      : Math.min(100, Math.round((progressItems / groupSize) * 100));
    const needed = groupSize - remainder;

    let message;
    if (maxReached) {
      message = `Maximum offer reached — ${freeItems} free ${
        freeItems === 1 ? "item" : "items"
      } unlocked.`;
    } else if (completedGroups > 0 && remainder === 0) {
      message = `${freeItems} free ${
        freeItems === 1 ? "item" : "items"
      } unlocked! Add ${groupSize} more eligible ${
        groupSize === 1 ? "item" : "items"
      } for another free item.`;
    } else if (completedGroups > 0) {
      message = `${freeItems} free ${
        freeItems === 1 ? "item" : "items"
      } unlocked! Add ${needed} more eligible ${
        needed === 1 ? "item" : "items"
      } for another free item.`;
    } else if (needed === 1) {
      message = "Add 1 more eligible item and 1 item will be FREE.";
    } else {
      message = `Add ${needed} more eligible items to get 1 FREE.`;
    }

    const card = promo.querySelector(".b3g1-promo-card");
    const messageElement = promo.querySelector("[data-b3g1-message]");
    const progressElement = promo.querySelector(".b3g1-progress");

    if (card) {
      card.style.setProperty("--b3g1-progress", `${progressPercent}%`);
    }
    if (messageElement) {
      messageElement.textContent = message;
    }
    if (progressElement) {
      progressElement.setAttribute("aria-valuenow", String(progressPercent));
    }
  }

  getSectionsToRender() {
    return [
      {
        id: "cart-notification-product",
      },
      {
        id: "cart-notification-subtotal",
      },
      {
        id: "cart-notification-count",
      },
      {
        id: "cart-notification-discount",
      },
    ];
  }

  updateQuantity(line, quantity, name, variantId) {
    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.id),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement = document.getElementById(`Quantity-${line}`);
        const items = document.querySelectorAll(".cart-notification-product");

        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute("value");
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.renderContents(parsedState);

        const updatedValue = parsedState.items[line - 1]
          ? parsedState.items[line - 1].quantity
          : undefined;
        let message = "";
        if (
          items.length === parsedState.items.length &&
          updatedValue !== parseInt(quantityElement.value)
        ) {
          if (typeof updatedValue === "undefined") {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace(
              "[quantity]",
              updatedValue
            );
          }
        }
        this.updateLiveRegions(line, message);

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: "cart-notification",
          cartData: parsedState,
          variantId: variantId,
        });
      })
      .catch(() => {
        // const errors =
        //   document.getElementById("cart-errors") ||
        //   document.getElementById("CartDrawer-CartErrors");
        // errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        // this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError = document.getElementById(`Line-item-error-${line}`);
    if (lineItemError) {
      lineItemError.classList.remove("d-none");
      lineItemError.querySelector(".cart-item__error-text").innerHTML = message;
    }
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (
      target !== this.notification &&
      !target.closest("cart-notification") &&
      !target.closest("#quickViewWrapper")
    ) {
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("cart-notification", CartNotification);

class OpenMiniCart extends HTMLElement {
  constructor() {
    super();

    this.cartButton = this.querySelector("a");

    this.cartButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.onClickMiniCart();
    });

    this.notification = document.getElementById("offcanvas__mini_cart");
    this.onBodyClassRemove = this.handleBodyClass.bind(this);

    this.notification.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.miniCartClose()
    );
  }

  onClickMiniCart() {
    document
      .getElementById("offcanvas__mini_cart")
      .classList.add("animate", "active");
    document.querySelector("body").classList.add("added__overlay");

    this.notification.addEventListener(
      "transitionend",
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true }
    );

    document.body.addEventListener("click", this.onBodyClassRemove);
  }

  miniCartClose() {
    document.getElementById("offcanvas__mini_cart").classList.remove("active");
    document.querySelector("body").classList.remove("added__overlay");

    document.body.removeEventListener("click", this.onBodyClassRemove);
  }

  handleBodyClass(evt) {
    let eventTarget = evt.target;
    if (
      !eventTarget.closest("cart-notification") &&
      !eventTarget.closest("open-minicart") &&
      !eventTarget.closest("button")
    ) {
      this.miniCartClose();
    }
  }
}
customElements.define("open-minicart", OpenMiniCart);
