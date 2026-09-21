if (!customElements.get("color-swatch-variant")) {
  customElements.define(
    "color-swatch-variant",
    class ColorSwatchVariant extends HTMLElement {
      constructor() {
        super();
        this.variantId = this.dataset.variantId;
        this.productHandle = this.dataset.productHandle;
        this.productCard = this.closest(".product-grid-item");
        this.addEventListener("click", this.onClickHandler.bind(this));
      }

      onClickHandler(event) {
        let url = `/products/${this.productHandle}?variant=${this.variantId}&view=colorswatch`;
        fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(
              responseText,
              "text/html"
            );
            this.updateThumbnail(html);
            this.updatePrice(html)
          })
          .catch((e) => {
            console.error(e);
          });
        const colorButtonList = this.productCard.querySelectorAll(
          ".product--color-swatch"
        );
        colorButtonList.forEach((button) => {
          button.classList.remove("checked-color");
        });
        this.classList.add("checked-color");
      }
      updateThumbnail(html) {
        const testSource = html.querySelector(".media")
        const destination = this.productCard.querySelector(".media").firstChild;
        const source = html.querySelector(".media").firstChild;
        // console.log("TEST SOURCE>>>>>>>>>", source)
        if (source && destination) {
          destination.src = source.src;
          destination.srcset = source.srcset;
        }
      }
      updatePrice(html) {
        const price = this.productCard.querySelector(".price");
        const srcPrice = html.querySelector(".price");
        // console.log("PRICE>>>>", price.innerHTML)
          // console.log("PRICESRC>>>>", srcPrice)
        if(price && srcPrice){
          price.innerHTML = srcPrice.innerHTML
        }
      }
    }
  );
}
