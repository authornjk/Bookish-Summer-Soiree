// storage.js — HQ state management + Firebase sync
const SK = 'soiree_hq_2027';
let S = {};

window.FIREBASE_DB_URL = localStorage.getItem('soiree_firebase_url') || '';
window.PRIZE_APP_URL   = localStorage.getItem('soiree_prize_url')   || '';

function migrateState() {
  if (!S.attendance)       S.attendance       = JSON.parse(JSON.stringify(DEFAULT_DATA.attendance));
  if (S.ticketPrice === undefined) S.ticketPrice = 0;
  if (!S.expenses)         S.expenses         = JSON.parse(JSON.stringify(DEFAULT_DATA.expenses));
  if (!S.todos)            S.todos            = JSON.parse(JSON.stringify(DEFAULT_DATA.todos));
  if (!S.inventory)        S.inventory        = JSON.parse(JSON.stringify(DEFAULT_DATA.inventory));
  if (!S.authors)          S.authors          = JSON.parse(JSON.stringify(DEFAULT_DATA.authors));
  if (!S.wishlist)         S.wishlist         = JSON.parse(JSON.stringify(DEFAULT_DATA.wishlist));
  if (!S.people)           S.people           = JSON.parse(JSON.stringify(DEFAULT_DATA.people));
  if (!S.customLocations)  S.customLocations  = [];
  if (!S.nextId)           S.nextId           = 200;
  if (!S.eventName)        S.eventName        = DEFAULT_DATA.eventName;
  if (!S.eventYear)        S.eventYear        = DEFAULT_DATA.eventYear;
  if (S.merchType === undefined) S.merchType  = DEFAULT_DATA.merchType || 'hats';

  // Subtable arrays
  ['tshirts','hats','totes','prizes','swag','decorations','misc'].forEach(key => {
    if (!S[key]) S[key] = JSON.parse(JSON.stringify(DEFAULT_DATA[key]));
  });

  // Patch expenses by id — keep user values, restore structure
  const defMap = {};
  DEFAULT_DATA.expenses.forEach(e => { defMap[e.id] = e; });
  S.expenses = S.expenses.map(e => {
    const def = defMap[e.id];
    if (!def) return e;
    const patched = { ...def };
    if (e.spent   !== undefined) patched.spent    = e.spent;
    if (e.notes   !== undefined) patched.notes    = e.notes;
    if (e.expanded!== undefined) patched.expanded = e.expanded;
    if (def.type === 'perunit') {
      if (e.unitPrice) patched.unitPrice = e.unitPrice;
      if (e.qty)       patched.qty       = e.qty;
    }
    if (def.type === 'fixed' && e.fixedAmt) patched.fixedAmt = e.fixedAmt;
    if (def.tip && e.tip) patched.tip = { ...def.tip, ...e.tip };
    return patched;
  });
  DEFAULT_DATA.expenses.forEach(def => {
    if (!S.expenses.find(e => e.id === def.id)) {
      S.expenses.push(JSON.parse(JSON.stringify(def)));
    }
  });
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
  syncHQToFirebase();
}

function syncHQToFirebase() {
  if (!window.FIREBASE_DB_URL) return;
  // Push attendance so Prize Manager can calc BINGO goal
  fetch(window.FIREBASE_DB_URL + '/hq/attendance.json', {
    method:'PUT', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(S.attendance)
  }).catch(()=>{});
  // Push expenses so Prize Manager can show prize/raffle budget
  const expObj = {};
  (S.expenses||[]).forEach(e => { expObj[e.id] = e; });
  fetch(window.FIREBASE_DB_URL + '/hq/expenses.json', {
    method:'PUT', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(expObj)
  }).catch(()=>{});
  // Push authors so Prize Manager has the donor list
  const authObj = {};
  (S.authors||[]).forEach(a => { authObj[a.id] = a; });
  fetch(window.FIREBASE_DB_URL + '/authors.json', {
    method:'PUT', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(authObj)
  }).catch(()=>{});
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
function showModal(html) {
  const mc = document.getElementById('modal-container');
  mc.innerHTML = `<div class="modal-overlay" id="modal-bg" onclick="closeModalOutside(event)">
    <div class="modal">
      <button class="modal-close" onclick="closeModal()"><i class="ti ti-x"></i></button>
      ${html}
    </div>
  </div>`;
}
function closeModal() { document.getElementById('modal-container').innerHTML=''; }
function closeModalOutside(e) { if(e.target.id==='modal-bg') closeModal(); }
function fmt(n) { return '$'+(+(n||0)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
