// Section: product grid + product card.
// SHOPIFY: sections/main-collection-product-grid.liquid + snippets/card-product.liquid
// (first image = product shot, second image = on-model shot).
import { esc, money, fromPrice, productUrl, intent, reveal } from '../core.js';
import { media } from '../media.js';

export function productCard(p) {
  const shotImg = p.images.find((i) => i.type === 'product') || p.images[0];
  const model = p.images.find((i) => i.type === 'model');
  const note = intent.wantsColour() && p.colourable ? '<p class="pcard__note">Colouring available on this piece</p>' : '';
  const meta = [p.textureLabel, `from ${money(fromPrice(p))}`].filter(Boolean).join(' · ');
  return `
  <article class="pcard" data-reveal>
    <a class="pcard__link" href="${productUrl(p.handle)}">
      <div class="pcard__media" ${model ? 'data-swipe' : ''}>
        <div class="pcard__slide">${media(shotImg)}</div>
        ${model ? `<div class="pcard__slide pcard__slide--model">${media(model)}</div>` : ''}
      </div>
      <div>
        <h3 class="pcard__title">${esc(p.title)}</h3>
        <p class="pcard__meta">${esc(meta)}</p>
        ${note}
      </div>
    </a>
    ${model ? '<div class="pcard__dots" aria-hidden="true"><span class="is-on"></span><span></span></div>' : ''}
  </article>`;
}

/** Keeps the little 1/2 indicator in sync when a card is swiped on touch screens. */
function wireSwipeDots(root) {
  root.querySelectorAll('[data-swipe]').forEach((track) => {
    const dots = track.closest('.pcard').querySelectorAll('.pcard__dots span');
    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
    }, { passive: true });
  });
}

/**
 * @param el        container element
 * @param products  products to show
 * @param empty     { title, text, actions: [{ label, onAction }] } for the filtered-zero state
 */
export function renderProductGrid(el, products, { empty, columns = 3 } = {}) {
  if (!products.length) {
    el.innerHTML = `<div class="empty-frame" role="status">
      <h3>${esc(empty?.title || 'Nothing here just yet')}</h3>
      <p class="muted">${esc(empty?.text || '')}</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
        ${(empty?.actions || []).map((a, i) => `<button class="btn ${i ? 'btn--secondary' : 'btn--primary'}" type="button" data-empty-action="${i}">${esc(a.label)}</button>`).join('')}
      </div>
    </div>`;
    el.querySelectorAll('[data-empty-action]').forEach((b) => b.addEventListener('click', () => empty.actions[Number(b.dataset.emptyAction)].onAction()));
    return;
  }
  el.innerHTML = `<div class="product-grid ${columns === 4 ? 'product-grid--4' : ''}">${products.map(productCard).join('')}</div>`;
  wireSwipeDots(el);
  reveal(el);
}
