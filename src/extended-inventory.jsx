/* ============================================================
   ExtendedInventory — Minecraft-style bag (3×10) + hotbar (1×10)
   Toggle: E key (when not near chair/shelf) / Escape to close
   ============================================================ */

const ExtendedInventory = () => {
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(null); // { zone, index } | null
  const s = window.useStore();

  React.useLayoutEffect(() => {
    window.toggleExtendedInventory = () => setOpen(o => !o);
    window.extendedInventoryOpen   = false;
    return () => {
      window.toggleExtendedInventory = null;
      window.extendedInventoryOpen   = false;
    };
  }, []);

  // Keep global flag in sync so world.js can block movement
  React.useEffect(() => {
    window.extendedInventoryOpen = open;
    if (!open) setCursor(null);
  }, [open]);

  React.useEffect(() => {
    const onKey = (e) => {
      const inInput = e.target && (
        e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable
      );
      if (inInput) return;
      if ((e.key.toLowerCase() === 'e' || e.key === 'Escape') && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const carried = s.carried || { hotbar: Array(10).fill(null), bag: Array(30).fill(null) };

  const clickSlot = (zone, index) => {
    const arr = carried[zone];
    const slot = arr[index];
    if (!cursor) {
      if (slot) setCursor({ zone, index });
    } else if (cursor.zone === zone && cursor.index === index) {
      setCursor(null); // deselect
    } else {
      window.Store.moveCarriedSlot(cursor, { zone, index });
      setCursor(null);
    }
  };

  if (!open) return null;

  const SlotCell = ({ zone, index }) => {
    const arr = carried[zone];
    const sl = arr[index];
    const isCursor = cursor?.zone === zone && cursor?.index === index;
    const item = sl ? window.Store.CATALOG_MAP[sl.id] : null;
    return (
      <div
        onClick={() => clickSlot(zone, index)}
        style={{
          width: 46, height: 46,
          background: isCursor ? 'rgba(255,210,120,0.18)' : 'rgba(255,255,255,0.04)',
          border: isCursor ? '1px solid var(--dust)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', cursor: sl || cursor ? 'pointer' : 'default',
          transition: 'background 0.1s, border-color 0.1s',
        }}
        title={item?.name || ''}
      >
        {item && <window.ItemGlyph id={sl.id} size={28} />}
        {sl && sl.count > 1 && (
          <span style={{
            position: 'absolute', bottom: 2, right: 4,
            fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--dust)',
          }}>{sl.count}</span>
        )}
        {item && (
          <span style={{
            position: 'absolute', bottom: 1, left: 0, right: 0, textAlign: 'center',
            fontSize: 7, color: 'var(--muted)', overflow: 'hidden', whiteSpace: 'nowrap',
            textOverflow: 'ellipsis', padding: '0 2px',
          }}>{item.name}</span>
        )}
      </div>
    );
  };

  const bagFull = carried.bag.filter(Boolean).length;
  const hotbarFull = carried.hotbar.filter(Boolean).length;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
    }} onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); } }}>
      <div style={{
        background: 'var(--bg-rust)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 14,
        minWidth: 520,
        boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-jp)', fontSize: 14, color: 'var(--ink)' }}>所持品</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginLeft: 10 }}>
              {bagFull + hotbarFull} / 40
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>E / Esc で閉じる</span>
        </div>

        {/* Bag (3 × 10) */}
        <div>
          <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 6 }}>バッグ (3 × 10)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 46px)', gap: 4 }}>
            {Array.from({ length: 30 }, (_, i) => (
              <SlotCell key={`bag-${i}`} zone="bag" index={i} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--line)', margin: '0 -4px' }} />

        {/* Hotbar (1 × 10) */}
        <div>
          <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 6 }}>ホットバー (1 × 10)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 46px)', gap: 4 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <SlotCell key={`hotbar-${i}`} zone="hotbar" index={i} />
            ))}
          </div>
        </div>

        {cursor && (
          <div style={{ fontSize: 10, color: 'var(--dust)', textAlign: 'center' }}>
            {window.Store.CATALOG_MAP[carried[cursor.zone][cursor.index]?.id]?.name} を選択中 — 移動先をクリック
          </div>
        )}
      </div>
    </div>
  );
};

window.ExtendedInventory = ExtendedInventory;
