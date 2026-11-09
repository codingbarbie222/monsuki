// Section: "Complete the look" — bundles only. Suggests the matching frontal or closure in the
// same texture, with its own length, and adds it alongside the bundles in one tap.
// SHOPIFY: sections/complete-the-look.liquid using a product metafield (list of matching products)
// and a single /cart/add.js call with two items.
import { esc, icon, money, findProduct, productUrl } from '../core.js';
import { media } from '../media.js';

export function renderCompleteTheLook(el, data, product, { onAddBoth }) {
  const options = (product.completeTheLook || []).map((h) => findProduct(data, h)).filter(Boolean);
  if (!options.length) { el.hidden = true; return null; }

  const state = { handle: options[0].handle, value: findProduct(data, options[0].handle).variants[0].value };
  const pick = () => findProduct(data, state.handle);

  function render() {
    const p = pick();
    const img = p.images.find((i) => i.type === 'product') || p.images[0];
    el.innerHTML = `
    <section class="ctl" aria-labelledby="ctl-title">
      <div class="ctl__head">
        <p class="eyebrow">For a seamless finish</p>
        <h2 id="ctl-title">Complete the look</h2>
        <p class="small muted">Made from the same ${esc(product.textureLabel.toLowerCase())} hair, so the lustre matches perfectly.</p>
      </div>
      ${options.length > 1 ? `
        <div class="segmented segmented--sm" role="radiogroup" aria-label="Frontal or closure">
          ${options.map((o) => `<label><input type="radio" name="ctl-kind" value="${o.handle}" ${o.handle === state.handle ? 'checked' : ''}><span>${o.title.includes('Frontal') ? 'Frontal' : 'Closure'}</span></label>`).join('')}
        </div>` : ''}
      <div class="ctl__item">
        <a class="ctl__media" href="${productUrl(p.handle)}" tabindex="-1" aria-hidden="true">${media(img, { mini: true })}</a>
        <div>
          <h3><a href="${productUrl(p.handle)}">${esc(p.title)}</a></h3>
          <p class="small muted">${esc(p.summary)}</p>
          <div class="ctl__controls">
            <label class="mini-field">
              <span class="mini-field__label">Length</span><span class="mini-select">
              <select data-ctl-length aria-label="Length of the ${esc(p.title)}">
                ${p.variants.map((v) => `<option value="${v.value}" ${String(v.value) === String(state.value) ? 'selected' : ''}>${v.label} · ${money(v.price)}</option>`).join('')}
              </select>${icon('chevron-down')}</span>
            </label>
          </div>
        </div>
      </div>
      <button class="btn btn--secondary btn--block" type="button" data-ctl-add></button>
    </section>`;
    el.querySelectorAll('input[name="ctl-kind"]').forEach((r) => r.addEventListener('change', () => {
      state.handle = r.value;
      const v = pick().variants;
      if (!v.some((x) => String(x.value) === String(state.value))) state.value = v[0].value;
      render();
      el.querySelector(`input[name="ctl-kind"][value="${state.handle}"]`).focus();
    }));
    el.querySelector('[data-ctl-length]').addEventListener('change', (e) => {
      state.value = Number(e.target.value);
      updateButton();
    });
    el.querySelector('[data-ctl-add]').addEventListener('click', () => onAddBoth({ handle: state.handle, value: state.value }));
    updateButton();
  }

  let mainTotal = 0;
  let colourAdd = 0; // the frontal/closure is coloured to match the bundles
  function updateButton() {
    const p = pick();
    const piece = p.title.includes('Frontal') ? 'frontal' : 'closure';
    const price = p.variants.find((v) => String(v.value) === String(state.value))?.price || 0;
    el.querySelector('[data-ctl-add]').textContent = `Add bundles + ${piece} — ${money(mainTotal + price + colourAdd)}`;
  }

  render();
  return {
    /** Called by the product page whenever the bundles' price changes. */
    setMainTotal(n, colour = 0) { mainTotal = n; colourAdd = colour; updateButton(); },
  };
}
