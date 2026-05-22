/* ============================================================
   ShelfStorage — Rusted shelf storage (3 x 4)
   Use: E near shelf_rust
   Stores: materials(items) + carry items
   ============================================================ */

const ShelfStorage = () => {
  const s = window.useStore();
  const [open, setOpen] = React.useState(false);
  const [target, setTarget] = React.useState(null); // { x, z }

  React.useLayoutEffect(() => {
    window.openShelfStorageAt = (x, z) => {
      if (window.extendedInventoryOpen) window.toggleExtendedInventory?.();
      setTarget({ x, z });
      setOpen(true);
    };
    window.closeShelfStorage = () => setOpen(false);
    window.shelfStorageOpen = false;
    return () => {
      window.openShelfStorageAt = null;
      window.closeShelfStorage = null;
      window.shelfStorageOpen = false;
    };
  }, []);

  React.useEffect(() => {
    window.shelfStorageOpen = open;
  }, [open]);

  React.useEffect(() => {
    if (!open || !target) return;
    const tile = (s.world?.tiles || []).find(t => t.x === target.x && t.z === target.z);
    if (!tile || tile.item !== 'shelf_rust') setOpen(false);
  }, [open, target, s.world?.tiles]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      const inInput = e.target && (
        e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable
      );
      if (inInput) return;
      const k = (e.key || '').toLowerCase();
      if (k === 'e' || k === 'escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || !target) return null;

  const slots = window.Store.getShelfSlots(target.x, target.z);
  const materials = Object.entries(s.inventory?.items || {})
    .map(([id, count]) => ({ id, count: Number(count) || 0, meta: window.Store.CATALOG_MAP[id] }))
    .filter(x => x.count > 0 && x.meta?.category === 'items');

  const carryRows = [];
  ['hotbar', 'bag'].forEach((zone) => {
    (s.carried?.[zone] || []).forEach((slot, index) => {
      if (!slot) return;
      const meta = window.Store.CATALOG_MAP[slot.id];
      if (!meta || meta.category !== 'carry') return;
      carryRows.push({ zone, index, id: slot.id, count: slot.count, name: meta.name });
    });
  });

  const reasonToText = (reason) => {
    if (reason === 'shelf_full') return '棚がいっぱいです';
    if (reason === 'not_enough') return '素材が不足しています';
    if (reason === 'carry_full') return '所持品が満杯です';
    if (reason === 'not_shelf') return '棚が見つかりません';
    return '操作できませんでした';
  };

  const onDepositMaterial = (id) => {
    const res = window.Store.depositMaterialToShelf(target.x, target.z, id, 1);
    if (!res?.ok) window.toast?.(reasonToText(res?.reason));
  };

  const onDepositCarry = (zone, index) => {
    const res = window.Store.depositCarryToShelf(target.x, target.z, zone, index);
    if (!res?.ok) window.toast?.(reasonToText(res?.reason));
  };

  const onWithdraw = (slotIndex) => {
    const res = window.Store.withdrawShelfSlot(target.x, target.z, slotIndex);
    if (!res?.ok) window.toast?.(reasonToText(res?.reason));
  };

  const used = slots.filter(Boolean).length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2100,
        background: 'rgba(0,0,0,0.56)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        style={{
          width: 860,
          maxWidth: '92vw',
          background: 'var(--bg-rust)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          boxShadow: '0 10px 36px rgba(0,0,0,0.72)',
          padding: '16px 18px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <div style={{ gridColumn: '1 / span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-jp)', color: 'var(--ink)', fontSize: 15 }}>錆びた棚</span>
            <span style={{ marginLeft: 10, color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{used} / 12</span>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>E / Esc で閉じる</span>
        </div>

        <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 10, background: 'rgba(0,0,0,0.12)' }}>
          <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.09em', marginBottom: 8 }}>SHELF (3 × 4)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const sl = slots[i];
              const meta = sl ? window.Store.CATALOG_MAP[sl.id] : null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onWithdraw(i)}
                  className="btn ghost"
                  style={{
                    height: 66,
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    borderColor: sl ? 'rgba(205,172,128,0.42)' : 'rgba(255,255,255,0.08)',
                  }}
                  title={sl ? `${meta?.name || sl.id} × ${sl.count}` : ''}
                >
                  {sl ? (
                    <>
                      <window.ItemGlyph id={sl.id} size={24} />
                      <span style={{ fontSize: 9, color: 'var(--ink-soft)', whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {meta?.name || sl.id}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--dust)', fontFamily: 'var(--font-mono)' }}>×{sl.count}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 10, color: 'rgba(200,184,150,0.36)' }}>EMPTY</span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--muted)' }}>スロットをクリックで取り出し</div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 10, background: 'rgba(0,0,0,0.10)' }}>
            <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.09em', marginBottom: 8 }}>素材 (items)</div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 170, overflowY: 'auto', paddingRight: 2 }}>
              {materials.length === 0 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>収納できる素材がありません</div>}
              {materials.map(row => (
                <button
                  key={row.id}
                  type="button"
                  className="btn ghost"
                  onClick={() => onDepositMaterial(row.id)}
                  style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <window.ItemGlyph id={row.id} size={18} />
                    <span style={{ fontFamily: 'var(--font-jp)', color: 'var(--ink-soft)' }}>{row.meta?.name || row.id}</span>
                  </span>
                  <span style={{ color: 'var(--dust)', fontFamily: 'var(--font-mono)' }}>×{row.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 10, background: 'rgba(0,0,0,0.10)' }}>
            <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.09em', marginBottom: 8 }}>所持品 (carry)</div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 200, overflowY: 'auto', paddingRight: 2 }}>
              {carryRows.length === 0 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>収納できる所持品がありません</div>}
              {carryRows.map(row => (
                <button
                  key={`${row.zone}-${row.index}`}
                  type="button"
                  className="btn ghost"
                  onClick={() => onDepositCarry(row.zone, row.index)}
                  style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <window.ItemGlyph id={row.id} size={18} />
                    <span style={{ fontFamily: 'var(--font-jp)', color: 'var(--ink-soft)' }}>{row.name}</span>
                  </span>
                  <span style={{ color: 'var(--dust)', fontFamily: 'var(--font-mono)' }}>×{row.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ShelfStorage = ShelfStorage;
