/**
 * ui-prizes.js — prize list, filtering, sorting, add/edit/delete
 */

let _sortKey = 'name';
let _sortDir = 1;
let _donorTypeModal = 'author';

function initPrizeSortFromPrefs() {
  const prefs = getPrefs();
  _sortKey = prefs.sortKey || 'name';
  _sortDir = prefs.sortDir || 1;
}

function renderPrizesTab() {
  const prefs = getPrefs();
  const meta = getMeta();
  const defCat = prefs.defaultCat !== undefined ? prefs.defaultCat : (currentUser().defaultCat || '');

  return `
    <div class="filter-bar">
      <input type="text" id="search" placeholder="Search prizes, donors, notes…" oninput="renderPrizes()">
      <select id="filter-cat" onchange="saveFilterPref();renderPrizes()">
        <option value="">All categories</option>
        ${CATS.map(c => `<option value="${c}"${c === defCat ? ' selected' : ''}>${c}</option>`).join('')}
      </select>
      <select id="filter-loc" onchange="renderPrizes()"><option value="">All locations</option></select>
      <select id="filter-donor" onchange="renderPrizes()"><option value="">All donors</option></select>
      <select id="filter-tag" onchange="renderPrizes()">
        <option value="">Any tag status</option>
        <option value="needed">Tag needed</option>
        <option value="made">Tag made</option>
        <option value="complete">All stages done</option>
        <option value="no">No tag needed</option>
      </select>
      <button class="add-btn" onclick="openAddPrizeModal()"><i class="ti ti-plus"></i> Add prize</button>
    </div>
    <div class="sort-row">
      <span class="sort-lbl">Sort:</span>
      ${['name','value','donor','cat','loc','paid','qty'].map(k =>
        `<button class="sort-btn${_sortKey === k ? ' active' : ''}" id="sort-${k}" onclick="setSort('${k}')">${
          {name:'Name',value:'Value',donor:'Donor',cat:'Category',loc:'Location',paid:'Paid',qty:'Qty'}[k]
        }</button>`
      ).join('')}
      <span class="result-count" id="result-count"></span>
    </div>
    <div class="prize-list" id="prize-list"></div>`;
}

function saveFilterPref() {
  const cat = (document.getElementById('filter-cat') || {}).value || '';
  const prefs = getPrefs();
  prefs.defaultCat = cat;
  savePrefs(prefs);
}

function updateFilterDropdowns() {
  const locSel = document.getElementById('filter-loc');
  if (locSel) {
    const cv = locSel.value;
    locSel.innerHTML = '<option value="">All locations</option>' +
      getLocs().map(l => `<option${l === cv ? ' selected' : ''}>${escHtml(l)}</option>`).join('');
  }
  const donSel = document.getElementById('filter-donor');
  if (donSel) {
    const cv = donSel.value;
    donSel.innerHTML = '<option value="">All donors</option>' +
      getDonors().map(d => `<option${d === cv ? ' selected' : ''}>${escHtml(d)}</option>`).join('');
  }
}

function filteredSortedPrizes() {
  const q = (document.getElementById('search') || {}).value?.toLowerCase() || '';
  const cat = (document.getElementById('filter-cat') || {}).value || '';
  const loc = (document.getElementById('filter-loc') || {}).value || '';
  const don = (document.getElementById('filter-donor') || {}).value || '';
  const tag = (document.getElementById('filter-tag') || {}).value || '';

  let list = getPrizes().filter(p => {
    const mq = !q || p.name.toLowerCase().includes(q) || (p.donor || '').toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q);
    const mc = !cat || p.cat === cat;
    const ml = !loc || p.loc === loc;
    const md = !don || p.donor === don;
    let mt = true;
    if (tag === 'needed') mt = p.needTag && !p.tagMade;
    if (tag === 'made') mt = p.needTag && p.tagMade;
    if (tag === 'complete') mt = p.needTag && STAGES.every(s => p[s]);
    if (tag === 'no') mt = !p.needTag;
    return mq && mc && ml && md && mt;
  });

  list.sort((a, b) => {
    let av = a[_sortKey] || '', bv = b[_sortKey] || '';
    if (['value', 'paid', 'qty'].includes(_sortKey)) {
      return ((+av || 0) - (+bv || 0)) * _sortDir;
    }
    return String(av).localeCompare(String(bv)) * _sortDir;
  });

  return list;
}

