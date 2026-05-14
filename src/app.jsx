/* ============================================================
   App — root component, modal routing, wires dock<->world
   ============================================================ */

const App = () => {
  const [modal, setModal] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('world'); // 'world' | 'fullscreen'
  const t = window.useTimer();

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

  const openModal = (id) => setModal(id);
  const closeModal = () => setModal(null);

  return (
    <>
      <window.TopBar
        openModal={openModal}
        timerActive={t.running}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <window.TimerChip />
      <window.Dock openModal={openModal} selected={selectedItem} setSelected={setSelectedItem} />
      <window.ToastStack />

      {/* Mini hint at first launch */}
      <KeyHint />

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
    </>
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

// Mount once DOM + scripts ready
window.__mountApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('ui-root'));
  root.render(<App />);
};
