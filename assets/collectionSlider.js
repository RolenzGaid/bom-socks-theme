theme.collectionSliderModule = (function () {
  
  class CollectionSlider extends HTMLElement {
    constructor() {
      super();
      this.collectionSliderSelector = this.querySelector(".collection-slider-active");
      this.productsShow = parseInt(this.dataset.products_show);
      this.autoPlay = parseInt(this.dataset.autoplay);
      this.autoPlayTime = parseInt(this.dataset.autoplay_time);
      this.buttonNext = this.querySelector(".swiper-button-next");
      this.buttonPrev = this.querySelector(".swiper-button-prev");
      this.pagination = this.querySelector(".swiper-pagination");
      
      this.init();
    }
  
    init() {
      let featuredCollection = new Swiper(this.collectionSliderSelector, {
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
          },  
          breakpoints: {
            640: {
              slidesPerView: 1.25,
              spaceBetween: 20
            },
            1024: {
              slidesPerView: this.productsShow,
              spaceBetween: 20
            }
          }
        });
    }
  }
  
  customElements.define("collection-slider", CollectionSlider);
  
})();