function renderEventDay() {
  const el = document.getElementById('tab-eventday');
  if (!el) return;

  el.innerHTML = `
    <div class="card">
      <div class="card-title">Event agenda</div>
      ${S.agenda.map(a => `
        <div class="agenda-row">
          <div class="agenda-time">${escHtml(a.time)}</div>
          <div>${a.items.map(item => `<div class="agenda-item">• ${escHtml(item)}</div>`).join('')}</div>
        </div>`).join('')}
    </div>

    <div class="card">
      <div class="card-title">Getting to know you — author game</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:8px">Authors stand up if this applies to them:</div>
      ${S.qAndA.map((q, i) => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:0.5px solid var(--border)">
          <span style="font-size:11px;color:var(--text3);width:20px;flex-shrink:0;text-align:right">${i + 1}.</span>
          <span style="font-size:13px">${escHtml(q)}</span>
        </div>`).join('')}
    </div>

    <div class="card">
      <div class="card-title">Book signing seating (2026 layout — update for 2027)</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:5px">
        ${S.seating.map(s => `
          <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--bg2);border-radius:var(--radius-sm)">
            <span style="font-size:13px;font-weight:600;color:var(--purple);width:24px;text-align:right;flex-shrink:0">${s.seat}</span>
            <span style="font-size:12px">${escHtml(s.name)}</span>
          </div>`).join('')}
      </div>
      <p style="font-size:11px;color:var(--text3);margin-top:10px">This is the 2026 layout. Update author names as 2027 authors are confirmed.</p>
    </div>`;
}
