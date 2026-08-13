// finances.js — full expense calculator with merch toggle and swipe-to-delete

function tipAmt(tip, base) {
  if (!tip||!tip.enabled) return 0;
  if (tip.type==='pct') return Math.round((tip.pct||0)/100*base*100)/100;
  return +(tip.fixedAmt||0);
}

function subtableEst(name) {
  const rows = S[name]||[];
  if (['tshirts','hats','totes'].includes(name))
    return rows.reduce((s,r)=>s+Math.round((+r.price||0)*(+r.qty||0)*100)/100,0);
  return rows.reduce((s,r)=>s+(+r.est||0),0);
}

function subtableSpent(name) {
  if (['tshirts','hats','totes'].includes(name)) return 0;
  return (S[name]||[]).reduce((s,r)=>s+(+r.spent||0),0);
}

function lineEst(e) {
  if (e.type==='subtable') {
    // Skip inactive merch
    if (e.subtable==='tshirts' && S.merchType!=='tshirts') return 0;
    if (e.subtable==='hats'    && S.merchType!=='hats')    return 0;
  }
  let base=0;
  if (e.type==='fixed')    base=+(e.fixedAmt||0);
  if (e.type==='perunit')  base=Math.round((+(e.unitPrice||0))*(+(e.qty||0))*100)/100;
  if (e.type==='subtable') base=subtableEst(e.subtable);
  return Math.round((base+tipAmt(e.tip,base))*100)/100;
}

function lineSpent(e) {
  if (e.type==='subtable') return subtableSpent(e.subtable);
  return +(e.spent||0);
}

function calcTotals() {
  const {total,authors,admin}=S.attendance;
  const paying=Math.max(0,total-authors-admin);
  const totalEst=Math.round(S.expenses.reduce((s,e)=>s+lineEst(e),0)*100)/100;
  const totalSpent=Math.round(S.expenses.reduce((s,e)=>s+lineSpent(e),0)*100)/100;
  const autoTicket=paying>0?Math.round(totalEst/paying*100)/100:0;
  return {paying,totalEst,totalSpent,autoTicket};
}

function moneyInExp(id,val,i,field,style) {
  const v=val!=null&&val!==''?(+val).toFixed(2):'';
  return `<input type="text" inputmode="decimal" id="${id}" class="ni money-in" value="${v}" placeholder="0.00" style="${style||''}"
    onblur="blurMoneyExp(this,${i},'${field}')" onkeydown="if(event.key==='Enter')this.blur()">`;
}
function numInExp(id,val,i,field,style) {
  return `<input type="text" inputmode="numeric" id="${id}" class="ni num-in" value="${val!=null?val:''}" placeholder="0" style="${style||''}"
    onblur="blurNumExp(this,${i},'${field}')" onkeydown="if(event.key==='Enter')this.blur()">`;
}
function moneyInSt(id,val,key,i,field,style) {
  const v=val!=null&&val!==''?(+val).toFixed(2):'';
  return `<input type="text" inputmode="decimal" id="${id}" class="ni money-in" value="${v}" placeholder="0.00" style="${style||''}"
    onblur="blurMoneySt(this,'${key}',${i},'${field}')" onkeydown="if(event.key==='Enter')this.blur()">`;
}
function numInSt(id,val,key,i,field,style) {
  return `<input type="text" inputmode="numeric" id="${id}" class="ni num-in" value="${val!=null?val:''}" placeholder="0" style="${style||''}"
    onblur="blurNumSt(this,'${key}',${i},'${field}')" onkeydown="if(event.key==='Enter')this.blur()">`;
}

