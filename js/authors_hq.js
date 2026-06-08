// authors_hq.js — author management with Firebase sync and prize auto-creation

const AUTHOR_CHECKBOXES = [
  { key: 'infoFormDone',      label: 'Info form filled out' },
  { key: 'multiAuthorDone',   label: 'Multi-author story submitted' },
  { key: 'swagSent',          label: 'SWAG sent / confirmed' },
  { key: 'booksDonated',      label: 'Books donated (BINGO)' },
  { key: 'ticketPurchased',   label: 'Ticket purchased' },
  { key: 'qrCodeDone',        label: 'QR code / social links received' },
  { key: 'signingConfirmed',  label: 'Book signing slot confirmed' },
  { key: 'thankYouSent',      label: 'Thank you sent' },
];

const AUTHOR_STATUSES = ['Confirmed','Asked','Maybe','Wishlist','Declined'];

// ── Firebase author sync ──────────────────────────────────────────────────────

async function loadAuthorsFromFirebase() {
  if (!window.FIREBASE_DB_URL) return;
  try {
    const res = await fetch(window.FIREBASE_DB_URL + '/authors.json');
    if (!res.ok) return;
    const data = await res.json();
    if (data) {
      S.authors = Object.values(data);
      saveState();
    }
  } catch(e) { console.warn('Author load failed:', e); }
}

async function saveAuthorToFirebase(author) {
  if (!window.FIREBASE_DB_URL) return;
  try {
    await fetch(window.FIREBASE_DB_URL + '/authors/' + author.id + '.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(author)
    });
  } catch(e) { console.warn('Author save failed:', e); }
}

async function deleteAuthorFromFirebase(id) {
  if (!window.FIREBASE_DB_URL) return;
  try {
    await fetch(window.FIREBASE_DB_URL + '/authors/' + id + '.json', { method: 'DELETE' });
  } catch(e) { console.warn('Author delete failed:', e); }
}

// ── Auto-create prize entries when checkbox toggled ───────────────────────────

async function createPrizeForAuthor(author, type) {
  // type: 'books' → BINGO, 'swag' → SWAG Bag
  if (!window.FIREBASE_DB_URL) {
    showToast('Set Firebase URL in Settings to sync prizes');
    return;
  }
  const cat   = type === 'books' ? 'BINGO' : 'SWAG Bag';
  const label = type === 'books' ? 'Book donation' : 'SWAG donation';
  try {
    // Get next prize ID
    const metaRes = await fetch(window.FIREBASE_DB_URL + '/meta/nextId.json');
    const currentId = await metaRes.json() || 1;
    const newId = currentId + 1;

    const prize = {
      id: newId,
      cat,
      name: `${author.name} — ${label}`,
      qty: 1,
      paid: 0,
      value: 0,
      loc: '',
      donor: author.name,
      donorType: 'author',
      notes: `Auto-created from author tracking`,
      url: '',
      needTag: true,
      tagMade: false, tagPrinted: false, tagAttached: false, onTote: false,
      photo: null,
      addedBy: 'HQ Auto',
      updatedBy: 'HQ Auto',
      _mod: Date.now()
    };

    await fetch(window.FIREBASE_DB_URL + '/prizes/' + newId + '.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prize)
    });
    await fetch(window.FIREBASE_DB_URL + '/meta/nextId.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newId + 1)
    });
    showToast(`Prize entry created for ${author.name}`);
  } catch(e) {
    console.warn('Prize create failed:', e);
    showToast('Could not create prize entry — check Firebase URL');
  }
}

// ── Render authors tab ────────────────────────────────────────────────────────

