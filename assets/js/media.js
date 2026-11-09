// Images and labelled placeholders, plus reference-photo handling.
import { esc } from './core.js';

/**
 * Renders a real photo when `img.src` is set in products.json, otherwise a labelled
 * placeholder describing the intended shot. To swap in a photo: put it in /images and
 * set "src": "images/your-file.jpg" on that image in data/products.json.
 */
export function media(img, { eager = false, dark = false, mini = false } = {}) {
  if (!img) return `<span class="ph ${dark ? 'ph--dark' : ''} ${mini ? 'ph--mini' : ''}" aria-hidden="true"></span>`;
  if (img.src) {
    return `<img class="media" src="${esc(img.src)}" alt="${esc(img.alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
  }
  return `<span class="ph ${dark ? 'ph--dark' : ''} ${mini ? 'ph--mini' : ''}" role="img" aria-label="${esc(img.alt || img.shot)}">
    <span class="ph__tag">Image placeholder</span>
    <span class="ph__shot">${esc(img.shot)}</span>
  </span>`;
}

/** Placeholder from just a description (for editorial images not tied to a product). */
export const shot = (description, opts = {}) => media({ src: '', alt: description, shot: description }, opts);

/**
 * Turns an uploaded reference photo into a small JPEG data URL so it can live with
 * the bag item in localStorage (which holds ~5 MB in total).
 *
 * SHOPIFY: replace with a file-upload app (e.g. a line-item upload field) so the photo is
 * stored on Shopify and linked from the order line item properties; admins then see it
 * in Orders → order details and in the order notification email.
 */
export async function compressImage(file, maxSize = 900, quality = 0.8) {
  if (!file || !file.type.startsWith('image/')) throw new Error('not-image');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', quality);
}
