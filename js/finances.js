// finances.js — full rewrite: working edits, vendor comparison, firebase prize sync

// ── Firebase prize sync ───────────────────────────────────────────────────────
// Reads from the same Firebase db as the Prize Manager app.
// Configure PRIZE_DB_URL in storage.js (or here). Falls back to manual if not set.

let _prizesPaidFromDB = null;

async function syncPrizesFromFirebase() {
  const url = window.FIREBASE_DB_URL; // set in storage.js
  if (!url) return;
  try {
    const res = await fetch(url + '/prizes.json');
    if (!res.ok) return;
    const data = await res.json();
    if (!data) { _prizesPaidFromDB = 0; return; }
    const prizes = Object.values(data);
    _prizesPaidFromDB = Math.round(prizes.reduce((s,p) => s + (+p.paid||0), 0)*100)/100;
    // Inject into the prizes expense line
    const prizeExp = S.expenses.find(e => e.id === 'prizes');
    if (prizeExp) {
      prizeExp._dbSpent = _prizesPaidFromDB;
      saveState();
      renderFinances();
    }
  } catch(e) {
    console.warn('Prize sync failed:', e);
  }
}

// ── Math ──────────────────────────────────────────────────────────────────────

function tipAmt(tip, base) {
  if (!tip || !tip.enabled) return 0;
  if (tip.type === 'pct') return Math.round((tip.pct||0)/100 * base * 100)/100;
  return +(tip.fixedAmt||0);
}

// For a vendor-comparison subtable, only the selected vendor's rows count
function activeRows(key) {
  const rows = S[key] || [];
  const hasVendors = rows.some(r => r.vendorId !== undefined);
  if (!hasVendors) return rows;
  const selectedVendor = S[key+'_selectedVendor'] || rows[0]?.vendorId || 0;
  return rows.filter(r => r.vendorId === selectedVendor);
}

function subtableEst(name) {
  if (['tshirts','hats','totes'].includes(name)) {
    return activeRows(name).reduce((s,r) => s + Math.round((+r.price||0)*(+r.qty||0)*100)/100, 0);
  }
  return (S[name]||[]).reduce((s,r) => s + (+r.est||0), 0);
}

function subtableSpent(name) {
  if (['tshirts','hats','totes'].includes(name)) return 0;
  return (S[name]||[]).reduce((s,r) => s + (+r.spent||0), 0);
}

function lineEst(e) {
  let base = 0;
  if (e.type === 'fixed')    base = +(e.fixedAmt||0);
  if (e.type === 'perunit')  base = Math.round((+(e.unitPrice||0))*(+(e.qty||0))*100)/100;
  if (e.type === 'subtable') base = subtableEst(e.subtable);
  return Math.round((base + tipAmt(e.tip, base))*100)/100;
}

function lineSpent(e) {
  if (e.type === 'subtable') return subtableSpent(e.subtable);
  if (e._dbSpent !== undefined) return e._dbSpent; // firebase-synced
  return +(e.spent||0);
}

function calcTotals() {
  const {total, authors, admin} = S.attendance;
  const paying     = Math.max(0, total - authors - admin);
  const totalEst   = Math.round(S.expenses.reduce((s,e) => s + lineEst(e), 0)*100)/100;
  const totalSpent = Math.round(S.expenses.reduce((s,e) => s + lineSpent(e), 0)*100)/100;
  const autoTicket = paying > 0 ? Math.round(totalEst/paying*100)/100 : 0;
  const setTicket  = +(S.ticketPrice||0);
  return {paying, totalEst, totalSpent, autoTicket, setTicket};
}

// ── Direct-reference setters (no eval) ───────────────────────────────────────
// All mutation goes through these — safe and debuggable.

function setExpField(i, field, val) {
  if (S.expenses[i]) { S.expenses[i][field] = val; }
}
function setExpTipField(i, field, val) {
  if (S.expenses[i] && S.expenses[i].tip) { S.expenses[i].tip[field] = val; }
}
function setStField(key, i, field, val) {
  if (S[key] && S[key][i]) { S[key][i][field] = val; }
}

// ── Input renderers ───────────────────────────────────────────────────────────

