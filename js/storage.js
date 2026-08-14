// storage.js — strict preserve-only migration + Firebase sync
var _authorSwipeX = 0;
const SK = 'soiree_hq_2027';
let S = {};

window.FIREBASE_DB_URL = localStorage.getItem('soiree_firebase_url') || 'https://soiree-prizes-2027-default-rtdb.firebaseio.com';
window.PRIZE_APP_URL   = localStorage.getItem('soiree_prize_url')    || 'https://authornjk.github.io/BSS-Prizes';

function getAdminCount() {
  return (S.peopleGroups?.['Admin'] || []).length || 4;
}

function getAllPeople() {
  const groups = S.peopleGroups || DEFAULT_DATA.peopleGroups;
  return [...new Set(Object.values(groups).flat())];
}

function migrateState() {
  const D = DEFAULT_DATA;
  // Scalars — only set if missing
  if (S.ticketPrice  === undefined) S.ticketPrice  = D.ticketPrice;
  if (S.ccFeePercent === undefined) S.ccFeePercent = D.ccFeePercent || 3.2;
  if (S.nextId       === undefined) S.nextId       = 200;
  if (!S.eventName)                  S.eventName   = D.eventName;
  if (!S.eventYear)                  S.eventYear   = D.eventYear;
  if (S.merchType    === undefined)  S.merchType   = D.merchType;
  if (!S.merchOptions)               S.merchOptions = [...D.merchOptions];
  if (!S.merchLabels)                S.merchLabels  = {...D.merchLabels};
  if (!S.customLocations)            S.customLocations = [];
  if (!S.inventoryCategories)        S.inventoryCategories = [...D.inventoryCategories];
  if (!S.peopleContacts)             S.peopleContacts = {};

  // Attendance — preserve user values
  if (!S.attendance) {
    S.attendance = {...D.attendance};
  } else {
    if (S.attendance.total   === undefined) S.attendance.total   = D.attendance.total;
    if (S.attendance.authors === undefined) S.attendance.authors = D.attendance.authors;
    // Admin always comes from people groups
    S.attendance.admin = getAdminCount();
  }

  // People groups — preserve
  if (!S.peopleGroups) S.peopleGroups = JSON.parse(JSON.stringify(D.peopleGroups));

  // Expenses — preserve user values, restore structure if missing
  if (!S.expenses || S.expenses.length === 0) {
    S.expenses = JSON.parse(JSON.stringify(D.expenses));
  } else {
    const defMap = {};
    D.expenses.forEach(e => { defMap[e.id] = e; });
    S.expenses = S.expenses.map(e => {
      const def = defMap[e.id];
      if (!def) return e; // user-added, preserve as-is
      const out = {...e};
      if (!out.type)  out.type  = def.type;
      if (!out.label) out.label = def.label;
      if (out.spent    === undefined) out.spent    = 0;
      if (out.notes    === undefined) out.notes    = '';
      if (out.expanded === undefined) out.expanded = false;
      if (def.tip && !out.tip) out.tip = {...def.tip};
      if (out.type === 'cc_fee' && out.ccPct === undefined) out.ccPct = def.ccPct || 3.2;
      return out;
    });
    // Add any missing default expense lines
    D.expenses.forEach(def => {
      if (!S.expenses.find(e => e.id === def.id)) {
        S.expenses.push(JSON.parse(JSON.stringify(def)));
      }
    });
    // Remove prizes subtable if present
    S.expenses = S.expenses.filter(e => !(e.id==='prizes' && e.type==='subtable'));
    // Re-sort to match default order (preserving user-added custom lines at end)
    const defaultOrder = D.expenses.map(e => e.id);
    const known = S.expenses.filter(e => defaultOrder.includes(e.id))
      .sort((a,b) => defaultOrder.indexOf(a.id) - defaultOrder.indexOf(b.id));
    const custom = S.expenses.filter(e => !defaultOrder.includes(e.id));
    S.expenses = [...known, ...custom];
  }

  // Update per-unit qty from attendance
  S.expenses.forEach(e => {
    if (e.type === 'perunit') {
      if (e.unitLabelType === 'total')   e.qty = S.attendance.total;
      if (e.unitLabelType === 'authors') e.qty = S.attendance.authors;
    }
  });

  // Remove prizes subtable expense line if present (no longer needed)
  S.expenses = (S.expenses||[]).filter(e => !(e.id==='prizes' && e.type==='subtable'));

  // Subtables — preserve, restore if empty
  ['tshirts','hats','totes','prizes','swag','decorations','misc'].forEach(key => {
    if (!S[key] || S[key].length === 0) S[key] = JSON.parse(JSON.stringify(D[key]));
    S[key] = S[key].map(r => ({label:'',est:0,spent:0,notes:'',url:'',price:0,qty:0,...r}));
  });

  // Custom merch options
  (S.merchOptions||[]).forEach(key => {
    if (!['hats','tshirts'].includes(key) && (!S[key] || S[key].length === 0)) {
      S[key] = [{label:'',price:0,qty:0,notes:''}];
    }
  });

  // Inventory — preserve, restore if empty
  if (!S.inventory || S.inventory.length === 0) {
    S.inventory = JSON.parse(JSON.stringify(D.inventory));
  }

  // Authors + wishlist — preserve, restore if empty
  if (!S.authors  || S.authors.length  === 0) S.authors  = JSON.parse(JSON.stringify(D.authors));
  if (!S.wishlist || S.wishlist.length  === 0) S.wishlist = JSON.parse(JSON.stringify(D.wishlist));

  // Ensure author fields
  S.authors = S.authors.map(a => ({
    infoForm:false,multiAuthor:false,swagSent:false,booksDonated:false,
    ticket:false,qrCode:false,signingConfirmed:false,thankYou:false,
    notes:'',website:'',_expanded:false,...a
  }));

  // Todos — preserve, restore if empty; reset done if new year
  if (!S.todos || S.todos.length === 0) {
    S.todos = JSON.parse(JSON.stringify(D.todos));
  }
  // Force re-apply defaults for todos to pick up categories
  if (!S._2027reset || !S._catReset) {
    S.todos = JSON.parse(JSON.stringify(DEFAULT_DATA.todos));
    S._2027reset = true;
    S._catReset  = true;
  }
  // Force expense re-sort (picks up new order and removes prizes subtable)
  if (!S._expSort2 || !S._expSort3) {
    const D2 = DEFAULT_DATA;
    const defaultOrder = D2.expenses.map(e => e.id);
    S.expenses = S.expenses.filter(e => !(e.id==='prizes' && e.type==='subtable'));
    const known  = S.expenses.filter(e => defaultOrder.includes(e.id))
      .sort((a,b) => defaultOrder.indexOf(a.id) - defaultOrder.indexOf(b.id));
    const custom = S.expenses.filter(e => !defaultOrder.includes(e.id));
    S.expenses = [...known, ...custom];
    S._expSort2 = true;
    S._expSort3 = true;
  }
  // Add notes field to todos missing it
  S.todos = S.todos.map(t => ({notes:'',...t}));
}

