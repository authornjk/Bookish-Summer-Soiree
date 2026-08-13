// todo.js — with swipe-to-delete and tap-name-to-reassign

let _todoFilter = '';
let _todoWho = '';
let _swipedTodoId = null;

function renderTodo() {
  const el = document.getElementById('tab-todo');
  if (!el) return;

  const people = S.people || [];
  let list = S.todos || [];
  if (_todoWho) list = list.filter(t => t.who === _todoWho);
  if (_todoFilter === 'done')   list = list.filter(t => t.done);
  if (_todoFilter === 'undone') list = list.filter(t => !t.done);

  const done  = (S.todos||[]).filter(t=>t.done).length;
  const total = (S.todos||[]).length;

  el.innerHTML = `
    <div class="card" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:18px;font-weight:700">${done}/${total}</div>
          <div style="font-size:11px;color:var(--text2)">tasks complete</div>
          <div style="margin-top:6px;height:6px;background:var(--border);border-radius:3px;width:180px;overflow:hidden">
            <div style="height:100%;background:var(--purple);width:${total>0?Math.round(done/total*100):0}%;border-radius:3px"></div>
          </div>
        </div>
        <button class="btn primary" onclick="openAddTodoModal()"><i class="ti ti-plus"></i> Add task</button>
      </div>
    </div>

    <div class="filter-bar">
      <select onchange="_todoFilter=this.value;renderTodo()">
        <option value="">All tasks</option>
        <option value="undone"${_todoFilter==='undone'?' selected':''}>Not done</option>
        <option value="done"${_todoFilter==='done'?' selected':''}>Done</option>
      </select>
      <select onchange="_todoWho=this.value;renderTodo()">
        <option value="">Everyone</option>
        ${people.map(p=>`<option value="${escHtml(p)}"${_todoWho===p?' selected':''}>${escHtml(p)}</option>`).join('')}
      </select>
    </div>

    <div id="todo-list" style="display:flex;flex-direction:column;gap:5px">
      ${list.map(t => todoRowHTML(t)).join('')}
    </div>`;
}

function todoRowHTML(t) {
  const isOpen = _swipedTodoId === t.id;
  return `<div class="author-swipe-row${isOpen?' open':''}" id="todo-row-${t.id}">
    <div class="author-swipe-content"
      ontouchstart="_authorSwipeX=event.touches[0].clientX"
      ontouchend="todoSwipeEnd(event,${t.id})">
      <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:var(--bg);border:.5px solid var(--border);border-radius:var(--radius-sm)">
        <input type="checkbox" ${t.done?'checked':''} style="width:16px;height:16px;accent-color:var(--purple);flex-shrink:0"
          onchange="toggleTodo(${t.id},this.checked)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;${t.done?'text-decoration:line-through;color:var(--text3)':''}">${escHtml(t.task)}</div>
          ${t.who?`<div class="who-badge" onclick="cycleTodoWho(${t.id},event)">${escHtml(t.who)} <i class="ti ti-chevron-down" style="font-size:9px"></i></div>`
                 :`<div class="who-badge unassigned" onclick="cycleTodoWho(${t.id},event)">Unassigned <i class="ti ti-chevron-down" style="font-size:9px"></i></div>`}
        </div>
      </div>
    </div>
    <div class="author-swipe-actions" style="width:80px">
      <button class="author-action" style="background:var(--red)" onclick="deleteTodo(${t.id})">
        <i class="ti ti-trash"></i><span>Delete</span>
      </button>
    </div>
  </div>`;
}

function toggleTodo(id, val) {
  const t = (S.todos||[]).find(t=>t.id===id);
  if (t) { t.done = val; saveState(); renderTodo(); }
}

function cycleTodoWho(id, e) {
  e.stopPropagation();
  const t = (S.todos||[]).find(t=>t.id===id);
  if (!t) return;
  const people = ['', ...(S.people||[])];
  const idx = people.indexOf(t.who||'');
  t.who = people[(idx+1) % people.length];
  saveState(); renderTodo();
}

function deleteTodo(id) {
  if (!confirm('Delete this task?')) return;
  S.todos = (S.todos||[]).filter(t=>t.id!==id);
  _swipedTodoId = null;
  saveState(); renderTodo();
}

function openAddTodoModal() {
  const people = S.people || [];
  showModal(`
    <h3>Add task</h3>
    <div class="field"><label>Task description</label>
      <textarea id="at-task" rows="2" placeholder="What needs to be done?"></textarea>
    </div>
    <div class="field"><label>Assigned to</label>
      <select id="at-who">
        <option value="">Unassigned</option>
        ${people.map(p=>`<option>${escHtml(p)}</option>`).join('')}
      </select>
    </div>
    <div class="m-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="doAddTodo()"><i class="ti ti-plus"></i> Add</button>
    </div>`);
  setTimeout(()=>document.getElementById('at-task')?.focus(),50);
}

function doAddTodo() {
  const task = document.getElementById('at-task')?.value?.trim();
  if (!task) { alert('Please enter a task.'); return; }
  const todo = {
    id: S.nextId++,
    task,
    who: document.getElementById('at-who')?.value || '',
    done: false
  };
  S.todos.push(todo);
  saveState(); closeModal(); renderTodo();
}

function todoSwipeEnd(e, id) {
  const dx = e.changedTouches[0].clientX - _authorSwipeX;
  if (dx < -50) _swipedTodoId = id;
  else if (dx > 20) _swipedTodoId = null;
  renderTodo();
}
