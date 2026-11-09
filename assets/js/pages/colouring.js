import { initChrome } from '../chrome.js';
import { loadData, esc, money, fromPrice, productUrl, smoothScroll, reveal, toast, loadError } from '../core.js';
import { shot } from '../media.js';
import { bag, openBag } from '../bag.js';
import { renderIntake } from '../sections/intake-form.js';

initChrome('colouring.html');

/* ---------- Before / after gallery ---------- */
const WORK = [
  { from: '1B Natural black', to: '27 Honey blonde', piece: 'Silk Straight Bundles, 24″' },
  { from: '1B Natural black', to: '99J Merlot', piece: 'Deep Wave HD Lace Wig, 22″' },
  { from: '1B Natural black', to: '30 Auburn copper', piece: 'Kinky Curly Bundles, 20″' },
  { from: '1B Natural black', to: '613 Champagne blonde', piece: 'Silk Straight HD Lace Wig, 26″' },
];
const baTrack = document.querySelector('[data-ba-track]');
baTrack.innerHTML = WORK.map((w) => `
  <figure class="ba" data-reveal>
    <div class="ba__pair">
      <div><span class="ba__label">Before</span>${shot(`Before: ${w.piece} in ${w.from}, laid on ivory linen, daylight.`)}</div>
      <div><span class="ba__label">After</span>${shot(`After: the same hair in ${w.to}, same light and angle.`)}</div>
    </div>
    <figcaption class="ba__caption"><strong>${esc(w.from)} → ${esc(w.to)}</strong> · ${esc(w.piece)}</figcaption>
  </figure>`).join('');
document.querySelectorAll('[data-ba-dir]').forEach((b) => b.addEventListener('click', () => {
  baTrack.scrollBy({ left: Number(b.dataset.baDir) * baTrack.clientWidth * 0.8, behavior: smoothScroll() });
}));
reveal(baTrack);

/* ---------- Intake + aftercare ---------- */
const intakeEl = document.querySelector('[data-section="intake"]');
const careEl = document.querySelector('[data-section="aftercare"]');

loadData().then((data) => {
  renderIntake(intakeEl, data);

  const care = data.products.filter((p) => p.aftercare);
  careEl.innerHTML = `<div class="product-grid">${care.map((p) => {
    const img = p.images.find((i) => i.type === 'product');
    return `
    <article class="pcard" data-reveal>
      <a class="pcard__link" href="${productUrl(p.handle)}">
        <div class="pcard__media"><div class="pcard__slide">${shot(img.shot)}</div></div>
        <div>
          <h3 class="pcard__title">${esc(p.title)}</h3>
          <p class="pcard__meta">${esc(p.variants[0].label)} · ${money(fromPrice(p))}</p>
          <p class="small muted" style="margin-top:6px">${esc(p.summary)}</p>
        </div>
      </a>
      <button class="btn btn--secondary btn--block pcard__add" type="button" data-add="${p.handle}">Add to bag</button>
    </article>`;
  }).join('')}</div>`;
  reveal(careEl);

  careEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const p = care.find((x) => x.handle === b.dataset.add);
    if (bag.add([{ handle: p.handle, value: p.variants[0].value, qty: 1 }])) {
      toast(`${p.title} added to your bag`);
      openBag();
    }
  });
}).catch((err) => loadError(intakeEl, err));
