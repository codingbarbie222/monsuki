// Section: category grid (Bundles · HD lace wigs · Frontals & closures · Ponytails).
// SHOPIFY: sections/collection-list.liquid, one block per collection.
import { esc } from '../core.js';
import { shot } from '../media.js';

export function renderCategoryGrid(el, categories, { counts, selected, onSelect }) {
  el.innerHTML = `<div class="cat-grid">${categories.map((c) => `
    <button class="cat-tile" type="button" data-cat="${c.id}" aria-pressed="${c.id === selected}" data-reveal>
      <span class="cat-tile__media">${shot(c.shot)}</span>
      <span>
        <span class="cat-tile__name">${esc(c.label)}</span><br>
        <span class="cat-tile__count">${counts[c.id] || 0} ${counts[c.id] === 1 ? 'piece' : 'pieces'}</span>
      </span>
    </button>`).join('')}</div>`;
  el.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => onSelect(b.dataset.cat)));
}
