/* ============================================================
   App — root component, modal routing, wires dock<->world
   ============================================================ */

const App = () => {
  const [modal, setModal] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('world'); // 'world' | 'fullscreen'
  const [showcaseMode, setShowcaseMode] = React.useState(false);
  const [confirmState, setConfirmState] = React.useState(null);
  const t = window.useTimer();

  const exitShowcaseMode = React.useCallback(() => {
    setShowcaseMode(false);
  }, []);

  const toggleShowcaseMode = React.useCallback(() => {
    setShowcaseMode((prev) => !prev);
    setModal(null);
    setSelectedItem(null);
    setViewMode('world');
    window.World?.setPlacement?.(null);
  }, []);

  // When user selects item in dock → enable world placement
  React.useEffect(() => {
    if (selectedItem) {
      window.World?.setPlacement?.(selectedItem);
    } else {
      window.World?.setPlacement?.(null);
    }
  }, [selectedItem]);

  // World can clear placement (e.g. on Escape) — sync back
  React.useEffect(() => {
    window.World?.onPlacementChange?.((p) => {
      if (!p) setSelectedItem(null);
    });
  }, []);

  // Body class when world is dimmed
  React.useEffect(() => {
    document.body.classList.toggle('world-focused', t.running && viewMode === 'world');
  }, [t.running, viewMode]);

  // Auto-exit fullscreen if timer stops
  React.useEffect(() => {
    if (!t.running && viewMode === 'fullscreen') setViewMode('world');
  }, [t.running]);

  React.useEffect(() => {
    document.body.classList.toggle('showcase-mode', showcaseMode);
    return () => document.body.classList.remove('showcase-mode');
  }, [showcaseMode]);

  React.useEffect(() => {
    if (!showcaseMode) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      e.preventDefault();
      setShowcaseMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showcaseMode]);

  React.useLayoutEffect(() => {
    window.gameConfirm = (options = {}) => new Promise((resolve) => {
      setConfirmState((prev) => {
        prev?.resolve?.(false);
        return {
          title: options.title || '警告',
          message: options.message || '',
          confirmText: options.confirmText || '実行',
          cancelText: options.cancelText || 'キャンセル',
          danger: !!options.danger,
          resolve,
        };
      });
    });
    return () => {
      if (window.gameConfirm) delete window.gameConfirm;
    };
  }, []);

  const closeConfirm = React.useCallback((ok) => {
    setConfirmState((prev) => {
      if (prev?.resolve) prev.resolve(ok);
      return null;
    });
  }, []);

  const openModal = (id) => setModal(id);
  const closeModal = () => setModal(null);

  return (
    <>
      {!showcaseMode && (
        <window.TopBar
          openModal={openModal}
          timerActive={t.running}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showcaseMode={showcaseMode}
          onToggleShowcase={toggleShowcaseMode}
        />
      )}
      {!showcaseMode && viewMode === 'world' && <MiniMap />}
      {!showcaseMode && <window.TimerChip />}
      {!showcaseMode && <window.Dock openModal={openModal} selected={selectedItem} setSelected={setSelectedItem} />}
      {showcaseMode && <ShowcaseExit onExit={exitShowcaseMode} />}
      <window.ToastStack />

      {/* Mini hint at first launch */}
      {!showcaseMode && <KeyHint />}

      {viewMode === 'fullscreen' && t.running && (
        <window.TimerFullscreen onExit={() => setViewMode('world')} />
      )}

      {modal === 'tasks' && (
        <div className="modal-scrim" onClick={closeModal}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title">タスク</div>
              <span className="subtitle">TASK MANAGER</span>
              <button className="modal-close" onClick={closeModal}><window.Icon name="close" size={14} /></button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <window.TaskManager />
            </div>
          </div>
        </div>
      )}

      {modal === 'timer' && <window.TimerModal onClose={closeModal} />}

      {modal === 'shop' && (
        <div className="modal-scrim" onClick={closeModal}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title">SHOP</div>
              <span className="subtitle">廃材市場</span>
              <button className="modal-close" onClick={closeModal}><window.Icon name="close" size={14} /></button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <window.Shop />
            </div>
          </div>
        </div>
      )}

      {modal === 'stats' && (
        <div className="modal-scrim" onClick={closeModal}>
          <div className="modal large" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh' }}>
            <div className="modal-head">
              <div className="title">統計</div>
              <span className="subtitle">STATISTICS</span>
              <button className="modal-close" onClick={closeModal}><window.Icon name="close" size={14} /></button>
            </div>
            <div className="modal-body">
              <window.Stats />
            </div>
          </div>
        </div>
      )}

      {modal === 'settings' && (
        <div className="modal-scrim" onClick={closeModal}>
          <div className="modal small" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh' }}>
            <div className="modal-head">
              <div className="title">設定</div>
              <span className="subtitle">SETTINGS</span>
              <button className="modal-close" onClick={closeModal}><window.Icon name="close" size={14} /></button>
            </div>
            <div className="modal-body">
              <window.Settings />
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <GameConfirmModal
          state={confirmState}
          onConfirm={() => closeConfirm(true)}
          onCancel={() => closeConfirm(false)}
        />
      )}

      <AdminShell />
    </>
  );
};

