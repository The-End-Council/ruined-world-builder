/* ============================================================
   Bottom Dock — inventory tabs + shop button
   ============================================================ */

const Dock = ({ openModal, selected, setSelected }) => {
  const s = window.useStore();
  const [tab, setTab] = React.useState('tile');
  const [search, setSearch] = React.useState('');

  const CAT = window.Store.CATALOG;
  const items = CAT[tab] || [];

  // Inventory entries for this tab
  const inv = s.inventory[tab] || {};

  // Filter to items the user owns >= 1, or show all with 0 (we'll show only owned)
  const owned = items.filter(it => (inv[it.id] || 0) > 0)
    .filter(it => it.name.includes(search) || it.kind.includes(search));

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
          ].map(t => (
            <button key={t.id} className={'dock-tab ' + (tab === t.id ? 'active' : '')} onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--muted)' }}>{t.en}</span>
              <span className="ja">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="dock-items">
          {owned.length === 0 ? (
            <div className="dock-empty">
              {search ? '見つかりません' : 'インベントリ空 — SHOPで購入'}
            </div>
          ) : (
            owned.map(it => {
              const count = inv[it.id] || 0;
              const sel = selected && selected.category === tab && selected.id === it.id;
              return (
                <div
                  key={it.id}
                  className={'inv-cell ' + (sel ? 'selected' : '')}
                  onClick={() => setSelected(sel ? null : { category: tab, id: it.id })}
                  title={it.name}
                >
                  <window.ItemGlyph id={it.id} size={36} />
                  <span className="count">{count}</span>
                  <span className="label">{it.name}</span>
                </div>
              );
            })
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
