// Section: wig fit — cap size or custom head measurements, plus the "How to measure" slide-over.
// SHOPIFY: snippets/wig-fit.liquid. Values are sent as line item properties
// (properties[Cap size] or properties[Circumference] …) so admins see them on the order.
import { CONFIG, esc, icon } from '../core.js';

export const MEASURES = [
  { id: 'circumference', label: 'Circumference', cm: [48, 64],
    how: 'Start at the front hairline, wrap the tape behind the ear, around the nape and back to the start. Keep it snug and level.' },
  { id: 'frontToNape', label: 'Front to nape', cm: [28, 44],
    how: 'From the centre of the front hairline, over the top of the head, to the nape where your hair ends.' },
  { id: 'earToEar', label: 'Ear to ear', cm: [26, 42],
    how: 'From the top of one ear, across the forehead along the hairline, to the top of the other ear.' },
  { id: 'templeToTemple', label: 'Temple to temple', cm: [26, 44],
    how: 'From one temple, around the back of the head at its widest point, to the other temple.' },
];

const toUnit = (cm, unit) => (unit === 'in' ? Math.round((cm / 2.54) * 10) / 10 : cm);

export function fitMarkup() {
  return `
  <fieldset class="field-group" data-fit>
    <legend>Cap size <span class="legend-value" data-fit-value></span></legend>
    <div class="cap-sizes">
      ${CONFIG.capSizes.map((s) => `
        <label class="cap"><input type="radio" name="fit" value="${s.code}" ${s.code === 'M' ? 'checked' : ''}>
          <span>${esc(s.label)}<small>${esc(s.range)}</small></span></label>`).join('')}
      <label class="cap"><input type="radio" name="fit" value="custom"><span>Custom<small>Your measurements</small></span></label>
    </div>
    <div class="measure" data-measure hidden>
      <div class="measure__head">
        <button class="link" type="button" data-open="measure-guide">${icon('ruler', 'icon--sm')} How to measure</button>
        <div class="segmented segmented--sm" role="radiogroup" aria-label="Unit">
          <label><input type="radio" name="unit" value="cm" checked><span>cm</span></label>
          <label><input type="radio" name="unit" value="in"><span>inches</span></label>
        </div>
      </div>
      <div class="measure__grid">
        ${MEASURES.map((m) => `
          <div class="field">
            <label for="m-${m.id}">${m.label}</label>
            <div class="unit-input">
              <input class="input" id="m-${m.id}" name="${m.id}" inputmode="decimal" autocomplete="off" aria-describedby="m-${m.id}-err">
              <span data-unit>cm</span>
            </div>
            <p class="error" id="m-${m.id}-err" hidden></p>
          </div>`).join('')}
      </div>
      <p class="small muted">We’ll fit your cap to these measurements before it’s dispatched.</p>
    </div>
  </fieldset>`;
}

/* Simple line diagrams: espresso outline, gold measuring line */
const HEAD_SIDE = '<path d="M96 196c-6-22-10-36-26-46-14-9-22-28-22-52 0-42 33-74 76-74s74 30 74 70c0 18-6 32-14 44l10 20-14 6v18c0 8-6 12-14 12h-14l-4 22" fill="none" stroke="#2e231d" stroke-width="2" stroke-linecap="round"/><path d="M172 82c8 2 14 8 14 16" fill="none" stroke="#2e231d" stroke-width="1.5"/>';
const HEAD_FRONT = '<ellipse cx="130" cy="100" rx="58" ry="72" fill="none" stroke="#2e231d" stroke-width="2"/><path d="M72 104c-10 0-12 22 0 26M188 104c10 0 12 22 0 26" fill="none" stroke="#2e231d" stroke-width="2"/><path d="M104 172l-4 28M156 172l4 28" stroke="#2e231d" stroke-width="2"/>';
const HEAD_BACK = '<ellipse cx="130" cy="96" rx="62" ry="70" fill="none" stroke="#2e231d" stroke-width="2"/><path d="M110 164l-2 36M150 164l2 36" stroke="#2e231d" stroke-width="2"/>';
const DIAGRAMS = {
  circumference: `${HEAD_SIDE}<ellipse cx="122" cy="96" rx="76" ry="22" transform="rotate(-8 122 96)" fill="none" stroke="#c9ab72" stroke-width="3" stroke-dasharray="6 5"/>`,
  frontToNape: `${HEAD_SIDE}<path d="M188 70C176 22 90 14 60 60c-14 22-12 60 6 84" fill="none" stroke="#c9ab72" stroke-width="3" stroke-dasharray="6 5"/>`,
  earToEar: `${HEAD_FRONT}<path d="M74 104C74 50 186 50 186 104" fill="none" stroke="#c9ab72" stroke-width="3" stroke-dasharray="6 5"/>`,
  templeToTemple: `${HEAD_BACK}<path d="M70 82c4 40 116 40 120 0" fill="none" stroke="#c9ab72" stroke-width="3" stroke-dasharray="6 5"/>`,
};

