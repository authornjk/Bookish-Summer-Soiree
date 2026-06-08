function renderInventory() {
  const el = document.getElementById('tab-inventory');
  if (!el) return;

  const packed = S.inventory.filter(i => i.packed).length;
  const total = S.inventory.length;
  const locs = [...new Set(S.inventory.map(i => i.loc))];

  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="stat-lbl">Total items</div><div class="stat-val">${total}</div></div>
      <div class="stat"><div class="stat-lbl">Packed / done</div><div class="stat-val" style="color:var(--green)">${packed}</div></div>
      <div class="stat"><div class="stat-lbl">Still needed</div><div class="stat-val" style="color:var(--red)">${total - packed}</div></div>
      <div class="stat">
        <div class="stat-lbl">Progress</div>
        <div class="stat-val">${pctStr(packed, total)}</div>
        <div class="prog-bar"><div class="prog-fill" style="width:${pctStr(packed, total)}"></div></div>
      </div>
    </div>

    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      <button class="btn" onclick="S.inventory.forEach(i=>i.packed=false);saveState();renderInventory()"><i class="ti ti-refresh"></i> Reset all</button>
      <button class="btn primary" onclick="openAddInventory()"><i class="ti ti-plus"></i> Add item</button>
    </div>

    ${locs.map(loc => {
      const items = S.inventory.filter(i => i.loc === loc);
      const locClass = loc.includes('Nicole') ? 'loc-nicole' : loc.includes('Alyssa') ? 'loc-alyssa' : 'loc-other';
      return `<div class="card">
        <div class="card-title"><i class="ti ti-map-pin" style="font-size:14px;margin-right:4px"></i>${escHtml(loc)}</div>
        ${items.map(i => `<div class="inv-item ${i.packed ? 'packed' : ''}">
          <input type="checkbox" class="todo-cb" ${i.packed ? 'checked' : ''} onchange="toggleInv(${i.id},this.checked)">
          <span class="loc-pill ${locClass}" style="font-size:9px">${escHtml(loc.replace("'s", ''))}</span>
          <span style="font-size:13px;flex:1">${escHtml(i.item)}</span>
          ${i.note ? `<span style="font-size:10px;color:var(--text3)">${escHtml(i.note)}</span>` : ''}
          <button class="btn" onclick="deleteInv(${i.id})" style="padding:2px 6px;color:var(--text3);flex-shrink:0"><i class="ti ti-x"></i></button>
        </div>`).join('')}
      </div>`;
    }).join('')}`;
}

function toggleInv(id, val) {
  const i = S.inventory.find(x => x.id === id);
  if (i) { i.packed = val; saveState(); renderInventory(); }
}

function deleteInv(id) {
  if (!confirm('Remove this item?')) return;
  S.inventory = S.inventory.filter(x => x.id !== id);
  saveState(); renderInventory();
}

function openAddInventory() {
  const locs = [...new Set(S.inventory.map(i => i.loc))];
  showModal(`
    <h3>Add inventory item</h3>
    <div class="field"><label>Item description</label><input type="text" id="ai-item" placeholder="e.g. Extra extension cord"></div>
    <div class="field"><label>Location</label>
      <select id="ai-loc">
        ${locs.map(l => `<option>${escHtml(l)}</option>`).join('')}
        <option value="Other">Other</option>
      </select>
    </div>
    <div class="field"><label>Note (optional)</label><input type="text" id="ai-note" placeholder="e.g. Garage — black tote"></div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddInventory()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(() => document.getElementById('ai-item')?.focus(), 50);
}

function doAddInventory() {
  const item = document.getElementById('ai-item')?.value?.trim();
  if (!item) { alert('Please enter an item description.'); return; }
  S.inventory.push({
    id: S.nextId++,
    loc: document.getElementById('ai-loc')?.value || 'Other',
    item,
    note: document.getElementById('ai-note')?.value?.trim() || '',
    packed: false
  });
  saveState(); closeModal(); renderInventory();
}