function blurMoneyExp(el,i,field) {
  const n=Math.round(parseFloat(el.value.replace(/[^0-9.\-]/g,'')||0)*100)/100;
  el.value=isNaN(n)?'0.00':n.toFixed(2);
  if(field==='_ticketPrice'){S.ticketPrice=isNaN(n)?0:n;}
  else if(field==='_att_total'){S.attendance.total=Math.round(n)||0;}
  else if(i>=0&&S.expenses[i]){S.expenses[i][field]=isNaN(n)?0:n;}
  saveState();renderFinances();
}
function blurNumExp(el,i,field) {
  const n=parseInt(el.value.replace(/[^0-9]/g,''),10)||0;
  el.value=n;
  if(field==='_att_total')   S.attendance.total=n;
  else if(field==='_att_authors') S.attendance.authors=n;
  else if(field==='_att_admin')   S.attendance.admin=n;
  else if(field==='_tip_pct'&&i>=0&&S.expenses[i]?.tip) S.expenses[i].tip.pct=n;
  else if(i>=0&&S.expenses[i]) S.expenses[i][field]=n;
  saveState();renderFinances();
}
function blurMoneyTip(el,i,field) {
  const n=Math.round(parseFloat(el.value.replace(/[^0-9.\-]/g,'')||0)*100)/100;
  el.value=isNaN(n)?'0.00':n.toFixed(2);
  if(S.expenses[i]?.tip) S.expenses[i].tip[field]=isNaN(n)?0:n;
  saveState();renderFinances();
}
function blurMoneySt(el,key,i,field) {
  const n=Math.round(parseFloat(el.value.replace(/[^0-9.\-]/g,'')||0)*100)/100;
  el.value=isNaN(n)?'0.00':n.toFixed(2);
  if(S[key]&&S[key][i]) S[key][i][field]=isNaN(n)?0:n;
  saveState();renderFinances();
}
function blurNumSt(el,key,i,field) {
  const n=parseInt(el.value.replace(/[^0-9]/g,''),10)||0;
  el.value=n;
  if(S[key]&&S[key][i]) S[key][i][field]=n;
  saveState();renderFinances();
}

