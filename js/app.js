// app.js — main orchestrator

let _activeTab = 'finances';

// ── Helpers ───────────────────────────────────────────────────────────────────

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function showModal(html) {
  const mc = document.getElementById('modal-container');
  mc.innerHTML = `<div class="modal-overlay" id="modal-bg" onclick="closeModalOutside(event)">
    <div class="modal">
      <button class="modal-close" onclick="closeModal()" aria-label="Close"><i class="ti ti-x"></i></button>
      ${html}
    </div>
  </div>`;
}
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }
function closeModalOutside(e) { if (e.target.id === 'modal-bg') closeModal(); }

// ── Shell ─────────────────────────────────────────────────────────────────────

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
        <div id="hq-stats" style="font-size:12px;color:var(--text2);text-align:right">
          <span>${todoDone}/${todoTotal} tasks</span> &nbsp;·&nbsp; <span>${packed}/${invTotal} packed</span>
        </div>
      </div>

      <div id="tab-finances"></div>
      <div id="tab-todo"      style="display:none"></div>
      <div id="tab-inventory" style="display:none"></div>
      <div id="tab-authors-hq" style="display:none"><div id="authors-content"></div></div>
      <div id="tab-prizes-embed" style="display:none"><div id="prizes-content"></div></div>
      <div id="tab-eventday"  style="display:none"></div>
      <div id="tab-settings"  style="display:none"><div id="settings-content"></div></div>
    </div>

    <nav class="tab-bar" role="navigation">
      <button class="tab-btn active" onclick="showTab('finances')">
        <i class="ti ti-calculator" aria-hidden="true"></i>Finances
      </button>
      <button class="tab-btn" onclick="showTab('todo')">
        <i class="ti ti-check" aria-hidden="true"></i>To-do
      </button>
      <button class="tab-btn" onclick="showTab('inventory')">
        <i class="ti ti-package" aria-hidden="true"></i>Inventory
      </button>
      <button class="tab-btn" onclick="showTab('authors-hq')">
        <i class="ti ti-users" aria-hidden="true"></i>Authors
      </button>
      <button class="tab-btn" onclick="showTab('prizes-embed')">
        <i class="ti ti-gift" aria-hidden="true"></i>Prizes
      </button>
      <button class="tab-btn" onclick="showTab('eventday')">
        <i class="ti ti-calendar" aria-hidden="true"></i>Event day
      </button>
      <button class="tab-btn" onclick="showTab('settings')">
        <i class="ti ti-settings" aria-hidden="true"></i>Settings
      </button>
    </nav>`;
}

// ── Tab routing ───────────────────────────────────────────────────────────────

function showTab(t) {
  _activeTab = t;
  const tabs = ['finances','todo','inventory','authors-hq','prizes-embed','eventday','settings'];

  tabs.forEach(x => {
    const el = document.getElementById('tab-' + x);
    if (el) el.style.display = x === t ? 'block' : 'none';
  });

  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', tabs[i] === t);
  });

  if (t === 'finances')      renderFinances();
  if (t === 'todo')          renderTodo();
  if (t === 'inventory')     renderInventory();
  if (t === 'authors-hq')    renderAuthors();
  if (t === 'prizes-embed')  renderPrizesTab();
  if (t === 'eventday')      renderEventDay();
  if (t === 'settings')      renderSettings();
}

// ── Settings ──────────────────────────────────────────────────────────────────

async function renderSettings() {
  const el = document.getElementById('settings-content');
  if (!el) return;
  el.innerHTML = `
    <div class="card">
      <div class="card-title">App connections</div>
      <div class="sett-grid">
        <div class="sf" style="grid-column:1/-1">
          <label>Firebase Database URL
            <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:4px">(shared between HQ and Prize Manager)</span>
          </label>
          <input type="text" id="s-firebase" value="${escHtml(window.FIREBASE_DB_URL||'')}"
            placeholder="https://your-project-default-rtdb.firebaseio.com"
            style="width:100%;font-family:monospace;font-size:12px">
        </div>
        <div class="sf" style="grid-column:1/-1">
          <label>Prize Manager URL
            <span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:4px">(GitHub Pages address of your Prize Manager app)</span>
          </label>
          <input type="text" id="s-prize-url" value="${escHtml(window.PRIZE_APP_URL||'')}"
            placeholder="https://yourusername.github.io/soiree-prizes"
            style="width:100%;font-family:monospace;font-size:12px">
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn primary" onclick="saveConnectionSettings()"><i class="ti ti-check"></i> Save connections</button>
        <button class="btn" onclick="syncPrizesFromFirebase();loadAuthorsFromFirebase().then(()=>renderAuthors())">
          <i class="ti ti-refresh"></i> Sync now
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Event details</div>
      <div class="sett-grid">
        <div class="sf"><label>Event name</label>
          <input type="text" id="s-name" value="${escHtml(S.eventName||'Bookish Summer Soirée 2027')}">
        </div>
        <div class="sf"><label>Year</label>
          <input type="text" id="s-year" value="${escHtml(S.eventYear||'2027')}">
        </div>
      </div>
    </div>

    <div style="margin-top:10px">
      <button class="btn primary" onclick="saveAllSettings()"><i class="ti ti-check"></i> Save all settings</button>
    </div>

    <div class="danger-zone" style="margin-top:1.5rem">
      <h3><i class="ti ti-alert-triangle"></i> Reset all local data</h3>
      <p style="font-size:12px;color:var(--text2);margin-bottom:9px">
        Clears locally-saved data and reloads defaults. Firebase data is unaffected.
      </p>
      <button class="btn danger" onclick="resetLocalData()">
        <i class="ti ti-refresh"></i> Reset local data
      </button>
    </div>`;
}

function saveConnectionSettings() {
  const fb = document.getElementById('s-firebase')?.value?.trim()||'';
  const pu = document.getElementById('s-prize-url')?.value?.trim()||'';
  // Persist in localStorage
  localStorage.setItem('soiree_firebase_url', fb);
  localStorage.setItem('soiree_prize_url', pu);
  window.FIREBASE_DB_URL = fb;
  window.PRIZE_APP_URL   = pu;
  showToast('Connections saved');
  // Re-sync
  if (fb) {
    syncPrizesFromFirebase();
    loadAuthorsFromFirebase().then(()=>renderAuthors());
  }
}

function saveAllSettings() {
  saveConnectionSettings();
  const name = document.getElementById('s-name')?.value?.trim();
  const year = document.getElementById('s-year')?.value?.trim();
  if (name) S.eventName = name;
  if (year) S.eventYear = year;
  saveState();
  showToast('Settings saved');
}

function resetLocalData() {
  if (!confirm('Clear all local data and reload defaults? Firebase data is unaffected.')) return;
  localStorage.removeItem(SK);
  location.reload();
}

// ── Boot ──────────────────────────────────────────────────────────────────────

function boot() {
  // Load persisted connection URLs
  window.FIREBASE_DB_URL = localStorage.getItem('soiree_firebase_url') || window.FIREBASE_DB_URL || '';
  window.PRIZE_APP_URL   = localStorage.getItem('soiree_prize_url')   || '';

  loadState();
  renderShell();
  showTab('finances');

  // Background syncs
  if (window.FIREBASE_DB_URL) {
    syncPrizesFromFirebase();
    loadAuthorsFromFirebase().then(() => {
      if (_activeTab === 'authors-hq') renderAuthors();
    });
    setInterval(syncPrizesFromFirebase, 30000);
    setInterval(() => loadAuthorsFromFirebase().then(() => {
      if (_activeTab === 'authors-hq') renderAuthors();
    }), 60000);
  }
}

boot();
