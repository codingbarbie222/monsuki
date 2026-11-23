/* =====================================================================
   MONSUKI — site configuration (the only file most changes need)
   ===================================================================== */
window.MONSUKI_CONFIG = {
  brand: 'Monsuki',

  // Where colouring briefs are sent. With Web3Forms / Formspree the
  // recipient is also set in that service's dashboard — use this same address there.
  adminEmail: 'studio@monsuki.example',

  // Static-friendly form service for the colouring intake form.
  // provider: 'web3forms' | 'formspree'
  // key: Web3Forms access key, or the Formspree form id (the part after /f/).
  // Leave key empty to run in demo mode (a confirmation screen, nothing is sent).
  formService: { provider: 'web3forms', key: '' },

  currency: { code: 'GBP', locale: 'en-GB' },

  // Colour price list. 1B is the natural colour of the hair and is included.
  // price = added to each piece (per bundle, wig, frontal…) for the colouring service.
  colours: [
    { code: '1B',   name: 'Natural black',   hex: '#1b1613', price: 0,   included: true },
    { code: '2',    name: 'Espresso brown',  hex: '#3a2a20', price: 60 },
    { code: '4',    name: 'Chestnut',        hex: '#5a3a26', price: 60 },
    { code: '30',   name: 'Auburn copper',   hex: '#8a4a28', price: 90 },
    { code: '99J',  name: 'Merlot',          hex: '#5a1e2a', price: 90 },
    { code: '27',   name: 'Honey blonde',    hex: '#b7834b', price: 120 },
    { code: '613',  name: 'Champagne blonde', hex: '#e2cf9f', price: 180 },
    { code: 'custom', name: 'Custom colour', price: 150, custom: true, priceNote: 'from' },
  ],

  // Wig cap sizes (head circumference)
  capSizes: [
    { code: 'S', label: 'Small',  range: '53–54 cm' },
    { code: 'M', label: 'Medium', range: '55–56 cm' },
    { code: 'L', label: 'Large',  range: '57–58 cm' },
  ],

  // How long the studio takes to reply to a colouring brief (shown on the confirmation screen)
  replyTime: 'within one working day',
};
