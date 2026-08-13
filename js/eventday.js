function renderEventDay() {
  const el = document.getElementById('tab-eventday');
  if (!el) return;
  el.innerHTML = `<div class="card"><div class="card-title">Event Day</div>
    <p style="color:var(--text2);font-size:13px">Agenda, Q&A questions, and seating chart coming soon.</p>
  </div>`;
}