function renderAuthors() {
  const el = document.getElementById('authors-content');
  if (!el) return;

  const all       = S.authors || [];
  const confirmed = all.filter(a => a.status === 'Confirmed');
  const asked     = all.filter(a => a.status === 'Asked');
  const maybe     = all.filter(a => a.status === 'Maybe');
  const wishlist  = all.filter(a => a.status === 'Wishlist');
  const slots     = 25;
  const open      = Math.max(0, slots - confirmed.length);

  // Progress summary across all confirmed authors
  const totalChecks = confirmed.length * AUTHOR_CHECKBOXES.length;
  const doneChecks  = confirmed.reduce((s,a) =>
    s + AUTHOR_CHECKBOXES.filter(c => a[c.key]).length, 0);

  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="stat-lbl">Confirmed</div><div class="stat-val" style="color:var(--purple)">${confirmed.length}</div><div class="stat-sub">of ${slots} slots · ${open} open</div></div>
      <div class="stat"><div class="stat-lbl">Asked / pending</div><div class="stat-val" style="color:var(--amber)">${asked.length + maybe.length}</div></div>
      <div class="stat"><div class="stat-lbl">Wishlist</div><div class="stat-val">${wishlist.length}</div></div>
      <div class="stat">
        <div class="stat-lbl">Tasks complete</div>
        <div class="stat-val">${doneChecks}/${totalChecks}</div>
        <div class="prog-bar"><div class="prog-fill" style="width:${totalChecks>0?Math.round(doneChecks/totalChecks*100):0}%"></div></div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${window.FIREBASE_DB_URL
          ? `<span style="font-size:11px;color:var(--green)">● Synced with Prize Manager</span>`
          : `<span style="font-size:11px;color:var(--text3)">⚠ Set Firebase URL to sync with Prize Manager</span>`}
      </div>
      <button class="btn primary" onclick="openAddAuthorModal()"><i class="ti ti-user-plus"></i> Add author</button>
    </div>

    ${authorSection('Confirmed', confirmed, '#1D9E75')}
    ${asked.length||maybe.length ? authorSection('Asked / Maybe', [...asked,...maybe], '#BA7517') : ''}
    ${wishlist.length ? wishlistSection(wishlist) : ''}

    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        Open slots (${open} remaining)
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px">
        ${Array.from({length:open}).map((_,i)=>`
          <div style="border:0.5px dashed var(--border2);border-radius:var(--radius-sm);padding:10px;display:flex;align-items:center;gap:7px;background:var(--bg2)">
            <div style="width:28px;height:28px;border-radius:50%;border:0.5px dashed var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="ti ti-user" style="font-size:12px;color:var(--text3)"></i>
            </div>
            <span style="font-size:11px;color:var(--text3)">Slot ${confirmed.length+i+1}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function authorSection(title, authors, color) {
  if (!authors.length) return '';
  return `<div class="card">
    <div class="card-title" style="color:${color}">${title} (${authors.length})</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${authors.map(a => authorCard(a)).join('')}
    </div>
  </div>`;
}

function authorCard(a) {
  const idx = (S.authors||[]).findIndex(x => x.id === a.id);
  const totalDone = AUTHOR_CHECKBOXES.filter(c => a[c.key]).length;
  const pct = Math.round(totalDone / AUTHOR_CHECKBOXES.length * 100);
  const ini = a.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const isExpanded = a._expanded;

  return `<div style="border:0.5px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">
    <!-- Header row -->
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;background:var(--bg)"
      onclick="toggleAuthorExpand(${idx})">
      <div class="avatar">${ini}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600">${escHtml(a.name)}</div>
        <div style="font-size:11px;color:var(--text2)">${escHtml(a.role||'Book Signing')}</div>
      </div>
      <!-- mini progress -->
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <div style="font-size:11px;color:${pct===100?'var(--green)':'var(--text2)'}">${totalDone}/${AUTHOR_CHECKBOXES.length}</div>
        <div style="width:48px;height:4px;background:var(--border);border-radius:2px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${pct===100?'var(--green)':'var(--purple)'}"></div>
        </div>
        <select class="tip-sel" style="font-size:11px;padding:2px 5px"
          onclick="event.stopPropagation()"
          onchange="setAuthorField(${idx},'status',this.value);saveAuthorToFirebase(S.authors[${idx}]);renderAuthors()">
          ${AUTHOR_STATUSES.map(s=>`<option${a.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
        <i class="ti ti-chevron-${isExpanded?'up':'down'}" style="font-size:13px;color:var(--text3)"></i>
      </div>
    </div>
    ${isExpanded ? authorDetail(a, idx) : ''}
  </div>`;
}

function authorDetail(a, idx) {
  return `<div style="padding:10px 12px;border-top:0.5px solid var(--border);background:var(--bg2)">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3);margin-bottom:3px">Role</div>
        <select class="st-text" style="width:100%;font-size:12px"
          onchange="setAuthorField(${idx},'role',this.value);saveAuthorToFirebase(S.authors[${idx}])">
          <option${a.role==='Book Signing'?' selected':''}>Book Signing</option>
          <option${a.role==='Q&A'?' selected':''}>Q&A</option>
          <option${a.role==='Keynote'?' selected':''}>Keynote</option>
          <option${a.role==='Both'?' selected':''}>Both</option>
        </select>
      </div>
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3);margin-bottom:3px">Website / social</div>
        <input type="text" class="st-text" value="${escHtml(a.website||'')}" placeholder="https://…"
          onblur="setAuthorField(${idx},'website',this.value);saveAuthorToFirebase(S.authors[${idx}])"
          onkeydown="if(event.key==='Enter')this.blur()">
      </div>
    </div>

    <!-- Checkboxes -->
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3);margin-bottom:6px">Tasks</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
      ${AUTHOR_CHECKBOXES.map(cb => {
        const checked = !!a[cb.key];
        const isSpecial = cb.key==='booksDonated'||cb.key==='swagSent';
        return `<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;padding:3px 0">
          <input type="checkbox" ${checked?'checked':''} style="accent-color:var(--purple);width:14px;height:14px"
            onchange="toggleAuthorCheck(${idx},'${cb.key}',this.checked)">
          <span style="color:${checked?'var(--text)':'var(--text2)'}">${cb.label}</span>
          ${isSpecial&&!checked?`<span style="font-size:9px;color:var(--purple);background:var(--purple-bg);padding:1px 4px;border-radius:4px">→ Prize</span>`:''}
        </label>`;
      }).join('')}
    </div>

    <!-- Notes -->
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3);margin-bottom:4px">Notes</div>
    <textarea class="notes-area" style="width:100%;min-height:48px" placeholder="Any notes about this author…"
      onblur="setAuthorField(${idx},'notes',this.value);saveAuthorToFirebase(S.authors[${idx}])"
      onkeydown="">${escHtml(a.notes||'')}</textarea>

    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button class="btn danger" onclick="deleteAuthor(${idx})"><i class="ti ti-trash"></i> Remove</button>
    </div>
  </div>`;
}

function wishlistSection(authors) {
  return `<div class="card">
    <div class="card-title">Wishlist for future years (${authors.length})</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px">
      ${authors.map(a => {
        const idx = (S.authors||[]).findIndex(x=>x.id===a.id);
        return `<div style="background:var(--bg2);border-radius:var(--radius-sm);padding:8px 10px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600">${escHtml(a.name)}</span>
            <button class="btn" style="font-size:10px;padding:2px 7px"
              onclick="promoteAuthor(${idx})">Invite</button>
          </div>
          ${a.notes?`<div style="font-size:10px;color:var(--text2)">${escHtml(a.notes)}</div>`:''}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function setAuthorField(idx, field, val) {
  if (S.authors[idx]) S.authors[idx][field] = val;
  saveState();
}

function toggleAuthorExpand(idx) {
  const a = S.authors[idx];
  if (a) a._expanded = !a._expanded;
  saveState(); renderAuthors();
}

async function toggleAuthorCheck(idx, key, val) {
  const a = S.authors[idx];
  if (!a) return;
  a[key] = val;
  saveState();
  await saveAuthorToFirebase(a);

  // Auto-create prize entry if checking books or swag
  if (val && key === 'booksDonated') {
    await createPrizeForAuthor(a, 'books');
  }
  if (val && key === 'swagSent') {
    await createPrizeForAuthor(a, 'swag');
  }
  renderAuthors();
}

function promoteAuthor(idx) {
  const a = S.authors[idx];
  if (!a) return;
  a.status = 'Asked';
  saveAuthorToFirebase(a);
  saveState(); renderAuthors();
}

function deleteAuthor(idx) {
  const a = S.authors[idx];
  if (!a) return;
  if (!confirm(`Remove ${a.name} from the list?`)) return;
  deleteAuthorFromFirebase(a.id);
  S.authors.splice(idx,1);
  saveState(); renderAuthors();
}

function openAddAuthorModal() {
  showModal(`
    <h3>Add author</h3>
    <div class="field"><label>Name</label>
      <input type="text" id="aa-name" placeholder="Author name">
    </div>
    <div class="field"><label>Status</label>
      <select id="aa-status">
        ${AUTHOR_STATUSES.map(s=>`<option>${s}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Role</label>
      <select id="aa-role">
        <option>Book Signing</option><option>Q&A</option><option>Keynote</option><option>Both</option>
      </select>
    </div>
    <div class="field"><label>Website / social (optional)</label>
      <input type="text" id="aa-web" placeholder="https://…">
    </div>
    <div class="field"><label>Notes (optional)</label>
      <input type="text" id="aa-notes" placeholder="Any notes…">
    </div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddAuthor()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(()=>document.getElementById('aa-name')?.focus(),50);
}

async function doAddAuthor() {
  const name = document.getElementById('aa-name')?.value?.trim();
  if (!name) { alert('Please enter a name.'); return; }
  const author = {
    id: 'author_' + S.nextId++,
    name,
    status: document.getElementById('aa-status')?.value || 'Confirmed',
    role:   document.getElementById('aa-role')?.value   || 'Book Signing',
    website: document.getElementById('aa-web')?.value?.trim()   || '',
    notes:   document.getElementById('aa-notes')?.value?.trim() || '',
    _expanded: false,
  };
  AUTHOR_CHECKBOXES.forEach(c => { author[c.key] = false; });
  S.authors.push(author);
  saveState();
  await saveAuthorToFirebase(author);
  closeModal(); renderAuthors();
}
