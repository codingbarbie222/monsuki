// The bag: stored in this browser (localStorage), rendered in a slide-over.
// SHOPIFY: replace this module with the Ajax Cart API (/cart/add.js, /cart/change.js).
// Each bag line maps to a cart line: variant = product + length; colour, custom colour photo/note,
// cap size and measurements become line item `properties`.
import {
  CONFIG, loadData, findProduct, variantFor, unitPrice, money, esc, icon, colourByCode,
  intent, toast,
} from './core.js';
import { media } from './media.js';

const KEY = 'monsuki.bag';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function write(lines) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
    return true;
  } catch {
    // Usually: storage full because of several reference photos.
    toast('Your bag is full on this device. Remove a reference photo or an item and try again.');
    return false;
  }
}
const emit = () => window.dispatchEvent(new CustomEvent('bag:change'));
const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export const bag = {
  lines: read,
  count: () => read().reduce((n, l) => n + l.qty, 0),
  /** Add one or several lines in one tap. Returns true when saved. */
  add(newLines) {
    const lines = read();
    newLines.forEach((l) => lines.push({ key: newKey(), qty: 1, ...l }));
    const ok = write(lines);
    if (ok) emit();
    return ok;
  },
  update(key, patch) {
    const lines = read().map((l) => (l.key === key ? { ...l, ...patch } : l));
    if (write(lines)) emit();
  },
  remove(key) {
    write(read().filter((l) => l.key !== key));
    emit();
  },
};

/* ---------- Line summaries (also used for future Shopify line item properties) ---------- */
export function lineDescription(product, line) {
  const parts = [variantFor(product, line.value).label];
  if (product.colourable) {
    const c = colourByCode(line.colour);
    parts.push(c.custom ? 'Custom colour' : `${c.code} ${c.name}`);
  }
  return parts.join(' · ');
}

function measurementsSummary(line) {
  if (line.capSize) {
    const c = CONFIG.capSizes.find((s) => s.code === line.capSize);
    return `Cap size: ${c ? `${c.label} (${c.range})` : line.capSize}`;
  }
  if (line.measurements) {
    const m = line.measurements;
    const u = m.unit === 'in' ? '″' : ' cm';
    return `Custom fit: circumference ${m.circumference}${u} · front to nape ${m.frontToNape}${u} · ear to ear ${m.earToEar}${u} · temple to temple ${m.templeToTemple}${u}`;
  }
  return '';
}

/* ---------- Drawer ---------- */
let pendingRemove = null;

function lineHtml(p, line) {
  const img = p.images.find((i) => i.type === 'product') || p.images[0];
  const name = `${p.title}, ${variantFor(p, line.value).label}`;
  const lengthSelect = p.variants.length > 1 ? `
    <label class="mini-field">
      <span class="mini-field__label">${esc(p.option.name)}</span><span class="mini-select">
      <select data-field="value" aria-label="${esc(p.option.name)} for ${esc(p.title)}" data-fid="${line.key}-value">
        ${p.variants.map((v) => `<option value="${esc(v.value)}" ${String(v.value) === String(line.value) ? 'selected' : ''}>${esc(v.label)} · ${money(v.price)}</option>`).join('')}
      </select>${icon('chevron-down')}</span>
    </label>` : '';
  const colours = CONFIG.colours.filter((c) => !c.custom || line.colour === 'custom');
  const colourSelect = p.colourable ? `
    <label class="mini-field">
      <span class="mini-field__label">Colour</span><span class="mini-select">
      <select data-field="colour" aria-label="Colour for ${esc(p.title)}" data-fid="${line.key}-colour">
        ${colours.map((c) => `<option value="${c.code}" ${c.code === line.colour ? 'selected' : ''}>${c.custom ? 'Custom colour' : `${c.code} ${esc(c.name)}`}${c.price ? ` (+${money(c.price)})` : ''}</option>`).join('')}
      </select>${icon('chevron-down')}</span>
    </label>` : '';
  const custom = line.colour === 'custom' && line.custom ? `
    <div class="bag-line__extra">
      ${line.custom.image ? `<img src="${line.custom.image}" alt="Your reference photo for the custom colour">` : ''}
      ${line.custom.note ? `<span>Note to colourist: “${esc(line.custom.note)}”</span>` : ''}
    </div>` : '';
  const fit = measurementsSummary(line);
  const confirming = pendingRemove === line.key;
  return `
  <li class="bag-line" data-key="${line.key}">
    <a class="bag-line__media" href="product.html?id=${esc(p.handle)}" tabindex="-1" aria-hidden="true">${media(img, { mini: true })}</a>
    <div>
      <p class="bag-line__title"><a href="product.html?id=${esc(p.handle)}">${esc(p.title)}</a></p>
      <p class="bag-line__meta">${esc(lineDescription(p, line))}</p>
      <div class="bag-line__edit">${lengthSelect}${colourSelect}</div>
      ${custom}
      ${fit ? `<p class="bag-line__extra">${esc(fit)}</p>` : ''}
      <div class="bag-line__foot">
        <div class="stepper" role="group" aria-label="Quantity of ${esc(p.title)}">
          <button type="button" data-qty="-1" data-fid="${line.key}-minus" aria-label="Remove one" ${line.qty <= 1 ? 'disabled' : ''}>${icon('minus', 'icon--sm')}</button>
          <output aria-live="polite">${line.qty}</output>
          <button type="button" data-qty="1" data-fid="${line.key}-plus" aria-label="Add one more" ${line.qty >= 10 ? 'disabled' : ''}>${icon('plus', 'icon--sm')}</button>
        </div>
        <strong>${money(unitPrice(p, line) * line.qty)}</strong>
      </div>
      ${confirming ? '' : `<button class="link small" type="button" data-remove data-fid="${line.key}-remove">Remove</button>`}
    </div>
    ${confirming ? `
    <div class="bag-line__confirm" role="group" aria-label="Confirm removal">
      <p>Remove ${esc(name)} from your bag?</p>
      <button class="btn btn--primary" type="button" data-confirm-remove data-fid="${line.key}-confirm">Remove ${esc(p.title)}</button>
      <button class="btn btn--secondary" type="button" data-keep data-fid="${line.key}-keep">Keep it</button>
    </div>` : ''}
  </li>`;
}

