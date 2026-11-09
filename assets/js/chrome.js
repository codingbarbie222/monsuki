// Site chrome shared by every page: announcement, header, menu, footer, bag, dialogs.
// SHOPIFY: header and footer become theme sections (sections/header.liquid, footer.liquid).
import { CONFIG, icon, readIntentFromUrl, reveal } from './core.js';
import { bag, bagMarkup, initBag, openBag } from './bag.js';

const NAV = [
  { href: 'shop.html', label: 'Shop' },
  { href: 'colouring.html', label: 'Colouring' },
  { href: 'browse.html', label: 'Browse all' },
];

function headerHtml(current) {
  const links = NAV.map((l) => `<a href="${l.href}" ${l.href === current ? 'aria-current="page"' : ''}>${l.label}</a>`).join('');
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <p class="announce">Raw Vietnamese hair · Black- and female-owned · Hand-checked in our studio</p>
  <header class="site-header">
    <div class="container container--chrome site-header__inner">
      <div>
        <nav class="site-header__nav" aria-label="Main">${links}</nav>
        <button class="icon-btn menu-btn" type="button" aria-label="Open menu" data-open="menu">${icon('menu')}</button>
      </div>
      <a class="logo" href="index.html" aria-label="${CONFIG.brand} — home">MONSUKI</a>
      <div class="site-header__end">
        <button class="bag-btn" type="button" data-open-bag aria-label="Open your bag (0 pieces)">
          ${icon('bag')}<span class="bag-btn__count" data-bag-count aria-hidden="true">0</span>
        </button>
      </div>
    </div>
  </header>
  <dialog id="menu" class="sheet sheet--left" aria-label="Menu">
    <div class="sheet__head">
      <span class="logo" style="font-size:1.4rem">MONSUKI</span>
      <button class="icon-btn" type="button" data-close aria-label="Close menu">${icon('x')}</button>
    </div>
    <div class="sheet__body">
      <nav class="menu-nav" aria-label="Main">
        ${NAV.map((l) => `<a href="${l.href}" ${l.href === current ? 'aria-current="page"' : ''}>${l.label}</a>`).join('')}
        <a href="index.html">Start again</a>
      </nav>
    </div>
  </dialog>
  ${bagMarkup()}`;
}

function footerHtml() {
  return `
  <footer class="site-footer on-dark">
    <div class="container container--chrome">
      <div class="site-footer__grid">
        <div>
          <a class="logo" href="index.html">MONSUKI</a>
          <p class="muted small" style="margin-top:12px;color:var(--on-dark-muted)">Premium raw Vietnamese human hair, coloured and finished by hand. Black- and female-owned.</p>
        </div>
        <nav aria-label="Shop">
          <ul>
            <li><a href="shop.html">The collection</a></li>
            <li><a href="browse.html">Browse every piece</a></li>
            <li><a href="colouring.html">Colouring service</a></li>
          </ul>
        </nav>
        <nav aria-label="Studio">
          <ul>
            <li><a href="mailto:${CONFIG.adminEmail}">Write to the studio</a></li>
            <li><a href="index.html">Start again</a></li>
          </ul>
        </nav>
      </div>
      <div class="site-footer__base">
        <span>© ${new Date().getFullYear()} ${CONFIG.brand}</span>
        <span>Client preview — checkout and accounts are not live yet</span>
      </div>
    </div>
  </footer>`;
}

function updateCount() {
  const n = bag.count();
  document.querySelectorAll('[data-bag-count]').forEach((el) => { el.textContent = n; });
  document.querySelectorAll('[data-open-bag]').forEach((b) => b.setAttribute('aria-label', `Open your bag (${n} ${n === 1 ? 'piece' : 'pieces'})`));
}

/** Call once per page. `current` = this page's file name (for aria-current). */
export function initChrome(current) {
  readIntentFromUrl();
  document.querySelector('[data-section="header"]')?.insertAdjacentHTML('afterbegin', headerHtml(current));
  document.querySelector('[data-section="footer"]')?.insertAdjacentHTML('afterbegin', footerHtml());

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) document.getElementById(opener.dataset.open)?.showModal();
    if (e.target.closest('[data-open-bag]')) openBag();
    const closer = e.target.closest('[data-close]');
    if (closer) closer.closest('dialog')?.close();
    // Click on the dimmed backdrop closes slide-overs and dialogs
    if (e.target instanceof HTMLDialogElement && e.target.open) {
      const r = e.target.getBoundingClientRect();
      const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (outside) e.target.close();
    }
  });
  // Menu links that point to this page should still close the menu
  document.getElementById('menu')?.addEventListener('click', (e) => { if (e.target.closest('a')) e.currentTarget.close(); });

  // Tooltips for icon-only buttons: shown on hover and keyboard focus, text = aria-label
  const tip = (e) => {
    const b = e.target.closest?.('button[aria-label], a.icon-btn[aria-label]');
    if (!b || (b.textContent.trim() && !b.matches('.bag-btn'))) return;
    const r = b.getBoundingClientRect();
    b.dataset.tip = r.bottom > innerHeight - 80 ? 'above' : r.right > innerWidth - 120 ? 'left' : 'below';
  };
  document.addEventListener('pointerover', tip);
  document.addEventListener('focusin', tip);

  initBag();
  updateCount();
  window.addEventListener('bag:change', updateCount);
  reveal();
}
