import { initChrome } from '../chrome.js';
import { loadData, intent, icon, smoothScroll, loadError } from '../core.js';
import { renderCategoryGrid } from '../sections/category-grid.js';
import { renderProductGrid } from '../sections/product-grid.js';
import { renderLookbook, wireLookbook, lookbookNav } from '../sections/lookbook.js';

initChrome('shop.html');

const params = new URLSearchParams(location.search);
const state = {
  texture: params.get('texture') === 'curly' ? 'curly' : 'straight',
  category: params.get('category') || null,
};
const TEXTURE_NAME = { straight: 'Straight', curly: 'Curly' };

/* ---------- "Both" intent note ---------- */
function renderIntentNote() {
  const el = document.querySelector('[data-section="intent-note"]');
  if (!intent.wantsColour()) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="intent-note on-dark">
      <div class="container intent-note__inner">
        <p><span class="intent-note__mark" aria-hidden="true"></span>Colouring noted for this visit — we’ll show you your shade options on every piece.</p>
        <a class="link" href="colouring.html">Read about colouring</a>
        <button class="link" type="button" data-intent-off>Hide colour notes</button>
      </div>
    </div>`;
  el.querySelector('[data-intent-off]').addEventListener('click', () => {
    intent.clear();
    renderIntentNote();
    render();
    document.getElementById('main').focus?.();
  });
}

let data;
const grid = document.querySelector('[data-section="product-grid"]');
const cats = document.querySelector('[data-section="category-grid"]');
const look = document.querySelector('[data-section="lookbook"]');
const title = document.getElementById('grid-title');
const clearBtn = document.querySelector('[data-clear-category]');

function syncUrl() {
  const q = new URLSearchParams(location.search);
  q.set('texture', state.texture);
  state.category ? q.set('category', state.category) : q.delete('category');
  q.delete('intent');
  history.replaceState(null, '', `?${q}${location.hash}`);
}

function render() {
  const shopCats = data.categories.filter((c) => !c.hiddenInShop);
  const inTexture = data.products.filter((p) => p.textureFamily === state.texture);
  const counts = Object.fromEntries(shopCats.map((c) => [c.id, inTexture.filter((p) => p.category === c.id).length]));

  renderCategoryGrid(cats, shopCats, {
    counts,
    selected: state.category,
    onSelect(id) {
      state.category = state.category === id ? null : id;
      syncUrl();
      render();
      document.getElementById('pieces').scrollIntoView({ behavior: smoothScroll(), block: 'start' });
    },
  });

  const list = inTexture.filter((p) => !state.category || p.category === state.category);
  const catLabel = state.category ? shopCats.find((c) => c.id === state.category)?.label.toLowerCase() : 'pieces';
  title.textContent = `${TEXTURE_NAME[state.texture]} ${catLabel}`;
  clearBtn.hidden = !state.category;

  const other = state.texture === 'straight' ? 'curly' : 'straight';
  renderProductGrid(grid, list, {
    empty: {
      title: `No ${TEXTURE_NAME[state.texture].toLowerCase()} ${catLabel} just yet`,
      text: `This piece is currently made in ${other} textures only.`,
      actions: [
        { label: `See ${TEXTURE_NAME[other].toLowerCase()} ${catLabel}`, onAction: () => setTexture(other) },
        { label: 'Clear all filters', onAction: () => { state.category = null; setTexture('straight'); } },
      ],
    },
  });

  renderLookbook(look, data, data.lookbook.filter((l) => l.textureFamily === state.texture));
}

function setTexture(t) {
  state.texture = t;
  document.querySelector(`input[name="texture"][value="${t}"]`).checked = true;
  syncUrl();
  render();
}

document.querySelectorAll('input[name="texture"]').forEach((r) => r.addEventListener('change', () => setTexture(r.value)));
clearBtn.addEventListener('click', () => { state.category = null; syncUrl(); render(); });

// Hero halves set the texture without reloading the page
document.querySelectorAll('[data-texture-link]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  setTexture(a.dataset.textureLink);
  document.getElementById('collection').scrollIntoView({ behavior: smoothScroll(), block: 'start' });
  document.querySelector(`input[name="texture"][value="${a.dataset.textureLink}"]`).focus({ preventScroll: true });
}));

document.querySelector('[data-lookbook-nav]').innerHTML = lookbookNav();
wireLookbook(look);
renderIntentNote();
document.querySelector(`input[name="texture"][value="${state.texture}"]`).checked = true;

loadData()
  .then((d) => { data = d; render(); })
  .catch((err) => loadError(grid, err));
