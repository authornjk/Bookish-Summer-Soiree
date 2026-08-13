// authors_hq.js — clean rewrite

var _authorSwipeX = _authorSwipeX || 0;
var _swipedAuthorId = null;

const AUTHOR_CHECKS = [
  {key:'infoForm',         label:'Info form filled'},
  {key:'multiAuthor',      label:'Multi-author story'},
  {key:'swagSent',         label:'SWAG sent'},
  {key:'booksDonated',     label:'Books donated'},
  {key:'ticket',           label:'Ticket purchased'},
  {key:'qrCode',           label:'QR code received'},
  {key:'signingConfirmed', label:'Signing confirmed'},
  {key:'thankYou',         label:'Thank you sent'},
];

function renderAuthors() {
  const el = document.getElementById('authors-content');
  if (!el) return;

  const all    = S.authors  || [];
  const wish   = S.wishlist || [];

  const byName = arr => [...arr].sort((a,b) => (a.name||'').localeCompare(b.name||''));

  const qna    = byName(all.filter(a => (a.role==='Q&A'||a.role==='Both') && a.status==='Confirmed'));
  const conf   = byName(all.filter(a => a.role!=='Q&A' && a.role!=='Both' && (a.status==='Confirmed'||a.status==='Asked'||a.status==='Maybe')));
  const wishSorted = byName(wish);

  // If completely empty, try Firebase restore
  if (all.length === 0 && wish.length === 0 && window.FIREBASE_DB_URL) {
    el.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text2)">
      <div style="font-size:13px;margin-bottom:12px">Loading authors from Firebase…</div>
      <button class="btn primary" onclick="restoreAuthorsFromFirebase()">Restore from Firebase</button>
      <div style="margin-top:12px">
        <button class="btn" onclick="openAddAuthorModal()"><i class="ti ti-user-plus"></i> Add author manually</button>
      </div>
    </div>`;
    restoreAuthorsFromFirebase();
    return;
  }

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div style="font-size:13px;font-weight:600">${all.filter(a=>a.status==='Confirmed').length} confirmed · ${all.length} total</div>
      <button class="btn primary" onclick="openAddAuthorModal()"><i class="ti ti-user-plus"></i> Add author</button>
    </div>`;

  if (qna.length) {
    html += `<div style="font-size:11px;font-weight:600;color:var(--purple);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Q&amp;A Panel</div>`;
    html += qna.map(a => authorCard(a)).join('');
  }

  if (conf.length) {
    html += `<div style="font-size:11px;font-weight:600;color:var(--text2);margin:10px 0 6px;text-transform:uppercase;letter-spacing:.05em">Book Signing</div>`;
    html += conf.map(a => authorCard(a)).join('');
  }

  if (wishSorted.length) {
    html += `<div class="card" style="margin-top:10px">
      <div class="card-title">Wishlist (${wishSorted.length})</div>`;
    wishSorted.forEach((w, i) => {
      const realIdx = wish.indexOf(w);
      const wid = 'wl-' + realIdx;
      const isOpen = _swipedAuthorId === wid;
      html += `<div class="author-swipe-row${isOpen?' open':''}" data-single="1" id="arow-${wid}" style="margin-bottom:4px">
        <div class="author-swipe-content" ontouchstart="_authorSwipeX=event.touches[0].clientX" ontouchend="wishSwipeEnd(event,'${wid}',${realIdx})">
          <div style="padding:8px 10px;background:var(--bg);border:.5px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:13px;font-weight:500">${escHtml(w.name)}</div>
            ${w.note ? `<div style="font-size:11px;color:var(--text2)">${escHtml(w.note)}</div>` : ''}
          </div>
        </div>
        <div class="author-swipe-actions">
          <button class="author-action" style="background:var(--green);flex:0 0 90px" onclick="promptAddToYear(${realIdx})">
            <i class="ti ti-user-plus"></i><span>Add to 2027</span>
          </button>
          <button class="author-action" style="background:var(--red);flex:0 0 70px" onclick="deleteWishlist(${realIdx})">
            <i class="ti ti-trash"></i><span>Delete</span>
          </button>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  el.innerHTML = html;
}

function authorCard(a) {
  const idx     = (S.authors||[]).findIndex(x => x.id === a.id);
  const done    = AUTHOR_CHECKS.filter(c => a[c.key]).length;
  const ini     = (a.name||'?').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const isOpen  = _swipedAuthorId === a.id;
  const isQA    = a.role==='Q&A' || a.role==='Both';

  return `<div class="author-swipe-row${isOpen?' open':''}" id="arow-${a.id}" style="margin-bottom:6px">
    <div class="author-swipe-content" ontouchstart="_authorSwipeX=event.touches[0].clientX" ontouchend="authorSwipeEnd(event,'${a.id}')">
      <div style="border:.5px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;background:var(--bg)">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer" onclick="toggleAuthorExpand('${a.id}')">
          <div class="avatar">${escHtml(ini)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600">${escHtml(a.name||'')}</div>
            <div style="font-size:11px;color:var(--text2)">${escHtml(a.role||'Book Signing')} · ${escHtml(a.status||'')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <span style="font-size:11px;color:${done===AUTHOR_CHECKS.length?'var(--green)':'var(--text2)'}">${done}/${AUTHOR_CHECKS.length}</span>
            <i class="ti ti-chevron-${a._expanded?'up':'down'}" style="font-size:12px;color:var(--text3)"></i>
          </div>
        </div>
        ${a._expanded ? authorDetail(a, idx) : ''}
      </div>
    </div>
    <div class="author-swipe-actions">
      <button class="author-action" style="background:var(--purple);flex:0 0 70px" onclick="moveAuthorRole('${a.id}','${isQA?'Book Signing':'Q&A'}')">
        <i class="ti ti-${isQA?'book':'microphone'}"></i>
        <span>${isQA?'→ Signing':'→ Q&A'}</span>
      </button>
      <button class="author-action" style="background:var(--amber);flex:0 0 70px" onclick="moveAuthorToWishlist('${a.id}')">
        <i class="ti ti-star"></i><span>→ Wish</span>
      </button>
      <button class="author-action" style="background:var(--red);flex:0 0 50px" onclick="deleteAuthor(${idx})">
        <i class="ti ti-trash"></i>
      </button>
    </div>
  </div>`;
}

function authorDetail(a, idx) {
  return `<div style="padding:10px 12px;border-top:.5px solid var(--border);background:var(--bg2)">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
      <div>
        <div style="font-size:10px;color:var(--text3);margin-bottom:2px">Status</div>
        <select style="width:100%;font-size:12px;padding:3px 6px" onchange="setAuthorField(${idx},'status',this.value);saveAuthorToFirebase(${idx});renderAuthors()">
          ${['Confirmed','Asked','Maybe','Declined'].map(s=>`<option${a.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div>
        <div style="font-size:10px;color:var(--text3);margin-bottom:2px">Role</div>
        <select style="width:100%;font-size:12px;padding:3px 6px" onchange="setAuthorField(${idx},'role',this.value);saveAuthorToFirebase(${idx});renderAuthors()">
          ${['Book Signing','Q&A','Both'].map(r=>`<option${a.role===r?' selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div style="grid-column:1/-1">
        <div style="font-size:10px;color:var(--text3);margin-bottom:2px">Website</div>
        <input type="text" value="${escHtml(a.website||'')}" placeholder="https://…" style="width:100%;font-size:12px;padding:3px 6px"
          onblur="setAuthorField(${idx},'website',this.value);saveAuthorToFirebase(${idx})">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
      ${AUTHOR_CHECKS.map(c=>`<label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;padding:2px 0">
        <input type="checkbox" ${a[c.key]?'checked':''} style="accent-color:var(--purple)"
          onchange="toggleAuthorCheck(${idx},'${c.key}',this.checked)">
        ${escHtml(c.label)}
      </label>`).join('')}
    </div>
    <textarea style="width:100%;font-size:12px;padding:4px 7px;border:.5px solid var(--border2);border-radius:var(--radius-sm);min-height:36px;background:var(--bg);color:var(--text);font-family:inherit"
      placeholder="Notes…" onblur="setAuthorField(${idx},'notes',this.value);saveAuthorToFirebase(${idx})">${escHtml(a.notes||'')}</textarea>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button class="btn danger" style="font-size:11px" onclick="deleteAuthor(${idx})"><i class="ti ti-trash"></i> Remove</button>
    </div>
  </div>`;
}

// ── Swipe handlers ────────────────────────────────────────────────────────────

function authorSwipeEnd(e, id) {
  const dx = e.changedTouches[0].clientX - _authorSwipeX;
  _swipedAuthorId = dx < -50 ? id : (dx > 20 ? null : _swipedAuthorId);
  renderAuthors();
}

function wishSwipeEnd(e, wid, idx) {
  const dx = e.changedTouches[0].clientX - _authorSwipeX;
  _swipedAuthorId = dx < -50 ? wid : (dx > 20 ? null : _swipedAuthorId);
  renderAuthors();
}

// ── Author mutations ──────────────────────────────────────────────────────────

function setAuthorField(idx, field, val) {
  if (S.authors[idx]) S.authors[idx][field] = val;
  saveState();
}

function toggleAuthorExpand(idx) {
  // Support both index and id
  const a = typeof idx === 'string' 
    ? (S.authors||[]).find(x=>x.id===idx)
    : S.authors[idx];
  if (a) a._expanded = !a._expanded;
  saveState(); renderAuthors();
}

async function toggleAuthorCheck(idx, key, val) {
  const a = S.authors[idx];
  if (!a) return;
  a[key] = val;
  saveState();
  saveAuthorToFirebase(idx);
  if (val && key==='booksDonated') await createPrizeForAuthor(a, 'books');
  if (val && key==='swagSent')     await createPrizeForAuthor(a, 'swag');
  renderAuthors();
}

function saveAuthorToFirebase(idx) {
  const a = S.authors[idx];
  if (!a || !window.FIREBASE_DB_URL) return;
  fetch(window.FIREBASE_DB_URL + '/authors/' + a.id + '.json', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(a)
  }).catch(()=>{});
}

function moveAuthorRole(id, newRole) {
  const a = (S.authors||[]).find(x=>x.id===id);
  if (!a) return;
  a.role = newRole;
  _swipedAuthorId = null;
  saveState();
  saveAuthorToFirebase((S.authors||[]).findIndex(x=>x.id===id));
  renderAuthors();
}

function moveAuthorToWishlist(id) {
  const idx = (S.authors||[]).findIndex(x=>x.id===id);
  if (idx<0) return;
  const a = S.authors[idx];
  if (!confirm('Move ' + a.name + ' to wishlist?')) return;
  S.wishlist = S.wishlist || [];
  S.wishlist.push({name:a.name, note:a.notes||''});
  S.authors.splice(idx, 1);
  _swipedAuthorId = null;
  saveState(); renderAuthors();
}

function deleteAuthor(idx) {
  const a = S.authors[idx];
  if (!a || !confirm('Remove ' + a.name + '?')) return;
  S.authors.splice(idx, 1);
  _swipedAuthorId = null;
  saveState(); renderAuthors();
}

function deleteWishlist(idx) {
  if (!confirm('Remove from wishlist?')) return;
  S.wishlist.splice(idx, 1);
  _swipedAuthorId = null;
  saveState(); renderAuthors();
}

function promptAddToYear(wishIdx) {
  const w = (S.wishlist||[])[wishIdx];
  if (!w) return;
  showModal(`
    <h3>Add ${escHtml(w.name)} to 2027</h3>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
      <button class="btn primary" style="justify-content:center;padding:12px" onclick="addWishlistToYear(${wishIdx},'Book Signing')">
        <i class="ti ti-book"></i> Book Signing
      </button>
      <button class="btn primary" style="justify-content:center;padding:12px" onclick="addWishlistToYear(${wishIdx},'Q&A')">
        <i class="ti ti-microphone"></i> Q&amp;A Panel
      </button>
    </div>
    <div class="m-actions"><button class="btn" onclick="closeModal()">Cancel</button></div>`);
}

function addWishlistToYear(wishIdx, role) {
  const w = (S.wishlist||[])[wishIdx];
  if (!w) return;
  const a = {
    id: 'a'+S.nextId++, name:w.name, status:'Confirmed', role,
    notes:w.note||'', website:'', _expanded:false,
  };
  AUTHOR_CHECKS.forEach(c => { a[c.key] = false; });
  S.authors.push(a);
  S.wishlist.splice(wishIdx, 1);
  _swipedAuthorId = null;
  saveState();
  saveAuthorToFirebase(S.authors.length-1);
  closeModal(); renderAuthors();
}

function openAddAuthorModal() {
  showModal(`
    <h3>Add author</h3>
    <div class="field"><label>Name</label><input type="text" id="aa-name" placeholder="Author name"></div>
    <div class="field"><label>Status</label>
      <select id="aa-status">
        <option>Confirmed</option><option>Asked</option><option>Maybe</option>
      </select>
    </div>
    <div class="field"><label>Role</label>
      <select id="aa-role">
        <option>Book Signing</option><option>Q&A</option><option>Both</option>
      </select>
    </div>
    <div class="field"><label>Website (optional)</label><input type="text" id="aa-web" placeholder="https://…"></div>
    <div class="field"><label>Notes (optional)</label><input type="text" id="aa-notes" placeholder="Any notes…"></div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddAuthor()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(()=>document.getElementById('aa-name')?.focus(), 50);
}

function doAddAuthor() {
  const name = document.getElementById('aa-name')?.value?.trim();
  if (!name) { alert('Please enter a name.'); return; }
  const a = {
    id: 'a'+S.nextId++, name,
    status:  document.getElementById('aa-status')?.value || 'Confirmed',
    role:    document.getElementById('aa-role')?.value   || 'Book Signing',
    website: document.getElementById('aa-web')?.value?.trim()   || '',
    notes:   document.getElementById('aa-notes')?.value?.trim() || '',
    _expanded: false,
  };
  AUTHOR_CHECKS.forEach(c => { a[c.key] = false; });
  if (!S.authors) S.authors = [];
  S.authors.push(a);
  saveState();
  saveAuthorToFirebase(S.authors.length-1);
  closeModal(); renderAuthors();
}

async function createPrizeForAuthor(author, type) {
  if (!window.FIREBASE_DB_URL) { showToast('Set Firebase URL in Settings first'); return; }
  const cat = type==='books' ? 'BINGO' : 'SWAG Bag';
  try {
    const res   = await fetch(window.FIREBASE_DB_URL + '/meta/nextId.json');
    const nextId = (await res.json()) || 1;
    const prize = {
      id:nextId, cat, name:`${author.name} — ${type==='books'?'Book donation':'SWAG donation'}`,
      qty:1, paid:0, value:0, donor:author.name, donorType:'author',
      needTag:true, tagMade:false, tagPrinted:false, tagAttached:false, onTote:false,
      tagGenerated:false, notes:'Auto-created from HQ', _mod:Date.now()
    };
    await fetch(window.FIREBASE_DB_URL + '/prizes/' + nextId + '.json', {
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(prize)
    });
    await fetch(window.FIREBASE_DB_URL + '/meta/nextId.json', {
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(nextId+1)
    });
    showToast('Prize created for ' + author.name);
  } catch(e) { showToast('Could not create prize — check Firebase URL'); }
}

function restoreAuthorsFromFirebase() {
  if (!window.FIREBASE_DB_URL) return;
  fetch(window.FIREBASE_DB_URL + '/authors.json')
    .then(r => r.json())
    .then(data => {
      if (data && typeof data === 'object') {
        const authors = Object.values(data).filter(a => a && a.name);
        if (authors.length > 0) {
          S.authors = authors;
          saveState();
          showToast('Restored ' + authors.length + ' authors from Firebase');
          renderAuthors();
          return;
        }
      }
      showToast('No authors found in Firebase yet');
    })
    .catch(() => showToast('Could not reach Firebase'));
}
