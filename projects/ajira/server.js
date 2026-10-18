import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const PORT = process.env.PORT || 3000;

// Ініціалізація бази даних у файлі tasks.db прямо у проєкті
const db = new DatabaseSync('tasks.db');

// Створення таблиці задач
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    day TEXT NOT NULL,
    color TEXT NOT NULL,
    status TEXT NOT NULL
  )
`);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET: вибірка всіх задач з SQLite
  if (req.url === '/api/tasks' && req.method === 'GET') {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tasks));
    return;
  }

  // POST: створення задачі в SQLite
  if (req.url === '/api/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newTask = {
          id: Date.now().toString(),
          title: data.title?.trim() || 'Нова задача',
          day: String(data.day || new Date().getDate()),
          color: data.color || '#22c55e',
          status: data.status || 'todo'
        };

        const insert = db.prepare(`
          INSERT INTO tasks (id, title, day, color, status)
          VALUES (?, ?, ?, ?, ?)
        `);
        insert.run(newTask.id, newTask.title, newTask.day, newTask.color, newTask.status);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTask));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // PATCH: оновлення статусу задачі в SQLite
  if (req.url.startsWith('/api/tasks/') && req.method === 'PATCH') {
    const id = req.url.split('/')[3];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.status) {
          const update = db.prepare('UPDATE tasks SET status = ? WHERE id = ?');
          update.run(data.status, id);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // DELETE: видалення задачі з SQLite
  if (req.url.startsWith('/api/tasks/') && req.method === 'DELETE') {
    const id = req.url.split('/')[3];
    const del = db.prepare('DELETE FROM tasks WHERE id = ?');
    del.run(id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Інтерфейс клієнта (HTML + CSS + JS)
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SecureTask — Jira Clone</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background-color: #0b0f19; color: #f8fafc; display: flex; height: 100vh; width: 100vw; overflow: hidden; }

    .sidebar { width: 250px; flex-shrink: 0; background: #0f172a; border-right: 1px solid #1e293b; display: flex; flex-direction: column; padding: 20px; }
    .logo { font-size: 18px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .nav-item { padding: 10px 14px; border-radius: 8px; color: #94a3b8; font-size: 14px; cursor: pointer; margin-bottom: 6px; transition: 0.2s; user-select: none; }
    .nav-item:hover, .nav-item.active { background: #1e293b; color: #fff; }

    .main { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    header { height: 60px; flex-shrink: 0; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; background: #0b0f19; }
    .project-title { font-size: 16px; font-weight: 600; }

    .content { padding: 20px 30px; flex: 1; display: none; overflow: hidden; }
    .content.active { display: flex; flex-direction: column; }

    .control-bar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; background: #0f172a; padding: 12px 16px; border-radius: 12px; border: 1px solid #1e293b; flex-shrink: 0; }
    input { background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none; flex: 1; max-width: 360px; }
    input:focus { border-color: #38bdf8; }

    .selected-day-badge { background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; white-space: nowrap; }
    .color-picker { display: flex; gap: 8px; align-items: center; }
    .color-option { width: 22px; height: 22px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
    .color-option.selected { border-color: #fff; transform: scale(1.15); }

    button.primary { background: #38bdf8; color: #0b0f19; font-weight: 600; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    button.primary:hover { background: #0ea5e9; }

    /* Kanban Board */
    .kanban-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; flex: 1; min-height: 0; }
    .kanban-column { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; display: flex; flex-direction: column; padding: 16px; min-height: 0; }
    .kanban-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; font-weight: 600; flex-shrink: 0; }
    .kanban-badge { background: #1e293b; color: #94a3b8; font-size: 12px; padding: 2px 8px; border-radius: 10px; }
    
    .kanban-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px; min-height: 0; }
    .kanban-list::-webkit-scrollbar { width: 5px; }
    .kanban-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

    .kanban-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-size: 13px; display: flex; flex-direction: column; gap: 8px; transition: 0.15s; }
    .kanban-card:hover { border-color: #475569; }
    .kanban-card-title { display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .kanban-card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .kanban-actions { display: flex; gap: 5px; }
    .kanban-actions button { background: #334155; border: none; color: #cbd5e1; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
    .kanban-actions button:hover { background: #475569; color: #fff; }

    /* Calendar */
    #tab-calendar { overflow-y: auto; display: none; }
    #tab-calendar.active { display: block; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; padding-bottom: 20px; }
    .weekday-header { text-align: center; font-size: 12px; font-weight: 600; color: #94a3b8; padding-bottom: 6px; }
    .day-cell { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; display: flex; flex-direction: column; min-height: 105px; padding: 8px; cursor: pointer; transition: 0.2s; }
    .day-cell:hover { border-color: #475569; background: #131c31; }
    .day-cell.selected-cell { border-color: #38bdf8; background: #131c31; }
    .day-cell.today-cell { border-color: #22c55e; }
    .day-cell.empty { background: transparent; border: none; cursor: default; }

    .day-header { font-size: 13px; font-weight: 600; color: #94a3b8; display: flex; justify-content: space-between; margin-bottom: 6px; }
    .tasks-container { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 4px; pointer-events: none; }
    .task-card { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; pointer-events: auto; }
    .task-left { display: flex; align-items: center; gap: 6px; overflow: hidden; }
    .task-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .task-done-badge { font-size: 10px; color: #22c55e; border: 1px solid #22c55e; padding: 0 4px; border-radius: 4px; }
    .actions button { background: #334155; border: none; color: #f43f5e; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; }
    .actions button:hover { background: #475569; }

    /* Stats Layout */
    #tab-stats { overflow-y: auto; display: none; }
    #tab-stats.active { display: block; }
    .stats-wrapper { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; padding-bottom: 30px; }

    .stats-charts-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
    .stat-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; text-align: center; }
    .stat-title { font-size: 15px; font-weight: 600; margin-bottom: 18px; color: #38bdf8; }
    .chart-box { position: relative; width: 150px; height: 150px; margin: 0 auto 18px auto; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .chart-center { position: absolute; width: 105px; height: 105px; background: #0f172a; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .chart-total { font-size: 24px; font-weight: 700; color: #fff; }
    .chart-label { font-size: 11px; color: #94a3b8; }
    .legend { display: flex; justify-content: center; gap: 14px; font-size: 12px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

    /* KPI Row */
    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .kpi-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; }
    .kpi-info-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
    .kpi-info-val { font-size: 24px; font-weight: 700; color: #f8fafc; }
    .kpi-icon { font-size: 24px; background: #1e293b; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }

    /* Details: Priorities + Done Feed */
    .stats-details-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .detail-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; }
    .detail-card-title { font-size: 14px; font-weight: 600; color: #38bdf8; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }

    .priority-bar-item { margin-bottom: 12px; }
    .priority-bar-header { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #cbd5e1; }
    .progress-track { width: 100%; height: 7px; background: #1e293b; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }

    .recent-list { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .recent-item { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 9px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
    .recent-empty { font-size: 12px; color: #64748b; text-align: center; margin: auto; }
  </style>
</head>
<body>

  <div class="sidebar">
    <div class="logo">⚡ SecureTask</div>
    <div class="nav-item active" id="nav-kanban" onclick="switchTab('kanban')">📋 Kanban Дошка</div>
    <div class="nav-item" id="nav-calendar" onclick="switchTab('calendar')">📅 Календар місяця</div>
    <div class="nav-item" id="nav-stats" onclick="switchTab('stats')">📈 Статистика</div>
  </div>

  <div class="main">
    <header>
      <div class="project-title" id="header-title">Дошка завдань (Kanban)</div>
      <div style="font-size: 13px; color: #94a3b8;">Workspace: <b>AJIRA</b></div>
    </header>

    <!-- Вкладка Kanban -->
    <div class="content active" id="tab-kanban">
      <div class="control-bar">
        <input type="text" id="kanban-title" placeholder="Швидке створення задачі...">
        <div class="color-picker">
          <div class="color-option selected" style="background: #22c55e;" onclick="selectColor('#22c55e')" title="Звичайний"></div>
          <div class="color-option" style="background: #eab308;" onclick="selectColor('#eab308')" title="Середній"></div>
          <div class="color-option" style="background: #ef4444;" onclick="selectColor('#ef4444')" title="Терміновий"></div>
        </div>
        <button class="primary" onclick="addKanbanTask()">+ Створити</button>
      </div>

      <div class="kanban-grid">
        <div class="kanban-column">
          <div class="kanban-header">
            <span>📝 До виконання</span>
            <span class="kanban-badge" id="badge-todo">0</span>
          </div>
          <div class="kanban-list" id="list-todo"></div>
        </div>
        <div class="kanban-column">
          <div class="kanban-header">
            <span>⚙️ В процесі</span>
            <span class="kanban-badge" id="badge-in_progress">0</span>
          </div>
          <div class="kanban-list" id="list-in_progress"></div>
        </div>
        <div class="kanban-column">
          <div class="kanban-header">
            <span>✅ Виконано</span>
            <span class="kanban-badge" id="badge-done">0</span>
          </div>
          <div class="kanban-list" id="list-done"></div>
        </div>
      </div>
    </div>

    <!-- Вкладка Календаря -->
    <div class="content" id="tab-calendar">
      <div class="control-bar">
        <div class="selected-day-badge" id="selected-day-label">День 1</div>
        <input type="text" id="calendar-title" placeholder="Назва задачі на обраний день...">
        <div class="color-picker">
          <div class="color-option selected" style="background: #22c55e;" onclick="selectColor('#22c55e')" title="Звичайний"></div>
          <div class="color-option" style="background: #eab308;" onclick="selectColor('#eab308')" title="Середній"></div>
          <div class="color-option" style="background: #ef4444;" onclick="selectColor('#ef4444')" title="Терміновий"></div>
        </div>
        <button class="primary" onclick="addCalendarTask()">+ Додати задачу</button>
      </div>

      <div class="calendar-grid" id="calendar"></div>
    </div>

    <!-- Вкладка Статистики -->
    <div class="content" id="tab-stats">
      <div class="stats-wrapper">
        <div class="stats-charts-row">
          <div class="stat-card">
            <div class="stat-title" id="stats-today-heading">Сьогодні</div>
            <div class="chart-box" id="today-chart">
              <div class="chart-center">
                <div class="chart-total" id="today-total">0</div>
                <div class="chart-label">всього</div>
              </div>
            </div>
            <div class="legend">
              <div class="legend-item"><div class="legend-dot" style="background: #94a3b8;"></div>До виконання: <span id="today-todo">0</span></div>
              <div class="legend-item"><div class="legend-dot" style="background: #38bdf8;"></div>В процесі: <span id="today-in_progress">0</span></div>
              <div class="legend-item"><div class="legend-dot" style="background: #22c55e;"></div>Виконано: <span id="today-done">0</span></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Загальний прогрес за місяць</div>
            <div class="chart-box" id="total-chart">
              <div class="chart-center">
                <div class="chart-total" id="month-total">0</div>
                <div class="chart-label">всього</div>
              </div>
            </div>
            <div class="legend">
              <div class="legend-item"><div class="legend-dot" style="background: #94a3b8;"></div>До виконання: <span id="month-todo">0</span></div>
              <div class="legend-item"><div class="legend-dot" style="background: #38bdf8;"></div>В процесі: <span id="month-in_progress">0</span></div>
              <div class="legend-item"><div class="legend-dot" style="background: #22c55e;"></div>Виконано: <span id="month-done">0</span></div>
            </div>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div>
              <div class="kpi-info-label">Відсоток завершення</div>
              <div class="kpi-info-val" id="kpi-rate" style="color: #22c55e;">0%</div>
            </div>
            <div class="kpi-icon">🎯</div>
          </div>
          <div class="kpi-card">
            <div>
              <div class="kpi-info-label">Задач у процесі</div>
              <div class="kpi-info-val" id="kpi-in-prog" style="color: #38bdf8;">0</div>
            </div>
            <div class="kpi-icon">⚡</div>
          </div>
          <div class="kpi-card">
            <div>
              <div class="kpi-info-label">Термінових задач</div>
              <div class="kpi-info-val" id="kpi-urgent" style="color: #ef4444;">0</div>
            </div>
            <div class="kpi-icon">🔥</div>
          </div>
        </div>

        <div class="stats-details-row">
          <div class="detail-card">
            <div class="detail-card-title">
              <span>📊 Розподіл пріоритетів</span>
              <span style="font-size: 11px; color: #94a3b8;">за весь час</span>
            </div>
            <div class="priority-bar-item">
              <div class="priority-bar-header">
                <span>🔴 Термінові</span>
                <span id="prio-red-count">0</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" id="prio-red-bar" style="background: #ef4444; width: 0%;"></div>
              </div>
            </div>
            <div class="priority-bar-item">
              <div class="priority-bar-header">
                <span>🟡 Середні</span>
                <span id="prio-yellow-count">0</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" id="prio-yellow-bar" style="background: #eab308; width: 0%;"></div>
              </div>
            </div>
            <div class="priority-bar-item">
              <div class="priority-bar-header">
                <span>🟢 Звичайні</span>
                <span id="prio-green-count">0</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" id="prio-green-bar" style="background: #22c55e; width: 0%;"></div>
              </div>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-card-title">
              <span>✅ Останні виконані завдання</span>
              <span style="font-size: 11px; color: #22c55e;">Done feed</span>
            </div>
            <div class="recent-list" id="recent-done-list">
              <div class="recent-empty">Ще немає виконаних задач</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const today = new Date().getDate();
    let selectedDay = String(today);
    let selectedColor = '#22c55e';
    let cachedTasks = [];

    function switchTab(tab) {
      document.querySelectorAll('.content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

      if (tab === 'kanban') {
        document.getElementById('tab-kanban').classList.add('active');
        document.getElementById('nav-kanban').classList.add('active');
        document.getElementById('header-title').innerText = 'Дошка завдань (Kanban)';
        renderKanban();
      } else if (tab === 'calendar') {
        document.getElementById('tab-calendar').classList.add('active');
        document.getElementById('nav-calendar').classList.add('active');
        document.getElementById('header-title').innerText = 'Календар місяця (Сьогодні: ' + today + ')';
        renderCalendar();
      } else {
        document.getElementById('tab-stats').classList.add('active');
        document.getElementById('nav-stats').classList.add('active');
        document.getElementById('header-title').innerText = 'Аналітика прогресу та статуси';
        updateCharts();
      }
    }

    function selectColor(color) {
      selectedColor = color;
      document.querySelectorAll('.color-option').forEach(opt => {
        if (opt.getAttribute('style').includes(color)) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });
    }

    function chooseDay(day) {
      selectedDay = String(day);
      document.getElementById('selected-day-label').innerText = 'День ' + selectedDay;
      document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected-cell'));
      const activeCell = document.getElementById('cell-' + day);
      if (activeCell) activeCell.classList.add('selected-cell');
    }

    async function fetchTasks() {
      const res = await fetch('/api/tasks');
      cachedTasks = await res.json();
      return cachedTasks;
    }

    function renderKanban() {
      const lists = {
        todo: document.getElementById('list-todo'),
        in_progress: document.getElementById('list-in_progress'),
        done: document.getElementById('list-done')
      };

      Object.values(lists).forEach(list => list.innerHTML = '');
      const counts = { todo: 0, in_progress: 0, done: 0 };

      cachedTasks.forEach(task => {
        const status = task.status || 'todo';
        if (counts[status] !== undefined) counts[status]++;

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = \`
          <div class="kanban-card-title">
            <div class="task-dot" style="background: \${task.color};"></div>
            <span>\${task.title}</span>
          </div>
          <div class="kanban-card-footer">
            <span>📅 День \${task.day}</span>
            <div class="kanban-actions">
              \${status !== 'todo' ? \`<button title="Назад" onclick="updateStatus('\${task.id}', '\${status === 'done' ? 'in_progress' : 'todo'}')">◀</button>\` : ''}
              \${status !== 'done' ? \`<button title="Далі" onclick="updateStatus('\${task.id}', '\${status === 'todo' ? 'in_progress' : 'done'}')">▶</button>\` : ''}
              <button title="Видалити" style="color: #f43f5e;" onclick="removeTask('\${task.id}')">✕</button>
            </div>
          </div>
        \`;
        if (lists[status]) lists[status].appendChild(card);
      });

      document.getElementById('badge-todo').innerText = counts.todo;
      document.getElementById('badge-in_progress').innerText = counts.in_progress;
      document.getElementById('badge-done').innerText = counts.done;
    }

    function renderCalendar() {
      const calendar = document.getElementById('calendar');
      calendar.innerHTML = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
        .map(d => \`<div class="weekday-header">\${d}</div>\`).join('');

      for (let i = 0; i < 3; i++) {
        const empty = document.createElement('div');
        empty.className = 'day-cell empty';
        calendar.appendChild(empty);
      }

      for (let d = 1; d <= 31; d++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell' + (selectedDay == d ? ' selected-cell' : '') + (d === today ? ' today-cell' : '');
        cell.id = 'cell-' + d;
        cell.onclick = () => chooseDay(d);

        cell.innerHTML = \`
          <div class="day-header">
            <span>\${d} \${d === today ? '(Сьогодні)' : ''}</span>
            <span style="color: #38bdf8; font-size: 10px;" id="count-\${d}"></span>
          </div>
          <div class="tasks-container" id="day-\${d}"></div>
        \`;
        calendar.appendChild(cell);
      }

      const counts = {};
      cachedTasks.forEach(task => {
        const d = task.day || '1';
        counts[d] = (counts[d] || 0) + 1;
        const container = document.getElementById('day-' + d);
        if (container) {
          const div = document.createElement('div');
          div.className = 'task-card';
          div.innerHTML = \`
            <div class="task-left">
              <div class="task-dot" style="background: \${task.color || '#22c55e'};"></div>
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${task.title}</span>
              \${task.status === 'done' ? '<span class="task-done-badge">✓</span>' : ''}
            </div>
            <div class="actions">
              <button onclick="event.stopPropagation(); removeTask('\${task.id}')">✕</button>
            </div>
          \`;
          container.appendChild(div);
        }
      });

      Object.keys(counts).forEach(d => {
        const b = document.getElementById('count-' + d);
        if (b) b.innerText = counts[d] > 0 ? counts[d] : '';
      });
    }

    function updateCharts() {
      document.getElementById('stats-today-heading').innerText = 'Задачі на сьогодні (' + today + ' число)';
      const todayTasks = cachedTasks.filter(t => String(t.day) === String(today));

      const tTodo = todayTasks.filter(t => (t.status || 'todo') === 'todo').length;
      const tInProg = todayTasks.filter(t => t.status === 'in_progress').length;
      const tDone = todayTasks.filter(t => t.status === 'done').length;

      document.getElementById('today-total').innerText = todayTasks.length;
      document.getElementById('today-todo').innerText = tTodo;
      document.getElementById('today-in_progress').innerText = tInProg;
      document.getElementById('today-done').innerText = tDone;
      setStatusGradient('today-chart', tTodo, tInProg, tDone, todayTasks.length);

      const totalTasks = cachedTasks.length;
      const mTodo = cachedTasks.filter(t => (t.status || 'todo') === 'todo').length;
      const mInProg = cachedTasks.filter(t => t.status === 'in_progress').length;
      const mDone = cachedTasks.filter(t => t.status === 'done').length;

      document.getElementById('month-total').innerText = totalTasks;
      document.getElementById('month-todo').innerText = mTodo;
      document.getElementById('month-in_progress').innerText = mInProg;
      document.getElementById('month-done').innerText = mDone;
      setStatusGradient('total-chart', mTodo, mInProg, mDone, totalTasks);

      const rate = totalTasks > 0 ? Math.round((mDone / totalTasks) * 100) : 0;
      document.getElementById('kpi-rate').innerText = rate + '%';
      document.getElementById('kpi-in-prog').innerText = mInProg;

      const rUrgent = cachedTasks.filter(t => t.color === '#ef4444' && t.status !== 'done').length;
      document.getElementById('kpi-urgent').innerText = rUrgent;

      const rRed = cachedTasks.filter(t => t.color === '#ef4444').length;
      const rYellow = cachedTasks.filter(t => t.color === '#eab308').length;
      const rGreen = cachedTasks.filter(t => t.color === '#22c55e').length;

      document.getElementById('prio-red-count').innerText = rRed;
      document.getElementById('prio-yellow-count').innerText = rYellow;
      document.getElementById('prio-green-count').innerText = rGreen;

      document.getElementById('prio-red-bar').style.width = totalTasks > 0 ? ((rRed / totalTasks) * 100) + '%' : '0%';
      document.getElementById('prio-yellow-bar').style.width = totalTasks > 0 ? ((rYellow / totalTasks) * 100) + '%' : '0%';
      document.getElementById('prio-green-bar').style.width = totalTasks > 0 ? ((rGreen / totalTasks) * 100) + '%' : '0%';

      const recentListEl = document.getElementById('recent-done-list');
      const doneTasks = cachedTasks.filter(t => t.status === 'done').slice(-4).reverse();

      if (doneTasks.length === 0) {
        recentListEl.innerHTML = '<div class="recent-empty">Ще немає виконаних задач</div>';
      } else {
        recentListEl.innerHTML = doneTasks.map(t => \`
          <div class="recent-item">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #22c55e;">✓</span>
              <span>\${t.title}</span>
            </div>
            <span style="color: #64748b; font-size: 11px;">День \${t.day}</span>
          </div>
        \`).join('');
      }
    }

    function setStatusGradient(elementId, todo, inProg, done, total) {
      const el = document.getElementById(elementId);
      if (total === 0) {
        el.style.background = '#1e293b';
        return;
      }
      const p1 = (todo / total) * 100;
      const p2 = p1 + (inProg / total) * 100;

      el.style.background = \`conic-gradient(
        #94a3b8 0% \${p1}%,
        #38bdf8 \${p1}% \${p2}%,
        #22c55e \${p2}% 100%
      )\`;
    }

    async function addKanbanTask() {
      const input = document.getElementById('kanban-title');
      const title = input.value.trim();
      if (!title) return;

      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, day: today, color: selectedColor, status: 'todo' })
      });
      input.value = '';
      await refresh();
    }

    async function addCalendarTask() {
      const input = document.getElementById('calendar-title');
      const title = input.value.trim();
      if (!title) return;

      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, day: selectedDay, color: selectedColor, status: 'todo' })
      });
      input.value = '';
      await refresh();
    }

    async function updateStatus(id, newStatus) {
      await fetch('/api/tasks/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await refresh();
    }

    async function removeTask(id) {
      await fetch('/api/tasks/' + id, { method: 'DELETE' });
      await refresh();
    }

    async function refresh() {
      await fetchTasks();
      const activeTab = document.querySelector('.content.active').id;
      if (activeTab === 'tab-kanban') renderKanban();
      else if (activeTab === 'tab-calendar') renderCalendar();
      else if (activeTab === 'tab-stats') updateCharts();
    }

    // Init
    document.getElementById('selected-day-label').innerText = 'День ' + selectedDay;
    fetchTasks().then(() => renderKanban());
  </script>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущено! Відкрий: http://localhost:${PORT}`);
});