/* ============================================================
   Timer — Pomodoro w/ dial + numeric, cycles, fullscreen
   ============================================================ */

const timerStyles = {
  body: { padding: 28, display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'stretch' },
  topRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' },

  dialWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  numericWrap: { display: 'flex', flexDirection: 'column', gap: 14 },
  numericRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  numericInputs: { display: 'flex', alignItems: 'center', gap: 6 },
  num: { width: 64, padding: '12px 8px', textAlign: 'center', fontSize: 22, fontFamily: 'var(--font-jp)', background: 'var(--bg-soil)', border: '1px solid var(--line)', color: 'var(--ink)', borderRadius: 6 },
  numLabel: { fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' },

  controlRow: { display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--line)' },
  bigBtn: (primary) => ({
    padding: '12px 28px',
    fontSize: 14,
    fontFamily: 'var(--font-jp)',
    letterSpacing: '0.1em',
    border: '1px solid ' + (primary ? 'var(--dust)' : 'var(--line)'),
    background: primary ? 'linear-gradient(180deg, var(--dust), var(--dust-soft))' : 'var(--panel-raised)',
    color: primary ? '#1a1410' : 'var(--ink-soft)',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }),

  preview: { display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12 },
  previewSeg: (mode, idx, current) => ({
    width: mode === 'work' ? 40 : 16,
    height: 4,
    background: idx === current ? (mode === 'work' ? 'var(--dust)' : 'var(--moss)') : (mode === 'work' ? 'rgba(201,123,74,0.3)' : 'rgba(111,138,91,0.3)'),
    borderRadius: 2,
  }),
};

// ---------- Active timer state — globally accessible so character sits ----------
const TimerEngine = (() => {
  let listeners = new Set();
  let state = {
    running: false,
    paused: false,
    mode: 'idle', // 'work' | 'break' | 'idle'
    cycle: 0,    // current cycle index (0-based)
    totalCycles: 3,
    workMin: 25,
    breakMin: 5,
    secondsLeft: 0,
    phaseSeconds: 0,
  };
  let interval = null;

  const notify = () => listeners.forEach(fn => fn(state));

  const start = (cfg) => {
    state = {
      ...state,
      running: true,
      paused: false,
      mode: 'work',
      cycle: 0,
      totalCycles: cfg.cycles,
      workMin: cfg.workMin,
      breakMin: cfg.breakMin,
      secondsLeft: cfg.workMin * 60,
      phaseSeconds: cfg.workMin * 60,
    };
    if (interval) clearInterval(interval);
    interval = setInterval(tick, 1000);
    // tell world to sit
    window.World?.setSitting?.(true);
    notify();
  };

  const tick = () => {
    if (!state.running || state.paused) return;
    state = { ...state, secondsLeft: state.secondsLeft - 1 };
    // Record stats
    if (state.mode === 'work') window.Store.recordFocusTick(1);
    else if (state.mode === 'break') window.Store.recordBreakTick(1);
    if (state.secondsLeft <= 0) {
      // Advance phase
      if (state.mode === 'work') {
        // Switch to break (unless last cycle, then session done)
        if (state.cycle >= state.totalCycles - 1) {
          // End of session
          window.Store.completeSession();
          window.toast('🌌  集中セッション完了', 'success');
          stop();
          return;
        }
        state = { ...state, mode: 'break', secondsLeft: state.breakMin * 60, phaseSeconds: state.breakMin * 60 };
        window.toast('☕  休憩 ' + state.breakMin + '分', 'success');
      } else {
        state = { ...state, mode: 'work', cycle: state.cycle + 1, secondsLeft: state.workMin * 60, phaseSeconds: state.workMin * 60 };
        window.toast('✨  作業 ' + state.workMin + '分');
      }
    }
    notify();
  };

  const pause = () => { state = { ...state, paused: !state.paused }; notify(); };
  const stop = () => {
    if (interval) { clearInterval(interval); interval = null; }
    state = { ...state, running: false, paused: false, mode: 'idle', secondsLeft: 0 };
    window.World?.setSitting?.(false);
    notify();
  };
  const skip = () => {
    state = { ...state, secondsLeft: 0 };
    tick();
  };

  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const get = () => state;

  return { start, pause, stop, skip, subscribe, get };
})();
window.TimerEngine = TimerEngine;

const useTimer = () => {
  const [t, setT] = React.useState(TimerEngine.get());
  React.useEffect(() => TimerEngine.subscribe(setT), []);
  return t;
};
window.useTimer = useTimer;

const formatTime = (s) => {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
};

const TimerModal = ({ onClose }) => {
  const s = window.useStore();
  const t = window.useTimer();
  const cfg = s.timer;

  const setWork = (v) => window.Store.setTimerConfig({ workMin: Math.max(1, Math.min(120, v)) });
  const setBreak = (v) => window.Store.setTimerConfig({ breakMin: Math.max(1, Math.min(60, v)) });
  const setCycles = (v) => window.Store.setTimerConfig({ cycles: Math.max(1, Math.min(10, v)) });

  const start = () => {
    TimerEngine.start({ workMin: cfg.workMin, breakMin: cfg.breakMin, cycles: cfg.cycles });
    onClose();
  };

  // Build preview segments
  const segments = [];
  for (let i = 0; i < cfg.cycles; i++) {
    segments.push({ kind: 'work', i });
    if (i < cfg.cycles - 1) segments.push({ kind: 'break', i });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal medium" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="title" style={{ flex: 1 }}>タイマー</div>
          <span className="subtitle">FOCUS SESSION</span>
          <button className="modal-close" onClick={onClose}><window.Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body" style={timerStyles.body}>
          <div style={timerStyles.topRow}>
            {/* Dial */}
            <div style={timerStyles.dialWrap}>
              <TimerDial minutes={cfg.workMin} onChange={setWork} label="作業" max={90} />
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                作業時間 — ドラッグで調整
              </div>
            </div>

            {/* Numeric */}
            <div style={timerStyles.numericWrap}>
              <div style={timerStyles.numericRow}>
                <span style={timerStyles.numLabel}>作業 (分)</span>
                <div style={timerStyles.numericInputs}>
                  <button className="btn" onClick={() => setWork(cfg.workMin - 5)}>−5</button>
                  <input className="num" style={timerStyles.num} type="number" value={cfg.workMin} onChange={e => setWork(parseInt(e.target.value) || 1)} />
                  <button className="btn" onClick={() => setWork(cfg.workMin + 5)}>+5</button>
                </div>
              </div>
              <div style={timerStyles.numericRow}>
                <span style={timerStyles.numLabel}>休憩 (分)</span>
                <div style={timerStyles.numericInputs}>
                  <button className="btn" onClick={() => setBreak(cfg.breakMin - 1)}>−1</button>
                  <input className="num" style={timerStyles.num} type="number" value={cfg.breakMin} onChange={e => setBreak(parseInt(e.target.value) || 1)} />
                  <button className="btn" onClick={() => setBreak(cfg.breakMin + 1)}>+1</button>
                </div>
              </div>
              <div style={timerStyles.numericRow}>
                <span style={timerStyles.numLabel}>サイクル (回)</span>
                <div style={timerStyles.numericInputs}>
                  <button className="btn" onClick={() => setCycles(cfg.cycles - 1)}>−1</button>
                  <input className="num" style={timerStyles.num} type="number" value={cfg.cycles} onChange={e => setCycles(parseInt(e.target.value) || 1)} />
                  <button className="btn" onClick={() => setCycles(cfg.cycles + 1)}>+1</button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>
              {cfg.workMin}分 × {cfg.cycles} — 合計 {cfg.workMin * cfg.cycles + cfg.breakMin * (cfg.cycles - 1)}分
            </div>
            <div style={timerStyles.preview}>
              {segments.map((seg, idx) => (
                <div
                  key={idx}
                  style={{
                    width: seg.kind === 'work' ? 50 : 18,
                    height: 6,
                    background: seg.kind === 'work' ? 'var(--dust)' : 'var(--moss)',
                    borderRadius: 3,
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          </div>

          <div style={timerStyles.controlRow}>
            <button style={timerStyles.bigBtn(true)} onClick={start}>
              <window.Icon name="play" size={14} /> 集中セッション開始
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', fontFamily: 'var(--font-jp)', lineHeight: 1.6 }}>
            開始すると{s.character.name}が机に座り、勉強を始めます。
            <br />5分の集中ごとに <span style={{ color: 'var(--dust)' }}>+1 DUST</span> を獲得。
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Dial ---------- */
const TimerDial = ({ minutes, onChange, label, max = 90 }) => {
  const ref = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const size = 200;
  const radius = 80;
  const stroke = 8;
  const cx = size / 2, cy = size / 2;

  const angle = (minutes / max) * Math.PI * 2 - Math.PI / 2;
  const knobX = cx + Math.cos(angle) * radius;
  const knobY = cy + Math.sin(angle) * radius;

  const handlePoint = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left - cx;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top - cy;
    let a = Math.atan2(y, x) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    const pct = a / (Math.PI * 2);
    const m = Math.max(1, Math.min(max, Math.round(pct * max)));
    onChange(m);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e) => handlePoint(e);
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging]);

  // SVG path arc for current
  const arcEnd = angle;
  const arcStart = -Math.PI / 2;
  const largeArc = (minutes / max) > 0.5 ? 1 : 0;
  const ex = cx + Math.cos(arcEnd) * radius;
  const ey = cy + Math.sin(arcEnd) * radius;
  const sx = cx + Math.cos(arcStart) * radius;
  const sy = cy + Math.sin(arcStart) * radius;

  // Tick marks
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const r1 = radius + 8;
    const r2 = radius + (i % 5 === 0 ? 16 : 12);
    ticks.push({
      x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1,
      x2: cx + Math.cos(a) * r2, y2: cy + Math.sin(a) * r2,
      major: i % 5 === 0,
    });
  }

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      onMouseDown={(e) => { setDragging(true); handlePoint(e); }}
      onTouchStart={(e) => { setDragging(true); handlePoint(e); }}
      style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}
    >
      {/* tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.major ? 'var(--muted)' : 'var(--muted-deep)'}
              strokeWidth={t.major ? 1.5 : 0.8} />
      ))}
      {/* base ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      {/* progress arc */}
      <path
        d={`M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey}`}
        fill="none"
        stroke="url(#dialGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c97b4a" />
          <stop offset="100%" stopColor="#a04826" />
        </linearGradient>
      </defs>
      {/* knob */}
      <circle cx={knobX} cy={knobY} r={9} fill="#c97b4a" stroke="#1a1410" strokeWidth={2} />
      {/* center labels */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--ink)" fontSize="36" fontFamily="var(--font-jp)" fontWeight="300">
        {minutes}
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="var(--muted)" fontSize="11" letterSpacing="0.2em">
        MIN
      </text>
    </svg>
  );
};

/* ---------- Floating timer chip (when running) ---------- */
const TimerChip = () => {
  const t = window.useTimer();
  if (!t.running) return null;
  const pct = t.phaseSeconds > 0 ? (t.secondsLeft / t.phaseSeconds) * 100 : 0;
  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 30, pointerEvents: 'auto' }}>
      <div className="glass" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 280 }}>
        <span style={{ fontFamily: 'var(--font-jp)', fontSize: 11, color: t.mode === 'work' ? 'var(--dust)' : 'var(--moss)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {t.mode === 'work' ? '集中' : '休憩'} {t.cycle + 1}/{t.totalCycles}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--ink)', letterSpacing: 1 }}>
          {formatTime(t.secondsLeft)}
        </span>
        <div className="bar" style={{ flex: 1, height: 3 }}>
          <div style={{ width: pct + '%', background: t.mode === 'work' ? 'var(--dust)' : 'var(--moss)' }} />
        </div>
        <button className="icon-btn" style={{ width: 28, height: 28, background: 'transparent', border: 'none' }} onClick={() => TimerEngine.pause()} title={t.paused ? '再開' : '一時停止'}>
          <window.Icon name={t.paused ? 'play' : 'pause'} size={14} />
        </button>
        <button className="icon-btn" style={{ width: 28, height: 28, background: 'transparent', border: 'none' }} onClick={() => TimerEngine.stop()} title="停止">
          <window.Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
};
window.TimerChip = TimerChip;