function moneyInExp(id, val, expIdx, field, style) {
  const v = val != null && val !== '' ? (+val).toFixed(2) : '';
  return `<input type="text" inputmode="decimal" id="${id}" class="ni money-in"
    value="${v}" placeholder="0.00" style="${style||''}"
    onblur="blurMoneyExp(this,${expIdx},'${field}')"
    onkeydown="if(event.key==='Enter')this.blur()">`;
}
function numInExp(id, val, expIdx, field, style) {
  return `<input type="text" inputmode="numeric" id="${id}" class="ni num-in"
    value="${val!=null?val:''}" placeholder="0" style="${style||''}"
    onblur="blurNumExp(this,${expIdx},'${field}')"
    onkeydown="if(event.key==='Enter')this.blur()">`;
}
function moneyInTip(id, val, expIdx, field, style) {
  const v = val != null && val !== '' ? (+val).toFixed(2) : '';
  return `<input type="text" inputmode="decimal" id="${id}" class="ni money-in"
    value="${v}" placeholder="0.00" style="${style||''}"
    onblur="blurMoneyTip(this,${expIdx},'${field}')"
    onkeydown="if(event.key==='Enter')this.blur()">`;
}
function moneyInSt(id, val, key, i, field, style) {
  const v = val != null && val !== '' ? (+val).toFixed(2) : '';
  return `<input type="text" inputmode="decimal" id="${id}" class="ni money-in"
    value="${v}" placeholder="0.00" style="${style||''}"
    onblur="blurMoneySt(this,'${key}',${i},'${field}')"
    onkeydown="if(event.key==='Enter')this.blur()">`;
}
function numInSt(id, val, key, i, field, style) {
  return `<input type="text" inputmode="numeric" id="${id}" class="ni num-in"
    value="${val!=null?val:''}" placeholder="0" style="${style||''}"
    onblur="blurNumSt(this,'${key}',${i},'${field}')"
    onkeydown="if(event.key==='Enter')this.blur()">`;
}

// blur handlers
function blurMoneyExp(el, i, field) {
  const n = Math.round(parseFloat(el.value.replace(/[^0-9.\-]/g,'')||0)*100)/100;
  el.value = isNaN(n) ? '0.00' : n.toFixed(2);
  setExpField(i, field, isNaN(n)?0:n);
  saveState(); renderFinances();
}
function blurNumExp(el, i, field) {
  const n = parseInt(el.value.replace(/[^0-9]/g,''),10)||0;
  el.value = n;
  setExpField(i, field, n);
  saveState(); renderFinances();
}
function blurMoneyTip(el, i, field) {
  const n = Math.round(parseFloat(el.value.replace(/[^0-9.\-]/g,'')||0)*100)/100;
  el.value = isNaN(n) ? '0.00' : n.toFixed(2);
  setExpTipField(i, field, isNaN(n)?0:n);
  saveState(); renderFinances();
}
function blurMoneySt(el, key, i, field) {
  const n = Math.round(parseFloat(el.value.replace(/[^0-9.\-]/g,'')||0)*100)/100;
  el.value = isNaN(n) ? '0.00' : n.toFixed(2);
  setStField(key, i, field, isNaN(n)?0:n);
  saveState(); renderFinances();
}
function blurNumSt(el, key, i, field) {
  const n = parseInt(el.value.replace(/[^0-9]/g,''),10)||0;
  el.value = n;
  setStField(key, i, field, n);
  saveState(); renderFinances();
}

// ── Main render ───────────────────────────────────────────────────────────────

