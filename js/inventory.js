// inventory.js — swipe-to-delete, custom locations, single "Other"

let _invLoc = '';
let _swipedInvId = null;

const BASE_LOCATIONS = ["Nicole's", "Alyssa's", "Other"];

function getLocations() {
  const custom = S.customLocations || [];
  return [...BASE_LOCATIONS.slice(0,2), ...custom, 'Other'];
}

function renderInventory() {
  const el = document.getElementById('tab-inventory');
  if (!el) return;

  const locs = getLocations();
  const items = S.inventory || [];
  const filtered = _invLoc ? items.filter(i=>i.loc===_invLoc) : items;
  const packed = items.filter(i=>i.packed).length;

  el.innerHTML = `
    <div class="card" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:18px;font-weight:700">${packed}/${items.length}</div>
          <div style="font-size:11px;color:var(--text2)">items packed</div>
          <div style="margin-top:6px;height:6px;background:var(--border);border-radius:3px;width:180px;overflow:hidden">
            <div style="height:100%;background:var(--green);width:${items.length>0?Math.round(packed/items.length*100):0}%;border-radius:3px"></div>
          </div>
        </div>
        <button class="btn primary" onclick="openAddInvModal()"><i class="ti ti-plus"></i> Add item</button>
      </div>
    </div>

    <div class="filter-bar">
      <select onchange="_invLoc=this.value;renderInventory()">
        <option value="">All locations</option>
        ${locs.map(l=>`<option value="${escHtml(l)}"${_invLoc===l?' selected':''}>${escHtml(l)}</option>`).join('')}
      </select>
    </div>

    ${locs.map(loc => {
      const locItems = filtered.filter(i=>i.loc===loc);
      if (_invLoc && _invLoc!==loc) return '';
      if (!_invLoc && !locItems.length) return '';
      return `<div class="card">
        <div class="card-title">${escHtml(loc)} <span style="font-size:11px;font-weight:400;color:var(--text3)">${locItems.filter(i=>i.packed).length}/${locItems.length} packed</span></div>
        <div style="display:flex;flex-direction:column;gap:4px">
          ${locItems.map(item => invRowHTML(item)).join('')}
        </div>
      </div>`;
    }).join('')}`;
}

function invRowHTML(item) {
  const isOpen = _swipedInvId === item.id;
  return `<div class="author-swipe-row${isOpen?' open':''}" id="inv-row-${item.id}">
    <div class="author-swipe-content"
      ontouchstart="_authorSwipeX=event.touches[0].clientX"
      ontouchend="invSwipeEnd(event,${item.id})">
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border:.5px solid var(--border);border-radius:var(--radius-sm)">
        <input type="checkbox" ${item.packed?'checked':''} style="width:16px;height:16px;accent-color:var(--green);flex-shrink:0"
          onchange="togglePacked(${item.id},this.checked)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;${item.packed?'text-decoration:line-through;color:var(--text3)':''}">${escHtml(item.item)}</div>
          ${item.note?`<div style="font-size:10px;color:var(--text3)">${escHtml(item.note)}</div>`:''}
        </div>
      </div>
    </div>
    <div class="author-swipe-actions" style="width:80px">
      <button class="author-action" style="background:var(--red)" onclick="deleteInvItem(${item.id})">
        <i class="ti ti-trash"></i><span>Delete</span>
      </button>
    </div>
  </div>`;
}

function togglePacked(id, val) {
  const item = (S.inventory||[]).find(i=>i.id===id);
  if (item) { item.packed = val; saveState(); renderInventory(); }
}

function deleteInvItem(id) {
  if (!confirm('Remove this item?')) return;
  S.inventory = (S.inventory||[]).filter(i=>i.id!==id);
  _swipedInvId = null;
  saveState(); renderInventory();
}

function openAddInvModal() {
  const locs = getLocations();
  showModal(`
    <h3>Add inventory item</h3>
    <div class="field"><label>Item</label>
      <input type="text" id="ai-item" placeholder="What is it?">
    </div>
    <div class="field"><label>Location</label>
      <select id="ai-loc" onchange="toggleCustomLoc(this.value)">
        ${locs.map(l=>`<option>${escHtml(l)}</option>`).join('')}
      </select>
    </div>
    <div class="field" id="ai-custom-field" style="display:none"><label>Custom location name</label>
      <input type="text" id="ai-custom" placeholder="e.g. Jordan's garage">
      <div style="margin-top:6px;display:flex;align-items:center;gap:6px">
        <input type="checkbox" id="ai-save-loc" checked>
        <label for="ai-save-loc" style="font-size:12px">Save this location for future use</label>
      </div>
    </div>
    <div class="field"><label>Note (optional)</label>
      <input type="text" id="ai-note" placeholder="e.g. In the black tote">
    </div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddInvItem()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(()=>document.getElementById('ai-item')?.focus(),50);
}

function toggleCustomLoc(val) {
  document.getElementById('ai-custom-field').style.display = val==='Other' ? 'block' : 'none';
}

function doAddInvItem() {
  const item = document.getElementById('ai-item')?.value?.trim();
  if (!item) { alert('Please enter an item name.'); return; }
  let loc = document.getElementById('ai-loc')?.value || "Nicole's";
  if (loc === 'Other') {
    const custom = document.getElementById('ai-custom')?.value?.trim();
    if (custom) {
      loc = custom;
      const save = document.getElementById('ai-save-loc')?.checked;
      if (save && !S.customLocations.includes(custom)) {
        S.customLocations = S.customLocations || [];
        S.customLocations.push(custom);
      }
    }
  }
  S.inventory.push({
    id: S.nextId++,
    loc,
    item,
    note: document.getElementById('ai-note')?.value?.trim() || '',
    packed: false
  });
  saveState(); closeModal(); renderInventory();
}

function invSwipeEnd(e, id) {
  const dx = e.changedTouches[0].clientX - _authorSwipeX;
  if (dx < -50) _swipedInvId = id;
  else if (dx > 20) _swipedInvId = null;
  renderInventory();
}
