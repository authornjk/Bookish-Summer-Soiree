// todo.js — clean rewrite with search, sort, edit, notes, no disappearing names

var _todoSort   = 'default';
var _todoSearch = '';
var _editTodoId = null;

function renderTodo() {
  const el = document.getElementById('tab-todo');
  if (!el) return;

  const people = getAllPeople();
  let list = S.todos || [];

  // Search
  if (_todoSearch.trim()) {
    const q = _todoSearch.toLowerCase();
    const primary   = list.filter(t => (t.task||'').toLowerCase().includes(q));
    const secondary = list.filter(t => !(t.task||'').toLowerCase().includes(q) && (t.notes||'').toLowerCase().includes(q));
    list = [...primary, ...secondary];
  }

  // Sort
  if (_todoSort === 'alpha') list = [...list].sort((a,b) => (a.task||'').localeCompare(b.task||''));
  if (_todoSort === 'person') list = [...list].sort((a,b) => (a.who||'').localeCompare(b.who||''));

  const done  = (S.todos||[]).filter(t => t.done).length;
  const total = (S.todos||[]).length;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div style="font-size:13px;color:var(--text2)">${done}/${total} done</div>
      <button class="btn primary" onclick="openAddTodo()"><i class="ti ti-plus"></i> Add task</button>
    </div>

    <!-- Search -->
    <div style="margin-bottom:8px">
      <input type="text" id="todo-search" value="${escHtml(_todoSearch)}" placeholder="Search tasks and notes…"
        style="width:100%;font-size:13px;padding:8px 12px"
        oninput="_todoSearch=this.value;renderTodo()">
    </div>

    <!-- Sort -->
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      <span style="font-size:11px;color:var(--text2);align-self:center">Sort:</span>
      <button class="sort-btn${_todoSort==='default'?' active':''}" onclick="_todoSort='default';renderTodo()">Default</button>
      <button class="sort-btn${_todoSort==='alpha'?' active':''}"   onclick="_todoSort='alpha';renderTodo()">A–Z</button>
      <button class="sort-btn${_todoSort==='person'?' active':''}"  onclick="_todoSort='person';renderTodo()">By person</button>
    </div>

    <!-- Person filter when sorted by person -->
    ${_todoSort==='person' ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
      ${['',...people].map(p => `<button class="person-filter-btn" onclick="filterByPerson('${escHtml(p)}')" style="${!p?'font-style:italic':''}">
        ${p||'Unassigned'}
      </button>`).join('')}
    </div>` : ''}

    <!-- Task list -->
    <div style="display:flex;flex-direction:column;gap:4px">
      ${list.map(t => todoRow(t)).join('')}
      ${list.length===0?`<div style="color:var(--text3);font-size:13px;text-align:center;padding:2rem">No tasks found.</div>`:''}
    </div>`;
}

function filterByPerson(who) {
  // Scroll to that person's section
  const els = document.querySelectorAll('[data-who]');
  for (const el of els) {
    if (el.dataset.who === who) { el.scrollIntoView({behavior:'smooth'}); break; }
  }
}

function todoRow(t) {
  return `<div class="todo-card" id="todo-${t.id}" data-who="${escHtml(t.who||'')}">
    <div style="display:flex;align-items:flex-start;gap:8px;padding:9px 12px">
      <input type="checkbox" ${t.done?'checked':''} style="width:16px;height:16px;accent-color:var(--purple);flex-shrink:0;margin-top:2px"
        onchange="toggleTodoDone(${t.id},this.checked)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;${t.done?'text-decoration:line-through;color:var(--text3)':''}">${escHtml(t.task||'')}</div>
        ${t.notes?`<div style="font-size:11px;color:var(--text3);margin-top:2px">${escHtml(t.notes)}</div>`:''}
        <div style="margin-top:4px">
          <select class="who-select" onchange="setTodoWho(${t.id},this.value)" style="font-size:11px;padding:2px 6px;border-radius:10px;border:.5px solid var(--border2);background:var(--bg2);color:${t.who?'var(--purple-text)':'var(--text3)'}">
            <option value="">Unassigned</option>
            ${getAllPeople().map(p => `<option value="${escHtml(p)}"${t.who===p?' selected':''}>${escHtml(p)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:flex;gap:2px;flex-shrink:0">
        <button class="icon-btn" onclick="openEditTodo(${t.id})" title="Edit"><i class="ti ti-pencil" style="font-size:13px"></i></button>
        <button class="icon-btn del-btn" onclick="confirmDelete('Delete \\'${escHtml(t.task||'this task')}\\'?',()=>deleteTodo(${t.id}))" title="Delete">
          <i class="ti ti-trash" style="font-size:13px"></i>
        </button>
      </div>
    </div>
  </div>`;
}

function toggleTodoDone(id, val) {
  const t = (S.todos||[]).find(t => t.id===id);
  if (t) { t.done = val; saveState(); renderTodo(); }
}

function setTodoWho(id, val) {
  const t = (S.todos||[]).find(t => t.id===id);
  if (t) { t.who = val; saveState(); }
  // Don't re-render — just save. Avoids focus loss.
}

function deleteTodo(id) {
  S.todos = (S.todos||[]).filter(t => t.id!==id);
  saveState(); renderTodo();
}

function openAddTodo() {
  showModal(`
    <h3>Add task</h3>
    <div class="field"><label>Task</label><textarea id="at-task" rows="2" placeholder="What needs to be done?"></textarea></div>
    <div class="field"><label>Assigned to</label>
      <select id="at-who">
        <option value="">Unassigned</option>
        ${getAllPeople().map(p=>`<option>${escHtml(p)}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Notes (optional)</label><input type="text" id="at-notes" placeholder="Any notes…"></div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddTodo()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(()=>document.getElementById('at-task')?.focus(),50);
}

function doAddTodo() {
  const task = document.getElementById('at-task')?.value?.trim();
  if (!task) { alert('Please enter a task.'); return; }
  S.todos.push({
    id:    S.nextId++,
    task,
    who:   document.getElementById('at-who')?.value || '',
    notes: document.getElementById('at-notes')?.value?.trim() || '',
    done:  false
  });
  saveState(); closeModal(); renderTodo();
}

function openEditTodo(id) {
  const t = (S.todos||[]).find(t => t.id===id);
  if (!t) return;
  showModal(`
    <h3>Edit task</h3>
    <div class="field"><label>Task</label><textarea id="et-task" rows="2">${escHtml(t.task||'')}</textarea></div>
    <div class="field"><label>Assigned to</label>
      <select id="et-who">
        <option value="">Unassigned</option>
        ${getAllPeople().map(p=>`<option value="${escHtml(p)}"${t.who===p?' selected':''}>${escHtml(p)}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Notes</label><input type="text" id="et-notes" value="${escHtml(t.notes||'')}" placeholder="Any notes…"></div>
    <div class="m-actions">
      <button class="btn danger" onclick="confirmDelete('Delete this task?',()=>{deleteTodo(${id});closeModal()})">
        <i class="ti ti-trash"></i> Delete
      </button>
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doEditTodo(${id})"><i class="ti ti-check"></i> Save</button>
    </div>`);
}

function doEditTodo(id) {
  const t = (S.todos||[]).find(t => t.id===id);
  if (!t) return;
  t.task  = document.getElementById('et-task')?.value?.trim()  || t.task;
  t.who   = document.getElementById('et-who')?.value  || '';
  t.notes = document.getElementById('et-notes')?.value?.trim() || '';
  saveState(); closeModal(); renderTodo();
}
