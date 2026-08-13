// authors_hq.js
let _swipedAuthorId = null;
let _authorSwipeX = 0;

const AUTHOR_CHECKS = [
  {key:'infoForm',    label:'Info form filled'},
  {key:'multiAuthor', label:'Multi-author story'},
  {key:'swagSent',    label:'SWAG sent'},
  {key:'booksDonated',label:'Books donated'},
  {key:'ticket',      label:'Ticket purchased'},
  {key:'qrCode',      label:'QR code received'},
  {key:'signingConfirmed', label:'Signing confirmed'},
  {key:'thankYou',    label:'Thank you sent'},
];

function renderAuthors() {
  const el = document.getElementById('authors-content');
  if (!el) return;
  const all = S.authors || [];
  const alpha = arr => [...arr].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const qna   = alpha(all.filter(a => (a.role==='Q&A'||a.role==='Both') && a.status==='Confirmed'));
  const conf  = alpha(all.filter(a => a.role!=='Q&A' && a.role!=='Both' && a.status==='Confirmed'));
  const asked = alpha(all.filter(a => a.status==='Asked'||a.status==='Maybe'));
  const wish  = alpha(S.wishlist || []);

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div style="font-size:13px;font-weight:600">${conf.length + qna.length} confirmed authors</div>
      <button class="btn primary" onclick="openAddAuthorModal()"><i class="ti ti-user-plus"></i> Add author</button>
    </div>
    ${qna.length ? `<div style="font-size:11px;font-weight:600;color:var(--purple);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Q&A Panel</div>
    ${qna.map(a=>authorCard(a)).join('')}
    <div style="font-size:11px;font-weight:600;color:var(--text2);margin:10px 0 6px;text-transform:uppercase;letter-spacing:.05em">Book Signing</div>` : ''}
    ${conf.map(a=>authorCard(a)).join('')}
    ${asked.length ? `<div style="font-size:11px;font-weight:600;color:var(--amber);margin:10px 0 6px;text-transform:uppercase;letter-spacing:.05em">Asked / Pending</div>
    ${asked.map(a=>authorCard(a)).join('')}` : ''}
    ${wish.length ? `<div class="card" style="margin-top:10px">
      <div class="card-title">Wishlist</div>
      ${wish.map((w,i)=>{
        const wid = 'wl-'+i;
        const isWishOpen = _swipedAuthorId === wid;
        return `<div class="author-swipe-row${isWishOpen?' open':''}" id="arow-${wid}" style="margin-bottom:4px">
          <div class="author-swipe-content"
            ontouchstart="_authorSwipeX=event.touches[0].clientX"
            ontouchend="authorSwipeEnd(event,'${wid}')">
            <div style="padding:8px 10px;background:var(--bg);border:.5px solid var(--border);border-radius:var(--radius-sm)">
              <div style="font-size:13px;font-weight:500">${escHtml(w.name)}</div>
              ${w.note?`<div style="font-size:11px;color:var(--text2)">${escHtml(w.note)}</div>`:''}
            </div>
          </div>
          <div class="author-swipe-actions">
            <button class="author-action" style="background:var(--green)"
              onclick="promptAddToYear(${i})">
              <i class="ti ti-user-plus"></i><span>Add to 2027</span>
            </button>
            <button class="author-action" style="background:var(--red)"
              onclick="deleteWishlist(${i})">
              <i class="ti ti-trash"></i><span>Delete</span>
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>` : ''}`;
}

function deleteWishlist(i){
  if(!confirm('Remove from wishlist?')) return;
  S.wishlist.splice(i,1);
  _swipedAuthorId=null;
  saveState();renderAuthors();
}

function authorSwipeEnd(e, id) {
  const dx = e.changedTouches[0].clientX - _authorSwipeX;
  if(dx < -50) _swipedAuthorId = id;
  else if(dx > 20) _swipedAuthorId = null;
  renderAuthors();
}

function moveAuthorRole(id, newRole) {
  const a = (S.authors||[]).find(x=>x.id===id);
  if(!a) return;
  a.role = newRole;
  _swipedAuthorId = null;
  saveState();
  syncAuthorToFirebase((S.authors||[]).findIndex(x=>x.id===id));
  renderAuthors();
}

function moveAuthorToWishlist(id) {
  const idx = (S.authors||[]).findIndex(x=>x.id===id);
  if(idx<0) return;
  const a = S.authors[idx];
  if(!confirm(`Move ${a.name} to wishlist?`)) return;
  S.wishlist = S.wishlist||[];
  S.wishlist.push({name:a.name, note:a.notes||''});
  S.authors.splice(idx,1);
  _swipedAuthorId = null;
  saveState(); renderAuthors();
}

function promptAddToYear(wishIdx) {
  const w = (S.wishlist||[])[wishIdx];
  if(!w) return;
  showModal(`
    <h3>Add ${escHtml(w.name)} to 2027</h3>
    <div style="font-size:13px;color:var(--text2);margin-bottom:14px">What role will they have?</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn primary" style="justify-content:center;padding:12px" onclick="addWishlistToYear(${wishIdx},'Book Signing')">
        <i class="ti ti-book"></i> Book Signing
      </button>
      <button class="btn primary" style="justify-content:center;padding:12px" onclick="addWishlistToYear(${wishIdx},'Q&A')">
        <i class="ti ti-microphone"></i> Q&A Panel
      </button>
    </div>
    <div class="m-actions" style="margin-top:10px">
      <button class="btn" onclick="closeModal()">Cancel</button>
    </div>`);
}

async function addWishlistToYear(wishIdx, role) {
  const w = (S.wishlist||[])[wishIdx];
  if(!w) return;
  const a = {
    id:'a'+S.nextId++, name:w.name, status:'Confirmed', role,
    notes:w.note||'', website:'', _expanded:false,
  };
  AUTHOR_CHECKS.forEach(c => { a[c.key]=false; });
  S.authors.push(a);
  S.wishlist.splice(wishIdx,1);
  _swipedAuthorId = null;
  saveState();
  syncAuthorToFirebase(S.authors.length-1);
  closeModal(); renderAuthors();
}

function authorCard(a) {
  const idx = (S.authors||[]).findIndex(x=>x.id===a.id);
  const done = AUTHOR_CHECKS.filter(c=>a[c.key]).length;
  const ini  = a.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const isOpen = _swipedAuthorId === a.id;
  const isQA   = (a.role||'').includes('Q&A') || a.role==='Both';

  // Swipe actions for confirmed/asked authors
  const actions = `
    <button class="author-action" style="background:var(--purple)"
      onclick="moveAuthorRole('${a.id}','${isQA?'Book Signing':'Q&A'}')">
      <i class="ti ti-${isQA?'microphone-off':'microphone'}"></i>
      <span>${isQA?'→ Book Signing':'→ Q&A'}</span>
    </button>
    <button class="author-action" style="background:var(--amber)"
      onclick="moveAuthorToWishlist('${a.id}')">
      <i class="ti ti-star"></i><span>→ Wishlist</span>
    </button>
    <button class="author-action" style="background:var(--red)"
      onclick="deleteAuthor(${idx})">
      <i class="ti ti-trash"></i><span>Delete</span>
    </button>`;

  return `<div class="author-swipe-row${isOpen?' open':''}" id="arow-${a.id}">
    <div class="author-swipe-content"
      ontouchstart="_authorSwipeX=event.touches[0].clientX"
      ontouchend="authorSwipeEnd(event,'${a.id}')">
      <div style="border:.5px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;background:var(--bg)">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer"
          onclick="toggleAuthorExpand(${idx})">
          <div class="avatar">${ini}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600">${escHtml(a.name)}</div>
            <div style="font-size:11px;color:var(--text2)">${escHtml(a.role||'Book Signing')} · ${escHtml(a.status)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <div style="font-size:11px;color:${done===AUTHOR_CHECKS.length?'var(--green)':'var(--text2)'}">${done}/${AUTHOR_CHECKS.length}</div>
            <i class="ti ti-chevron-${a._expanded?'up':'down'}" style="font-size:12px;color:var(--text3)"></i>
          </div>
        </div>
        ${a._expanded ? authorDetail(a, idx) : ''}
      </div>
    </div>
    <div class="author-swipe-actions">${actions}</div>
  </div>`;
}

function authorDetail(a, idx) {
  return `<div style="padding:10px 12px;border-top:.5px solid var(--border);background:var(--bg2)">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
      <div>
        <div style="font-size:10px;color:var(--text3);margin-bottom:2px">Status</div>
        <select style="width:100%;font-size:12px;padding:3px 6px" onchange="setAuthorField(${idx},'status',this.value);syncAuthorToFirebase(${idx})">
          ${['Confirmed','Asked','Maybe','Declined'].map(s=>`<option${a.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div>
        <div style="font-size:10px;color:var(--text3);margin-bottom:2px">Role</div>
        <select style="width:100%;font-size:12px;padding:3px 6px" onchange="setAuthorField(${idx},'role',this.value);syncAuthorToFirebase(${idx})">
          ${['Book Signing','Q&A','Both'].map(r=>`<option${a.role===r?' selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div style="grid-column:1/-1">
        <div style="font-size:10px;color:var(--text3);margin-bottom:2px">Website</div>
        <input type="text" value="${escHtml(a.website||'')}" placeholder="https://…" style="width:100%;font-size:12px;padding:3px 6px"
          onblur="setAuthorField(${idx},'website',this.value);syncAuthorToFirebase(${idx})">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px">
      ${AUTHOR_CHECKS.map(c=>`<label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer">
        <input type="checkbox" ${a[c.key]?'checked':''} style="accent-color:var(--purple)"
          onchange="toggleAuthorCheck(${idx},'${c.key}',this.checked)">
        ${c.label}
      </label>`).join('')}
    </div>
    <textarea style="width:100%;font-size:12px;padding:4px 7px;border:.5px solid var(--border2);border-radius:var(--radius-sm);min-height:36px;background:var(--bg);color:var(--text);font-family:inherit"
      placeholder="Notes…" onblur="setAuthorField(${idx},'notes',this.value);syncAuthorToFirebase(${idx})">${escHtml(a.notes||'')}</textarea>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button class="btn danger" style="font-size:11px" onclick="deleteAuthor(${idx})"><i class="ti ti-trash"></i> Remove</button>
    </div>
  </div>`;
}

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
  syncAuthorToFirebase(idx);
  if (val && key==='booksDonated') await createPrizeForAuthor(a, 'books');
  if (val && key==='swagSent')     await createPrizeForAuthor(a, 'swag');
  renderAuthors();
}

function syncAuthorToFirebase(idx) {
  const a = S.authors[idx];
  if (!a || !window.FIREBASE_DB_URL) return;
  fetch(window.FIREBASE_DB_URL + '/authors/' + a.id + '.json', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(a)
  }).catch(()=>{});
}

function deleteAuthor(idx) {
  const a = S.authors[idx];
  if (!a || !confirm(`Remove ${a.name}?`)) return;
  S.authors.splice(idx,1);
  saveState(); renderAuthors();
}

async function createPrizeForAuthor(author, type) {
  if (!window.FIREBASE_DB_URL) { showToast('Set Firebase URL in Settings first'); return; }
  const cat = type==='books' ? 'BINGO' : 'SWAG Bag';
  try {
    const metaRes = await fetch(window.FIREBASE_DB_URL + '/meta/nextId.json');
    const nextId  = (await metaRes.json()) || 1;
    const prize   = {
      id: nextId, cat, name: `${author.name} — ${type==='books'?'Book donation':'SWAG donation'}`,
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
    showToast(`Prize created for ${author.name}`);
  } catch(e) { showToast('Could not create prize — check Firebase URL'); }
}

function openAddAuthorModal() {
  showModal(`
    <h3>Add author</h3>
    <div class="field"><label>Name</label><input type="text" id="aa-name" placeholder="Author name"></div>
    <div class="field"><label>Status</label>
      <select id="aa-status"><option>Confirmed</option><option>Asked</option><option>Maybe</option></select>
    </div>
    <div class="field"><label>Role</label>
      <select id="aa-role"><option>Book Signing</option><option>Q&A</option><option>Both</option></select>
    </div>
    <div class="field"><label>Notes (optional)</label><input type="text" id="aa-notes" placeholder="Any notes…"></div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddAuthor()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(()=>document.getElementById('aa-name')?.focus(),50);
}

function doAddAuthor() {
  const name = document.getElementById('aa-name')?.value?.trim();
  if (!name) { alert('Please enter a name.'); return; }
  const a = {
    id: 'a'+S.nextId++, name,
    status: document.getElementById('aa-status')?.value || 'Confirmed',
    role:   document.getElementById('aa-role')?.value   || 'Book Signing',
    notes:  document.getElementById('aa-notes')?.value?.trim() || '',
    website:'', _expanded:false,
  };
  AUTHOR_CHECKS.forEach(c => { a[c.key] = false; });
  S.authors.push(a);
  saveState();
  syncAuthorToFirebase(S.authors.length-1);
  closeModal(); renderAuthors();
}