function renderFinances() {
  const el=document.getElementById('tab-finances');
  if(!el) return;
  const {paying,totalEst,totalSpent,autoTicket}=calcTotals();
  const {total,authors,admin}=S.attendance;
  const setTicket=+(S.ticketPrice||0);
  const useTicket=setTicket>0?setTicket:autoTicket;
  const revenue=Math.round(useTicket*paying*100)/100;
  const surplus=Math.round((revenue-totalEst)*100)/100;
  const spentDiff=totalSpent>0?Math.round((totalSpent-totalEst)*100)/100:null;

  el.innerHTML=`
  <div class="card">
    <div class="card-title">Attendance &amp; ticket price</div>
    <div class="att-grid">
      <div class="att-cell"><div class="att-lbl">Total attendees</div>
        ${numInExp('att-total',total,-1,'_att_total','width:64px;font-size:18px;font-weight:700;text-align:center')}</div>
      <div class="att-cell"><div class="att-lbl">Authors (free)</div>
        ${numInExp('att-authors',authors,-1,'_att_authors','width:64px;font-size:18px;font-weight:700;text-align:center')}</div>
      <div class="att-cell"><div class="att-lbl">Admin (free)</div>
        ${numInExp('att-admin',admin,-1,'_att_admin','width:64px;font-size:18px;font-weight:700;text-align:center')}</div>
      <div class="att-cell" style="border:.5px solid var(--purple);background:var(--purple-bg)">
        <div class="att-lbl" style="color:var(--purple)">Paying tickets</div>
        <div style="font-size:20px;font-weight:700;color:var(--purple-text)">${paying}</div>
      </div>
    </div>
    <div class="att-grid" style="margin-top:8px">
      <div class="att-cell" style="border:.5px solid var(--purple);background:var(--purple-bg)">
        <div class="att-lbl" style="color:var(--purple)">Ticket price you charge</div>
        ${moneyInExp('ticket-set',S.ticketPrice||'',-1,'_ticketPrice','width:80px;font-size:18px;font-weight:700;text-align:center;color:var(--purple-text)')}
      </div>
      <div class="att-cell"><div class="att-lbl">Auto-calculated</div>
        <div style="font-size:18px;font-weight:700">${fmt(autoTicket)}</div>
        <div class="att-sub">costs ÷ ${paying} tickets</div>
      </div>
      <div class="att-cell" style="background:${surplus>=0?'var(--green-bg)':'var(--red-bg)'}">
        <div class="att-lbl" style="color:${surplus>=0?'var(--green-text)':'var(--red-dark)'}">${surplus>=0?'Surplus':'Shortfall'}</div>
        <div style="font-size:18px;font-weight:700;color:${surplus>=0?'var(--green)':'var(--red)'}">${surplus>=0?'+':''}${fmt(surplus)}</div>
        <div class="att-sub">revenue ${fmt(revenue)} − costs ${fmt(totalEst)}</div>
      </div>
      <div class="att-cell">
        <div class="att-lbl">Spent so far</div>
        <div style="font-size:18px;font-weight:700">${fmt(totalSpent)}</div>
        <div class="att-sub" style="color:${spentDiff===null?'var(--text3)':spentDiff>0?'var(--red)':'var(--green)'}">
          ${spentDiff===null?'No actuals yet':spentDiff>0?'+'+fmt(spentDiff)+' over':fmt(Math.abs(spentDiff))+' under'}
        </div>
      </div>
    </div>
  </div>

  <!-- Merch toggle -->
  <div class="card" style="padding:10px 14px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-size:13px;font-weight:500">Merch this year:</span>
      <button class="btn${S.merchType==='hats'?' purple':''}" onclick="S.merchType='hats';saveState();renderFinances()">
        <i class="ti ti-cap"></i> Hats
      </button>
      <button class="btn${S.merchType==='tshirts'?' purple':''}" onclick="S.merchType='tshirts';saveState();renderFinances()">
        <i class="ti ti-shirt"></i> T-shirts
      </button>
      <span style="font-size:11px;color:var(--text2)">Only the selected type feeds into the budget</span>
    </div>
  </div>

  <!-- Jump nav -->
  <div class="jump-nav">
    <span class="jump-lbl">Jump to:</span>
    ${S.merchType==='tshirts'?'<a href="#st-tshirts" class="jump-link">T-shirts</a>':'<a href="#st-hats" class="jump-link">Hats</a>'}
    <a href="#st-totes" class="jump-link">Totes</a>
    <a href="#st-prizes" class="jump-link">Prizes</a>
    <a href="#st-swag" class="jump-link">Swag</a>
    <a href="#st-decorations" class="jump-link">Decorations</a>
    <a href="#st-misc" class="jump-link">Misc</a>
  </div>

  <!-- Expense table -->
  <div class="card">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
      Expenses
      <button class="btn primary" style="font-size:11px;padding:4px 10px" onclick="openAddExpense()">
        <i class="ti ti-plus"></i> Add line
      </button>
    </div>
    <div class="etbl">
      <div class="erow ehdr">
        <div class="ec-move"></div><div class="ec-label">Line item</div>
        <div class="ec-type">Type</div><div class="ec-price">Unit price</div>
        <div class="ec-qty">Qty</div><div class="ec-total">Total</div>
        <div class="ec-pertix" style="color:var(--purple)">Per ticket</div>
        <div class="ec-spent">Spent</div><div class="ec-diff">+/−</div>
        <div class="ec-act"></div>
      </div>
      ${S.expenses.map((e,i)=>expRow(e,i,paying)).join('')}
      <div class="erow etotals">
        <div class="ec-move"></div>
        <div class="ec-label" style="font-weight:600;grid-column:2/6">Totals</div>
        <div class="ec-total" style="font-weight:700">${fmt(totalEst)}</div>
        <div class="ec-pertix" style="font-weight:700;color:var(--purple)">${fmt(autoTicket)}</div>
        <div class="ec-spent" style="font-weight:600;color:var(--text2)">${totalSpent>0?fmt(totalSpent):'—'}</div>
        <div class="ec-diff" style="font-weight:600;color:${spentDiff===null?'var(--text3)':spentDiff>0?'var(--red)':'var(--green)'}">
          ${spentDiff===null?'—':(spentDiff>0?'+':'')+fmt(spentDiff)}
        </div>
        <div class="ec-act"></div>
      </div>
      <!-- Mobile totals row -->
      <div class="etotals">
        <span style="font-weight:600">Total: ${fmt(totalEst)}</span>
        <span style="color:var(--purple);font-weight:600">${fmt(autoTicket)}/ticket</span>
        <span style="color:var(--text2)">Spent: ${totalSpent>0?fmt(totalSpent):'—'}</span>
        ${spentDiff!==null?`<span style="color:${spentDiff>0?'var(--red)':'var(--green);font-weight:600'}">${spentDiff>0?'+':''} ${fmt(spentDiff)}</span>`:''}
      </div>
    </div>
  </div>

  <!-- Subtables -->
  ${S.merchType==='tshirts' ? stPriceQty('tshirts','T-shirts') : stPriceQty('hats','Hats')}
  ${stPriceQty('totes','Totes')}
  ${stEstSpent('prizes','Prizes')}
  ${stEstSpent('swag','Swag bag')}
  ${stEstSpent('decorations','Decorations')}
  ${stEstSpent('misc','Misc expenses',true)}
  `;
}