function loadState() {
  try {
    const raw = localStorage.getItem(SK);
    S = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  } catch(e) {
    S = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  // Always sync admin count from people groups
  if (S.attendance) S.attendance.admin = getAdminCount();
  migrateState();
}

function saveState() {
  // Keep admin count in sync
  if (S.attendance) S.attendance.admin = getAdminCount();
  // Keep per-unit qty in sync with attendance
  (S.expenses||[]).forEach(e => {
    if (e.type === 'perunit') {
      if (e.unitLabelType === 'total')   e.qty = S.attendance.total;
      if (e.unitLabelType === 'authors') e.qty = S.attendance.authors;
    }
  });
  try { localStorage.setItem(SK, JSON.stringify(S)); } catch(e) {}
  syncHQToFirebase();
}

function syncHQToFirebase() {
  if (!window.FIREBASE_DB_URL) return;
  const push = (path, data) => fetch(window.FIREBASE_DB_URL + path + '.json', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
  }).catch(()=>{});
  push('/hq/attendance', S.attendance);
  push('/hq/ticketPrice', S.ticketPrice);
  const expObj = {};
  (S.expenses||[]).forEach(e => { expObj[e.id] = e; });
  push('/hq/expenses', expObj);
  const authObj = {};
  (S.authors||[]).forEach(a => { authObj[a.id] = a; });
  push('/authors', authObj);
  push('/wishlist', S.wishlist||[]);
}

// ── Helpers ──
function showToast(msg, type='success') {
  let t = document.getElementById('toast');
  if (!t) { t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.background = type==='error' ? 'var(--red)' : 'var(--green)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
function showModal(html) {
  document.getElementById('modal-container').innerHTML =
    `<div class="modal-overlay" id="modal-bg" onclick="closeModalOutside(event)">
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
function confirmDelete(msg, fn) {
  if (confirm(msg)) fn();
}
