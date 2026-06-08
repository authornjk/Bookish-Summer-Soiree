// prizes_tab.js — Prize Manager embedded tab

function renderPrizesTab() {
  const el = document.getElementById('prizes-content');
  if (!el) return;

  const prizeUrl = window.PRIZE_APP_URL || '';

  if (!prizeUrl) {
    el.innerHTML = `
      <div class="card">
        <div class="card-title">Prize Manager</div>
        <div class="empty">
          <i class="ti ti-gift" style="font-size:28px"></i>
          <span style="font-weight:600">Prize Manager URL not set</span>
          <span>Go to Settings and enter your Prize Manager GitHub Pages URL to embed it here.</span>
          <button class="btn primary" onclick="showTab('settings')"><i class="ti ti-settings"></i> Open Settings</button>
        </div>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
      <div style="font-size:12px;color:var(--text2)">
        <i class="ti ti-gift"></i> Prize Manager
        <span style="color:var(--text3);margin-left:6px">${escHtml(prizeUrl)}</span>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn" onclick="document.getElementById('prize-frame').src=document.getElementById('prize-frame').src">
          <i class="ti ti-refresh"></i> Refresh
        </button>
        <a href="${escHtml(prizeUrl)}" target="_blank" class="btn">
          <i class="ti ti-external-link"></i> Open in new tab
        </a>
      </div>
    </div>
    <iframe
      id="prize-frame"
      src="${escHtml(prizeUrl)}"
      style="width:100%;height:calc(100vh - 200px);min-height:600px;border:0.5px solid var(--border);border-radius:var(--radius-md);background:var(--bg)"
      title="Prize Manager">
    </iframe>`;
}
