// Section: colouring intake form — a short 3-step wizard.
// Sends through Web3Forms or Formspree (config.js → formService) to the admin address.
// With no key set it runs in demo mode and shows the confirmation screen without sending.
// SHOPIFY: keep this as a page section posting to the same form service, or swap for a
// Shopify Forms / app block. Photos then go through that app's file upload.
import { CONFIG, esc, icon, money } from '../core.js';
import { colourMarkup, wireColour } from './colour-picker.js';

const STEPS = ['You', 'Your hair', 'Your colour'];

export function renderIntake(el, data) {
  const hair = data.products.filter((p) => !p.aftercare);
  const today = new Date().toISOString().slice(0, 10);
  const lengths = Array.from({ length: 10 }, (_, i) => 12 + i * 2);

  el.innerHTML = `
  <form class="wizard" novalidate data-wizard aria-labelledby="brief-title">
    <ol class="wizard__steps" aria-label="Progress">
      ${STEPS.map((s, i) => `<li ${i === 0 ? 'aria-current="step"' : ''}>${i + 1}. ${s}</li>`).join('')}
    </ol>
    <div class="form-alert" role="alert" data-alert hidden></div>
    <p class="demo-flag" data-draft-note hidden style="margin-bottom:24px">We kept your brief from your last visit.
      <button class="link small" type="button" data-discard>Discard and start fresh</button></p>

    <fieldset data-step="0">
      <legend>About you</legend>
      ${field('name', 'Full name', '<input class="input" id="f-name" name="name" autocomplete="name" required>')}
      ${field('email', 'Email address', '<input class="input" id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required>', 'We’ll send your confirmed price and timing here.')}
      ${field('order', 'Monsuki order number', '<input class="input" id="f-order" name="order" autocomplete="off" required placeholder="e.g. MS-10482">', 'Colouring is reserved for hair bought from Monsuki. You’ll find the number in your order confirmation email.')}
    </fieldset>

    <fieldset data-step="1" hidden>
      <legend>Your hair</legend>
      ${field('product', 'Which piece should we colour?', selectHtml('product', [['', 'Choose your piece'], ...hair.map((p) => [p.title, p.title])]))}
      ${field('length', 'Length', selectHtml('length', [['', 'Choose the length'], ...lengths.map((l) => [`${l}″`, `${l}″`])]))}
      ${field('current', 'Current colour', selectHtml('current', [...CONFIG.colours.filter((c) => !c.custom).map((c) => [`${c.code} ${c.name}`, `${c.code} ${c.name}`]), ['Already coloured — other shade', 'Already coloured — another shade']]))}
    </fieldset>

    <fieldset data-step="2" hidden>
      <legend>Your colour</legend>
      ${colourMarkup({ name: 'desired', legend: 'Desired colour', include1B: false, showPrices: true, idPrefix: 'intake' })}
      <p class="error" id="desired-err" role="alert" hidden></p>
      ${field('deadline', 'Deadline or event date', `<input class="input" id="f-deadline" name="deadline" type="date" min="${today}">`, 'We’ll plan your colour around it.', true)}
      ${field('notes', 'Anything else we should know', '<textarea class="textarea" id="f-notes" name="notes" maxlength="1000"></textarea>', '', true)}
    </fieldset>

    <div class="wizard__nav">
      <button class="btn btn--secondary" type="button" data-back hidden>${icon('arrow-left', 'icon--sm')} Back</button>
      <button class="btn btn--primary" type="button" data-next>Continue</button>
      <button class="btn btn--primary" type="submit" data-submit hidden>Send my colour brief</button>
    </div>
  </form>
  <div class="wizard confirmation" data-confirmation tabindex="-1" hidden></div>`;

  wire(el);
}

function field(name, label, control, hint = '', optional = false) {
  return `
  <div class="field">
    <label for="f-${name}">${label}${optional ? ' <span class="optional">(optional)</span>' : ''}</label>
    ${hint ? `<p class="hint" id="f-${name}-hint">${hint}</p>` : ''}
    ${control.replace(/(id="f-[^"]+")/, `$1 aria-describedby="${hint ? `f-${name}-hint ` : ''}f-${name}-err"`)}
    <p class="error" id="f-${name}-err" hidden></p>
  </div>`;
}
function selectHtml(name, options) {
  return `<span class="select-wrap"><select class="select" id="f-${name}" name="${name}" required>
    ${options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}
  </select>${icon('chevron-down', 'icon--sm')}</span>`;
}

