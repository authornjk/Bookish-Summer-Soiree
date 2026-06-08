// ── Firebase configuration ───────────────────────────────────────────────────
// Set this to your Firebase Realtime Database URL to pull prize spending
// automatically from the Prize Manager app.
// e.g. 'https://your-project-default-rtdb.firebaseio.com'
// Leave as empty string '' if not set up yet.
window.FIREBASE_DB_URL = '';

const SK = 'soiree_hq_2027';
let S = {};

// ── Migration: called after load, patches missing/changed fields
// without ever overwriting data the user has entered.
function migrateState() {
  // Ensure top-level keys exist
  if (!S.attendance)   S.attendance   = JSON.parse(JSON.stringify(DEFAULT_DATA.attendance));
  if (S.ticketPrice === undefined) S.ticketPrice = 0;

  // Subtable arrays — add if missing, never remove user rows
  ['tshirts','hats','totes','prizes','swag','decorations','misc'].forEach(key => {
    if (!S[key]) S[key] = JSON.parse(JSON.stringify(DEFAULT_DATA[key]));
  });

  // Expenses — merge by id: keep user's spent/notes/expanded,
  // but restore type/structure fields if they're wrong or missing
  const defMap = {};
  DEFAULT_DATA.expenses.forEach(e => { defMap[e.id] = e; });

  S.expenses = S.expenses || [];

  // For each saved expense, patch structural fields from default if type is wrong/missing
  S.expenses = S.expenses.map(e => {
    const def = defMap[e.id];
    if (!def) return e; // user-added custom line — leave untouched

    // Always restore structural fields from default
    const patched = { ...def };

    // Preserve user-entered values
    if (e.spent   !== undefined) patched.spent    = e.spent;
    if (e.notes   !== undefined) patched.notes    = e.notes;
    if (e.expanded!== undefined) patched.expanded = e.expanded;

    // For perunit lines: preserve user's unitPrice and qty if they set them
    if (def.type === 'perunit') {
      if (e.unitPrice && e.unitPrice !== def.unitPrice) patched.unitPrice = e.unitPrice;
      if (e.qty       && e.qty       !== def.qty)       patched.qty       = e.qty;
    }
    // For fixed lines: preserve user's fixedAmt if they set it
    if (def.type === 'fixed') {
      if (e.fixedAmt && e.fixedAmt !== def.fixedAmt) patched.fixedAmt = e.fixedAmt;
    }
    // Preserve tip values if user changed them
    if (def.tip && e.tip) {
      patched.tip = { ...def.tip, ...e.tip };
    }

    return patched;
  });

  // Add any default expenses that are missing (new lines added in a future update)
  DEFAULT_DATA.expenses.forEach(def => {
    if (!S.expenses.find(e => e.id === def.id)) {
      S.expenses.push(JSON.parse(JSON.stringify(def)));
    }
  });

  // Ensure vendor comparison fields exist on price×qty tables
  ['tshirts','hats','totes'].forEach(key => {
    if (S[key]) {
      S[key] = S[key].map(r => ({
        desc: r.desc || r.label || r.style || r.size || '',
        label: r.label || r.style || r.size || '',
        size: r.size || r.label || '',
        price: r.price || 0,
        qty: r.qty || 0,
        notes: r.notes || '',
        ...(r.vendorId !== undefined ? {vendorId: r.vendorId} : {}),
        ...r,
      }));
    }
  });

  // Legacy: if hats has 'selected' field (old format), migrate to vendorId
  if (S.hats && S.hats.some(r => r.selected !== undefined && r.vendorId === undefined)) {
    // old comparison mode — ignore, migration will reset
  }

  // Ensure hats table has a 'selected' field for comparison mode
  if (S.hats) {
    S.hats = S.hats.map(r => ({
      ...r,
      compare: r.compare !== undefined ? r.compare : false,
      selected: r.selected !== undefined ? r.selected : false,
    }));
    // If none selected, select the one with lowest price by default
    if (!S.hats.some(r => r.selected)) {
      const cheapest = S.hats.reduce((a,b) => (+a.price||0) <= (+b.price||0) ? a : b, S.hats[0]);
      if (cheapest) cheapest.selected = true;
    }
  }

  // nextId safety
  if (!S.nextId) S.nextId = 300;

  // Other tabs
  if (!S.todos)     S.todos     = JSON.parse(JSON.stringify(DEFAULT_DATA.todos));
  if (!S.inventory) S.inventory = JSON.parse(JSON.stringify(DEFAULT_DATA.inventory));
  if (!S.authors)   S.authors   = JSON.parse(JSON.stringify(DEFAULT_DATA.authors));
  if (!S.wishlist)  S.wishlist  = JSON.parse(JSON.stringify(DEFAULT_DATA.wishlist));
  if (!S.admin)     S.admin     = JSON.parse(JSON.stringify(DEFAULT_DATA.admin));
  if (!S.helpers)   S.helpers   = JSON.parse(JSON.stringify(DEFAULT_DATA.helpers));
  if (!S.agenda)    S.agenda    = JSON.parse(JSON.stringify(DEFAULT_DATA.agenda));
  if (!S.qAndA)     S.qAndA     = JSON.parse(JSON.stringify(DEFAULT_DATA.qAndA));
  if (!S.seating)   S.seating   = JSON.parse(JSON.stringify(DEFAULT_DATA.seating));
}

function loadState() {
  try {
    const raw = localStorage.getItem(SK);
    S = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  } catch(e) {
    S = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  migrateState();
}

function saveState() {
  try { localStorage.setItem(SK, JSON.stringify(S)); } catch(e) { console.warn('Save failed', e); }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function showModal(html) {
  const mc = document.getElementById('modal-container');
  mc.innerHTML = `<div class="modal-overlay" id="modal-bg" onclick="closeModalOutside(event)">
    <div class="modal">
      <button class="modal-close" onclick="closeModal()" aria-label="Close"><i class="ti ti-x"></i></button>
      ${html}
    </div>
  </div>`;
}
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }
function closeModalOutside(e) { if (e.target.id === 'modal-bg') closeModal(); }

function fmt(n) {
  return '$' + (+(n||0)).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function pctStr(n, t) { return t > 0 ? Math.round(n/t*100) + '%' : '0%'; }
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
