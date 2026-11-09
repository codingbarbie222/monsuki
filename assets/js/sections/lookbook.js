// Section: lookbook / customer looks carousel. Each tile names the piece worn and links to it.
// SHOPIFY: sections/lookbook.liquid with blocks (image, product, length) — or a UGC app.
import { esc, icon, findProduct, productUrl, smoothScroll, reveal } from '../core.js';
import { shot } from '../media.js';

export function renderLookbook(el, data, looks) {
  const track = el.querySelector('[data-track]');
  if (!looks.length) {
    track.innerHTML = '<p class="look__credit">New looks from our clients are on their way.</p>';
    return;
  }
  track.innerHTML = looks.map((l) => {
    const p = findProduct(data, l.handle);
    if (!p) return '';
    const piece = `${p.title}, ${l.length}″`;
    return `
    <a class="look" href="${productUrl(p.handle, { length: l.length })}" data-reveal aria-label="Client look. Wearing: ${esc(piece)}. View the piece.">
      <span class="look__media">${shot(l.shot, { dark: true })}</span>
      <span class="look__wearing">Wearing: <strong>${esc(piece)}</strong></span>
      <span class="look__credit">${esc(l.credit)}</span>
    </a>`;
  }).join('');
  track.scrollLeft = 0;
  reveal(track);
  updateNav(el);
}

function updateNav(el) {
  const track = el.querySelector('[data-track]');
  const [prev, next] = el.querySelectorAll('[data-dir]');
  if (!prev) return;
  prev.disabled = track.scrollLeft < 8;
  next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
}

export function wireLookbook(el) {
  const track = el.querySelector('[data-track]');
  el.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => {
    track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.8, behavior: smoothScroll() });
  }));
  track.addEventListener('scroll', () => updateNav(el), { passive: true });
}

export const lookbookNav = () => `
  <div class="carousel-nav">
    <button type="button" data-dir="-1" aria-label="Show previous looks">${icon('chevron-left')}</button>
    <button type="button" data-dir="1" aria-label="Show more looks">${icon('chevron-right')}</button>
  </div>`;
