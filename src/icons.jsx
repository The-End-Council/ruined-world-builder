/* ============================================================
   Shared icons + small utility components
   ============================================================ */

const Icon = ({ name, size = 18 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'stats':
      return <svg {...common}><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-5"/></svg>;
    case 'tasks':
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>;
    case 'timer':
      return <svg {...common}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>;
    case 'shop':
      return <svg {...common}><path d="M3 7l1 13h16l1-13"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>;
    case 'close':
      return <svg {...common}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'sun':
      return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>;
    case 'moon':
      return <svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
    case 'cloud':
      return <svg {...common}><path d="M18 19a4 4 0 0 0 0-8 6 6 0 0 0-11.6 1.5A3.5 3.5 0 0 0 7 19h11z"/></svg>;
    case 'star':
      return <svg {...common}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>;
    case 'wave':
      return <svg {...common}><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>;
    case 'eclipse':
      return <svg {...common}><circle cx="12" cy="12" r="8"/><circle cx="14" cy="12" r="6" fill="currentColor" stroke="none"/></svg>;
    case 'music':
      return <svg {...common}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case 'eye':
      return <svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'fullscreen':
      return <svg {...common}><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/></svg>;
    case 'home':
      return <svg {...common}><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>;
    case 'chevron':
      return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case 'check':
      return <svg {...common}><path d="M5 12l5 5L20 7"/></svg>;
    case 'trash':
      return <svg {...common}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"/></svg>;
    case 'edit':
      return <svg {...common}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case 'play':
      return <svg {...common}><path d="M6 4l14 8-14 8z" fill="currentColor"/></svg>;
    case 'pause':
      return <svg {...common}><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>;
    case 'reset':
      return <svg {...common}><path d="M3 12a9 9 0 0 1 15.5-6.3M21 4v5h-5"/></svg>;
    case 'kanban':
      return <svg {...common}><rect x="3" y="4" width="5" height="14" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/></svg>;
    case 'table':
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 16h18M10 4v16"/></svg>;
    case 'isometric':
      return <svg {...common}><path d="M12 3 21 8l-9 5-9-5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>;
    case 'menu':
      return <svg {...common}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>;
    default: return null;
  }
};
window.Icon = Icon;

/* ---------- Toast ---------- */
const toastListeners = [];
const toast = (msg, kind = 'default') => {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach(fn => fn({ id, msg, kind }));
};
window.toast = toast;
const ToastStack = () => {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const handler = (t) => {
      setItems(prev => [...prev, t]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 2400);
    };
    toastListeners.push(handler);
    return () => toastListeners.splice(toastListeners.indexOf(handler), 1);
  }, []);
  return (
    <div className="toast-stack">
      {items.map(t => <div key={t.id} className={'toast ' + (t.kind || '')}>{t.msg}</div>)}
    </div>
  );
};
window.ToastStack = ToastStack;

/* ---------- Hook: useStore ---------- */
const useStore = () => {
  const [s, setS] = React.useState(window.Store.get());
  React.useEffect(() => window.Store.subscribe(setS), []);
  return s;
};
window.useStore = useStore;

