/* ============================================================
   SHOP — buy tiles / furniture / decoration / buildings / farming / ore / items
   ============================================================ */

const shopStyles = {
  body: { display: 'flex', flexDirection: 'column', height: '100%' },
  toolbar: { padding: '14px 22px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  tabs: { display: 'flex', gap: 4, background: 'var(--bg-soil)', border: '1px solid var(--line)', borderRadius: 6, padding: 3 },
  tab: (a) => ({ padding: '6px 14px', borderRadius: 4, border: 'none', background: a ? 'var(--panel-raised)' : 'transparent', color: a ? 'var(--ink)' : 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-jp)', cursor: 'pointer' }),
  balance: { fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--dust)', display: 'flex', alignItems: 'center', gap: 6 },
  body2: { padding: 24, overflow: 'auto', flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 },
  card: { background: 'var(--bg-soil)', border: '1px solid var(--line)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', transition: 'all 0.15s' },
  cardImg: { aspectRatio: '1', background: 'var(--bg-rust)', border: '1px solid var(--line)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' },
  cardName: { fontFamily: 'var(--font-jp)', fontSize: 14, fontWeight: 500 },
  cardKind: { fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' },
  cardFoot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--dust)' },
};

const Shop = () => {
  const s = window.useStore();
  const [tab, setTab] = React.useState('tile');
  const [search, setSearch] = React.useState('');
  const tabs = [
    { id: 'tile',       label: 'タイル' },
    { id: 'furniture',  label: '家具' },
    { id: 'decoration', label: '装飾' },
    { id: 'building',   label: '建物' },
    { id: 'farming',    label: '農業' },
    { id: 'ore',        label: '鉱石' },
    { id: 'items',      label: '素材' },
    { id: 'carry',      label: 'アイテム' },
  ];

  const CATALOG = window.Store.CATALOG;
  const items = (CATALOG[tab] || []).filter(it =>
    !it.shopHidden &&
    (!search || it.name.includes(search) || it.kind.includes(search))
  );

  const buy = (it) => {
    if (!Number.isFinite(it.price)) {
      window.toast('このアイテムは現在販売対象外です', 'warn');
      return;
    }
    const ok = tab === 'carry'
      ? window.Store.buyCarryItem(it.id)
      : window.Store.buyItem(tab, it.id);
    if (ok) window.toast('購入: ' + it.name + ' (-' + it.price + ' DUST)', 'success');
    else window.toast(tab === 'carry' ? 'DUST不足またはバッグが満杯です' : 'DUST が足りません', 'warn');
  };

  return (
    <div style={shopStyles.body}>
      <div style={shopStyles.toolbar}>
        <div style={shopStyles.tabs}>
          {tabs.map(t => (
            <button key={t.id} style={shopStyles.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className="text-input"
            placeholder="検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 160 }}
          />
          <div style={shopStyles.balance}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--dust)', boxShadow: '0 0 12px var(--dust)' }} />
            {s.currency.dust} DUST
          </div>
        </div>
      </div>

      <div style={shopStyles.body2}>
        <div style={shopStyles.grid}>
          {items.map(it => {
            const isForSale = Number.isFinite(it.price);
            const canAfford = isForSale && s.currency.dust >= it.price;
            const ownedCount = tab === 'carry'
              ? [...(s.carried?.hotbar || []), ...(s.carried?.bag || [])]
                  .filter(sl => sl?.id === it.id).reduce((a, sl) => a + (sl?.count || 0), 0)
              : (s.inventory[tab]?.[it.id] || 0);
            return (
              <div
                key={it.id}
                style={shopStyles.card}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--dust-soft)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div style={shopStyles.cardImg}>
                  <window.ItemGlyph id={it.id} size={64} />
                </div>
                <div>
                  <div style={shopStyles.cardName}>{it.name}</div>
                  <div style={shopStyles.cardKind}>{it.kind}{it.harvestMin ? ` · 採取 ${it.harvestMin}分` : ''}</div>
                </div>
                <div style={shopStyles.cardFoot}>
                  <span style={shopStyles.price}>{isForSale ? `${it.price} DUST` : '販売未対応'}</span>
                  <button
                    className={'btn small ' + (canAfford ? 'primary' : 'ghost')}
                    disabled={!canAfford}
                    onClick={() => buy(it)}
                    style={!canAfford ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                  >
                    購入
                  </button>
                </div>
                {/* Owned count */}
                <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  所有 × {ownedCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
window.Shop = Shop;