async function render() {
  const dlg = document.getElementById('bag');
  if (!dlg) return;
  const body = dlg.querySelector('.sheet__body');
  const foot = dlg.querySelector('.sheet__foot');
  const focusId = document.activeElement?.dataset?.fid;
  const data = await loadData();
  const lines = read().map((l) => ({ l, p: findProduct(data, l.handle) })).filter((x) => x.p);

  if (!lines.length) {
    body.innerHTML = `<div class="bag-empty">
      <h3 class="serif" style="font-size:1.8rem">Your bag is waiting</h3>
      <p class="muted">Nothing here yet. Begin with the collection and we’ll keep your pieces safe on this device.</p>
      <a class="btn btn--primary" href="shop.html">Explore the collection</a>
    </div>`;
    foot.hidden = true;
  } else {
    const subtotal = lines.reduce((s, { l, p }) => s + unitPrice(p, l) * l.qty, 0);
    const suggest = intent.wantsColour() ? `
      <div class="bag-suggest on-dark">
        <h3>Your colour, next</h3>
        <p>You mentioned colouring. Share your shade, reference photos and event date with our colourist.</p>
        <a class="link" href="colouring.html#brief">Open the colouring brief ${icon('arrow-right', 'icon--sm')}</a>
      </div>` : '';
    body.innerHTML = `<ul class="bag-lines">${lines.map(({ l, p }) => lineHtml(p, l)).join('')}</ul>${suggest}`;
    foot.hidden = false;
    foot.querySelector('[data-subtotal]').textContent = money(subtotal);
  }
  if (focusId) dlg.querySelector(`[data-fid="${focusId}"]`)?.focus();
}

function wireDrawer() {
  const dlg = document.getElementById('bag');
  dlg.addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-field]');
    if (!sel) return;
    const key = sel.closest('[data-key]').dataset.key;
    const patch = { [sel.dataset.field]: sel.dataset.field === 'value' && /^\d+$/.test(sel.value) ? Number(sel.value) : sel.value };
    bag.update(key, patch);
  });
  dlg.addEventListener('click', (e) => {
    const lineEl = e.target.closest('[data-key]');
    const key = lineEl?.dataset.key;
    if (e.target.closest('[data-qty]')) {
      const line = read().find((l) => l.key === key);
      const qty = Math.min(10, Math.max(1, line.qty + Number(e.target.closest('[data-qty]').dataset.qty)));
      bag.update(key, { qty });
    } else if (e.target.closest('[data-remove]')) {
      pendingRemove = key; render().then(() => dlg.querySelector(`[data-fid="${key}-keep"]`)?.focus());
    } else if (e.target.closest('[data-keep]')) {
      pendingRemove = null; render().then(() => dlg.querySelector(`[data-fid="${key}-remove"]`)?.focus());
    } else if (e.target.closest('[data-confirm-remove]')) {
      pendingRemove = null; bag.remove(key); toast('Removed from your bag');
      requestAnimationFrame(() => dlg.querySelector('[data-close]')?.focus());
    } else if (e.target.closest('[data-checkout]')) {
      document.getElementById('checkout-demo').showModal();
    }
  });
  window.addEventListener('bag:change', render);
  window.addEventListener('storage', (e) => { if (e.key === KEY) { emit(); } });
}

export function openBag() {
  pendingRemove = null;
  render();
  const dlg = document.getElementById('bag');
  if (!dlg.open) dlg.showModal();
}

export function bagMarkup() {
  return `
  <dialog id="bag" class="sheet" aria-labelledby="bag-title">
    <div class="sheet__head">
      <h2 id="bag-title">Your bag</h2>
      <button class="icon-btn" type="button" data-close aria-label="Close your bag">${icon('x')}</button>
    </div>
    <div class="sheet__body"></div>
    <div class="sheet__foot" hidden>
      <div class="bag-total"><span>Subtotal</span><strong data-subtotal></strong></div>
      <p class="small muted">Delivery and any colour adjustments are confirmed at checkout.</p>
      <button class="btn btn--primary btn--block" type="button" data-checkout>Check out</button>
    </div>
  </dialog>
  <dialog id="checkout-demo" class="modal" aria-labelledby="checkout-title">
    <p class="eyebrow">Demo</p>
    <h2 id="checkout-title">Checkout coming soon</h2>
    <p class="muted">This is a preview of the Monsuki boutique. In the finished store, this is where secure checkout opens. Your bag stays saved on this device.</p>
    <button class="btn btn--primary" type="button" data-close>Return to your bag</button>
  </dialog>`;
}

export function initBag() {
  wireDrawer();
  render();
}
