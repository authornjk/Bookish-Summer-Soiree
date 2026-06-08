function renderPeople() {
  const el = document.getElementById('tab-people');
  if (!el) return;

  const confirmed = S.authors.filter(a => a.status === 'confirmed').length;
  const totalSlots = 25;
  const openSlots = Math.max(0, totalSlots - S.authors.length);

  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="stat-lbl">Authors confirmed</div><div class="stat-val" style="color:var(--purple)">${confirmed}</div><div class="stat-sub">of ${totalSlots} slots</div></div>
      <div class="stat"><div class="stat-lbl">Open slots</div><div class="stat-val" style="color:var(--amber)">${openSlots}</div></div>
      <div class="stat"><div class="stat-lbl">Admin team</div><div class="stat-val">${S.admin.length}</div></div>
      <div class="stat"><div class="stat-lbl">Helpers</div><div class="stat-val">${S.helpers.length}</div></div>
    </div>

    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span>Confirmed / invited authors (${S.authors.length} / ${totalSlots})</span>
        <button class="btn primary" onclick="openAddAuthor()" style="font-size:11px;padding:3px 9px"><i class="ti ti-plus"></i> Add</button>
      </div>
      <div class="person-grid">
        ${S.authors.map(a => {
          const ini = a.name.split(' ').map(x => x[0]).join('').slice(0, 2);
          const sc = { confirmed: 'confirmed', asked: 'pending', maybe: 'pending' }[a.status] || 'pending';
          const sl = { confirmed: 'Confirmed', asked: 'Asked', maybe: 'Maybe' }[a.status] || a.status;
          return `<div class="person-card">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
              <div class="avatar">${escHtml(ini)}</div>
              <div>
                <div style="font-size:13px;font-weight:600">${escHtml(a.name)}</div>
                <div style="font-size:10px;color:var(--text2)">${escHtml(a.role)}</div>
              </div>
            </div>
            <span class="status-pill ${sc}">${sl}</span>
            ${a.note ? `<div style="font-size:10px;color:var(--text3);margin-top:4px">${escHtml(a.note)}</div>` : ''}
          </div>`;
        }).join('')}
        ${Array.from({ length: openSlots }).map((_, i) => `
          <div class="person-card" style="background:var(--bg2);border-style:dashed;display:flex;align-items:center;gap:7px">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--bg);border:0.5px dashed var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="ti ti-user" style="font-size:13px;color:var(--text3)"></i>
            </div>
            <span style="font-size:11px;color:var(--text3)">Open slot ${S.authors.length + i + 1}</span>
          </div>`).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="card">
        <div class="card-title">Admin team</div>
        ${S.admin.map(a => `
          <div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:0.5px solid var(--border)">
            <div class="avatar" style="background:var(--coral-bg);color:var(--coral-text);width:26px;height:26px;font-size:10px">${a.name[0]}</div>
            <div>
              <div style="font-size:13px;font-weight:600">${escHtml(a.name)}</div>
              ${a.note ? `<div style="font-size:10px;color:var(--text3)">${escHtml(a.note)}</div>` : ''}
            </div>
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-title">Helpers (${S.helpers.length})</div>
        ${S.helpers.map(h => `
          <div style="padding:4px 0;border-bottom:0.5px solid var(--border)">
            <div style="font-size:12px;font-weight:600">${escHtml(h.name)}</div>
            ${h.note ? `<div style="font-size:10px;color:var(--text2)">${escHtml(h.note)}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-title">Future author wish list (${S.wishlist.length})</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(195px,1fr));gap:5px">
        ${S.wishlist.map(w => `
          <div class="wish-card">
            <div style="font-size:12px;font-weight:600">${escHtml(w.name)}</div>
            ${w.note ? `<div style="font-size:10px;color:var(--text2)">${escHtml(w.note)}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
}

function openAddAuthor() {
  showModal(`
    <h3>Add author</h3>
    <div class="field"><label>Name</label><input type="text" id="aa-name" placeholder="Author name"></div>
    <div class="field"><label>Status</label>
      <select id="aa-status">
        <option value="confirmed">Confirmed</option>
        <option value="asked">Asked</option>
        <option value="maybe">Maybe</option>
      </select>
    </div>
    <div class="field"><label>Role</label>
      <select id="aa-role">
        <option>Book Signing</option>
        <option>Q&amp;A</option>
        <option>Keynote</option>
      </select>
    </div>
    <div class="field"><label>Note (optional)</label><input type="text" id="aa-note" placeholder="Any notes…"></div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddAuthor()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(() => document.getElementById('aa-name')?.focus(), 50);
}

function doAddAuthor() {
  const name = document.getElementById('aa-name')?.value?.trim();
  if (!name) { alert('Please enter the author\'s name.'); return; }
  S.authors.push({
    id: S.nextId++,
    name,
    status: document.getElementById('aa-status').value,
    role: document.getElementById('aa-role').value,
    note: document.getElementById('aa-note')?.value?.trim() || ''
  });
  saveState(); closeModal(); renderPeople();
}
