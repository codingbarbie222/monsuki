// Shared helpers: config, data, money, icons, escaping, session intent, reveal-on-scroll.
export const CONFIG = window.MONSUKI_CONFIG;

const DATA_URL = new URL('../../data/products.json', import.meta.url);
const ICONS_URL = new URL('../icons.svg', import.meta.url).href;

let dataPromise;
export function loadData() {
  dataPromise ??= fetch(DATA_URL).then((r) => {
    if (!r.ok) throw new Error(`Could not load products (${r.status})`);
    return r.json();
  });
  return dataPromise;
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="${ICONS_URL}#${name}"></use></svg>`;

const fmt = {};
export function money(n) {
  const key = Number.isInteger(n) ? 'int' : 'dec';
  fmt[key] ??= new Intl.NumberFormat(CONFIG.currency.locale, {
    style: 'currency', currency: CONFIG.currency.code,
    minimumFractionDigits: key === 'int' ? 0 : 2, maximumFractionDigits: key === 'int' ? 0 : 2,
  });
  return fmt[key].format(n);
}

/* ---------- Products ---------- */
export const productUrl = (handle, params = {}) => `product.html?${new URLSearchParams({ id: handle, ...params })}`;
export const findProduct = (data, handle) => data.products.find((p) => p.handle === handle);
export const fromPrice = (p) => Math.min(...p.variants.map((v) => v.price));
export const variantFor = (p, value) => p.variants.find((v) => String(v.value) === String(value)) || p.variants[0];
export const colourByCode = (code) => CONFIG.colours.find((c) => c.code === code) || CONFIG.colours[0];
export const categoryLabel = (data, id) => data.categories.find((c) => c.id === id)?.label || id;

/** Price of one unit of a bag line / selection: variant price + colouring service. */
export function unitPrice(product, { value, colour }) {
  const base = variantFor(product, value).price;
  const add = product.colourable && colour ? colourByCode(colour).price : 0;
  return base + add;
}

export const colourPriceLabel = (c) =>
  c.included ? 'Included' : `${c.priceNote ? `${c.priceNote} ` : ''}+ ${money(c.price)}`;

/* ---------- Session intent ("Both": shopping hair + colouring) ---------- */
const INTENT_KEY = 'monsuki.intent';
export const intent = {
  get() { try { return sessionStorage.getItem(INTENT_KEY); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(INTENT_KEY, v); } catch {} },
  clear() { try { sessionStorage.removeItem(INTENT_KEY); } catch {} },
  wantsColour() { return this.get() === 'both'; },
};
/** Links can carry ?intent=both so the flag survives a refresh or a shared link. */
export function readIntentFromUrl() {
  const v = new URLSearchParams(location.search).get('intent');
  if (v === 'both') intent.set('both');
  if (v === 'none') intent.clear();
}

/* ---------- Soft fade-in on scroll (respects reduced motion) ---------- */
export function reveal(root = document) {
  const els = root.querySelectorAll('[data-reveal]:not(.is-in)');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}

/* ---------- Toast ---------- */
let toastTimer;
export function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

export const smoothScroll = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

/** Show a gentle error inside a section frame if data fails to load. */
export function loadError(el, err) {
  console.error(err);
  el.innerHTML = `<div class="empty-frame"><h3>We couldn’t open the collection</h3>
    <p class="muted">Please refresh the page. If you opened the file directly from your computer, run it through a local server or GitHub Pages instead.</p>
    <button class="btn btn--secondary" type="button" onclick="location.reload()">Refresh the page</button></div>`;
}
