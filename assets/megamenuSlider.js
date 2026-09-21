theme.megamenuSliderModule = (function () {
  
  class MegamenuSlider extends HTMLElement {
    constructor() {
      super();
      this.menuSliderSelector = this.querySelector(".megamenu-slider-active");
      this.productsShow = parseInt(this.dataset.products_show);
      this.autoPlay = parseInt(this.dataset.autoplay);
      this.autoPlayTime = parseInt(this.dataset.autoplay_time);
      this.buttonNext = this.querySelector(".swiper-button-next");
      this.buttonPrev = this.querySelector(".swiper-button-prev");
      this.pagination = this.querySelector(".swiper-pagination");
      
      this.init();
    }
  
    init() {
      let featuredCollection = new Swiper(this.menuSliderSelector, {
          loop: true,
          spaceBetween: 30,
          slidesPerView: this.productsShow,
          autoplay: {
            delay: this.autoPlayTime,
          },
          navigation: {
            nextEl: this.buttonNext,
            prevEl: this.buttonPrev,
          },
          pagination: {
            el: this.pagination,
            clickable: true,
            type: "fraction"
          }
        });
    }
  }
  
  customElements.define("megamenu-slider", MegamenuSlider);
  
})();