import { initChrome } from '../chrome.js';
import { loadData, esc, loadError } from '../core.js';
import { renderProductGrid } from '../sections/product-grid.js';

initChrome('browse.html');

const params = new URLSearchParams(location.search);
const state = { category: params.get('category') || 'all', texture: params.get('texture') || 'all' };
const chips = document.querySelector('[data-chips]');
const count = document.querySelector('[data-count]');
const textureSel = document.querySelector('[data-texture]');
const grid = document.querySelector('[data-section="product-grid"]');
let data;

function syncUrl() {
  const q = new URLSearchParams();
  if (state.category !== 'all') q.set('category', state.category);
  if (state.texture !== 'all') q.set('texture', state.texture);
  history.replaceState(null, '', q.toString() ? `?${q}` : location.pathname);
}

function render() {
  chips.innerHTML = [{ id: 'all', label: 'Everything' }, ...data.categories]
    .map((c) => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${state.category === c.id}">${esc(c.label)}</button>`)
    .join('');
  textureSel.value = state.texture;

  const list = data.products.filter((p) =>
    (state.category === 'all' || p.category === state.category) &&
    // Aftercare suits every texture, so it stays visible under any texture filter
    (state.texture === 'all' || !p.textureFamily || p.textureFamily === state.texture));
  count.textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;

  renderProductGrid(grid, list, {
    columns: 4,
    empty: {
      title: 'Nothing in this combination yet',
      text: 'Try every texture, or another kind of piece.',
      actions: [
        { label: 'Show every texture', onAction: () => { state.texture = 'all'; syncUrl(); render(); } },
        { label: 'Clear all filters', onAction: () => { state.texture = 'all'; state.category = 'all'; syncUrl(); render(); } },
      ],
    },
  });
}

chips.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  state.category = b.dataset.cat;
  syncUrl();
  render();
  chips.querySelector(`[data-cat="${state.category}"]`).focus();
});
textureSel.addEventListener('change', () => { state.texture = textureSel.value; syncUrl(); render(); });

loadData().then((d) => { data = d; render(); }).catch((err) => loadError(grid, err));
