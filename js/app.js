// app.js — Event HQ shell
let _activeTab = 'finances';

function renderShell() {
  const todoDone  = (S.todos||[]).filter(t=>t.done).length;
  const todoTotal = (S.todos||[]).length;
  const packed    = (S.inventory||[]).filter(i=>i.packed).length;
  const invTotal  = (S.inventory||[]).length;

  document.getElementById('root').innerHTML = `
    <div class="shell">
      <div class="top-bar">
        <div>
          <div class="app-title">Bookish Summer Soirée 2027</div>
          <div class="app-sub">Event HQ — Nicole only</div>
        </div>
        <div style="font-size:11px;color:var(--text2);text-align:right">
          ${todoDone}/${todoTotal} tasks &nbsp;·&nbsp; ${packed}/${invTotal} packed
        </div>
      </div>
      <div id="tab-finances"></div>
      <div id="tab-todo"       style="display:none"></div>
      <div id="tab-inventory"  style="display:none"></div>
      <div id="tab-authors-hq" style="display:none"><div id="authors-content"></div></div>
      <div id="tab-prizes-embed" style="display:none"><div id="prizes-content"></div></div>
      <div id="tab-eventday"   style="display:none"></div>
      <div id="tab-settings"   style="display:none"><div id="settings-content"></div></div>
    </div>
    <nav class="tab-bar">
      <button class="tab-btn active" onclick="showTab('finances')"><i class="ti ti-calculator"></i>Finances</button>
      <button class="tab-btn" onclick="showTab('todo')"><i class="ti ti-check"></i>To-do</button>
      <button class="tab-btn" onclick="showTab('inventory')"><i class="ti ti-package"></i>Inventory</button>
      <button class="tab-btn" onclick="showTab('authors-hq')"><i class="ti ti-users"></i>Authors</button>
      <button class="tab-btn" onclick="showTab('prizes-embed')"><i class="ti ti-gift"></i>Prizes</button>
      <button class="tab-btn" onclick="showTab('settings')"><i class="ti ti-settings"></i>Settings</button>
    </nav>
    <div id="modal-container"></div>
    <div id="toast" class="toast"></div>`;
}

function showTab(t) {
  _activeTab = t;
  const tabs = ['finances','todo','inventory','authors-hq','prizes-embed','eventday','settings'];
  tabs.forEach(x => {
    const el = document.getElementById('tab-'+x);
    if (el) el.style.display = x===t ? 'block' : 'none';
  });
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', tabs[i]===t));
  if (t==='finances')     renderFinances();
  if (t==='todo')         renderTodo();
  if (t==='inventory')    renderInventory();
  if (t==='authors-hq')   renderAuthors();
  if (t==='prizes-embed') renderPrizesTab();
  if (t==='settings')     renderSettings();
}

async function renderSettings() {
  const el = document.getElementById('settings-content');
  if (!el) return;
  el.innerHTML = `
    <div class="card">
      <div class="card-title">App connections</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="sf full">
          <label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Firebase Database URL</label>
          <input type="text" id="s-firebase" value="${escHtml(window.FIREBASE_DB_URL||'')}"
            placeholder="https://soiree-prizes-default-rtdb.firebaseio.com"
            style="width:100%;font-family:monospace;font-size:12px">
        </div>
        <div class="sf full">
          <label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Prize Manager URL</label>
          <input type="text" id="s-prize-url" value="${escHtml(window.PRIZE_APP_URL||'')}"
            placeholder="https://authornjk.github.io/BSS-Prizes"
            style="width:100%;font-family:monospace;font-size:12px">
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn primary" onclick="saveSettings()"><i class="ti ti-check"></i> Save</button>
        <button class="btn" onclick="syncHQToFirebase();showToast('Synced!')"><i class="ti ti-refresh"></i> Sync now</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">People</div>
      ${['Admin','Set-up','Misc'].map(grp => {
        const groups = S.peopleGroups || {};
        const members = groups[grp] || [];
        return `<div style="margin-bottom:12px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text2);margin-bottom:5px">${grp}</div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:4px">
            ${members.map((p,i) => `<div style="display:flex;align-items:center;gap:5px">
              <input type="text" value="${escHtml(p)}" style="flex:1;font-size:13px;padding:5px 8px"
                onblur="updatePersonInGroup('${grp}',${i},this.value)">
              <button class="btn danger" style="padding:4px 8px" onclick="removePersonFromGroup('${grp}',${i})"><i class="ti ti-x"></i></button>
            </div>`).join('')}
          </div>
          <button class="btn" style="font-size:11px;padding:3px 9px" onclick="addPersonToGroup('${grp}')">
            <i class="ti ti-plus"></i> Add to ${grp}
          </button>
        </div>`;
      }).join('')}
    </div>`;
}

