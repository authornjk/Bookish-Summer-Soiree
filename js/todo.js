function renderTodo() {
  const el = document.getElementById('tab-todo');
  if (!el) return;

  const q = (document.getElementById('td-search') || {}).value?.toLowerCase() || '';
  const who = (document.getElementById('td-who') || {}).value || '';
  const status = (document.getElementById('td-status') || {}).value || '';

  const done = S.todos.filter(t => t.done).length;
  const total = S.todos.length;
  const people = [...new Set(S.todos.map(t => t.who).filter(Boolean))].sort();

  const filtered = S.todos.filter(t => {
    const mq = !q || t.task.toLowerCase().includes(q) || (t.who || '').toLowerCase().includes(q);
    const mw = !who || t.who === who;
    const ms = !status || (status === 'done' ? t.done : !t.done);
    return mq && mw && ms;
  });

  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="stat-lbl">Total tasks</div><div class="stat-val">${total}</div></div>
      <div class="stat"><div class="stat-lbl">Done</div><div class="stat-val" style="color:var(--green)">${done}</div></div>
      <div class="stat"><div class="stat-lbl">Remaining</div><div class="stat-val" style="color:var(--red)">${total - done}</div></div>
      <div class="stat">
        <div class="stat-lbl">Progress</div>
        <div class="stat-val">${pctStr(done, total)}</div>
        <div class="prog-bar"><div class="prog-fill" style="width:${pctStr(done, total)}"></div></div>
      </div>
    </div>

    <div class="filter-row">
      <input type="text" id="td-search" placeholder="Search tasks…" value="${escHtml(q)}" oninput="renderTodo()">
      <select id="td-who" onchange="renderTodo()">
        <option value="">All people</option>
        ${people.map(p => `<option${p === who ? ' selected' : ''}>${escHtml(p)}</option>`).join('')}
      </select>
      <select id="td-status" onchange="renderTodo()">
        <option value="">All</option>
        <option value="todo"${status === 'todo' ? ' selected' : ''}>To do</option>
        <option value="done"${status === 'done' ? ' selected' : ''}>Done</option>
      </select>
      <button class="btn primary" onclick="openAddTodo()"><i class="ti ti-plus"></i> Add task</button>
    </div>

    <div id="td-list">
      ${filtered.length ? filtered.map(t => `
        <div class="todo-item ${t.done ? 'done-item' : ''}">
          <input type="checkbox" class="todo-cb" ${t.done ? 'checked' : ''} onchange="toggleTodo(${t.id},this.checked)">
          <span class="todo-text ${t.done ? 'struck' : ''}">${escHtml(t.task)}</span>
          ${t.who ? `<span class="who-pill">${escHtml(t.who)}</span>` : ''}
          <button class="btn" onclick="deleteTodo(${t.id})" style="padding:2px 6px;color:var(--text3)"><i class="ti ti-x"></i></button>
        </div>`).join('') : `<div class="empty"><i class="ti ti-check"></i><span>No tasks match your filters</span></div>`}
    </div>`;
}

function toggleTodo(id, val) {
  const t = S.todos.find(x => x.id === id);
  if (t) { t.done = val; saveState(); renderTodo(); }
}

function deleteTodo(id) {
  if (!confirm('Delete this task?')) return;
  S.todos = S.todos.filter(x => x.id !== id);
  saveState(); renderTodo();
}

function openAddTodo() {
  const people = [...new Set(S.todos.map(t => t.who).filter(Boolean))].sort();
  showModal(`
    <h3>Add task</h3>
    <div class="field"><label>Task description</label><input type="text" id="at-task" placeholder="What needs to be done?"></div>
    <div class="field"><label>Assigned to</label>
      <input type="text" id="at-who" list="at-who-list" placeholder="Name (optional)">
      <datalist id="at-who-list">${people.map(p => `<option value="${escHtml(p)}">`).join('')}</datalist>
    </div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddTodo()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(() => document.getElementById('at-task')?.focus(), 50);
}

function doAddTodo() {
  const task = document.getElementById('at-task')?.value?.trim();
  if (!task) { alert('Please enter a task description.'); return; }
  S.todos.push({ id: S.nextId++, who: document.getElementById('at-who')?.value?.trim() || '', task, done: false });
  saveState(); closeModal(); renderTodo();
}