const MiniMap = () => {
  const state = window.useStore();
  const [expanded, setExpanded] = React.useState(false);
  const canvasRef = React.useRef(null);
  const tiles = state.world?.tiles || [];
  const spawn = state.world?.spawnTile || { x: 0, z: 0 };
  const player = state.character?.position || { x: 0, z: 0 };
  const mapSize = expanded ? 340 : 152;

  React.useEffect(() => {
    if (!expanded) return;
    const blockEscape = (e) => {
      if ((e.key || '').toLowerCase() !== 'escape') return false;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      return true;
    };
    const onKeyDown = (e) => {
      if (!blockEscape(e)) return;
      setExpanded(false);
    };
    const onKeyUp = (e) => { blockEscape(e); };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [expanded]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssSize = mapSize;
    canvas.width = Math.floor(cssSize * dpr);
    canvas.height = Math.floor(cssSize * dpr);
    canvas.style.width = cssSize + 'px';
    canvas.style.height = cssSize + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssSize, cssSize);

    const worldHalfRange = expanded ? 12 : 8;
    const drawArea = cssSize - 18;
    const cell = drawArea / (worldHalfRange * 2);
    const cx = player.x;
    const cz = player.z;
    const map = (wx, wz) => ({
      x: cssSize * 0.5 + (wx - cx) * cell,
      y: cssSize * 0.5 + (wz - cz) * cell,
    });

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, cssSize);
    bg.addColorStop(0, '#17120e');
    bg.addColorStop(1, '#0d0a08');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssSize, cssSize);

    // grid
    ctx.strokeStyle = 'rgba(84,70,56,0.38)';
    ctx.lineWidth = 1;
    const gridSteps = Math.max(6, Math.min(18, Math.round(worldHalfRange * 2)));
    for (let i = 0; i <= gridSteps; i++) {
      const v = 9 + (i / gridSteps) * (cssSize - 18);
      ctx.beginPath();
      ctx.moveTo(v, 9);
      ctx.lineTo(v, cssSize - 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(9, v);
      ctx.lineTo(cssSize - 9, v);
      ctx.stroke();
    }

    const tileColor = (type) => {
      if (type === 'water_murky') return '#3e6270';
      if (type === 'brick_ruin') return '#8b5a45';
      if (type === 'path_broken') return '#847b71';
      if (type === 'soil_toxic') return '#556b44';
      if (type === 'soil_cracked') return '#4c3a2b';
      if (type === 'field_barren') return '#5a452d';
      if (type === 'moss_gray') return '#616a57';
      return '#74695f';
    };
    const itemColor = (category) => {
      if (category === 'furniture') return '#e0b27a';
      if (category === 'building') return '#c78963';
      if (category === 'farming') return '#88b07d';
      if (category === 'ore') return '#94b8ce';
      return '#d8cfbf';
    };

    // tiles
    const tileSize = Math.max(4, cell * 0.72);
    const isInsideRange = (wx, wz) => (
      Math.abs(wx - cx) <= worldHalfRange + 0.6
      && Math.abs(wz - cz) <= worldHalfRange + 0.6
    );
    tiles.forEach(t => {
      if (!isInsideRange(t.x, t.z)) return;
      const p = map(t.x, t.z);
      ctx.fillStyle = tileColor(t.type);
      ctx.fillRect(p.x - tileSize * 0.5, p.y - tileSize * 0.5, tileSize, tileSize);
      ctx.strokeStyle = 'rgba(14, 10, 8, 0.65)';
      ctx.strokeRect(p.x - tileSize * 0.5, p.y - tileSize * 0.5, tileSize, tileSize);
      if (t.item) {
        ctx.beginPath();
        ctx.fillStyle = itemColor(t.itemCategory);
        ctx.arc(p.x, p.y, Math.max(1.8, tileSize * 0.24), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // spawn
    if (isInsideRange(spawn.x, spawn.z)) {
      const sp = map(spawn.x, spawn.z);
      ctx.strokeStyle = '#8f846f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sp.x - 4, sp.y);
      ctx.lineTo(sp.x + 4, sp.y);
      ctx.moveTo(sp.x, sp.y - 4);
      ctx.lineTo(sp.x, sp.y + 4);
      ctx.stroke();
    }

    // player
    const cp = map(player.x, player.z);
    ctx.beginPath();
    ctx.fillStyle = '#ffd9aa';
    ctx.arc(cp.x, cp.y, Math.max(2.4, cell * 0.22), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = '#8a5635';
    ctx.lineWidth = 1.4;
    ctx.arc(cp.x, cp.y, Math.max(4.2, cell * 0.33), 0, Math.PI * 2);
    ctx.stroke();
  }, [tiles, player.x, player.z, spawn.x, spawn.z, mapSize]);

  return (
    <div className={'mini-map-panel glass' + (expanded ? ' expanded' : '')}>
      <button
        type="button"
        className="mini-map-canvas-wrap"
        onClick={() => setExpanded(v => !v)}
        aria-label={expanded ? 'ミニマップを縮小' : 'ミニマップを拡大'}
      >
        <canvas ref={canvasRef} className="mini-map-canvas" />
      </button>
      <div className="mini-map-meta">
        <span>MINI MAP</span>
        <span>{expanded ? 'Click to close / Esc' : 'Click to expand'}</span>
      </div>
      {expanded && (
        <div className="mini-map-legend">
          <span><i className="lg tile" /> Tile</span>
          <span><i className="lg item" /> Item</span>
          <span><i className="lg player" /> Player</span>
        </div>
      )}
    </div>
  );
};

const KeyHint = () => {
  const [hide, setHide] = React.useState(() => {
    try { return localStorage.getItem('wb-hint-hidden') === '1'; } catch (e) { return false; }
  });
  React.useEffect(() => {
    if (hide) return;
    const id = setTimeout(() => {
      setHide(true);
      try { localStorage.setItem('wb-hint-hidden', '1'); } catch (e) {}
    }, 8000);
    return () => clearTimeout(id);
  }, [hide]);
  if (hide) return null;
  return (
    <div className="hint" style={{ bottom: 110 }}>
      移動 <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · 配置 <kbd>クリック</kbd>
    </div>
  );
};

const ShowcaseExit = ({ onExit }) => {
  return (
    <button className="showcase-exit" onClick={onExit} type="button" aria-label="Exit showcase mode">
      Exit showcase <span aria-hidden="true">Esc</span>
    </button>
  );
};

const GameConfirmModal = ({ state, onConfirm, onCancel }) => {
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal small" onClick={(e) => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh' }}>
        <div className="modal-head">
          <div className="title">{state.title}</div>
          <span className="subtitle">WARNING</span>
          <button className="modal-close" onClick={onCancel}><window.Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-jp)', lineHeight: 1.8, color: 'var(--ink-soft)' }}>
            {state.message}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn ghost" onClick={onCancel}>{state.cancelText}</button>
            <button className={'btn ' + (state.danger ? 'primary' : '')} onClick={onConfirm}>{state.confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Admin Shell ----------
const AdminShell = () => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [log, setLog] = React.useState([]);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  function exec(cmd) {
    const parts = cmd.trim().split(/\s+/);
    const c = parts[0];
    if (c === '/get') {
      const res = parts[1];
      const n = parseInt(parts[2], 10);
      if (res === 'DUST' && n > 0) {
        window.Store.addDust(n);
        return `+${n} DUST`;
      }
      return `usage: /get DUST <amount>`;
    }
    return `unknown: ${c}`;
  }

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const out = exec(input.trim());
    setLog(l => [...l.slice(-24), { cmd: input.trim(), out }]);
    setInput('');
  };

  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 68, left: 16, width: 340,
      background: 'rgba(6,4,2,0.93)', border: '1px solid #3a3028',
      borderRadius: 5, padding: '8px 12px', zIndex: 1200,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#c8b896',
    }}>
      <div style={{ color: '#5a4a3a', marginBottom: 6, letterSpacing: 1 }}>ADMIN SHELL — T to close</div>
      <div style={{ maxHeight: 130, overflowY: 'auto', marginBottom: 6 }}>
        {log.map((l, i) => (
          <div key={i} style={{ marginBottom: 3 }}>
            <div style={{ color: '#7a6a5a' }}>&gt; {l.cmd}</div>
            <div style={{ color: '#90c870', paddingLeft: 8 }}>{l.out}</div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ color: '#5a4a3a' }}>&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="/get DUST 100"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: '1px solid #3a3028', color: '#c8b896',
            fontFamily: 'inherit', fontSize: 11, outline: 'none', padding: '2px 0',
          }}
        />
        <button type="submit" style={{
          background: '#2a2018', border: '1px solid #3a3028', color: '#a09070',
          padding: '2px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 10,
        }}>実行</button>
      </form>
    </div>
  );
};

// Mount once DOM + scripts ready
window.__mountApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('ui-root'));
  root.render(<App />);
};
