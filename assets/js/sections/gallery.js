// Section: product gallery — swipeable slides, thumbnails, arrows, keyboard, full-screen zoom.
// SHOPIFY: sections/main-product.liquid → product.media loop (image, video, model).
import { esc, icon, smoothScroll } from '../core.js';
import { media } from '../media.js';

export function renderGallery(el, product) {
  const imgs = product.images;
  el.innerHTML = `
  <div class="gallery" role="region" aria-roledescription="carousel" aria-label="${esc(product.title)} images">
    <div class="gallery__stage">
      <div class="gallery__track" data-track tabindex="0" aria-label="Images, use arrow keys to move">
        ${imgs.map((img, i) => `
          <div class="gallery__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${imgs.length}${img.type === 'model' ? ', on model' : ''}">
            ${img.type === 'model' ? '<span class="gallery__badge">On model</span>' : ''}
            ${media(img, { eager: i === 0 })}
          </div>`).join('')}
      </div>
      <button class="icon-btn gallery__zoom" type="button" data-zoom aria-label="Zoom in on this image">${icon('zoom-in')}</button>
      <span class="gallery__counter" aria-hidden="true"><span data-index>1</span> / ${imgs.length}</span>
      <div class="gallery__arrows">
        <button type="button" data-step="-1" aria-label="Show previous image">${icon('chevron-left')}</button>
        <button type="button" data-step="1" aria-label="Show next image">${icon('chevron-right')}</button>
      </div>
    </div>
    <div class="gallery__thumbs">
      ${imgs.map((img, i) => `
        <button class="gallery__thumb" type="button" data-thumb="${i}" aria-label="Show image ${i + 1}${img.type === 'model' ? ' (on model)' : ''}" ${i === 0 ? 'aria-current="true"' : ''}>
          ${media(img, { mini: true })}
        </button>`).join('')}
    </div>
  </div>
  <dialog class="zoom" data-zoom-dialog aria-label="Zoomed image">
    <div class="zoom__viewport" data-viewport tabindex="0"><div class="zoom__canvas" data-canvas></div></div>
    <div class="zoom__bar">
      <button class="icon-btn" type="button" data-zstep="-1" aria-label="Show previous image">${icon('chevron-left')}</button>
      <button class="link small" type="button" data-ztoggle>Zoom in</button>
      <button class="icon-btn" type="button" data-zstep="1" aria-label="Show next image">${icon('chevron-right')}</button>
      <button class="icon-btn" type="button" data-close aria-label="Close zoom">${icon('x')}</button>
    </div>
  </dialog>`;

  const track = el.querySelector('[data-track]');
  const thumbs = el.querySelectorAll('[data-thumb]');
  const indexEl = el.querySelector('[data-index]');
  let current = 0;

  const go = (i, behavior = smoothScroll()) => {
    const n = (i + imgs.length) % imgs.length;
    track.scrollTo({ left: n * track.clientWidth, behavior });
  };
  const setCurrent = (i) => {
    current = i;
    indexEl.textContent = i + 1;
    thumbs.forEach((t, k) => (k === i ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
  };
  let raf;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => setCurrent(Math.round(track.scrollLeft / track.clientWidth)));
  }, { passive: true });
  new ResizeObserver(() => go(current, 'auto')).observe(track);
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
  });
  el.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => go(current + Number(b.dataset.step))));
  thumbs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.thumb))));

  // ----- Zoom
  const dlg = el.querySelector('[data-zoom-dialog]');
  const viewport = dlg.querySelector('[data-viewport]');
  const canvas = dlg.querySelector('[data-canvas]');
  const toggle = dlg.querySelector('[data-ztoggle]');
  let zIndex = 0;
  const showZoom = (i) => {
    zIndex = (i + imgs.length) % imgs.length;
    canvas.innerHTML = media(imgs[zIndex], { eager: true });
    viewport.classList.remove('is-zoomed');
    toggle.textContent = 'Zoom in';
  };
  const setZoom = (on, x = 0.5, y = 0.5) => {
    viewport.classList.toggle('is-zoomed', on);
    toggle.textContent = on ? 'Zoom out' : 'Zoom in';
    if (on) requestAnimationFrame(() => {
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) * x;
      viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) * y;
    });
  };
  el.querySelector('[data-zoom]').addEventListener('click', () => { showZoom(current); dlg.showModal(); });
  viewport.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    setZoom(!viewport.classList.contains('is-zoomed'), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  toggle.addEventListener('click', () => setZoom(!viewport.classList.contains('is-zoomed')));
  dlg.querySelectorAll('[data-zstep]').forEach((b) => b.addEventListener('click', () => { showZoom(zIndex + Number(b.dataset.zstep)); go(zIndex, 'auto'); }));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { showZoom(zIndex + 1); go(zIndex, 'auto'); }
    if (e.key === 'ArrowLeft') { showZoom(zIndex - 1); go(zIndex, 'auto'); }
  });
}