function saveSettings() {
  window.FIREBASE_DB_URL = document.getElementById('s-firebase')?.value?.trim()||'';
  window.PRIZE_APP_URL   = document.getElementById('s-prize-url')?.value?.trim()||'';
  localStorage.setItem('soiree_firebase_url', window.FIREBASE_DB_URL);
  localStorage.setItem('soiree_prize_url',    window.PRIZE_APP_URL);
  showToast('Settings saved');
  syncHQToFirebase();
}

function renderPrizesTab() {
  const el = document.getElementById('prizes-content');
  if (!el) return;
  const url = window.PRIZE_APP_URL || '';
  if (!url) {
    el.innerHTML = `<div class="card"><div class="card-title">Prize Manager</div>
      <div class="empty"><i class="ti ti-gift"></i>Prize Manager URL not set.<br>
      <button class="btn primary" onclick="showTab('settings')">Open Settings</button></div></div>`;
    return;
  }
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px">
      <span style="font-size:12px;color:var(--text2)"><i class="ti ti-gift"></i> Prize Manager</span>
      <div style="display:flex;gap:6px">
        <button class="btn" onclick="document.getElementById('prize-frame').src+=''"><i class="ti ti-refresh"></i> Refresh</button>
        <a href="${escHtml(url)}" target="_blank" class="btn"><i class="ti ti-external-link"></i> New tab</a>
      </div>
    </div>
    <iframe id="prize-frame" src="${escHtml(url)}"
      style="width:100%;height:calc(100vh - 180px);min-height:500px;border:.5px solid var(--border);border-radius:var(--radius-md);background:var(--bg)"
      title="Prize Manager"></iframe>`;
}

function updatePersonInGroup(grp, i, val) {
  if (!S.peopleGroups) S.peopleGroups = {};
  if (!S.peopleGroups[grp]) S.peopleGroups[grp] = [];
  S.peopleGroups[grp][i] = val;
  // Keep flat people array in sync
  S.people = [...new Set(Object.values(S.peopleGroups).flat())];
  saveState();
}
function removePersonFromGroup(grp, i) {
  if (!S.peopleGroups?.[grp]) return;
  S.peopleGroups[grp].splice(i, 1);
  S.people = [...new Set(Object.values(S.peopleGroups).flat())];
  saveState(); renderSettings();
}
function addPersonToGroup(grp) {
  if (!S.peopleGroups) S.peopleGroups = {};
  if (!S.peopleGroups[grp]) S.peopleGroups[grp] = [];
  S.peopleGroups[grp].push('New person');
  S.people = [...new Set(Object.values(S.peopleGroups).flat())];
  saveState(); renderSettings();
}

function boot() {
  window.FIREBASE_DB_URL = localStorage.getItem('soiree_firebase_url') || '';
  window.PRIZE_APP_URL   = localStorage.getItem('soiree_prize_url')   || '';
  loadState();
  renderShell();
  showTab('finances');
  if (window.FIREBASE_DB_URL) {
    syncHQToFirebase();
  }
}

boot();