function expRow(e,i,paying) {
  // Skip inactive merch lines
  if (e.type==='subtable' && e.subtable==='tshirts' && S.merchType!=='tshirts') return '';
  if (e.type==='subtable' && e.subtable==='hats'    && S.merchType!=='hats')    return '';

  const est=lineEst(e), spent=lineSpent(e);
  const perTix=paying>0?Math.round(est/paying*100)/100:0;
  const diff=spent>0?Math.round((spent-est)*100)/100:null;
  const diffHtml=diff===null?'<span style="color:var(--text3)">—</span>'
    :diff>0?`<span class="over">+${fmt(diff)}</span>`:`<span class="under">${fmt(diff)}</span>`;
  const isSub=e.type==='subtable';
  const isOpen = _swipedExpIdx === i;

  // Tip on same line as label
  let tipHtml='';
  if(e.tip&&e.tip.enabled){
    const base=e.type==='fixed'?+(e.fixedAmt||0):(+(e.unitPrice||0))*(+(e.qty||0));
    const ta=tipAmt(e.tip,base);
    tipHtml=`<span class="exp-tip-badge">+ ${fmt(ta)} tip</span>`;
  }

  // Sub-label: show price info compactly
  let subLabel='';
  if(e.type==='fixed')    subLabel=`${fmt(e.fixedAmt||0)} fixed`;
  if(e.type==='perunit')  subLabel=`${fmt(e.unitPrice||0)} × ${e.qty||0}${e.unitLabel?' ('+e.unitLabel+')':''}`;
  if(e.type==='subtable') subLabel=''; // no label needed — total speaks for itself

  const notesRow=e.expanded
    ?`<div class="enotes-row"><textarea class="notes-area" placeholder="Notes…"
        onblur="if(S.expenses[${i}])S.expenses[${i}].notes=this.value;saveState()">${escHtml(e.notes||'')}</textarea></div>`
    :(e.notes?`<div class="enotes-preview">${escHtml(e.notes)}</div>`:'');

  // Inline editable price/qty cells — tap to edit in place
  const priceCell = e.type==='fixed'
    ? moneyInExp('ef'+i, e.fixedAmt, i, 'fixedAmt', 'width:70px;font-size:11px;text-align:right')
    : e.type==='perunit'
    ? moneyInExp('eu'+i, e.unitPrice, i, 'unitPrice', 'width:70px;font-size:11px;text-align:right')
    : `<span style="font-size:11px;color:var(--text3)">—</span>`;

  const qtyCell = e.type==='perunit'
    ? numInExp('eq'+i, e.qty, i, 'qty', 'width:44px;font-size:11px;text-align:right')
    : `<span style="font-size:11px;color:var(--text3)">—</span>`;

  return `<div class="exp-swipe-row${isOpen?' open':''}" id="exp-row-${i}">
    <div class="exp-swipe-content"
      ontouchstart="expSwipeStart(event,${i})"
      ontouchend="expSwipeEnd(event,${i})">
      <div class="exp-mobile-row${isSub?' sub-row':''}">
        <div class="exp-mobile-reorder">
          ${i>0?`<button class="icon-btn" onclick="moveExp(${i},-1)"><i class="ti ti-chevron-up" style="font-size:10px"></i></button>`:''}
          ${i<S.expenses.length-1?`<button class="icon-btn" onclick="moveExp(${i},1)"><i class="ti ti-chevron-down" style="font-size:10px"></i></button>`:''}
        </div>
        <div class="exp-mobile-label">
          <div style="font-size:13px;font-weight:500">${escHtml(e.label)}${tipHtml}</div>
          ${e.notes?`<div class="enotes-preview" style="font-size:9px">${escHtml(e.notes)}</div>`:''}
        </div>
        <div class="exp-cell-price">${priceCell}</div>
        <div class="exp-cell-qty">${qtyCell}</div>
        <div class="exp-cell-total">
          <div style="font-size:11px;color:var(--text)">${fmt(est)}</div>
          <div style="font-size:9px;color:var(--purple)">${fmt(perTix)}/tix</div>
        </div>
        <div class="exp-cell-spent">
          ${isSub
            ?`<div style="font-size:11px;color:var(--text2)">${spent>0?fmt(spent):'—'}</div>`
            :moneyInExp('es'+i,e.spent,i,'spent','width:68px;font-size:11px;text-align:right')}
          ${diff!==null?`<div style="font-size:9px;margin-top:1px">${diffHtml}</div>`:''}
        </div>
      </div>
    </div>
    <div class="exp-swipe-actions">
      <button class="exp-action-edit" onclick="openEditExpense(${i})"><i class="ti ti-pencil"></i><span>Edit</span></button>
      <button class="exp-action-delete" onclick="deleteExp(${i})"><i class="ti ti-trash"></i><span>Delete</span></button>
    </div>
  </div>`;
}