export function guideMarkup() {
  return `
  <dialog id="measure-guide" class="sheet sheet--wide" aria-labelledby="guide-title">
    <div class="sheet__head">
      <h2 id="guide-title">How to measure</h2>
      <button class="icon-btn" type="button" data-close aria-label="Close the measuring guide">${icon('x')}</button>
    </div>
    <div class="sheet__body">
      <p class="muted" style="margin-bottom:32px">Use a soft tape measure over flat, braided or wrapped hair — the way you’ll wear the unit. Keep the tape snug, not tight.</p>
      ${MEASURES.map((m, i) => `
        <section class="guide-step">
          <p class="eyebrow">Step ${i + 1} of ${MEASURES.length}</p>
          <h3>${m.label}</h3>
          <svg viewBox="0 0 260 210" role="img" aria-label="Diagram: measuring ${m.label.toLowerCase()}">${DIAGRAMS[m.id]}</svg>
          <p>${m.how}</p>
        </section>`).join('')}
    </div>
    <div class="sheet__foot"><button class="btn btn--primary" type="button" data-close>Back to my measurements</button></div>
  </dialog>`;
}

/** Wires the fit fieldset. Returns { read(validate) } → { capSize } | { measurements } | null if invalid. */
export function wireFit(root, onChange) {
  const measure = root.querySelector('[data-measure]');
  const valueEl = root.querySelector('[data-fit-value]');
  const unitOf = () => root.querySelector('input[name="unit"]:checked').value;
  const fit = () => root.querySelector('input[name="fit"]:checked').value;

  const validateOne = (m) => {
    const input = root.querySelector(`#m-${m.id}`);
    const err = root.querySelector(`#m-${m.id}-err`);
    const unit = unitOf();
    const [lo, hi] = m.cm.map((v) => toUnit(v, unit));
    const raw = input.value.trim().replace(',', '.');
    let msg = '';
    if (!raw) msg = `Add your ${m.label.toLowerCase()} so we can fit the cap.`;
    else if (!Number.isFinite(Number(raw))) msg = 'Use numbers only, for example 56.';
    else if (Number(raw) < lo || Number(raw) > hi) msg = `Most heads measure between ${lo} and ${hi} ${unit === 'in' ? 'inches' : 'cm'} here. Please check and measure again.`;
    err.textContent = msg;
    err.hidden = !msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };

  const sync = () => {
    const f = fit();
    measure.hidden = f !== 'custom';
    const size = CONFIG.capSizes.find((s) => s.code === f);
    valueEl.textContent = size ? `${size.label}, ${size.range}` : 'Custom measurements';
    onChange?.();
  };
  root.querySelectorAll('input[name="fit"]').forEach((r) => r.addEventListener('change', sync));
  root.querySelectorAll('input[name="unit"]').forEach((r) => r.addEventListener('change', () => {
    root.querySelectorAll('[data-unit]').forEach((s) => { s.textContent = unitOf() === 'in' ? 'in' : 'cm'; });
    MEASURES.forEach((m) => { const i = root.querySelector(`#m-${m.id}`); if (i.getAttribute('aria-invalid') === 'true') validateOne(m); });
  }));
  // Blur-first validation; errors clear as soon as the value is fixed
  MEASURES.forEach((m) => {
    const input = root.querySelector(`#m-${m.id}`);
    input.addEventListener('blur', () => { if (input.value.trim()) validateOne(m); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateOne(m); });
  });
  // Remembered default: prefill the last measurements used on this device
  try {
    const saved = JSON.parse(localStorage.getItem('monsuki.measurements'));
    if (saved) {
      root.querySelector(`input[name="unit"][value="${saved.unit}"]`)?.click();
      MEASURES.forEach((m) => { if (saved[m.id]) root.querySelector(`#m-${m.id}`).value = saved[m.id]; });
    }
  } catch {}
  sync();

  return {
    read() {
      const f = fit();
      if (f !== 'custom') return { capSize: f };
      const ok = MEASURES.map(validateOne).every(Boolean);
      if (!ok) {
        root.querySelector('[aria-invalid="true"]')?.focus();
        return null;
      }
      const m = { unit: unitOf() };
      MEASURES.forEach((x) => { m[x.id] = Number(root.querySelector(`#m-${x.id}`).value.trim().replace(',', '.')); });
      try { localStorage.setItem('monsuki.measurements', JSON.stringify(m)); } catch {}
      return { measurements: m };
    },
    summary() {
      const f = fit();
      return f === 'custom' ? 'Custom fit' : `Cap ${f}`;
    },
  };
}
