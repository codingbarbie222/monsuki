// Section: colour swatches with "+ colouring service" prices and a custom-colour reference upload.
// Used on product pages and in the colouring intake form. Prices come from config.js.
// SHOPIFY: snippets/colour-swatches.liquid. The chosen colour becomes properties[Colour];
// the colouring fee becomes a hidden add-on product (or variant) added with the hair.
import { CONFIG, esc, icon, colourPriceLabel } from '../core.js';
import { compressImage } from '../media.js';

export function colourMarkup({ name = 'colour', legend = 'Colour', highlight = false, include1B = true, showPrices = true, idPrefix = 'c' } = {}) {
  const colours = CONFIG.colours.filter((c) => include1B || !c.included);
  const first = colours[0].code;
  return `
  <fieldset class="field-group colour-group ${highlight ? 'is-highlighted' : ''}" data-colour-group>
    <legend>${esc(legend)} <span class="legend-value" data-colour-value></span></legend>
    ${highlight ? '<p class="colour-group__flag">Colouring noted for this visit. Choose a shade, or share your own reference.</p>' : ''}
    <div class="swatches">
      ${colours.map((c) => `
        <label class="swatch">
          <input type="radio" name="${name}" value="${c.code}" ${c.code === first ? 'checked' : ''}
            aria-label="${esc(c.custom ? 'Custom colour' : `${c.code} ${c.name}`)}${showPrices ? `, ${esc(colourPriceLabel(c))}` : ''}">
          ${c.custom
            ? `<span class="swatch__dot swatch__dot--custom" aria-hidden="true">${icon('plus', 'icon--sm')}</span>`
            : `<span class="swatch__dot" style="background:${c.hex}" aria-hidden="true"></span>`}
          <span class="swatch__name" aria-hidden="true">${esc(c.custom ? 'Custom' : c.code)}<br>${esc(c.custom ? 'colour' : c.name)}</span>
          ${showPrices ? `<span class="swatch__price" aria-hidden="true">${esc(colourPriceLabel(c))}</span>` : ''}
        </label>`).join('')}
    </div>
    ${include1B && showPrices ? '<p class="colour-note">1B is the hair’s natural colour. Other shades are coloured by hand in our studio before dispatch, adding about five working days.</p>' : ''}
    <div class="custom-colour" data-custom hidden>
      <div class="upload">
        <span class="label" id="${idPrefix}-photo-label">Reference photo</span>
        <label class="upload__drop">
          <input type="file" accept="image/*" data-photo aria-labelledby="${idPrefix}-photo-label" aria-describedby="${idPrefix}-photo-hint ${idPrefix}-photo-err">
          ${icon('upload')}
          <span><span data-photo-cta>Choose a photo of the colour you love</span><br><span class="small muted" id="${idPrefix}-photo-hint">JPG, PNG or HEIC from your camera roll</span></span>
        </label>
        <div class="upload__preview" data-preview hidden>
          <img alt="Your reference photo" data-preview-img>
          <button class="link small" type="button" data-photo-remove>Remove photo</button>
        </div>
        <p class="error" id="${idPrefix}-photo-err" hidden></p>
      </div>
      <div class="field">
        <label for="${idPrefix}-note">Note to your colourist <span class="optional">(optional)</span></label>
        <textarea class="textarea" id="${idPrefix}-note" data-note maxlength="500" placeholder="e.g. Warm honey with darker roots"></textarea>
      </div>
    </div>
  </fieldset>`;
}

/**
 * @returns { value(), custom(), validate(), reset() }
 *  custom() → { image (compressed data URL), file (original File), note }
 */
export function wireColour(root, { name = 'colour', onChange, requirePhotoForCustom = true } = {}) {
  const group = root.querySelector('[data-colour-group]');
  const customPanel = group.querySelector('[data-custom]');
  const valueEl = group.querySelector('[data-colour-value]');
  const fileInput = group.querySelector('[data-photo]');
  const preview = group.querySelector('[data-preview]');
  const previewImg = group.querySelector('[data-preview-img]');
  const cta = group.querySelector('[data-photo-cta]');
  const err = group.querySelector('.upload .error');
  const note = group.querySelector('[data-note]');
  let image = null; let file = null;

  const current = () => group.querySelector(`input[name="${name}"]:checked`)?.value;
  const showError = (msg) => { err.textContent = msg; err.hidden = !msg; fileInput.setAttribute('aria-invalid', msg ? 'true' : 'false'); };

  const sync = () => {
    const c = CONFIG.colours.find((x) => x.code === current());
    valueEl.textContent = c ? (c.custom ? 'Custom colour' : `${c.code} ${c.name}`) : '';
    customPanel.hidden = !c?.custom;
    onChange?.();
  };
  group.querySelectorAll(`input[name="${name}"]`).forEach((r) => r.addEventListener('change', sync));

  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    if (!f) return;
    try {
      // SHOPIFY: upload the original file through the file-upload app instead of keeping a data URL.
      image = await compressImage(f);
      file = f;
      previewImg.src = image;
      preview.hidden = false;
      cta.textContent = 'Choose a different photo';
      showError('');
    } catch {
      showError('That file isn’t a photo we can open. Please choose a JPG or PNG image.');
    }
    onChange?.();
  });
  group.querySelector('[data-photo-remove]').addEventListener('click', () => {
    image = null; file = null; fileInput.value = '';
    preview.hidden = true; cta.textContent = 'Choose a photo of the colour you love';
    fileInput.focus();
    onChange?.();
  });

  sync();
  return {
    value: current,
    custom: () => ({ image, file, note: note.value.trim() }),
    validate() {
      if (CONFIG.colours.find((c) => c.code === current())?.custom && requirePhotoForCustom && !image) {
        showError('Add a reference photo so our colourist can match your shade.');
        fileInput.focus();
        return false;
      }
      showError('');
      return true;
    },
  };
}
