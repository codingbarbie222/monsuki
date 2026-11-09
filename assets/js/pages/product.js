// Product page (shared template for bundles, wigs, frontals/closures, ponytails and aftercare).
// SHOPIFY: templates/product.json → main-product section; the selectors below map to
// Length = variant option; Colour, custom colour photo/note, cap size, measurements = line item properties.
import { initChrome } from '../chrome.js';
import {
  CONFIG, loadData, findProduct, variantFor, unitPrice, money, esc, icon, intent, toast,
  categoryLabel, colourByCode, loadError,
} from '../core.js';
import { bag, openBag } from '../bag.js';
import { renderGallery } from '../sections/gallery.js';
import { colourMarkup, wireColour } from '../sections/colour-picker.js';
import { fitMarkup, guideMarkup, wireFit } from '../sections/measurements.js';
import { renderCompleteTheLook } from '../sections/complete-the-look.js';

initChrome('');

const params = new URLSearchParams(location.search);
const info = document.querySelector('[data-section="info"]');
const galleryEl = document.querySelector('[data-section="gallery"]');
const buybar = document.querySelector('[data-buybar]');

loadData().then((data) => {
  const product = findProduct(data, params.get('id'));
  if (!product) return notFound();
  render(data, product);
}).catch((err) => loadError(info, err));

function notFound() {
  document.title = 'Piece not found — Monsuki';
  info.removeAttribute('aria-busy');
  galleryEl.remove();
  info.innerHTML = `<div class="empty-frame">
    <h1 style="font-size:2.4rem">We couldn’t find that piece</h1>
    <p class="muted">The link may be from an older collection. Everything currently available is in the collection.</p>
    <a class="btn btn--primary" href="browse.html">See every piece</a>
  </div>`;
}