/* ---------- 2D item glyph (used in inventory cells & shop) ---------- */
const ItemGlyph = ({ id, size = 36 }) => {
  const sw = 1.4;
  // Each item gets a stylized SVG glyph
  const common = { width: size, height: size, viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (id) {
    // Tiles
    case 'soil_barren':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#4a3a2a" stroke="#2a2218"/><path d="M8 20l4 2M18 22l3-1M28 21l4 1M36 20l4 1M10 28l5 2M22 30l4-1M32 28l5 1" stroke="#2a2218"/></svg>;
    case 'soil_ash':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#5a554c" stroke="#3a3530"/><circle cx="14" cy="22" r="1.5" fill="#3a3530"/><circle cx="28" cy="24" r="1.5" fill="#3a3530"/><circle cx="36" cy="28" r="1.5" fill="#3a3530"/></svg>;
    case 'soil_toxic':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#4a5a3a" stroke="#2a3a1c"/><path d="M10 20l4 4 4-2M28 22l3 4 4-3" stroke="#9bcc6a"/></svg>;
    case 'soil_cracked':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#3e3022" stroke="#1c1410"/><path d="M8 18l6 8 4-2 8 6M30 16l4 10 6-2" stroke="#1c1410" strokeWidth="0.8"/></svg>;
    case 'path_broken':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#6a6258" stroke="#3a3530"/><rect x="8" y="20" width="8" height="4" fill="#8a8276" stroke="none"/><rect x="20" y="22" width="10" height="4" fill="#8a8276" stroke="none"/><rect x="32" y="20" width="8" height="4" fill="#8a8276" stroke="none"/></svg>;
    case 'water_murky':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#2c4048" stroke="#1a2a30"/><path d="M6 22c4-2 6 2 10 0s6 2 10 0 6 2 10 0M6 28c4-2 6 2 10 0s6 2 10 0 6 2 10 0" stroke="#5b8aa4"/></svg>;
    case 'brick_ruin':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#7a4a36" stroke="#3a1c10"/><path d="M4 22h40M4 28h40M14 14v8M24 22v6M34 28v8M10 28v8" stroke="#3a1c10" strokeWidth="0.6"/></svg>;
    // Furniture
    case 'desk_iron':
      return <svg {...common}><rect x="6" y="20" width="36" height="4" fill="#4a4036" stroke="#2a2218"/><path d="M10 24v18M38 24v18"/><rect x="14" y="14" width="10" height="3" fill="#8a5635" stroke="none"/><rect x="26" y="16" width="8" height="2" fill="#c8b896" stroke="none"/></svg>;
    case 'chair_iron':
      return <svg {...common}><rect x="12" y="24" width="22" height="4" fill="#4a4036" stroke="#2a2218"/><rect x="32" y="10" width="3" height="18" fill="#4a4036" stroke="#2a2218"/><path d="M14 28v14M32 28v14"/></svg>;
    case 'shelf_rust':
      return <svg {...common}><rect x="10" y="6" width="28" height="36" rx="1" fill="#6a3c28" stroke="#3a1c10"/><path d="M10 18h28M10 30h28"/></svg>;
    case 'bed_iron':
      return <svg {...common}><rect x="6" y="22" width="36" height="12" rx="2" fill="#4a3a32" stroke="#2a1c14"/><rect x="6" y="28" width="36" height="6" fill="#4a4036" stroke="none"/><rect x="8" y="20" width="8" height="4" fill="#8a7c66" stroke="none"/></svg>;
    case 'lamp_broken':
      return <svg {...common}><path d="M24 42V14l-6-4" stroke="#4a4036" strokeWidth="2.4"/><rect x="12" y="6" width="10" height="6" fill="#4a4036" stroke="#2a2218"/><circle cx="17" cy="14" r="3" fill="#ffd49a" stroke="#ffa860"/></svg>;
    case 'drum_oil':
      return <svg {...common}><rect x="14" y="10" width="20" height="30" rx="3" fill="#6a3c28" stroke="#3a1c10"/><path d="M14 18h20M14 30h20" stroke="#3a1c10"/></svg>;
    // Buildings
    case 'shack_scrap':
      return <svg {...common}><path d="M8 30l16-16 16 16v12H8z" fill="#3a2a1c" stroke="#1a140e"/><rect x="20" y="32" width="8" height="10" fill="#1a1410" stroke="none"/></svg>;
    case 'warehouse_rust':
      return <svg {...common}><rect x="6" y="16" width="36" height="26" fill="#6a3c28" stroke="#3a1c10"/><rect x="6" y="14" width="36" height="4" fill="#4a4036" stroke="#2a2218"/><path d="M14 24v18M24 24v18M34 24v18"/></svg>;
    // Farming
    case 'field_barren':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#3a2e1e" stroke="#1c1410"/><path d="M4 20h40M4 26h40M4 32h40" stroke="#2a2014"/></svg>;
    case 'moss_gray':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#4a5240" stroke="#2a3220"/><circle cx="14" cy="24" r="3" fill="#5a6450"/><circle cx="26" cy="28" r="4" fill="#5a6450"/><circle cx="36" cy="22" r="2.5" fill="#5a6450"/></svg>;
    case 'potato_waste':
      return <svg {...common}><rect x="4" y="30" width="40" height="6" fill="#3a2e1e" stroke="#1c1410"/><path d="M14 30v-10M24 30v-12M34 30v-9" stroke="#5a6a3a" strokeWidth="2"/><circle cx="14" cy="18" r="3" fill="#5a6a3a"/><circle cx="24" cy="16" r="3.5" fill="#5a6a3a"/><circle cx="34" cy="19" r="3" fill="#5a6a3a"/></svg>;
    // Ore
    case 'iron_rust':
      return <svg {...common}><path d="M10 30l8-14 14-2 10 6-6 14-16 4z" fill="#5a3826" stroke="#2a1810"/><path d="M18 16l-2 10 8 8 8-6 4-12" stroke="#3a2418" strokeWidth="0.8"/></svg>;
    default:
      return <svg {...common}><rect x="8" y="8" width="32" height="32" rx="2" fill="#3a3028" stroke="#2a2218"/></svg>;
  }
};
window.ItemGlyph = ItemGlyph;