function renderFinances() {
  const el = document.getElementById('tab-finances');
  if (!el) return;

  const {paying, totalEst, totalSpent, autoTicket, setTicket} = calcTotals();
  const {total, authors, admin} = S.attendance;
  const useTicket = setTicket > 0 ? setTicket : autoTicket;
  const revenue   = Math.round(useTicket * paying * 100)/100;
  const surplus   = Math.round((revenue - totalEst)*100)/100;
  const spentDiff = totalSpent > 0 ? Math.round((totalSpent - totalEst)*100)/100 : null;

  // Prize sync status
  const prizeExp = S.expenses.find(e=>e.id==='prizes');
  const prizeDbVal = prizeExp?._dbSpent;
  const prizeSync = window.FIREBASE_DB_URL
    ? (prizeDbVal !== undefined
        ? `<span style="font-size:10px;color:var(--green)">● Live from Prize Manager: ${fmt(prizeDbVal)}</span>`
        : `<span style="font-size:10px;color:var(--amber)">● Syncing prize data…</span>`)
    : `<span style="font-size:10px;color:var(--text3)">Configure Firebase URL in storage.js to sync prizes</span>`;

  el.innerHTML = `
  <div class="card">
    <div class="card-title">Attendance &amp; ticket price</div>
    <div class="att-grid">
      <div class="att-cell">
        <div class="att-lbl">Total attendees</div>
        ${numInExp('att-total', total, -1, '_att_total', 'width:64px;font-size:18px;font-weight:700;text-align:center')}
      </div>
      <div class="att-cell">
        <div class="att-lbl">Authors (free)</div>
        ${numInExp('att-authors', authors, -1, '_att_authors', 'width:64px;font-size:18px;font-weight:700;text-align:center')}
      </div>
      <div class="att-cell">
        <div class="att-lbl">Admin (free)</div>
        ${numInExp('att-admin', admin, -1, '_att_admin', 'width:64px;font-size:18px;font-weight:700;text-align:center')}
      </div>
      <div class="att-cell" style="border:0.5px solid var(--purple);background:var(--purple-bg)">
        <div class="att-lbl" style="color:var(--purple)">Paying tickets</div>
        <div style="font-size:20px;font-weight:700;color:var(--purple-text)">${paying}</div>
      </div>
    </div>
    <div class="att-grid" style="margin-top:8px">
      <div class="att-cell" style="border:0.5px solid var(--purple);background:var(--purple-bg)">
        <div class="att-lbl" style="color:var(--purple)">Ticket price you charge</div>
        ${moneyInExp('ticket-set', S.ticketPrice||'', -1, '_ticketPrice', 'width:80px;font-size:18px;font-weight:700;text-align:center;color:var(--purple-text)')}
      </div>
      <div class="att-cell">
        <div class="att-lbl">Auto-calculated price</div>
        <div style="font-size:18px;font-weight:700">${fmt(autoTicket)}</div>
        <div class="att-sub">costs ÷ ${paying} tickets</div>
      </div>
      <div class="att-cell" style="background:${surplus>=0?'var(--green-bg)':'var(--red-bg)'}">
        <div class="att-lbl" style="color:${surplus>=0?'var(--green-text)':'var(--red-dark)'}">${surplus>=0?'Surplus':'Shortfall'}</div>
        <div style="font-size:18px;font-weight:700;color:${surplus>=0?'var(--green)':'var(--red)'}">${surplus>=0?'+':''}${fmt(surplus)}</div>
        <div class="att-sub">revenue ${fmt(revenue)} − costs ${fmt(totalEst)}</div>
      </div>
      <div class="att-cell" style="background:${spentDiff!==null&&spentDiff>0?'var(--red-bg)':'var(--bg2)'}">
        <div class="att-lbl">Spent so far</div>
        <div style="font-size:18px;font-weight:700;color:${spentDiff!==null&&spentDiff>0?'var(--red)':'var(--text)'}">${fmt(totalSpent)}</div>
        <div class="att-sub" style="color:${spentDiff===null?'var(--text3)':spentDiff>0?'var(--red)':'var(--green)'}">
          ${spentDiff===null?'No actuals yet':spentDiff>0?'+'+fmt(spentDiff)+' over':fmt(Math.abs(spentDiff))+' under'}
        </div>
      </div>
    </div>
  </div>

  <div class="jump-nav">
    <span class="jump-lbl">Jump to:</span>
    <a href="#st-tshirts" class="jump-link">T-shirts</a>
    <a href="#st-hats" class="jump-link">Hats</a>
    <a href="#st-totes" class="jump-link">Totes</a>
    <a href="#st-prizes" class="jump-link">Prizes</a>
    <a href="#st-swag" class="jump-link">Swag</a>
    <a href="#st-decorations" class="jump-link">Decorations</a>
    <a href="#st-misc" class="jump-link">Misc</a>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
      Expenses
      <button class="btn primary" style="font-size:11px;padding:4px 10px" onclick="openAddExpense()">
        <i class="ti ti-plus"></i> Add line
      </button>
    </div>
    <div class="etbl">
      <div class="erow ehdr">
        <div class="ec-move"></div>
        <div class="ec-label">Line item</div>
        <div class="ec-type">Type</div>
        <div class="ec-price">Unit price</div>
        <div class="ec-qty">Qty</div>
        <div class="ec-total">Line total</div>
        <div class="ec-pertix" style="color:var(--purple)">Per ticket</div>
        <div class="ec-spent">Spent</div>
        <div class="ec-diff">+/−</div>
        <div class="ec-act"></div>
      </div>
      ${S.expenses.map((e,i) => expRow(e, i, paying)).join('')}
      <div class="erow etotals">
        <div class="ec-move"></div>
        <div class="ec-label" style="font-weight:600;font-size:13px">Totals</div>
        <div class="ec-type"></div><div class="ec-price"></div><div class="ec-qty"></div>
        <div class="ec-total" style="font-weight:700">${fmt(totalEst)}</div>
        <div class="ec-pertix" style="font-weight:700;color:var(--purple)">${fmt(autoTicket)}</div>
        <div class="ec-spent" style="font-weight:600;color:var(--text2)">${totalSpent>0?fmt(totalSpent):'—'}</div>
        <div class="ec-diff" style="font-weight:600;color:${spentDiff===null?'var(--text3)':spentDiff>0?'var(--red)':'var(--green)'}">
          ${spentDiff===null?'—':(spentDiff>0?'+':'')+fmt(spentDiff)}
        </div>
        <div class="ec-act"></div>
      </div>
    </div>
  </div>

  <!-- Prize sync status -->
  <div style="font-size:11px;color:var(--text2);margin-bottom:10px;padding:0 2px">${prizeSync}</div>

  ${stVendorComparison('tshirts','T-shirts', true)}
  ${stVendorComparison('hats','Hats', false)}
  ${stVendorComparison('totes','Totes', false)}
  ${stEstSpent('prizes','Prizes')}
  ${stEstSpent('swag','Swag bag')}
  ${stEstSpent('decorations','Decorations')}
  ${stEstSpent('misc','Misc expenses', true)}
  `;
}