/* ---------- Fullscreen timer view ---------- */
const TimerFullscreen = ({ onExit }) => {
  const t = window.useTimer();
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const nowStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="timer-fullscreen">
      <div style={{ position: 'absolute', top: 28, right: 28 }}>
        <button className="icon-btn" onClick={onExit} title="戻る">
          <window.Icon name="close" />
        </button>
      </div>
      <div className="timer-fs-mode">
        {t.mode === 'work' ? '集中セッション' : t.mode === 'break' ? '休憩' : '待機'} · {t.cycle + 1}/{t.totalCycles}
      </div>
      <div className="timer-fs-time">{formatTime(t.secondsLeft)}</div>
      <div style={{ width: 'min(70vw, 800px)' }}>
        <div className="bar" style={{ height: 4 }}>
          <div style={{ width: ((t.phaseSeconds - t.secondsLeft) / Math.max(1, t.phaseSeconds) * 100) + '%', background: t.mode === 'work' ? 'var(--dust)' : 'var(--moss)' }} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="timer-fs-now">{nowStr}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-jp)', letterSpacing: '0.2em' }}>{dateStr}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn" onClick={() => TimerEngine.pause()}>
          <window.Icon name={t.paused ? 'play' : 'pause'} size={14} /> {t.paused ? '再開' : '一時停止'}
        </button>
        <button className="btn ghost" onClick={() => TimerEngine.skip()}>スキップ</button>
        <button className="btn ghost" onClick={() => TimerEngine.stop()}>停止</button>
      </div>
    </div>
  );
};
window.TimerFullscreen = TimerFullscreen;
window.TimerModal = TimerModal;
