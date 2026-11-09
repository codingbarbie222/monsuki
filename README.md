# Monsuki — clickable client prototype

A static prototype of the Monsuki boutique: plain HTML, CSS and vanilla JavaScript.
No build step, no server, no database. It will later be rebuilt as a Shopify theme,
so every part is organised as a reusable section with `// SHOPIFY:` notes.

## Pages

| File | Page |
|---|---|
| `index.html` | Welcome — “What are you looking for?” (hair / colouring / both / just browsing) |
| `shop.html` | Shop — split hero, Straight / Curly toggle, categories, product grid, lookbook |
| `product.html?id=<handle>` | Product template — bundles, wigs, frontals & closures, ponytails, aftercare |
| `colouring.html` | Colouring service — hero, before/after, 3-step colour brief, aftercare |
| `browse.html` | Every piece, with category and texture filters |

Product examples: `product.html?id=silk-straight-bundles` (bundle + Complete the look),
`product.html?id=deep-wave-hd-lace-wig` (wig + measurements),
`product.html?id=silk-straight-hd-lace-frontal`, `product.html?id=sleek-straight-ponytail`.

## Put it on GitHub Pages

1. Create a repository called `monsuki` and upload **everything in this folder** to the `main` branch
   (keep the folder structure; include the hidden `.nojekyll` file).
2. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch **main**, folder **/ (root)** → **Save**.
3. After a minute the site is live at `https://<username>.github.io/monsuki/`.

All paths are relative, so it works in that subfolder and on refresh. Each page is its own HTML file.

## Try it on your computer

Pages load their data with `fetch`, which browsers block when you double-click a file.
Run a tiny local server in this folder instead:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## What to edit

| What | Where |
|---|---|
| Admin email, form service key, currency, **colour price list**, cap sizes | `config.js` |
| Products: names, texture, lengths & price per length, images, specs, care, matching frontal/closure | `data/products.json` |
| Categories and the lookbook (customer looks) | `data/products.json` (`categories`, `lookbook`) |
| Colours, type, spacing, motion (design tokens) | top of `assets/css/styles.css` |
| Design rules (taste, accessibility, voice, banned patterns) | `.ux-profile.md` |

### Swapping placeholders for real photos

Every image is a labelled box describing the intended shot. To use a photo:

1. Put the file in `/images` (e.g. `images/silk-straight-bundles-model.jpg`).
2. In `data/products.json`, find that image and set `"src": "images/silk-straight-bundles-model.jpg"`.
   Keep `"alt"` as a short description for screen readers.

For each product, the first `"type": "product"` image is the card image and the first
`"type": "model"` image is the hover / swipe image on product cards.
Editorial images on the Welcome, Shop and Colouring pages are written directly in those HTML files —
replace the `<span class="ph">…</span>` block with `<img class="media" src="images/…" alt="…">`.

### Colouring brief emails

The colour brief on `colouring.html` posts to a static-friendly form service:

- **Web3Forms** — create an access key at web3forms.com for `studio@…`, then set
  `formService: { provider: 'web3forms', key: 'YOUR-KEY' }`.
- **Formspree** — create a form at formspree.io with the studio address, then set
  `formService: { provider: 'formspree', key: 'FORM-ID' }` (the part after `/f/`).

With no key the form runs in **demo mode**: it shows the confirmation screen and sends nothing.
Note: file attachments (the reference photo) need a paid plan on both services. On free plans
the text arrives, but the photo does not.

## How the demo behaves

- **Bag** — saved in this browser (`localStorage`). Add, remove (with confirmation), change length,
  colour and quantity, subtotal. **Check out** shows “Demo — checkout coming soon”.
- **“Both” on the Welcome page** — remembered for the visit (`sessionStorage`): colour options are
  highlighted on products, and the bag suggests the colouring brief after adding hair.
- **Custom colour** — the reference photo is resized and kept with the bag item, with the note.
- **Wig measurements** — cap size or custom (cm / inches), saved to the bag line and remembered
  on this device for the next wig.
- **Colour brief** — a draft is kept on this device as she types and cleared once sent.

## Shopify rebuild — what replaces what

Search the code for `SHOPIFY:` for the exact spots.

| Prototype | Shopify |
|---|---|
| `data/products.json` product | Product; `Length` = variant option (`variants[].price` = variant price) |
| `texture`, `textureFamily`, `category` | Product type / tags / collections |
| `completeTheLook` | Product metafield (list of product references) |
| Colour choice + `config.js` colour prices | Line item property `Colour` + a colouring add-on product/variant |
| Custom colour photo + note | File-upload app field + line item properties (visible in the order and notification email) |
| Cap size / measurements | Line item properties |
| `bag.js` | Ajax Cart API (`/cart/add.js`, `/cart/change.js`) |
| `assets/js/sections/*` | Theme sections: header, hero-split, category-grid, product-grid, lookbook, product gallery, complete-the-look, wig-fit, intake form |

## Known limits of the prototype

- Checkout, payment and accounts are not built (by design).
- The bag and uploads live in one browser only; clearing site data empties them.
- Prices, product copy and imagery are sample content.
