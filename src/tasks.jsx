/* ============================================================
   Task Manager — Table + Board views, statuses, labels, sub-tasks
   ============================================================ */

const LEVELS = ['Easy', 'Normal', 'Hard', 'Expert'];
const LEVEL_COLORS = {
  Easy: 'var(--level-easy)',
  Normal: 'var(--level-normal)',
  Hard: 'var(--level-hard)',
  Expert: 'var(--level-expert)',
};
const RANKS = ['Low', 'Medium', 'High', 'Critical'];
const RANK_COLORS = {
  Low: 'var(--rank-low)',
  Medium: 'var(--rank-medium)',
  High: 'var(--rank-high)',
  Critical: 'var(--rank-critical)',
};

const tasksStyles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%' },
  toolbar: { padding: '14px 22px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  viewToggle: { display: 'flex', background: 'var(--bg-soil)', border: '1px solid var(--line)', borderRadius: 6, padding: 3, gap: 2 },
  viewBtn: (a) => ({ padding: '5px 10px', borderRadius: 4, border: 'none', background: a ? 'var(--panel-raised)' : 'transparent', color: a ? 'var(--ink)' : 'var(--muted)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-jp)' }),
  body: { flex: 1, overflow: 'auto' },

  // Table
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 14px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--panel-solid)', zIndex: 5 },
  td: { padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', verticalAlign: 'top' },
  rowGroup: { background: 'rgba(255,255,255,0.012)' },
  expander: { width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: 6, color: 'var(--muted)', transition: 'transform 0.15s' },

  // Board
  board: { display: 'flex', gap: 16, padding: 20, minHeight: '100%', alignItems: 'flex-start' },
  column: { width: 280, flexShrink: 0, background: 'var(--bg-soil)', border: '1px solid var(--line)', borderRadius: 10, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100% - 0px)' },
  colHead: { padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 },
  colTitle: { fontFamily: 'var(--font-jp)', fontSize: 13, fontWeight: 500 },
  colCount: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', background: 'var(--bg-rust)', padding: '1px 6px', borderRadius: 99 },
  colBody: { padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' },

  card: { background: 'var(--panel-raised)', border: '1px solid var(--line)', borderRadius: 8, padding: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.15s' },
  cardTitle: { fontFamily: 'var(--font-jp)', fontSize: 13, fontWeight: 500, lineHeight: 1.3 },
  cardMeta: { display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' },

  progressBar: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' },
};

const TaskManager = () => {
  const s = window.useStore();
  const [view, setView] = React.useState('board');
  const [filter, setFilter] = React.useState({ status: 'all', label: 'all', search: '' });
  const [editingTask, setEditingTask] = React.useState(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState({});

  const tasks = s.tasks.items;
  const statuses = s.tasks.statuses;
  const labels = s.tasks.labels;

  const matches = (t) => {
    if (filter.status !== 'all' && t.statusId !== filter.status) return false;
    if (filter.label !== 'all' && !t.labelIds.includes(filter.label)) return false;
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  };

  const parentTasks = tasks.filter(t => !t.parentId && matches(t));
  const childrenOf = (id) => tasks.filter(t => t.parentId === id);

  return (
    <div style={tasksStyles.container}>
      {/* Toolbar */}
      <div style={tasksStyles.toolbar}>
        <div style={tasksStyles.viewToggle}>
          <button style={tasksStyles.viewBtn(view === 'board')} onClick={() => setView('board')}>
            <window.Icon name="kanban" size={13} /> Board
          </button>
          <button style={tasksStyles.viewBtn(view === 'table')} onClick={() => setView('table')}>
            <window.Icon name="table" size={13} /> Table
          </button>
          <button style={tasksStyles.viewBtn(view === 'roadmap')} onClick={() => setView('roadmap')}>
            <window.Icon name="calendar" size={13} /> Roadmap
          </button>
        </div>

        <select className="select-input" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="all">All status</option>
          {statuses.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
        </select>

        <select className="select-input" value={filter.label} onChange={e => setFilter({ ...filter, label: e.target.value })}>
          <option value="all">All labels</option>
          {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <div style={{ position: 'relative' }}>
          <window.Icon name="search" size={14} />
          <input
            type="text"
            placeholder="検索…"
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
            className="text-input"
            style={{ paddingLeft: 26, width: 160 }}
          />
          <span style={{ position: 'absolute', left: 8, top: 9, color: 'var(--muted)', pointerEvents: 'none' }}>
            <window.Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn ghost small" onClick={() => setShowSettings(!showSettings)}>
          ステータス & ラベル
        </button>
        <button className="btn primary small" onClick={() => setNewTaskOpen(true)}>
          <window.Icon name="plus" size={12} /> 新規タスク
        </button>
      </div>

      {/* Body */}
      <div style={tasksStyles.body}>
        {view === 'board' ? (
          <BoardView
            statuses={statuses}
            labels={labels}
            tasks={tasks}
            parentTasks={parentTasks}
            childrenOf={childrenOf}
            setEditingTask={setEditingTask}
          />
        ) : view === 'table' ? (
          <TableView
            statuses={statuses}
            labels={labels}
            tasks={tasks}
            parentTasks={parentTasks}
            childrenOf={childrenOf}
            expanded={expanded}
            setExpanded={setExpanded}
            setEditingTask={setEditingTask}
          />
        ) : (
          <RoadmapView
            statuses={statuses}
            labels={labels}
            tasks={tasks}
            parentTasks={parentTasks}
            setEditingTask={setEditingTask}
          />
        )}
      </div>

      {/* Detail */}
      {editingTask && <TaskDetail task={editingTask} onClose={() => setEditingTask(null)} statuses={statuses} labels={labels} tasks={tasks} />}
      {newTaskOpen && <TaskDetail task={null} onClose={() => setNewTaskOpen(false)} statuses={statuses} labels={labels} tasks={tasks} />}
      {showSettings && <TaskSettings statuses={statuses} labels={labels} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

/* ---------- Board ---------- */
const BoardView = ({ statuses, labels, tasks, parentTasks, childrenOf, setEditingTask }) => {
  const tasksByStatus = (statusId) => parentTasks.filter(t => t.statusId === statusId);
  return (
    <div style={tasksStyles.board}>
      {statuses.map(st => {
        const colTasks = tasksByStatus(st.id);
        return (
          <div key={st.id} style={tasksStyles.column}>
            <div style={tasksStyles.colHead}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: st.color }} />
              <span style={tasksStyles.colTitle}>{st.name}</span>
              <span style={tasksStyles.colCount}>{colTasks.length}</span>
            </div>
            <div style={tasksStyles.colBody}>
              {colTasks.map(t => (
                <TaskCard key={t.id} task={t} labels={labels} statuses={statuses} children={childrenOf(t.id)} onClick={() => setEditingTask(t)} />
              ))}
              {colTasks.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: 11, padding: '20px 8px', textAlign: 'center', fontFamily: 'var(--font-jp)' }}>
                  タスクなし
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Task Card ---------- */
const TaskCard = ({ task, labels, statuses, children, onClick }) => {
  const taskLabels = task.labelIds.map(id => labels.find(l => l.id === id)).filter(Boolean);
  const doneStatusId = statuses.find(st => /done|完了/i.test(st.name))?.id;
  const childCount = children.length;
  const doneChildren = children.filter(c => c.statusId === doneStatusId).length;
  const pct = childCount > 0 ? Math.round(doneChildren / childCount * 100) : 0;

  return (
    <div style={tasksStyles.card} onClick={onClick} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--dust-soft)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={tasksStyles.cardTitle}>{task.title}</div>
        </div>
        <span className="tag" style={{ color: RANK_COLORS[task.rank], flexShrink: 0 }}>
          <span className="dot" />{task.rank}
        </span>
      </div>

      <div style={tasksStyles.cardMeta}>
        <span className="tag" style={{ color: LEVEL_COLORS[task.level] }}>{task.level}</span>
        {taskLabels.map(l => <span key={l.id} className="tag" style={{ color: l.color }}>{l.name}</span>)}
      </div>

      {childCount > 0 && <ProgressBar done={doneChildren} total={childCount} />}
    </div>
  );
};

const ProgressBar = ({ done, total }) => {
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  const segs = 10;
  const filled = Math.round((done / total) * segs);
  return (
    <div style={tasksStyles.progressBar}>
      <span>{done}/{total}</span>
      <span style={{ letterSpacing: 1 }}>
        {Array(segs).fill(0).map((_, i) => i < filled ? '■' : '□').join('')}
      </span>
      <span>{pct}%</span>
    </div>
  );
};

/* ---------- Table ---------- */
const TableView = ({ statuses, labels, tasks, parentTasks, childrenOf, expanded, setExpanded, setEditingTask }) => {
  return (
    <table style={tasksStyles.table}>
      <thead>
        <tr>
          <th style={{ ...tasksStyles.th, width: 36 }}></th>
          <th style={tasksStyles.th}>タスク</th>
          <th style={{ ...tasksStyles.th, width: 130 }}>ステータス</th>
          <th style={{ ...tasksStyles.th, width: 200 }}>ラベル</th>
          <th style={{ ...tasksStyles.th, width: 90 }}>レベル</th>
          <th style={{ ...tasksStyles.th, width: 100 }}>ランク</th>
          <th style={{ ...tasksStyles.th, width: 180 }}>進捗</th>
        </tr>
      </thead>
      <tbody>
        {parentTasks.map(t => {
          const childList = childrenOf(t.id);
          const exp = expanded[t.id];
          return (
            <React.Fragment key={t.id}>
              <TableRow task={t} statuses={statuses} labels={labels} children={childList} onClick={() => setEditingTask(t)} hasChildren={childList.length > 0} expanded={exp} onToggle={() => setExpanded({ ...expanded, [t.id]: !exp })} doneStatusId={statuses.find(st => /done|完了/i.test(st.name))?.id} />
              {exp && childList.map(c => (
                <TableRow key={c.id} task={c} statuses={statuses} labels={labels} children={[]} onClick={() => setEditingTask(c)} hasChildren={false} indent />
              ))}
            </React.Fragment>
          );
        })}
        {parentTasks.length === 0 && (
          <tr><td colSpan={7}><div className="empty">タスクなし — 新規タスクを作成</div></td></tr>
        )}
      </tbody>
    </table>
  );
};

const TableRow = ({ task, statuses, labels, children, onClick, hasChildren, expanded, onToggle, indent, doneStatusId }) => {
  const status = statuses.find(s => s.id === task.statusId);
  const taskLabels = task.labelIds.map(id => labels.find(l => l.id === id)).filter(Boolean);
  const childCount = children.length;
  const doneChildren = children.filter(c => c.statusId === doneStatusId).length;
  return (
    <tr style={{ cursor: 'pointer' }} onClick={onClick} onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,123,74,0.04)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
      <td style={tasksStyles.td} onClick={e => { if (hasChildren) { e.stopPropagation(); onToggle(); } }}>
        {hasChildren && (
          <span style={{ ...tasksStyles.expander, transform: expanded ? 'rotate(90deg)' : 'none' }}>
            <window.Icon name="chevron" size={12} />
          </span>
        )}
      </td>
      <td style={{ ...tasksStyles.td, paddingLeft: indent ? 40 : undefined }}>
        <div style={{ fontFamily: 'var(--font-jp)', fontSize: 13, color: indent ? 'var(--ink-soft)' : 'var(--ink)' }}>
          {indent && <span style={{ color: 'var(--muted)', marginRight: 6 }}>↳</span>}
          {task.title}
        </div>
        {task.note && !indent && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontFamily: 'var(--font-jp)' }}>{task.note}</div>
        )}
      </td>
      <td style={tasksStyles.td}>
        {status && (
          <span className="tag" style={{ color: status.color }}>
            <span className="dot" />{status.name}
          </span>
        )}
      </td>
      <td style={tasksStyles.td}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {taskLabels.map(l => <span key={l.id} className="tag" style={{ color: l.color }}>{l.name}</span>)}
        </div>
      </td>
      <td style={tasksStyles.td}>
        <span className="tag" style={{ color: LEVEL_COLORS[task.level] }}>{task.level}</span>
      </td>
      <td style={tasksStyles.td}>
        <span className="tag" style={{ color: RANK_COLORS[task.rank] }}>
          <span className="dot" />{task.rank}
        </span>
      </td>
      <td style={tasksStyles.td}>
        {childCount > 0 && <ProgressBar done={doneChildren} total={childCount} />}
      </td>
    </tr>
  );
};

/* ---------- Roadmap ---------- */
const RoadmapView = ({ tasks, parentTasks, statuses, setEditingTask }) => {
  const today = new Date();
  const taskDates = parentTasks.flatMap(t => [t.startDate, t.endDate].filter(Boolean)).map(d => new Date(d));

  let rangeStart, rangeEnd;
  if (taskDates.length) {
    const minT = Math.min(...taskDates.map(d => d.getTime()));
    const maxT = Math.max(...taskDates.map(d => d.getTime()));
    rangeStart = new Date(minT - 14 * 86400000);
    rangeEnd = new Date(maxT + 14 * 86400000);
  } else {
    rangeStart = new Date(today.getTime() - 14 * 86400000);
    rangeEnd = new Date(today.getTime() + 60 * 86400000);
  }

  // Snap start to Monday
  const dow = rangeStart.getDay();
  rangeStart.setDate(rangeStart.getDate() - (dow === 0 ? 6 : dow - 1));

  const totalDays = Math.ceil((rangeEnd - rangeStart) / 86400000) + 1;
  const DAY_W = 26;
  const ROW_H = 44;
  const LEFT_W = 240;
  const HEADER_H = 48;

  const dayOffset = (dateStr) => {
    if (!dateStr) return null;
    return Math.round((new Date(dateStr) - rangeStart) / 86400000);
  };
  const todayOff = Math.round((today - rangeStart) / 86400000);

  // Month segments for header
  const months = [];
  let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (cur <= rangeEnd) {
    const startOff = Math.max(0, Math.round((cur - rangeStart) / 86400000));
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const endOff = Math.round((next - rangeStart) / 86400000);
    months.push({ label: cur.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }), startOff, endOff });
    cur = next;
  }

  const getStatusColor = (t) => statuses.find(s => s.id === t.statusId)?.color || 'var(--dust)';

  const bodyStyle = { display: 'flex', height: '100%', overflow: 'hidden' };
  const leftHeadStyle = { height: HEADER_H, borderBottom: '1px solid var(--line)', padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--panel-solid)', position: 'sticky', top: 0, zIndex: 2 };
  const leftRowStyle = (i) => ({ height: ROW_H, borderBottom: '1px solid var(--line-soft)', padding: '0 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' });

  return (
    <div style={bodyStyle}>
      {/* Left fixed panel */}
      <div style={{ width: LEFT_W, flexShrink: 0, borderRight: '1px solid var(--line)', overflowY: 'auto' }}>
        <div style={leftHeadStyle}>タスク / 担当者</div>
        {parentTasks.length === 0 && (
          <div style={{ padding: 20, color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-jp)', textAlign: 'center' }}>タスクなし — 新規タスクを作成</div>
        )}
        {parentTasks.map((t, i) => (
          <div key={t.id} style={leftRowStyle(i)} onClick={() => setEditingTask(t)}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-jp)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
            {t.assignees && t.assignees.length > 0 && (
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {t.assignees.map((a, j) => (
                  <span key={j} style={{ fontSize: 9, background: 'var(--bg-rust)', color: 'var(--muted)', padding: '1px 5px', borderRadius: 99, fontFamily: 'var(--font-jp)' }}>{a}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right scrollable timeline */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ width: totalDays * DAY_W, position: 'relative', minHeight: '100%' }}>
          {/* Month header */}
          <div style={{ height: HEADER_H, borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 2, background: 'var(--panel-solid)' }}>
            {months.map((m, i) => (
              <div key={i} style={{ position: 'absolute', left: m.startOff * DAY_W, width: (m.endOff - m.startOff) * DAY_W, height: '100%', borderRight: '1px solid var(--line)', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {m.label}
              </div>
            ))}
          </div>

          {/* Today line */}
          {todayOff >= 0 && todayOff <= totalDays && (
            <div style={{ position: 'absolute', left: todayOff * DAY_W + DAY_W / 2 - 0.5, top: HEADER_H, bottom: 0, width: 1, background: 'var(--dust)', opacity: 0.6, zIndex: 3, pointerEvents: 'none' }} />
          )}

          {/* Rows */}
          {parentTasks.map((t, i) => {
            const startOff = dayOffset(t.startDate);
            const endOff = dayOffset(t.endDate);
            const hasBar = startOff !== null && endOff !== null && endOff >= startOff;
            const color = getStatusColor(t);
            return (
              <div key={t.id} style={{ height: ROW_H, borderBottom: '1px solid var(--line-soft)', position: 'relative', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}>
                {/* Weekly grid lines */}
                {Array.from({ length: Math.ceil(totalDays / 7) + 1 }, (_, wi) => (
                  <div key={wi} style={{ position: 'absolute', left: wi * 7 * DAY_W, top: 0, bottom: 0, width: 1, background: 'var(--line-soft)', opacity: 0.4 }} />
                ))}
                {hasBar ? (
                  <div
                    style={{ position: 'absolute', left: startOff * DAY_W + 2, width: Math.max(DAY_W, (endOff - startOff + 1) * DAY_W) - 4, top: '50%', transform: 'translateY(-50%)', height: 22, background: color, opacity: 0.85, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 8px', overflow: 'hidden' }}
                    onClick={() => setEditingTask(t)}
                    title={`${t.startDate} → ${t.endDate}`}
                  >
                    <span style={{ fontSize: 10, color: '#fff', fontFamily: 'var(--font-jp)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                  </div>
                ) : (
                  todayOff >= 0 && (
                    <div style={{ position: 'absolute', left: todayOff * DAY_W + DAY_W / 2 - 3, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: 99, background: color, opacity: 0.45 }} />
                  )
                )}
              </div>
            );
          })}
          {parentTasks.length === 0 && (
            <div style={{ padding: 40, color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-jp)', textAlign: 'center' }}>タスクなし</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Date picker ---------- */
const DatePicker = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const [viewDate, setViewDate] = React.useState(() => {
    if (value) { const [y, m] = value.split('-').map(Number); return new Date(y, m - 1, 1); }
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const selectDate = (d) => {
    onChange(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    setOpen(false);
  };

  const btnStyle = { background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px 8px', fontSize: 12 };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--line)', background: 'var(--bg-soil)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-jp)', fontSize: 13, color: 'var(--ink)' }}
      >
        <window.Icon name="calendar" size={12} />
        <span style={{ color: value ? 'var(--ink)' : 'var(--muted)' }}>{value || placeholder || '日付を選択'}</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', zIndex: 300, top: 'calc(100% + 4px)', left: 0, background: 'var(--panel-raised)', border: '1px solid var(--line)', borderRadius: 8, padding: 12, width: 220, boxShadow: 'var(--shadow-deep)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button type="button" style={btnStyle} onClick={() => setViewDate(new Date(year, month - 1, 1))}>◀</button>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-jp)', color: 'var(--dust)', letterSpacing: '0.1em' }}>{year}年 {month + 1}月</span>
            <button type="button" style={btnStyle} onClick={() => setViewDate(new Date(year, month + 1, 1))}>▶</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 4 }}>
            {['月','火','水','木','金','土','日'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'var(--muted)', padding: '2px 0' }}>{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {week.map((day, di) => {
                if (!day) return <div key={di} style={{ aspectRatio: '1' }} />;
                const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const isSel = value === ds, isTod = today === ds;
                return (
                  <button
                    key={di} type="button" onClick={() => selectDate(day)}
                    style={{ aspectRatio: '1', border: 'none', borderRadius: 4, cursor: 'pointer', background: isSel ? 'var(--dust)' : isTod ? 'rgba(201,123,74,0.12)' : 'transparent', color: isSel ? '#1a1410' : isTod ? 'var(--dust)' : 'var(--ink-soft)', fontSize: 11, fontFamily: 'var(--font-jp)', outline: isTod && !isSel ? '1px solid rgba(201,123,74,0.4)' : 'none' }}
                  >{day}</button>
                );
              })}
            </div>
          ))}
          {value && (
            <button
              type="button" onClick={() => { onChange(null); setOpen(false); }}
              style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-jp)', borderTop: '1px solid var(--line)', paddingTop: 8 }}
            >クリア</button>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- Task detail / edit ---------- */
const TaskDetail = ({ task, onClose, statuses, labels, tasks }) => {
  const isNew = !task;
  const [draft, setDraft] = React.useState(task
    ? { assignees: [], startDate: null, endDate: null, ...task }
    : { title: '', note: '', statusId: statuses[0]?.id, labelIds: [], level: 'Normal', rank: 'Medium', parentId: null, assignees: [], startDate: null, endDate: null }
  );
  const isChild = !!draft.parentId;
  const childList = !isNew && !isChild ? tasks.filter(t => t.parentId === task.id) : [];
  const doneStatusId = statuses.find(st => /done|完了/i.test(st.name))?.id;
  const [newChildTitle, setNewChildTitle] = React.useState('');

  const save = () => {
    if (!draft.title.trim()) return;
    if (isNew) window.Store.addTask(draft);
    else window.Store.updateTask(task.id, draft);
    onClose();
  };

  const remove = () => {
    if (!isNew) {
      window.Store.deleteTask(task.id);
      onClose();
    }
  };

  const addChild = () => {
    if (!newChildTitle.trim() || isNew) return;
    window.Store.addTask({ title: newChildTitle, parentId: task.id, statusId: statuses[0]?.id, level: 'Normal', rank: 'Medium' });
    setNewChildTitle('');
  };

  return (
    <div className="modal-scrim" onClick={onClose} style={{ zIndex: 110 }}>
      <div className="modal medium" onClick={e => e.stopPropagation()} style={{ maxHeight: '88vh' }}>
        <div className="modal-head">
          <div className="title" style={{ flex: 1 }}>
            {isNew ? '新規タスク' : (isChild ? 'サブタスク' : 'タスク')}
          </div>
          <button className="modal-close" onClick={onClose}><window.Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            className="text-input"
            placeholder="タスク名"
            value={draft.title}
            onChange={e => setDraft({ ...draft, title: e.target.value })}
            style={{ fontSize: 16, padding: '12px 14px', fontFamily: 'var(--font-jp)' }}
            autoFocus
          />
          <textarea
            className="text-input"
            placeholder="ノート…"
            rows={3}
            value={draft.note || ''}
            onChange={e => setDraft({ ...draft, note: e.target.value })}
            style={{ resize: 'vertical', fontFamily: 'var(--font-jp)' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="ステータス">
              <select className="select-input" value={draft.statusId} onChange={e => setDraft({ ...draft, statusId: e.target.value })}>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="親タスク">
              <select className="select-input" value={draft.parentId || ''} onChange={e => setDraft({ ...draft, parentId: e.target.value || null })}>
                <option value="">なし（親タスク）</option>
                {tasks.filter(t => !t.parentId && t.id !== draft.id).map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </Field>
            <Field label="レベル">
              <div style={{ display: 'flex', gap: 4 }}>
                {LEVELS.map(lv => (
                  <button key={lv} className={'btn small ' + (draft.level === lv ? 'primary' : 'ghost')} style={{ flex: 1 }} onClick={() => setDraft({ ...draft, level: lv })}>
                    {lv}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="ランク">
              <div style={{ display: 'flex', gap: 4 }}>
                {RANKS.map(r => (
                  <button key={r} className={'btn small ' + (draft.rank === r ? 'primary' : 'ghost')} style={{ flex: 1 }} onClick={() => setDraft({ ...draft, rank: r })}>
                    {r}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label="ラベル">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {labels.map(l => {
                const on = draft.labelIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => setDraft({ ...draft, labelIds: on ? draft.labelIds.filter(x => x !== l.id) : [...draft.labelIds, l.id] })}
                    className="tag"
                    style={{ color: l.color, opacity: on ? 1 : 0.5, cursor: 'pointer', border: '1px solid currentColor', padding: '4px 10px' }}
                  >
                    <span className="dot" />{l.name}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="担当者">
            <input
              className="text-input"
              placeholder="担当者（カンマ区切り）"
              value={(draft.assignees || []).join(', ')}
              onChange={e => setDraft({ ...draft, assignees: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              style={{ fontFamily: 'var(--font-jp)' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="開始日">
              <DatePicker value={draft.startDate} onChange={d => setDraft({ ...draft, startDate: d })} placeholder="開始日" />
            </Field>
            <Field label="終了日">
              <DatePicker value={draft.endDate} onChange={d => setDraft({ ...draft, endDate: d })} placeholder="終了日" />
            </Field>
          </div>

          {/* Subtasks */}
          {!isNew && !isChild && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>サブタスク</span>
                {childList.length > 0 && (
                  <ProgressBar done={childList.filter(c => c.statusId === doneStatusId).length} total={childList.length} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {childList.map(c => {
                  const isDone = c.statusId === doneStatusId;
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-soil)' }}>
                      <button
                        onClick={() => window.Store.updateTask(c.id, { statusId: isDone ? statuses[0].id : doneStatusId })}
                        style={{ width: 14, height: 14, border: '1px solid var(--line)', background: isDone ? 'var(--moss)' : 'transparent', borderColor: isDone ? 'var(--moss)' : 'var(--line)', borderRadius: 3, cursor: 'pointer', padding: 0 }}
                      >
                        {isDone && <window.Icon name="check" size={10} />}
                      </button>
                      <span style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-jp)', textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--muted)' : 'var(--ink)' }}>
                        {c.title}
                      </span>
                      <span className="tag" style={{ color: LEVEL_COLORS[c.level], fontSize: 9 }}>{c.level}</span>
                      <button className="btn small ghost" onClick={() => window.Store.deleteTask(c.id)} title="削除">
                        <window.Icon name="trash" size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="text-input"
                  placeholder="サブタスクを追加…"
                  value={newChildTitle}
                  onChange={e => setNewChildTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChild()}
                  style={{ flex: 1, fontFamily: 'var(--font-jp)' }}
                />
                <button className="btn primary" onClick={addChild}>追加</button>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {!isNew ? (
            <button className="btn ghost" onClick={remove} style={{ color: 'var(--rank-critical)' }}>
              <window.Icon name="trash" size={12} /> 削除
            </button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={onClose}>キャンセル</button>
            <button className="btn primary" onClick={save}>{isNew ? '作成' : '保存'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
    {children}
  </div>
);

/* ---------- Status + Label settings ---------- */
const TaskSettings = ({ statuses, labels, onClose }) => {
  const [newStatus, setNewStatus] = React.useState('');
  const [newLabel, setNewLabel] = React.useState('');
  const [renaming, setRenaming] = React.useState({});

  return (
    <div className="modal-scrim" onClick={onClose} style={{ zIndex: 120 }}>
      <div className="modal medium" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="title" style={{ flex: 1 }}>ステータス & ラベル</div>
          <button className="modal-close" onClick={onClose}><window.Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>ステータス</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {statuses.map(st => (
                <ItemRow
                  key={st.id}
                  item={st}
                  renaming={renaming[st.id]}
                  setRenaming={(v) => setRenaming({ ...renaming, [st.id]: v })}
                  onUpdate={(patch) => window.Store.updateStatus(st.id, patch)}
                  onDelete={() => window.Store.deleteStatus(st.id)}
                  disableDelete={statuses.length <= 1}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input className="text-input" placeholder="新規ステータス" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && newStatus.trim() && (window.Store.addStatus(newStatus.trim()), setNewStatus(''))} />
              <button className="btn primary" onClick={() => { if (newStatus.trim()) { window.Store.addStatus(newStatus.trim()); setNewStatus(''); } }}>追加</button>
            </div>
          </section>

          <section>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>ラベル</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {labels.map(l => (
                <ItemRow
                  key={l.id}
                  item={l}
                  renaming={renaming[l.id]}
                  setRenaming={(v) => setRenaming({ ...renaming, [l.id]: v })}
                  onUpdate={(patch) => window.Store.updateLabel(l.id, patch)}
                  onDelete={() => window.Store.deleteLabel(l.id)}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input className="text-input" placeholder="新規ラベル" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && newLabel.trim() && (window.Store.addLabel(newLabel.trim(), randomLabelColor()), setNewLabel(''))} />
              <button className="btn primary" onClick={() => { if (newLabel.trim()) { window.Store.addLabel(newLabel.trim(), randomLabelColor()); setNewLabel(''); } }}>追加</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ItemRow = ({ item, renaming, setRenaming, onUpdate, onDelete, disableDelete }) => {
  const [draftName, setDraftName] = React.useState(item.name);
  React.useEffect(() => setDraftName(item.name), [item.name]);
  const colorPalette = ['#c97b4a', '#5b8aa4', '#6f8a5b', '#a08456', '#a64a3a', '#7a4a90', '#4a8a86', '#888888'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-soil)' }}>
      <div style={{ position: 'relative' }}>
        <input type="color" value={item.color} onChange={e => onUpdate({ color: e.target.value })} style={{ width: 24, height: 24, border: '1px solid var(--line)', borderRadius: 4, background: 'transparent', cursor: 'pointer', padding: 0 }} />
      </div>
      {renaming ? (
        <input
          className="text-input"
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onBlur={() => { onUpdate({ name: draftName }); setRenaming(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onUpdate({ name: draftName }); setRenaming(false); } if (e.key === 'Escape') { setDraftName(item.name); setRenaming(false); } }}
          autoFocus
          style={{ flex: 1, padding: '4px 8px', fontFamily: 'var(--font-jp)' }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--font-jp)', color: item.color }}>{item.name}</span>
      )}
      <button className="btn small ghost" onClick={() => setRenaming(!renaming)}>
        <window.Icon name="edit" size={11} />
      </button>
      {!disableDelete && (
        <button className="btn small ghost" onClick={onDelete} style={{ color: 'var(--rank-critical)' }}>
          <window.Icon name="trash" size={11} />
        </button>
      )}
    </div>
  );
};

const randomLabelColor = () => ['#c97b4a', '#5b8aa4', '#6f8a5b', '#a08456', '#a64a3a', '#7a4a90', '#4a8a86'][Math.floor(Math.random() * 7)];

window.TaskManager = TaskManager;