function setSort(k) {
  if (_sortKey === k) _sortDir *= -1; else { _sortKey = k; _sortDir = 1; }
  const prefs = getPrefs();
  prefs.sortKey = _sortKey;
  prefs.sortDir = _sortDir;
  savePrefs(prefs);
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('sort-' + k);
  if (btn) btn.classList.add('active');
  renderPrizes();
}

function renderPrizes() {
  updateFilterDropdowns();
  renderGoals();

  const list = filteredSortedPrizes();
  const prizes = getPrizes();
  const rc = document.getElementById('result-count');
  if (rc) rc.textContent = list.length !== prizes.length ? `${list.length} of ${prizes.length}` : `${prizes.length} prizes`;

  const el = document.getElementById('prize-list');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = prizes.length === 0
      ? `<div class="empty"><i class="ti ti-gift"></i><span style="font-weight:600">No prizes yet</span><span>Tap "Add prize" to get started</span></div>`
      : `<div class="empty"><i class="ti ti-search"></i><span>No prizes match your filters</span></div>`;
    return;
  }

  el.innerHTML = list.map(p => prizeCardHTML(p)).join('');

  const newIds = getNewItemIds();
  newIds.forEach(id => {
    const card = document.getElementById('pc-' + id);
    if (card) card.classList.add('new-item');
  });
  setTimeout(() => clearNewItemIds(), 3000);
}

