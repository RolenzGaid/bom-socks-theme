if (!customElements.get("scrolling-text")) {
  class example extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      (this.promotion = this.querySelector(".scrolling")), this.init();
    }
    init() {
      if (1 === this.childElementCount) {
        this.promotion.classList.add("scrolling--animated");
        for (let e = 0; e < 10; e++)
          (this.clone = this.promotion.cloneNode(!0)),
            this.clone.setAttribute("aria-hidden", !0),
            this.appendChild(this.clone);
        
        new IntersectionObserver(
          (e, t) => {
            e.forEach((e) => {
              e.isIntersecting ? this.scrollingPlay() : this.scrollingPause();
            });
          },
          { rootMargin: "0px 0px 50px 0px" }
        ).observe(this);
      }
    }
    scrollingPlay() {
      this.classList.remove("scrolling--paused");
    }
    scrollingPause() {
      this.classList.add("scrolling--paused");
    }
  }
  customElements.define("scrolling-text", example);
}