// Override att/ticket blur handlers since these are special paths
const _origBlurNumExp = blurNumExp;
window.blurNumExp = function(el, i, field) {
  const n = parseInt(el.value.replace(/[^0-9]/g,''),10)||0;
  el.value = n;
  if (field === '_att_total')   { S.attendance.total = n; }
  else if (field === '_att_authors') { S.attendance.authors = n; }
  else if (field === '_att_admin')   { S.attendance.admin = n; }
  else if (i >= 0) { setExpField(i, field, n); }
  saveState(); renderFinances();
};
window.blurMoneyExp = function(el, i, field) {
  const n = Math.round(parseFloat(el.value.replace(/[^0-9.\-]/g,'')||0)*100)/100;
  el.value = isNaN(n) ? '0.00' : n.toFixed(2);
  if (field === '_ticketPrice') { S.ticketPrice = isNaN(n)?0:n; }
  else if (i >= 0) { setExpField(i, field, isNaN(n)?0:n); }
  saveState(); renderFinances();
};

// ── Expense row ───────────────────────────────────────────────────────────────

function expRow(e, i, paying) {
  const est    = lineEst(e);
  const spent  = lineSpent(e);
  const perTix = paying > 0 ? Math.round(est/paying*100)/100 : 0;
  const diff   = spent > 0 ? Math.round((spent-est)*100)/100 : null;
  const diffHtml = diff===null ? '<span style="color:var(--text3)">—</span>'
    : diff>0 ? `<span class="over">+${fmt(diff)}</span>`
    : `<span class="under">${fmt(diff)}</span>`;
  const isSub = e.type==='subtable';

  let priceCell='', qtyCell='';
  if (e.type==='fixed') {
    priceCell = moneyInExp('ef'+i, e.fixedAmt, i, 'fixedAmt');
    qtyCell   = `<span style="color:var(--text3);font-size:12px">—</span>`;
  } else if (e.type==='perunit') {
    priceCell = moneyInExp('eu'+i, e.unitPrice, i, 'unitPrice')
      + (e.unitLabel ? `<div style="font-size:9px;color:var(--text3);text-align:right;margin-top:1px">${escHtml(e.unitLabel)}</div>` : '');
    qtyCell   = numInExp('eq'+i, e.qty, i, 'qty', 'width:52px');
  } else {
    priceCell = `<a href="#st-${e.subtable}" class="jump-link" style="font-size:10px;padding:2px 6px"><i class="ti ti-arrow-down" style="font-size:10px"></i> Go</a>`;
    qtyCell   = '';
  }

  const spentCell = isSub
    ? `<span style="font-size:12px;color:var(--text2)">${spent>0?fmt(spent):'—'}</span>`
    : moneyInExp('es'+i, e.spent, i, 'spent');

  let tipHtml = '';
  if (e.tip && e.tip.enabled) {
    const base = e.type==='fixed' ? +(e.fixedAmt||0) : (+(e.unitPrice||0))*(+(e.qty||0));
    const ta   = tipAmt(e.tip, base);
    const tipInput = e.tip.type==='pct'
      ? numInExp('tp'+i, e.tip.pct, i, '_tip_pct', 'width:32px;text-align:center')
      : moneyInTip('ta'+i, e.tip.fixedAmt, i, 'fixedAmt', 'width:70px');
    tipHtml = `<div class="tip-row">
      <span class="tip-lbl">Tip</span>
      <select class="tip-sel" onchange="setExpTipField(${i},'type',this.value);saveState();renderFinances()">
        <option value="fixed"${e.tip.type==='fixed'?' selected':''}>$</option>
        <option value="pct"${e.tip.type==='pct'?' selected':''}>%</option>
      </select>
      ${tipInput}
      <span class="tip-result">${fmt(ta)}</span>
    </div>`;
  }

  // tip pct needs special path handling
  if (e.tip && e.tip.type==='pct') {
    // override: blurNumExp for tip pct field uses special field name
    tipHtml = tipHtml; // already built above; blurNumExp handles _tip_pct below
  }

  const notesRow = e.expanded
    ? `<div class="enotes-row"><textarea class="notes-area" placeholder="Notes…"
        onblur="setExpField(${i},'notes',this.value);saveState()">${escHtml(e.notes||'')}</textarea></div>`
    : (e.notes ? `<div class="enotes-preview">${escHtml(e.notes)}</div>` : '');

  return `
    <div class="erow-wrap${isSub?' sub-row':''}">
      <div class="erow edata">
        <div class="ec-move">
          ${i>0?`<button class="icon-btn" onclick="moveExp(${i},-1)"><i class="ti ti-chevron-up"></i></button>`:''}
          ${i<S.expenses.length-1?`<button class="icon-btn" onclick="moveExp(${i},1)"><i class="ti ti-chevron-down"></i></button>`:''}
        </div>
        <div class="ec-label">
          <div class="exp-label-text">${escHtml(e.label)}</div>
          ${tipHtml}
        </div>
        <div class="ec-type">
          <span class="type-pill ${e.type==='fixed'?'pill-fixed':e.type==='perunit'?'pill-per':'pill-sub'}">
            ${e.type==='fixed'?'Fixed':e.type==='perunit'?'Per unit':'Detail'}
          </span>
        </div>
        <div class="ec-price">${priceCell}</div>
        <div class="ec-qty">${qtyCell}</div>
        <div class="ec-total" style="font-weight:700">${fmt(est)}</div>
        <div class="ec-pertix" style="color:var(--purple);font-weight:600">${fmt(perTix)}</div>
        <div class="ec-spent">${spentCell}</div>
        <div class="ec-diff">${diffHtml}</div>
        <div class="ec-act">
          <button class="icon-btn" onclick="setExpField(${i},'expanded',!S.expenses[${i}].expanded);saveState();renderFinances()">
            <i class="ti ti-${e.expanded?'chevron-up':'notes'}"></i>
          </button>
          <button class="icon-btn del-btn" onclick="deleteExp(${i})"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      ${notesRow}
    </div>`;
}

