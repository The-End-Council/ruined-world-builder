/* ============================================================
   Bottom Dock — inventory tabs + shop button
   ============================================================ */

const Dock = ({ openModal, selected, setSelected }) => {
  const s = window.useStore();
  const [tab, setTab] = React.useState('tile');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 10;

  const CAT = window.Store.CATALOG;
  const items = CAT[tab] || [];

  // Inventory entries for this tab
  const inv = s.inventory[tab] || {};

  // Filter to items the user owns >= 1
  const owned = items.filter(it => (inv[it.id] || 0) > 0)
    .filter(it => it.name.includes(search) || (it.kind || '').includes(search));
  const pageCount = Math.max(1, Math.ceil(owned.length / PAGE_SIZE));
  const pageIndex = Math.min(page, pageCount - 1);
  const pageItems = owned.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
  const slots = Array.from({ length: PAGE_SIZE }, (_, i) => pageItems[i] || null);

  React.useEffect(() => {
    setPage(0);
  }, [tab, search]);

  React.useEffect(() => {
    if (page >= pageCount) setPage(pageCount - 1);
  }, [page, pageCount]);

  return (
    <div className="dock">
      <div className="dock-inner">
        <div className="dock-tabs">
          {[
            { id: 'tile', label: 'タイル', en: 'TILES' },
            { id: 'furniture', label: '家具', en: 'FURN' },
            { id: 'building', label: '建物', en: 'BUILD' },
            { id: 'farming', label: '農業', en: 'FARM' },
            { id: 'ore', label: '鉱石', en: 'ORE' },
            { id: 'items', label: 'アイテム', en: 'ITEMS' },
          ].map(t => (
            <button key={t.id} className={'dock-tab ' + (tab === t.id ? 'active' : '')} onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--muted)' }}>{t.en}</span>
              <span className="ja">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="dock-grid-wrap">
          <div className="dock-items">
            {slots.map((it, idx) => {
              if (!it) {
                return (
                  <div key={`slot-${idx}`} className="inv-cell empty" aria-hidden="true">
                    <div className="inv-icon empty-icon">
                      <span className="empty-mark">—</span>
                    </div>
                  </div>
                );
              }
              const count = inv[it.id] || 0;
              const placeable = tab !== 'items';
              const sel = placeable && selected && selected.category === tab && selected.id === it.id;
              return (
                <div
                  key={it.id}
                  className={'inv-cell ' + (sel ? 'selected' : '')}
                  onClick={() => placeable && setSelected(sel ? null : { category: tab, id: it.id })}
                  data-tip={it.name}
                  role={placeable ? 'button' : undefined}
                  tabIndex={placeable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (!placeable) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(sel ? null : { category: tab, id: it.id });
                    }
                  }}
                >
                  <div className="inv-icon">
                    <window.ItemGlyph id={it.id} size={36} />
                  </div>
                  <span className="count">{count}</span>
                  <span className="label">{it.name}</span>
                </div>
              );
            })}
          </div>

          {owned.length === 0 && (
            <div className="dock-empty">
              {search ? '該当アイテムなし' : '所持アイテムなし — SHOPで購入'}
            </div>
          )}

          {pageCount > 1 && (
            <div className="dock-pagination">
              <button
                className="page-btn"
                type="button"
                onClick={() => setPage(Math.max(0, pageIndex - 1))}
                disabled={pageIndex <= 0}
              >
                ◀
              </button>
              <span className="page-label">{pageIndex + 1} / {pageCount}</span>
              <button
                className="page-btn"
                type="button"
                onClick={() => setPage(Math.min(pageCount - 1, pageIndex + 1))}
                disabled={pageIndex >= pageCount - 1}
              >
                ▶
              </button>
            </div>
          )}
        </div>

        <div className="dock-actions">
          <input
            type="text"
            placeholder="検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-input"
            style={{ width: 100, fontSize: 12 }}
          />
          <button className="shop-btn" onClick={() => openModal('shop')}>
            <window.Icon name="shop" size={14} />
            SHOP
          </button>
        </div>
      </div>

      {selected && <PlacementHint selected={selected} />}
    </div>
  );
};

const PlacementHint = ({ selected }) => {
  const item = window.Store.CATALOG_MAP[selected.id];
  return (
    <div className="hint" style={{ bottom: 110 }}>
      <strong style={{ color: 'var(--dust)' }}>{item.name}</strong> を配置中 — グリッドクリック / <kbd>ESC</kbd> 取消
    </div>
  );
};

window.Dock = Dock;