function render(data, product) {
  document.title = `${product.title} — Monsuki`;
  document.querySelector('meta[name="description"]').content = product.summary;

  const cat = data.categories.find((c) => c.id === product.category);
  document.querySelector('[data-crumbs]').innerHTML = `
    <a href="${product.aftercare ? 'browse.html?category=aftercare' : `shop.html?texture=${product.textureFamily}&category=${product.category}`}">${esc(cat?.label || 'Shop')}</a>
    <span aria-hidden="true">/</span><span aria-current="page">${esc(product.title)}</span>`;

  renderGallery(galleryEl, product);

  const startVariant = variantFor(product, params.get('length'));
  const highlight = intent.wantsColour() && product.colourable;
  const q = product.quantity;

  info.innerHTML = `
    <div class="pdp__title">
      <p class="eyebrow">${esc(product.textureLabel || categoryLabel(data, product.category))}</p>
      <h1>${esc(product.title)}</h1>
      <p class="lede">${esc(product.summary)}</p>
      <p class="pdp__price"><span data-price></span> ${q ? `<small data-price-note></small>` : ''}</p>
    </div>

    <form id="buy-form" class="pdp__info" novalidate>
      ${product.variants.length > 1 ? `
      <fieldset class="field-group">
        <legend>${esc(product.option.name)} <span class="legend-value" data-length-value></span></legend>
        <div class="lengths">
          ${product.variants.map((v) => `
            <label class="len"><input type="radio" name="length" value="${v.value}" ${v === startVariant ? 'checked' : ''}
              aria-label="${esc(v.label)}, ${money(v.price)}"><span aria-hidden="true">${esc(v.label)}</span></label>`).join('')}
        </div>
      </fieldset>` : `<p class="small muted">${esc(product.option.name)}: ${esc(product.variants[0].label)}</p>`}

      ${product.colourable ? colourMarkup({ highlight }) : ''}
      ${product.capSizes ? fitMarkup() : ''}

      ${q ? `
      <div class="qty-row">
        <div>
          <p class="label" id="qty-label">${esc(q.label)}</p>
          <p class="small muted">${esc(q.note)}</p>
        </div>
        <div class="stepper" role="group" aria-labelledby="qty-label">
          <button type="button" data-q="-1" aria-label="Remove one bundle">${icon('minus', 'icon--sm')}</button>
          <output data-qty aria-live="polite">${q.default}</output>
          <button type="button" data-q="1" aria-label="Add one more bundle">${icon('plus', 'icon--sm')}</button>
        </div>
      </div>` : ''}

      <div class="buy">
        <button class="btn btn--primary btn--block buy__main" type="submit" data-buy-label>Add to bag</button>
        <p class="buy__note">Hand-checked in our studio before dispatch. Your bag is saved on this device.</p>
      </div>
    </form>

    <div data-section="complete-the-look"></div>

    <div class="accordion">
      <details open>
        <summary>Description ${icon('chevron-down')}</summary>
        <div class="accordion__body"><p>${esc(product.description)}</p></div>
      </details>
      <details>
        <summary>${product.aftercare ? 'Details' : 'Hair specs'} ${icon('chevron-down')}</summary>
        <div class="accordion__body">
          <dl class="specs">
            <div><dt>Origin</dt><dd>${esc(product.specs.origin)}</dd></div>
            <div><dt>Texture</dt><dd>${esc(product.specs.texture)}</dd></div>
            ${product.aftercare ? '' : `
            <div><dt>Density</dt><dd>${esc(product.specs.density)}</dd></div>
            <div><dt>Lace type</dt><dd>${esc(product.specs.laceType)}</dd></div>`}
            <div><dt>${product.aftercare ? 'Shelf life' : 'Lifespan'}</dt><dd>${esc(product.specs.lifespan)}</dd></div>
          </dl>
        </div>
      </details>
      <details>
        <summary>Care ritual ${icon('chevron-down')}</summary>
        <div class="accordion__body"><ol>${product.care.map((c) => `<li>${esc(c)}</li>`).join('')}</ol></div>
      </details>
    </div>`;
  info.removeAttribute('aria-busy');
  if (product.capSizes) document.body.insertAdjacentHTML('beforeend', guideMarkup());

  /* ---------- State ---------- */
  const form = info.querySelector('#buy-form');
  let qty = q?.default || 1;
  const value = () => form.querySelector('input[name="length"]:checked')?.value ?? product.variants[0].value;
  const lengthNum = () => (/^\d+$/.test(String(value())) ? Number(value()) : value());

  let colour = null; let fit = null; let ctl = null;
  const update = () => {
    const v = variantFor(product, value());
    const c = product.colourable ? colourByCode(colour?.value()) : null;
    const each = unitPrice(product, { value: v.value, colour: c?.code });
    const total = each * qty;
    info.querySelector('[data-price]').textContent = money(total);
    if (q) info.querySelector('[data-price-note]').textContent = `for ${qty} ${qty === 1 ? 'bundle' : 'bundles'} · ${money(each)} each`;
    const lv = info.querySelector('[data-length-value]');
    if (lv) lv.textContent = v.label;
    info.querySelector('[data-buy-label]').textContent = `Add to bag — ${money(total)}`;
    const summary = [v.label, c && (c.custom ? 'Custom colour' : `${c.code} ${c.name}`), fit?.summary(), q && `${qty} bundles`].filter(Boolean).join(' · ');
    buybar.querySelector('[data-buybar-summary]').textContent = summary;
    buybar.querySelector('[data-buybar-price]').textContent = money(total);
    ctl?.setMainTotal(total, c?.price || 0);
  };

  if (product.colourable) colour = wireColour(form, { onChange: update });
  if (product.capSizes) fit = wireFit(form, update);
  form.querySelectorAll('input[name="length"]').forEach((r) => r.addEventListener('change', update));
  form.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
    qty = Math.min(q.max, Math.max(q.min, qty + Number(b.dataset.q)));
    form.querySelector('[data-qty]').textContent = qty;
    form.querySelector('[data-q="-1"]').disabled = qty <= q.min;
    form.querySelector('[data-q="1"]').disabled = qty >= q.max;
    update();
  }));
  if (q) form.querySelector('[data-q="-1"]').disabled = qty <= q.min;

  /* ---------- Build the bag line(s) ---------- */
  function mainLine() {
    if (colour && !colour.validate()) return null;
    let fitData = {};
    if (fit) { fitData = fit.read(); if (!fitData) return null; }
    const line = { handle: product.handle, value: lengthNum(), qty };
    if (product.colourable) {
      line.colour = colour.value();
      // SHOPIFY: properties[_Reference photo] (file upload app) and properties[Colour note]
      if (colourByCode(line.colour).custom) {
        const { image, note } = colour.custom();
        line.custom = { image, note };
      }
    }
    return { ...line, ...fitData };
  }

  function afterAdd(message) {
    toast(message);
    openBag(); // the bag suggests the colouring brief when the "Both" intent is set
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const line = mainLine();
    if (!line) {
      // On mobile the field with the problem may be off-screen: bring it into view
      document.activeElement?.scrollIntoView({ block: 'center' });
      return;
    }
    if (bag.add([line])) afterAdd(`${product.title} added to your bag`);
  });

  /* ---------- Bundles: complete the look ---------- */
  if (product.completeTheLook) {
    ctl = renderCompleteTheLook(info.querySelector('[data-section="complete-the-look"]'), data, product, {
      onAddBoth({ handle, value: v }) {
        const line = mainLine();
        if (!line) { document.activeElement?.scrollIntoView({ block: 'center' }); return; }
        const match = { handle, value: v, qty: 1 };
        if (line.colour) { match.colour = line.colour; if (line.custom) match.custom = line.custom; }
        const piece = findProduct(data, handle).title.includes('Frontal') ? 'frontal' : 'closure';
        if (bag.add([line, match])) afterAdd(`Bundles and ${piece} added to your bag`);
      },
    });
  }

  buybar.hidden = false;
  document.body.classList.add('has-buybar');
  update();
}