// Special blur for tip pct — uses setExpTipField
window.blurNumExp = function(el, i, field) {
  const n = parseInt(el.value.replace(/[^0-9]/g,''),10)||0;
  el.value = n;
  if      (field==='_att_total')   S.attendance.total = n;
  else if (field==='_att_authors') S.attendance.authors = n;
  else if (field==='_att_admin')   S.attendance.admin = n;
  else if (field==='_tip_pct' && i>=0) setExpTipField(i,'pct',n);
  else if (i>=0) setExpField(i, field, n);
  saveState(); renderFinances();
};

function moveExp(i, dir) {
  const j=i+dir;
  if(j<0||j>=S.expenses.length) return;
  [S.expenses[i],S.expenses[j]]=[S.expenses[j],S.expenses[i]];
  saveState(); renderFinances();
}
function deleteExp(i) {
  if(!confirm('Remove this expense line?')) return;
  S.expenses.splice(i,1); saveState(); renderFinances();
}

// ── Vendor comparison subtable (T-shirts, Hats, Totes) ───────────────────────
// Each "vendor" is a group of rows sharing the same vendorId.
// In comparison mode, only the selected vendor's rows feed the budget.
// T-shirts also have a size column.

function stVendorComparison(key, title, hasSizes) {
  const rows = S[key]||[];
  const isCompare = rows.some(r=>r.vendorId!==undefined);
  const vendors = isCompare ? [...new Set(rows.map(r=>r.vendorId))] : [undefined];
  const selectedVendor = S[key+'_selectedVendor'] ?? vendors[0];
  const total = subtableEst(key);
  const {paying} = calcTotals();
  const perTix = paying>0 ? Math.round(total/paying*100)/100 : 0;
  const parent = S.expenses.find(e=>e.type==='subtable'&&e.subtable===key);

  const vendorNames = S[key+'_vendorNames'] || {};

  return `<div class="card" id="st-${key}">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
      <span>${title}
        <span class="sub-badge">Active total: <strong>${fmt(total)}</strong> · <span style="color:var(--purple)">${fmt(perTix)}/ticket</span>${parent?` → <em>${escHtml(parent.label)}</em>`:''}</span>
      </span>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${isCompare ? `
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${vendors.map(vid=>`
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer">
                <input type="radio" name="${key}-vendor" value="${vid}" ${vid===selectedVendor?'checked':''}
                  onchange="selectVendor('${key}',${vid})">
                <input type="text" value="${escHtml(vendorNames[vid]||'Option '+((+vid)+1))}"
                  style="font-size:11px;width:90px;padding:1px 4px;border:0.5px solid var(--border2);border-radius:4px;background:var(--bg);color:var(--text)"
                  onblur="renameVendor('${key}',${vid},this.value)"
                  onkeydown="if(event.key==='Enter')this.blur()">
                ${vid===selectedVendor?'<span style="font-size:10px;color:var(--green);font-weight:600">✓ active</span>':''}
                <button class="icon-btn del-btn" onclick="removeVendor('${key}',${vid})" title="Remove this option"><i class="ti ti-x" style="font-size:11px"></i></button>
              </label>`).join('')}
            <button class="btn" style="font-size:10px;padding:2px 8px" onclick="addVendor('${key}')">
              <i class="ti ti-plus"></i> Add option
            </button>
          </div>` : ''}
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer">
          <input type="checkbox" ${isCompare?'checked':''} onchange="toggleCompare('${key}',this.checked,${hasSizes})">
          Compare options
        </label>
      </div>
    </div>
    ${isCompare ? `<div style="font-size:11px;color:var(--text2);margin-bottom:8px">Select the active option with the radio button — only that option's total feeds into the budget above.</div>` : ''}

    ${isCompare
      ? vendors.map(vid=>{
          const vrows = rows.filter(r=>r.vendorId===vid);
          const vTotal = vrows.reduce((s,r)=>s+Math.round((+r.price||0)*(+r.qty||0)*100)/100,0);
          const isActive = vid===selectedVendor;
          return `
            <div style="margin-bottom:12px;opacity:${isActive?1:0.5};border:${isActive?'1.5px solid var(--green)':'0.5px solid var(--border)'};border-radius:var(--radius-sm);padding:8px">
              <div style="font-size:11px;font-weight:600;color:${isActive?'var(--green)':'var(--text2)'};margin-bottom:6px">
                ${vendorNames[vid]||'Option '+((+vid)+1)} ${isActive?'— ACTIVE':''}
              </div>
              ${stRows(key, vrows.map(r=>rows.indexOf(r)), hasSizes, vid)}
              <div style="text-align:right;font-size:12px;font-weight:600;margin-top:4px;color:${isActive?'var(--green)':'var(--text2)'}">Total: ${fmt(vTotal)}</div>
            </div>`;
        }).join('')
      : stRows(key, rows.map((_,i)=>i), hasSizes, undefined)
    }

    <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:12px">
      <button class="btn" style="font-size:11px;padding:3px 9px"
        onclick="addStRow('${key}',${hasSizes},${isCompare?selectedVendor:'undefined'})">
        <i class="ti ti-plus"></i> Add row
      </button>
      <span style="font-weight:700">Active total: ${fmt(total)}</span>
    </div>
    ${parent?`<div style="font-size:10px;color:var(--text3);margin-top:5px">Feeds into <strong>${escHtml(parent.label)}</strong> line above</div>`:''}
  </div>`;
}

function stRows(key, indices, hasSizes, vendorId) {
  const rows = S[key]||[];
  return `<table class="st-tbl">
    <thead><tr>
      <th style="width:24px"></th>
      ${hasSizes?'<th style="width:70px">Size</th>':''}
      <th style="width:120px">Description</th>
      <th style="text-align:right;width:90px">Price ($)</th>
      <th style="text-align:right;width:70px">Qty</th>
      <th style="text-align:right;width:80px">Total</th>
      <th style="width:28px"></th>
    </tr></thead>
    <tbody>
      ${indices.map(i=>{
        const r = rows[i];
        if(!r) return '';
        return `<tr>
          <td>
            ${i>0?`<button class="icon-btn" onclick="moveStRow('${key}',${i},-1)"><i class="ti ti-chevron-up" style="font-size:11px"></i></button>`:''}
            ${i<rows.length-1?`<button class="icon-btn" onclick="moveStRow('${key}',${i},1)"><i class="ti ti-chevron-down" style="font-size:11px"></i></button>`:''}
          </td>
          ${hasSizes?`<td><input type="text" class="st-text" style="width:60px"
            value="${escHtml(r.size||r.label||'')}"
            onblur="setStField('${key}',${i},'size',this.value);setStField('${key}',${i},'label',this.value);saveState()"
            onkeydown="if(event.key==='Enter')this.blur()"></td>`:''}
          <td><input type="text" class="st-text"
            value="${escHtml(r.desc||r.label||'')}"
            onblur="setStField('${key}',${i},'desc',this.value);setStField('${key}',${i},'label',this.value);saveState()"
            onkeydown="if(event.key==='Enter')this.blur()"></td>
          <td>${moneyInSt('st'+key+i+'p', r.price, key, i, 'price', 'width:78px')}</td>
          <td>${numInSt('st'+key+i+'q', r.qty, key, i, 'qty', 'width:58px;text-align:right')}</td>
          <td style="text-align:right;font-weight:600">${fmt((+r.price||0)*(+r.qty||0))}</td>
          <td><button class="icon-btn del-btn" onclick="delStRow('${key}',${i})"><i class="ti ti-x"></i></button></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function toggleCompare(key, on, hasSizes) {
  if (on) {
    // assign vendorId 0 to all existing rows
    (S[key]||[]).forEach(r => { if(r.vendorId===undefined) r.vendorId=0; });
    S[key+'_selectedVendor'] = 0;
    if (!S[key+'_vendorNames']) S[key+'_vendorNames'] = {0:'Option 1'};
  } else {
    (S[key]||[]).forEach(r => delete r.vendorId);
    delete S[key+'_selectedVendor'];
  }
  saveState(); renderFinances();
}

function selectVendor(key, vid) {
  S[key+'_selectedVendor'] = +vid;
  saveState(); renderFinances();
}

function renameVendor(key, vid, name) {
  if (!S[key+'_vendorNames']) S[key+'_vendorNames'] = {};
  S[key+'_vendorNames'][+vid] = name;
  saveState();
}

function addVendor(key) {
  const rows = S[key]||[];
  const existingIds = [...new Set(rows.map(r=>r.vendorId).filter(v=>v!==undefined))];
  const newId = existingIds.length > 0 ? Math.max(...existingIds)+1 : 1;
  if (!S[key+'_vendorNames']) S[key+'_vendorNames'] = {};
  S[key+'_vendorNames'][newId] = 'Option '+(newId+1);
  // Clone rows from first vendor as a starting template
  const firstVendor = existingIds[0]??0;
  const template = rows.filter(r=>r.vendorId===firstVendor);
  template.forEach(r => S[key].push({...r, vendorId: newId, price:0}));
  saveState(); renderFinances();
}

function removeVendor(key, vid) {
  if (!confirm('Remove this option and all its rows?')) return;
  S[key] = (S[key]||[]).filter(r=>r.vendorId!==+vid);
  if (S[key+'_selectedVendor']===+vid) {
    const remaining = [...new Set((S[key]||[]).map(r=>r.vendorId).filter(v=>v!==undefined))];
    S[key+'_selectedVendor'] = remaining[0]??0;
  }
  saveState(); renderFinances();
}

function moveStRow(key, i, dir) {
  const j=i+dir;
  const rows=S[key]||[];
  if(j<0||j>=rows.length) return;
  [rows[i],rows[j]]=[rows[j],rows[i]];
  saveState(); renderFinances();
}

function delStRow(key,i) { (S[key]||[]).splice(i,1); saveState(); renderFinances(); }

function addStRow(key, hasSizes, vendorId) {
  const newRow = {label:'New', desc:'', price:0, qty:0};
  if (hasSizes) newRow.size = '';
  if (vendorId !== undefined) newRow.vendorId = +vendorId;
  (S[key]||[]).push(newRow);
  saveState(); renderFinances();
  setTimeout(()=>{
    const rows=document.querySelectorAll('#st-'+key+' tbody tr');
    if(rows.length) rows[rows.length-1].querySelector('input')?.focus();
  },60);
}

// ── Est / Spent subtable (prizes, swag, decorations, misc) ───────────────────

function stEstSpent(key, title, showUrl) {
  const rows     = S[key]||[];
  const totEst   = Math.round(rows.reduce((s,r)=>s+(+r.est||0),0)*100)/100;
  const totSpent = Math.round(rows.reduce((s,r)=>s+(+r.spent||0),0)*100)/100;
  const {paying} = calcTotals();
  const perTix   = paying>0 ? Math.round(totEst/paying*100)/100 : 0;
  const parent   = S.expenses.find(e=>e.type==='subtable'&&e.subtable===key);

  // Special: prizes shows Firebase sync note
  const prizeNote = key==='prizes' && window.FIREBASE_DB_URL
    ? `<div style="font-size:10px;color:var(--green);margin-bottom:6px">
        ● Spent total pulled automatically from Prize Manager app
       </div>` : '';

  return `<div class="card" id="st-${key}">
    <div class="card-title">
      ${title}
      <span class="sub-badge">Est: <strong>${fmt(totEst)}</strong> · Spent: <strong>${fmt(totSpent)}</strong> · <span style="color:var(--purple)">${fmt(perTix)}/ticket</span>${parent?` → <em>${escHtml(parent.label)}</em>`:''}</span>
    </div>
    ${prizeNote}
    <table class="st-tbl">
      <thead><tr>
        <th style="width:24px"></th>
        <th>Item</th>
        <th style="text-align:right;width:88px">Est ($)</th>
        <th style="text-align:right;width:88px">Spent ($)</th>
        <th style="text-align:right;width:64px">+/−</th>
        <th>Notes</th>
        ${showUrl?'<th style="width:28px">🔗</th>':''}
        <th style="width:28px"></th>
      </tr></thead>
      <tbody>
        ${rows.map((r,i)=>{
          const diff = r.spent>0 ? Math.round((r.spent-r.est)*100)/100 : null;
          const dh = diff===null?'<span style="color:var(--text3)">—</span>'
            : diff>0?`<span class="over">+${fmt(diff)}</span>`:`<span class="under">${fmt(diff)}</span>`;
          const spentCell = (key==='prizes' && window.FIREBASE_DB_URL)
            ? `<span style="font-size:11px;color:var(--green)">${fmt(r.spent||0)} (auto)</span>`
            : moneyInSt('se'+key+i+'s', r.spent, key, i, 'spent', 'width:78px');
          return `<tr>
            <td>
              ${i>0?`<button class="icon-btn" onclick="moveStRow('${key}',${i},-1)"><i class="ti ti-chevron-up" style="font-size:11px"></i></button>`:''}
              ${i<rows.length-1?`<button class="icon-btn" onclick="moveStRow('${key}',${i},1)"><i class="ti ti-chevron-down" style="font-size:11px"></i></button>`:''}
            </td>
            <td><input type="text" class="st-text" value="${escHtml(r.label||'')}"
              onblur="setStField('${key}',${i},'label',this.value);saveState()"
              onkeydown="if(event.key==='Enter')this.blur()"></td>
            <td>${moneyInSt('se'+key+i+'e', r.est, key, i, 'est', 'width:78px')}</td>
            <td>${spentCell}</td>
            <td style="text-align:right;font-size:11px">${dh}</td>
            <td><input type="text" class="st-text" value="${escHtml(r.notes||'')}" placeholder="Notes…"
              onblur="setStField('${key}',${i},'notes',this.value);saveState()"
              onkeydown="if(event.key==='Enter')this.blur()"></td>
            ${showUrl?`<td style="text-align:center">${r.url?`<a href="${escHtml(r.url)}" target="_blank" rel="noopener" style="color:var(--purple);font-size:14px"><i class="ti ti-external-link"></i></a>`:''}</td>`:''}
            <td><button class="icon-btn del-btn" onclick="delStRow('${key}',${i})"><i class="ti ti-x"></i></button></td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot><tr>
        <td></td>
        <td style="font-weight:600">Total</td>
        <td style="text-align:right;font-weight:700">${fmt(totEst)}</td>
        <td style="text-align:right;font-weight:700">${fmt(totSpent)}</td>
        <td colspan="${showUrl?3:2}"></td>
        <td><button class="icon-btn" onclick="addESRow('${key}')" title="Add item"><i class="ti ti-plus"></i></button></td>
      </tr></tfoot>
    </table>
  </div>`;
}

function addESRow(key) {
  (S[key]||[]).push({label:'New item',est:0,spent:0,notes:'',url:''});
  saveState(); renderFinances();
  setTimeout(()=>{
    const rows=document.querySelectorAll('#st-'+key+' tbody tr');
    if(rows.length) rows[rows.length-1].querySelector('input')?.focus();
  },60);
}

// ── Add expense modal ─────────────────────────────────────────────────────────

function openAddExpense() {
  showModal(`
    <h3>Add expense line</h3>
    <div class="field"><label>Name</label>
      <input type="text" id="ae-label" placeholder="e.g. Photo booth rental">
    </div>
    <div class="field"><label>Price type</label>
      <div style="display:flex;gap:12px;margin-top:4px">
        <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer">
          <input type="radio" name="ae-type" value="fixed" checked onchange="aeType('fixed')"> Fixed total
        </label>
        <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer">
          <input type="radio" name="ae-type" value="perunit" onchange="aeType('perunit')"> Per item / person
        </label>
      </div>
    </div>
    <div id="ae-fixed-f">
      <div class="field"><label>Total amount ($)</label>
        <input type="text" inputmode="decimal" id="ae-fixed" placeholder="0.00" class="ni money-in">
      </div>
    </div>
    <div id="ae-per-f" style="display:none">
      <div class="field"><label>Price per item ($)</label>
        <input type="text" inputmode="decimal" id="ae-unit" placeholder="0.00" class="ni money-in">
      </div>
      <div class="field"><label>Quantity</label>
        <input type="text" inputmode="numeric" id="ae-qty" value="${S.attendance.total}" class="ni num-in">
        <div style="font-size:11px;color:var(--text3);margin-top:3px">Default: ${S.attendance.total} attendees</div>
      </div>
      <div class="field"><label>Unit label (optional)</label>
        <input type="text" id="ae-ulbl" placeholder="e.g. per person">
      </div>
    </div>
    <div class="field"><label>Has a tip?</label>
      <select id="ae-tip" onchange="aeTip(this.value)">
        <option value="none">No tip</option>
        <option value="pct">Yes — percentage</option>
        <option value="fixed">Yes — fixed amount</option>
      </select>
    </div>
    <div id="ae-tip-f" style="display:none">
      <div id="ae-tip-pct-f" class="field"><label>Tip %</label>
        <input type="text" inputmode="numeric" id="ae-tpct" placeholder="15" class="ni num-in">
      </div>
      <div id="ae-tip-amt-f" class="field" style="display:none"><label>Tip ($)</label>
        <input type="text" inputmode="decimal" id="ae-tamt" placeholder="0.00" class="ni money-in">
      </div>
    </div>
    <div class="field"><label>Notes (optional)</label>
      <input type="text" id="ae-notes" placeholder="Any notes…">
    </div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddExpense()"><i class="ti ti-plus"></i> Add line</button>
    </div>`);
  setTimeout(()=>document.getElementById('ae-label')?.focus(),50);
}

function aeType(t) {
  document.getElementById('ae-fixed-f').style.display = t==='fixed'?'block':'none';
  document.getElementById('ae-per-f').style.display   = t==='perunit'?'block':'none';
}
function aeTip(v) {
  document.getElementById('ae-tip-f').style.display      = v!=='none'?'block':'none';
  document.getElementById('ae-tip-pct-f').style.display  = v==='pct'?'block':'none';
  document.getElementById('ae-tip-amt-f').style.display  = v==='fixed'?'block':'none';
}
function parseMoney(id) { return Math.round(parseFloat((document.getElementById(id)?.value||'0').replace(/[^0-9.\-]/g,''))*100)/100||0; }
function parseNum(id)   { return parseInt((document.getElementById(id)?.value||'0').replace(/[^0-9]/g,''),10)||0; }

function doAddExpense() {
  const label = document.getElementById('ae-label')?.value?.trim();
  if(!label){alert('Please enter a name.');return;}
  const typeVal = document.querySelector('input[name="ae-type"]:checked')?.value||'fixed';
  const tipSel  = document.getElementById('ae-tip')?.value||'none';
  const tip = tipSel==='none'?null:{enabled:true,type:tipSel,pct:parseNum('ae-tpct')||15,fixedAmt:parseMoney('ae-tamt')};
  const line = {id:'custom_'+S.nextId++,label,type:typeVal,notes:document.getElementById('ae-notes')?.value?.trim()||'',spent:0,expanded:false};
  if(typeVal==='fixed') line.fixedAmt=parseMoney('ae-fixed');
  else { line.unitPrice=parseMoney('ae-unit'); line.qty=parseNum('ae-qty')||S.attendance.total; line.unitLabel=document.getElementById('ae-ulbl')?.value?.trim()||''; }
  if(tip) line.tip=tip;
  S.expenses.push(line);
  saveState(); closeModal(); renderFinances();
}