function moveExp(i,dir){const j=i+dir;if(j<0||j>=S.expenses.length)return;[S.expenses[i],S.expenses[j]]=[S.expenses[j],S.expenses[i]];saveState();renderFinances();}
function deleteExp(i){if(!confirm('Remove this line?'))return;S.expenses.splice(i,1);saveState();renderFinances();}

function stPriceQty(key,title) {
  const rows=S[key]||[];
  const total=subtableEst(key);
  const {paying}=calcTotals();
  const perTix=paying>0?Math.round(total/paying*100)/100:0;
  const parent=S.expenses.find(e=>e.type==='subtable'&&e.subtable===key);
  return `<div class="card" id="st-${key}">
    <div class="card-title">${title}
      <span class="sub-badge">Total: <strong>${fmt(total)}</strong> · <span style="color:var(--purple)">${fmt(perTix)}/ticket</span>${parent?` → <em>${escHtml(parent.label)}</em>`:''}</span>
    </div>
    <table class="st-tbl">
      <thead><tr><th>Size/style</th><th style="text-align:right">Price ($)</th><th style="text-align:right">Qty</th><th style="text-align:right">Total</th><th></th></tr></thead>
      <tbody>
        ${rows.map((r,i)=>`<tr>
          <td><input type="text" class="st-text" value="${escHtml(r.label||r.size||'')}"
            onblur="if(S.${key}[${i}]){S.${key}[${i}].label=this.value;S.${key}[${i}].size=this.value;}saveState()"
            onkeydown="if(event.key==='Enter')this.blur()"></td>
          <td>${moneyInSt('st'+key+i+'p',r.price,key,i,'price','width:78px')}</td>
          <td>${numInSt('st'+key+i+'q',r.qty,key,i,'qty','width:58px;text-align:right')}</td>
          <td style="text-align:right;font-weight:600">${fmt((+r.price||0)*(+r.qty||0))}</td>
          <td><button class="icon-btn del-btn" onclick="delStRow('${key}',${i})"><i class="ti ti-x"></i></button></td>
        </tr>`).join('')}
      </tbody>
      <tfoot><tr>
        <td colspan="3" style="font-weight:600">Total</td>
        <td style="text-align:right;font-weight:700">${fmt(total)}</td>
        <td><button class="icon-btn" onclick="addPQRow('${key}')"><i class="ti ti-plus"></i></button></td>
      </tr></tfoot>
    </table>
  </div>`;
}

