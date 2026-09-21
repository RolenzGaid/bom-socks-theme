# Sock bundle — pack size selector

Adds a DROOL-style pack-size selector to the product page: **Single / 2 Pack / 3 Pack / 4 Pack**.
Picking a multi-pack opens a sock picker in the product image column so the customer chooses
which socks go in the pack, and each pack can carry its own Shopify discount code.

## Files

| File | What it does |
| --- | --- |
| `snippets/sock-bundle.liquid` | The tier cards, the chosen-socks slots, the bundle total and the bundle add-to-cart button. Rendered in the product info column. |
| `snippets/sock-bundle-picker.liquid` | The sock picker grid. Rendered in the product media (left) column. |
| `assets/sock-bundle.js` | The `<sock-bundle>` custom element: tier switching, slot filling, add to cart, discount redirect. |
| `assets/sock-bundle.css` | All styling. |
| `sections/main-product.liquid` | Wires the above in: loads the assets, adds the `sock_bundle` block, renders the picker into the media column. |

## Setting it up in the theme editor

1. Open **Online Store → Themes → Customize**, then a **Product** page.
2. In the **Product information** section, click **Add block → Sock bundle (pack size)**.
   Drag it where you want it — above **Buy buttons** matches the reference layout.
3. Under **Sock picker**, choose the collection of socks customers may pick from.
   This is required: without it the picker has nothing to show.
4. For each of **2 socks**, **3 socks** and **4 socks**, set:
   - **Label** — e.g. `2 Pack`
   - **Top badge** — e.g. `10% OFF` (leave blank to hide)
   - **Bottom badge** — e.g. `Pick any 2` (leave blank to hide)
   - **Discount code** — the Shopify discount code for that pack

## Discount codes

The block does not create discounts. Create them first in **Shopify admin → Discounts**,
then paste the code into the matching tier.

When a pack is added to cart, the browser is sent to
`/discount/<CODE>?redirect=/cart`, which is Shopify's own way of attaching a
discount code to the cart. The discount then carries through to checkout.

Recommended discount setup, so a code can only be used for the pack it belongs to:

- Type: **Amount off products** (or **Percentage**)
- Applies to: the same collection you picked in **Sock picker**
- **Minimum quantity of items**: set it to the pack size (2, 3 or 4)

The minimum-quantity rule is what stops a 4-pack code from being used on a single pair.

Two things worth knowing:

- Discount codes set here are readable in the page source, as they must be for
  the browser to apply them. The minimum-quantity rule above is what keeps that safe.
- Shopify applies **one** discount code per order. If a customer already has a code
  in their cart, this one replaces it.

## Behaviour notes

- **Single** leaves the theme's normal add-to-cart form alone — nothing changes.
- Selecting 2/3/4 hides the normal add-to-cart (and the sticky bar) and shows the
  bundle button instead. Turn this off with *Hide the normal add to cart while a
  pack is selected*.
- The first slot is pre-filled with the product being viewed, and follows the
  variant picker. Turn this off with *Pre-fill the first slot with this product*.
- Socks with more than one variant get a dropdown on their picker card.
- The same sock can be picked more than once; Shopify merges those into one
  cart line with a higher quantity.
- The bundle total shown is the total **before** the discount code is applied.