const MESSAGES = {
  name: 'Please add your name so we know who we’re colouring for.',
  email: 'Please add an email address we can reply to.',
  emailFormat: 'That email doesn’t look complete — please check it, for example name@example.com.',
  order: 'Please add your Monsuki order number. Colouring is reserved for hair bought from us.',
  product: 'Please choose the piece you’d like coloured.',
  length: 'Please choose the length.',
  current: 'Please choose the current colour.',
  deadline: 'Please choose a date from today onwards.',
};

function validateField(input) {
  const err = document.getElementById(`${input.id}-err`);
  let msg = '';
  const v = input.value.trim();
  if (input.required && !v) msg = MESSAGES[input.name];
  else if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = MESSAGES.emailFormat;
  else if (input.type === 'date' && v && input.min && v < input.min) msg = MESSAGES.deadline;
  if (err) { err.textContent = msg; err.hidden = !msg; }
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}

function wire(el) {
  const form = el.querySelector('[data-wizard]');
  const steps = [...form.querySelectorAll('[data-step]')];
  const back = form.querySelector('[data-back]');
  const next = form.querySelector('[data-next]');
  const submit = form.querySelector('[data-submit]');
  const alertEl = form.querySelector('[data-alert]');
  const desired = wireColour(form, { name: 'desired', requirePhotoForCustom: true });
  let step = 0;

  // Desired colour starts unselected in the brief: she should choose actively
  form.querySelectorAll('input[name="desired"]').forEach((r) => { r.checked = false; });
  form.querySelector('[data-colour-value]').textContent = '';
  const desiredErr = form.querySelector('#desired-err');
  form.querySelectorAll('input[name="desired"]').forEach((r) => r.addEventListener('change', () => { desiredErr.hidden = true; }));

  // Blur-first validation; errors clear as soon as the value is fixed
  form.querySelectorAll('.input, .select, .textarea').forEach((input) => {
    input.addEventListener('blur', () => { if (input.value.trim() || input.getAttribute('aria-invalid') === 'true') validateField(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
    input.addEventListener('change', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
  });

  const show = (i) => {
    step = i;
    steps.forEach((s, k) => { s.hidden = k !== i; });
    form.querySelectorAll('.wizard__steps li').forEach((li, k) => {
      li.toggleAttribute('aria-current', k === i);
      if (k === i) li.setAttribute('aria-current', 'step');
      li.classList.toggle('is-done', k < i);
    });
    back.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    alertEl.hidden = true;
    steps[i].querySelector('legend').setAttribute('tabindex', '-1');
    steps[i].querySelector('legend').focus({ preventScroll: true });
    form.scrollIntoView({ block: 'start', behavior: 'auto' });
  };

  const validateStep = (i) => {
    const inputs = [...steps[i].querySelectorAll('.input, .select, .textarea')];
    const results = inputs.map(validateField);
    let ok = results.every(Boolean);
    if (i === 2) {
      if (!desired.value()) {
        desiredErr.textContent = 'Please choose the colour you’d like.';
        desiredErr.hidden = false;
        if (ok) form.querySelector('input[name="desired"]').focus();
        ok = false;
      } else if (!desired.validate()) ok = false;
    }
    if (!ok) inputs.find((x) => x.getAttribute('aria-invalid') === 'true')?.focus();
    return ok;
  };

  /* ---------- Draft: saved on this device as she types, restored on return, cleared on send ----------
     (Name and email are kept only in this browser; the reference photo is never stored in the draft.) */
  const DRAFT = 'monsuki.colourBrief';
  const NAMES = ['name', 'email', 'order', 'product', 'length', 'current', 'deadline', 'notes'];
  const noteEl = form.querySelector('[data-note]');
  const draftNote = form.querySelector('[data-draft-note]');
  let saveTimer;
  const saveDraft = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const d = Object.fromEntries(NAMES.map((n) => [n, form.querySelector(`[name="${n}"]`).value]));
      d.desired = desired.value() || ''; d.colourNote = noteEl.value;
      try { localStorage.setItem(DRAFT, JSON.stringify(d)); } catch {}
    }, 300);
  };
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT));
    if (d && NAMES.some((n) => d[n] && n !== 'current')) {
      NAMES.forEach((n) => { if (d[n]) form.querySelector(`[name="${n}"]`).value = d[n]; });
      if (d.desired) { const r = form.querySelector(`input[name="desired"][value="${d.desired}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event('change')); } }
      noteEl.value = d.colourNote || '';
      draftNote.hidden = false;
    }
  } catch {}
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
  form.querySelector('[data-discard]').addEventListener('click', () => {
    try { localStorage.removeItem(DRAFT); } catch {}
    form.reset();
    form.querySelectorAll('input[name="desired"]').forEach((r) => { r.checked = false; });
    form.querySelector('[data-colour-value]').textContent = '';
    form.querySelector('[data-custom]').hidden = true;
    form.querySelectorAll('[aria-invalid="true"]').forEach((x) => x.setAttribute('aria-invalid', 'false'));
    form.querySelectorAll('.error').forEach((x) => { x.hidden = true; });
    draftNote.hidden = true;
    show(0);
  });

  next.addEventListener('click', () => { if (validateStep(step)) show(step + 1); });
  back.addEventListener('click', () => show(step - 1));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    const fd = new FormData();
    const val = (n) => form.querySelector(`[name="${n}"]`).value.trim();
    const colour = CONFIG.colours.find((c) => c.code === desired.value());
    const custom = desired.custom();
    const fields = {
      Name: val('name'), Email: val('email'), 'Order number': val('order'),
      Piece: val('product'), Length: val('length'), 'Current colour': val('current'),
      'Desired colour': colour.custom ? 'Custom colour (see reference photo)' : `${colour.code} ${colour.name}`,
      'Colouring price (from price list)': `${colour.priceNote ? `${colour.priceNote} ` : ''}${money(colour.price)}`,
      'Colour note': custom.note || '—', 'Deadline or event': val('deadline') || 'No date given', Notes: val('notes') || '—',
    };
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    if (custom.file) fd.append('Reference photo', custom.file, custom.file.name);
    fd.append('Send to', CONFIG.adminEmail);

    submit.setAttribute('aria-disabled', 'true');
    submit.textContent = 'Sending your brief…';
    const { provider, key } = CONFIG.formService || {};
    let demo = !key;
    try {
      if (!demo) await send(provider, key, fd, fields);
      try { localStorage.removeItem('monsuki.colourBrief'); } catch {}
      confirm(el, fields, demo);
    } catch (err) {
      console.error(err);
      alertEl.innerHTML = `We couldn’t send your brief just now — nothing is lost, your answers are still here. Please try again, or email the studio at <a href="mailto:${CONFIG.adminEmail}">${CONFIG.adminEmail}</a>.`;
      alertEl.hidden = false;
      alertEl.focus?.();
    } finally {
      submit.removeAttribute('aria-disabled');
      submit.textContent = 'Send my colour brief';
    }
  });
}

async function send(provider, key, fd, fields) {
  let res;
  if (provider === 'formspree') {
    fd.append('_subject', `New colour brief — ${fields.Name}`);
    fd.append('_replyto', fields.Email);
    res = await fetch(`https://formspree.io/f/${encodeURIComponent(key)}`, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
  } else {
    fd.append('access_key', key);
    fd.append('subject', `New colour brief — ${fields.Name}`);
    fd.append('from_name', 'Monsuki colour studio');
    fd.append('replyto', fields.Email);
    res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.message || `Form service error ${res.status}`);
}

function confirm(el, fields, demo) {
  el.querySelector('[data-wizard]').hidden = true;
  const box = el.querySelector('[data-confirmation]');
  box.innerHTML = `
    <p class="eyebrow">Thank you, ${esc(fields.Name.split(' ')[0])}</p>
    <h2>Your colour brief is with us</h2>
    <p class="muted">${demo ? 'Here’s what happens next.' : 'A copy of your answers is now with our colour studio.'}</p>
    <ol>
      <li><span><strong>Your colourist reads your brief</strong> ${esc(CONFIG.replyTime)}.</span></li>
      <li><span><strong>We email ${esc(fields.Email)}</strong> with your confirmed price and timing${fields['Deadline or event'] !== 'No date given' ? `, planned around ${esc(new Date(fields['Deadline or event']).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }))}` : ''}.</span></li>
      <li><span><strong>Once you approve,</strong> we colour your ${esc(fields.Piece)} by hand and check it in daylight before it returns to you.</span></li>
    </ol>
    ${demo ? '<p class="demo-flag">Demo mode: no email was sent. Add a form service key in config.js to deliver briefs to the studio.</p>' : ''}
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px">
      <a class="btn btn--primary" href="shop.html">Return to the collection</a>
      <a class="btn btn--secondary" href="#care-title">See colour aftercare</a>
    </div>`;
  box.hidden = false;
  box.focus();
}