function stEstSpent(key,title,showUrl) {
  const rows=S[key]||[];
  const totEst=rows.reduce((s,r)=>s+(+r.est||0),0);
  const totSpent=rows.reduce((s,r)=>s+(+r.spent||0),0);
  const {paying}=calcTotals();
  const perTix=paying>0?Math.round(totEst/paying*100)/100:0;
  const parent=S.expenses.find(e=>e.type==='subtable'&&e.subtable===key);
  return `<div class="card" id="st-${key}">
    <div class="card-title">${title}
      <span class="sub-badge">Est: <strong>${fmt(totEst)}</strong> · Spent: <strong>${fmt(totSpent)}</strong> · <span style="color:var(--purple)">${fmt(perTix)}/ticket</span>${parent?` → <em>${escHtml(parent.label)}</em>`:''}</span>
    </div>
    <table class="st-tbl">
      <thead><tr><th>Item</th><th style="text-align:right">Est ($)</th><th style="text-align:right">Spent ($)</th><th style="text-align:right">+/−</th><th>Notes</th>${showUrl?'<th>🔗</th>':''}<th></th></tr></thead>
      <tbody>
        ${rows.map((r,i)=>{
          const diff=r.spent>0?Math.round((r.spent-r.est)*100)/100:null;
          const dh=diff===null?'<span style="color:var(--text3)">—</span>':diff>0?`<span class="over">+${fmt(diff)}</span>`:`<span class="under">${fmt(diff)}</span>`;
          return `<tr>
            <td><input type="text" class="st-text" value="${escHtml(r.label||'')}"
              onblur="if(S.${key}[${i}])S.${key}[${i}].label=this.value;saveState()"
              onkeydown="if(event.key==='Enter')this.blur()"></td>
            <td>${moneyInSt('se'+key+i+'e',r.est,key,i,'est','width:78px')}</td>
            <td>${moneyInSt('se'+key+i+'s',r.spent,key,i,'spent','width:78px')}</td>
            <td style="text-align:right;font-size:11px">${dh}</td>
            <td><input type="text" class="st-text" value="${escHtml(r.notes||'')}" placeholder="Notes…"
              onblur="if(S.${key}[${i}])S.${key}[${i}].notes=this.value;saveState()"
              onkeydown="if(event.key==='Enter')this.blur()"></td>
            ${showUrl?`<td style="text-align:center">${r.url?`<a href="${escHtml(r.url)}" target="_blank" rel="noopener" style="color:var(--purple);font-size:14px"><i class="ti ti-external-link"></i></a>`:''}</td>`:''}
            <td><button class="icon-btn del-btn" onclick="delStRow('${key}',${i})"><i class="ti ti-x"></i></button></td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot><tr>
        <td style="font-weight:600">Total</td>
        <td style="text-align:right;font-weight:700">${fmt(totEst)}</td>
        <td style="text-align:right;font-weight:700">${fmt(totSpent)}</td>
        <td colspan="${showUrl?3:2}"></td>
        <td><button class="icon-btn" onclick="addESRow('${key}')"><i class="ti ti-plus"></i></button></td>
      </tr></tfoot>
    </table>
  </div>`;
}

function delStRow(key,i){if(S[key])S[key].splice(i,1);saveState();renderFinances();}
function addPQRow(key){if(S[key])S[key].push({label:'New',size:'',price:0,qty:0,notes:''});saveState();renderFinances();}
function addESRow(key){if(S[key])S[key].push({label:'New item',est:0,spent:0,notes:'',url:''});saveState();renderFinances();}

function openAddExpense() {
  showModal(`
    <h3>Add expense line</h3>
    <div class="field"><label>Name</label><input type="text" id="ae-label" placeholder="e.g. Photo booth"></div>
    <div class="field"><label>Price type</label>
      <div style="display:flex;gap:12px;margin-top:4px">
        <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer"><input type="radio" name="ae-type" value="fixed" checked onchange="aeType('fixed')"> Fixed total</label>
        <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer"><input type="radio" name="ae-type" value="perunit" onchange="aeType('perunit')"> Per item</label>
      </div>
    </div>
    <div id="ae-fixed-f"><div class="field"><label>Total ($)</label><input type="text" inputmode="decimal" id="ae-fixed" placeholder="0.00" class="ni money-in"></div></div>
    <div id="ae-per-f" style="display:none">
      <div class="field"><label>Price per item ($)</label><input type="text" inputmode="decimal" id="ae-unit" placeholder="0.00" class="ni money-in"></div>
      <div class="field"><label>Quantity</label><input type="text" inputmode="numeric" id="ae-qty" value="${S.attendance.total}" class="ni num-in"></div>
      <div class="field"><label>Unit label</label><input type="text" id="ae-ulbl" placeholder="e.g. per person"></div>
    </div>
    <div class="field"><label>Notes</label><input type="text" id="ae-notes" placeholder="Optional…"></div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddExpense()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(()=>document.getElementById('ae-label')?.focus(),50);
}
function aeType(t){document.getElementById('ae-fixed-f').style.display=t==='fixed'?'block':'none';document.getElementById('ae-per-f').style.display=t==='perunit'?'block':'none';}
function parseMoney(id){return Math.round(parseFloat((document.getElementById(id)?.value||'0').replace(/[^0-9.\-]/g,''))*100)/100||0;}
function parseNum(id){return parseInt((document.getElementById(id)?.value||'0').replace(/[^0-9]/g,''),10)||0;}
function doAddExpense(){
  const label=document.getElementById('ae-label')?.value?.trim();
  if(!label){alert('Please enter a name.');return;}
  const t=document.querySelector('input[name="ae-type"]:checked')?.value||'fixed';
  const line={id:'custom_'+S.nextId++,label,type:t,notes:document.getElementById('ae-notes')?.value?.trim()||'',spent:0,expanded:false};
  if(t==='fixed') line.fixedAmt=parseMoney('ae-fixed');
  else{line.unitPrice=parseMoney('ae-unit');line.qty=parseNum('ae-qty')||S.attendance.total;line.unitLabel=document.getElementById('ae-ulbl')?.value?.trim()||'';}
  S.expenses.push(line);saveState();closeModal();renderFinances();
}

