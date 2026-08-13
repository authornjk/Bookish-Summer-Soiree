// storage.js — state management with strict data preservation
// RULE: migration may only ADD missing fields. Never overwrite user-entered values.

const SK = 'soiree_hq_2027';
let S = {};

// Global swipe state shared across all tab JS files
var _authorSwipeX = 0;

window.FIREBASE_DB_URL = localStorage.getItem('soiree_firebase_url') || '';
window.PRIZE_APP_URL   = localStorage.getItem('soiree_prize_url')   || '';

// ── Migration ─────────────────────────────────────────────────────────────────
// Each rule: if field missing on S, set it from default. Never overwrite.

function migrateState() {
  const D = DEFAULT_DATA;

  // Top-level scalars — only set if missing
  if (S.ticketPrice  === undefined) S.ticketPrice  = 0;
  if (S.nextId       === undefined) S.nextId       = 200;
  if (!S.eventName)                  S.eventName   = D.eventName;
  if (!S.eventYear)                  S.eventYear   = D.eventYear;
  if (S.merchType    === undefined) S.merchType    = D.merchType || 'hats';
  if (!S.merchOptions) S.merchOptions = ['hats','tshirts'];
  if (!S.merchLabels)  S.merchLabels  = {hats:'Hats', tshirts:'T-shirts'};
  if (!S._2027reset) {
    // One-time: reset todo done flags for new year
    if (S.todos) S.todos = S.todos.map(t => ({...t, done:false}));
    S._2027reset = true;
  }

  // Attendance — preserve user values, add missing sub-fields
  if (!S.attendance) S.attendance = {...D.attendance};
  else {
    if (S.attendance.total   === undefined) S.attendance.total   = D.attendance.total;
    if (S.attendance.authors === undefined) S.attendance.authors = D.attendance.authors;
    if (S.attendance.admin   === undefined) S.attendance.admin   = D.attendance.admin;
  }

  // People
  if (!S.people)       S.people       = [...D.people];
  if (!S.peopleGroups) S.peopleGroups = JSON.parse(JSON.stringify(D.peopleGroups));
  if (!S.customLocations) S.customLocations = [];

  // Expenses — patch structure only, preserve all user values
  if (!S.expenses) {
    S.expenses = JSON.parse(JSON.stringify(D.expenses));
  } else {
    const defMap = {};
    D.expenses.forEach(e => { defMap[e.id] = e; });

    // Patch existing lines: restore type/structure if wrong, keep user values
    S.expenses = S.expenses.map(e => {
      const def = defMap[e.id];
      if (!def) return e; // user-added custom line — never touch

      const out = {...e}; // start from saved state

      // Only restore structural fields if they're missing or wrong type
      if (!out.type)  out.type  = def.type;
      if (!out.label) out.label = def.label;
      if (out.type === 'fixed'    && out.fixedAmt   === undefined) out.fixedAmt   = def.fixedAmt;
      if (out.type === 'perunit'  && out.unitPrice   === undefined) out.unitPrice  = def.unitPrice;
      if (out.type === 'perunit'  && out.qty         === undefined) out.qty        = def.qty;
      if (out.type === 'perunit'  && !out.unitLabel)                out.unitLabel  = def.unitLabel || '';
      if (out.type === 'subtable' && !out.subtable)                 out.subtable   = def.subtable;
      if (out.spent    === undefined) out.spent    = 0;
      if (out.notes    === undefined) out.notes    = '';
      if (out.expanded === undefined) out.expanded = false;

      // Tip — only add if missing entirely
      if (def.tip && !out.tip) out.tip = {...def.tip};

      return out;
    });

    // Add any default lines that are completely missing
    D.expenses.forEach(def => {
      if (!S.expenses.find(e => e.id === def.id)) {
        S.expenses.push(JSON.parse(JSON.stringify(def)));
      }
    });
  }

  // Subtables — preserve all rows, add defaults only if table missing entirely
  ['tshirts','hats','totes','prizes','swag','decorations','misc'].forEach(key => {
    if (!S[key] || S[key].length === 0) {
      S[key] = JSON.parse(JSON.stringify(DEFAULT_DATA[key]));
    }
    // Add missing fields to existing rows (never overwrite values)
    S[key] = S[key].map(r => ({
      label:'', est:0, spent:0, notes:'', url:'', price:0, qty:0, ...r
    }));
  });

  // Add inventory category if missing
  if (S.inventory) {
    const catMap = [
      ['Backdrops','Backdrops'],['Check-in','Check-in'],['Decor:','Decor'],
      ['Prizes:','Prize table'],['Name tags','Check-in'],['Raffle','Prize table'],
      ['Misc:','Misc'],['Bible','Misc'],['Extra','Misc'],['Friendship','Misc'],
      ['Sign ','Misc'],['Water bottle','Misc'],
    ];
    S.inventory = S.inventory.map(item => {
      if (item.cat) return item;
      let cat = 'Misc';
      for (const [key, val] of catMap) {
        if ((item.item||'').includes(key)) { cat=val; break; }
      }
      return {...item, cat};
    });
  } else {
    S.inventory = JSON.parse(JSON.stringify(DEFAULT_DATA.inventory));
  }

  // Authors + wishlist — preserve user data, restore from defaults only if completely empty
  if (!S.authors  || S.authors.length  === 0) {
    S.authors  = JSON.parse(JSON.stringify(DEFAULT_DATA.authors));
  }
  if (!S.wishlist || S.wishlist.length  === 0) {
    S.wishlist = JSON.parse(JSON.stringify(DEFAULT_DATA.wishlist));
  }
  // Ensure all author records have required fields
  S.authors = S.authors.map(a => ({
    infoForm:false, multiAuthor:false, swagSent:false, booksDonated:false,
    ticket:false, qrCode:false, signingConfirmed:false, thankYou:false,
    notes:'', website:'', _expanded:false, ...a
  }));

  // Todos — preserve, just add if missing
  if (!S.todos || S.todos.length === 0) S.todos = JSON.parse(JSON.stringify(DEFAULT_DATA.todos));
}

// ── Load / Save ───────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(SK);
    S = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  } catch(e) {
    console.warn('Load failed, using defaults:', e);
    S = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  migrateState();
}

function saveState() {
  try {
    localStorage.setItem(SK, JSON.stringify(S));
  } catch(e) {
    console.warn('Save failed:', e);
  }
  syncHQToFirebase();
}

function syncHQToFirebase() {
  if (!window.FIREBASE_DB_URL) return;
  const push = (path, data) => fetch(window.FIREBASE_DB_URL+path+'.json', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
  }).catch(()=>{});
  push('/hq/attendance', S.attendance);
  const expObj = {};
  (S.expenses||[]).forEach(e => { expObj[e.id] = e; });
  push('/hq/expenses', expObj);
  const authObj = {};
  (S.authors||[]).forEach(a => { authObj[a.id] = a; });
  push('/authors', authObj);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
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