function prizeCardHTML(p) {
  const stages = STAGES.map((s, i) =>
    `<button class="stg ${p[s] ? 'done' : ''}" onclick="toggleStage(${p.id},'${s}',event)">${STAGE_LABELS[i]}</button>`
  ).join('');

  const valTotal = (p.value || 0) * (p.qty || 1);
  const meta = getMeta();

  return `
    <div class="prize-card" id="pc-${p.id}">
      <div class="prize-row" onclick="toggleCard(${p.id})">
        <span class="cat-pill ${catClass(p.cat)}">${escHtml(p.cat)}</span>
        <span class="prize-name">${escHtml(p.name)}</span>
        <div class="prize-meta">
          ${p.qty > 1 ? `<span class="pmv">×${p.qty}</span>` : ''}
          ${p.value ? `<span class="pmv">${fmtMoney(p.value)}</span>` : ''}
          ${valTotal > 0 && p.qty > 1 ? `<span class="pmv" style="font-weight:600">${fmtMoney(valTotal)}</span>` : ''}
          ${p.donor ? `<span class="pmv">${escHtml(p.donor)}</span>` : ''}
          ${p.loc ? `<span class="pmv">${escHtml(p.loc)}</span>` : ''}
          <div class="tag-dot ${tagDotClass(p)}"></div>
          <i class="ti ti-chevron-down" id="chev-${p.id}" style="font-size:13px;color:var(--text3);transition:transform .2s"></i>
        </div>
      </div>
      <div class="prize-detail" id="det-${p.id}">
        <div class="det-grid">
          <div class="df">
            <label>Category</label>
            <select onchange="updatePrize(${p.id},{cat:this.value})">
              ${CATS.map(c => `<option${p.cat === c ? ' selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="df">
            <label>Location</label>
            <input type="text" value="${escHtml(p.loc || '')}" list="ll-${p.id}" onchange="updatePrize(${p.id},{loc:this.value})">
            <datalist id="ll-${p.id}">${getLocs().map(l => `<option value="${escHtml(l)}">`).join('')}</datalist>
          </div>
          <div class="df">
            <label>Quantity</label>
            <input type="number" min="0" value="${p.qty || 1}" onchange="updatePrize(${p.id},{qty:+this.value})">
          </div>
          <div class="df">
            <label>Value each ($)</label>
            <input type="number" step=".01" value="${p.value || ''}" onchange="updatePrize(${p.id},{value:+this.value})">
          </div>
          <div class="df">
            <label>Amount paid ($)</label>
            <input type="number" step=".01" value="${p.paid || ''}" onchange="updatePrize(${p.id},{paid:+this.value})">
          </div>
          <div class="df">
            <label>Donor</label>
            <input type="text" value="${escHtml(p.donor || '')}" list="al-${p.id}" onchange="updatePrize(${p.id},{donor:this.value})">
            <datalist id="al-${p.id}">${meta.authors.map(a => `<option value="${escHtml(a)}">`).join('')}</datalist>
          </div>
          <div class="df full">
            <label>Notes / tag instructions</label>
            <textarea onchange="updatePrize(${p.id},{notes:this.value})">${escHtml(p.notes || '')}</textarea>
          </div>
          <div class="df full">
            <label>Website / QR link</label>
            <input type="text" value="${escHtml(p.url || '')}" onchange="updatePrize(${p.id},{url:this.value})">
          </div>
        </div>

        <div style="margin-bottom:8px">
          <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;display:flex;align-items:center;gap:8px">
            Donation tag
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;text-transform:none;letter-spacing:0;cursor:pointer">
              <input type="checkbox" ${p.needTag ? 'checked' : ''} onchange="updatePrize(${p.id},{needTag:this.checked})">
              Needs tag
            </label>
          </div>
          ${p.needTag
            ? `<div class="stage-row">${stages}</div>`
            : `<span style="font-size:11px;color:var(--text3)">No tag required</span>`}
        </div>

        <div class="photo-area ${p.photo ? 'has-photo' : ''}" id="pa-${p.id}">
          <input type="file" accept="image/*" capture="environment" onchange="handlePhoto(${p.id},this)">
          ${p.photo
            ? `<img src="${p.photo}" alt="Prize photo">`
            : `<div class="photo-ph"><i class="ti ti-camera" style="font-size:20px"></i><span>Tap to add photo</span></div>`}
        </div>

        <div class="det-meta">
          ${p.addedBy ? `Added by ${escHtml(p.addedBy)}` : ''}
          ${p.updatedBy && p.updatedBy !== p.addedBy ? ` · Last edited by ${escHtml(p.updatedBy)}` : ''}
        </div>

        <div class="det-actions">
          ${isAdmin() || p.addedBy === currentUser().displayName
            ? `<button class="btn danger" onclick="doDeletePrize(${p.id})"><i class="ti ti-trash"></i> Delete</button>`
            : ''}
          <button class="btn primary" onclick="doSavePrize(${p.id})"><i class="ti ti-cloud-upload"></i> Save</button>
        </div>
      </div>
    </div>`;
}

function toggleCard(id) {
  const card = document.getElementById('pc-' + id);
  const chev = document.getElementById('chev-' + id);
  const open = card.classList.toggle('expanded');
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0)';
}

async function toggleStage(id, stage, e) {
  e.stopPropagation();
  const p = getPrizes().find(x => x.id === id);
  if (!p) return;
  await updatePrize(id, { [stage]: !p[stage] });
}

async function doSavePrize(id) {
  // Fields already updated in-place via updatePrize calls; this just triggers a full re-save
  const p = getPrizes().find(x => x.id === id);
  if (!p) return;
  setSyncState('syncing');
  await updatePrize(id, {});
  setSyncState('live');
}

async function doDeletePrize(id) {
  if (!confirm('Delete this prize? This cannot be undone.')) return;
  await deletePrize(id);
}

async function handlePhoto(id, input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const compressed = await compressPhoto(e.target.result);
    const area = document.getElementById('pa-' + id);
    if (area) {
      area.classList.add('has-photo');
      area.innerHTML = `<input type="file" accept="image/*" capture="environment" onchange="handlePhoto(${id},this)"><img src="${compressed}" alt="Prize photo">`;
    }
    await updatePrize(id, { photo: compressed });
  };
  reader.readAsDataURL(input.files[0]);
}

// ── Add prize modal ──────────────────────────────────────────────────────────

function openAddPrizeModal() {
  _donorTypeModal = 'author';
  const meta = getMeta();
  showModal(`
    <h3>Add new prize</h3>
    <div class="m-grid">
      <div class="mf full"><label>Prize name / description</label><input type="text" id="mn" placeholder="e.g. Signed copy of…"></div>
      <div class="mf"><label>Category</label><select id="mc">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="mf"><label>Quantity</label><input type="number" id="mq" value="1" min="0"></div>
      <div class="mf"><label>Paid ($)</label><input type="number" id="mpaid" placeholder="0.00" step=".01"></div>
      <div class="mf"><label>Value each ($)</label><input type="number" id="mv" placeholder="0.00" step=".01"></div>
      <div class="mf"><label>Location</label><input type="text" id="ml" list="mll" placeholder="e.g. Nicole's house"><datalist id="mll">${getLocs().map(l => `<option value="${escHtml(l)}">`).join('')}</datalist></div>
      <div class="mf full">
        <label>Donor type</label>
        <div class="donor-toggle">
          <button class="dt-opt active" id="dt-author" onclick="setDonorType('author')">Author</button>
          <button class="dt-opt" id="dt-business" onclick="setDonorType('business')">Business</button>
          <button class="dt-opt" id="dt-none" onclick="setDonorType('none')">Not donated</button>
        </div>
        <div id="dt-author-f"><label>Author</label><select id="mauth"><option value="">— select —</option>${meta.authors.map(a => `<option>${escHtml(a)}</option>`).join('')}</select></div>
        <div id="dt-biz-f" style="display:none"><label>Business name</label><input type="text" id="mbiz" placeholder="e.g. Litograph.com"></div>
      </div>
      <div class="mf full"><label>Notes</label><textarea id="mnotes" rows="2"></textarea></div>
      <div class="mf"><label>Website / QR</label><input type="text" id="murl" placeholder="https://…"></div>
      <div class="mf"><label>Needs tag?</label><select id="mtag"><option value="no">No</option><option value="yes">Yes</option></select></div>
    </div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddPrize()"><i class="ti ti-plus"></i> Add prize</button>
    </div>`);
}

function setDonorType(t) {
  _donorTypeModal = t;
  ['author', 'business', 'none'].forEach(x => {
    const b = document.getElementById('dt-' + x);
    if (b) b.classList.toggle('active', x === t);
  });
  const af = document.getElementById('dt-author-f');
  const bf = document.getElementById('dt-biz-f');
  if (af) af.style.display = t === 'author' ? 'block' : 'none';
  if (bf) bf.style.display = t === 'business' ? 'block' : 'none';
}

async function doAddPrize() {
  const name = (document.getElementById('mn') || {}).value?.trim();
  if (!name) { alert('Please enter a prize name.'); return; }

  const donor = _donorTypeModal === 'author'
    ? (document.getElementById('mauth') || {}).value || ''
    : _donorTypeModal === 'business'
      ? (document.getElementById('mbiz') || {}).value || ''
      : '';

  setSyncState('syncing');
  await addPrize({
    cat: document.getElementById('mc').value,
    name,
    qty: +(document.getElementById('mq').value) || 1,
    paid: +(document.getElementById('mpaid').value) || 0,
    value: +(document.getElementById('mv').value) || 0,
    loc: document.getElementById('ml').value,
    donor,
    donorType: _donorTypeModal,
    notes: document.getElementById('mnotes').value,
    url: document.getElementById('murl').value,
    needTag: document.getElementById('mtag').value === 'yes',
    tagMade: false, tagPrinted: false, tagAttached: false, onTote: false,
    photo: null
  });
  setSyncState('live');
  closeModal();
}