function expSwipeStart(e,i){ _expSwipeX = e.touches[0].clientX; }
function expSwipeEnd(e,i){
  const dx = e.changedTouches[0].clientX - _expSwipeX;
  if(dx < -50) _swipedExpIdx = i;
  else if(dx > 20) _swipedExpIdx = null;
  renderFinances();
}

function openEditExpense(i) {
  _swipedExpIdx = null;
  const e = S.expenses[i];
  if(!e) return;
  const isFixed  = e.type==='fixed';
  const isPerUnit= e.type==='perunit';
  const isSub    = e.type==='subtable';
  showModal(`
    <h3>Edit: ${escHtml(e.label)}</h3>
    <div class="field"><label>Name</label>
      <input type="text" id="ee-label" value="${escHtml(e.label)}"></div>
    ${isFixed?`<div class="field"><label>Total amount ($)</label>
      <input type="text" inputmode="decimal" id="ee-fixed" value="${(+(e.fixedAmt||0)).toFixed(2)}" class="ni money-in" style="width:100%"></div>`:''}
    ${isPerUnit?`
    <div class="field"><label>Price per item ($)</label>
      <input type="text" inputmode="decimal" id="ee-unit" value="${(+(e.unitPrice||0)).toFixed(2)}" class="ni money-in" style="width:100%"></div>
    <div class="field"><label>Quantity</label>
      <input type="text" inputmode="numeric" id="ee-qty" value="${e.qty||0}" class="ni num-in" style="width:100%"></div>
    <div class="field"><label>Unit label</label>
      <input type="text" id="ee-ulbl" value="${escHtml(e.unitLabel||'')}"></div>`:''}
    ${isSub?`<div style="font-size:12px;color:var(--text2);margin-bottom:10px">This line pulls its total from the <strong>${escHtml(e.subtable)}</strong> table below. Edit the rows in that table to change the total.</div>`:''}
    ${e.tip&&e.tip.enabled?`
    <div class="field"><label>Tip type</label>
      <select id="ee-tiptype">
        <option value="fixed"${e.tip.type==='fixed'?' selected':''}>Fixed $</option>
        <option value="pct"${e.tip.type==='pct'?' selected':''}>Percentage %</option>
      </select></div>
    <div class="field"><label>Tip amount</label>
      <input type="text" inputmode="decimal" id="ee-tipamt" value="${e.tip.type==='pct'?e.tip.pct:(+(e.tip.fixedAmt||0)).toFixed(2)}"></div>`:''}
    <div class="field"><label>Notes</label>
      <input type="text" id="ee-notes" value="${escHtml(e.notes||'')}"></div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doEditExpense(${i})"><i class="ti ti-check"></i> Save</button>
    </div>`);
  setTimeout(()=>document.getElementById('ee-label')?.focus(),50);
}

function doEditExpense(i) {
  const e = S.expenses[i];
  if(!e) return;
  e.label = document.getElementById('ee-label')?.value?.trim() || e.label;
  e.notes = document.getElementById('ee-notes')?.value?.trim() || '';
  if(e.type==='fixed') {
    e.fixedAmt = parseFloat(document.getElementById('ee-fixed')?.value||0) || 0;
  } else if(e.type==='perunit') {
    e.unitPrice = parseFloat(document.getElementById('ee-unit')?.value||0) || 0;
    e.qty = parseInt(document.getElementById('ee-qty')?.value||0,10) || 0;
    e.unitLabel = document.getElementById('ee-ulbl')?.value?.trim() || '';
  }
  if(e.tip && e.tip.enabled) {
    e.tip.type = document.getElementById('ee-tiptype')?.value || e.tip.type;
    const tipVal = parseFloat(document.getElementById('ee-tipamt')?.value||0) || 0;
    if(e.tip.type==='pct') e.tip.pct = tipVal;
    else e.tip.fixedAmt = tipVal;
  }
  saveState(); closeModal(); renderFinances();
}
