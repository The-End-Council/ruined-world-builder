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
    case 'camera':
      return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.4-2h5.2L16 7"/><circle cx="12" cy="13.5" r="3.5"/></svg>;
    case 'zoomIn':
      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'zoomOut':
      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M8 11h6"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'rotate':
      return <svg {...common}><path d="M3 11a8 8 0 1 0 3-6.2"/><path d="M3 4v5h5"/></svg>;
    case 'cursor':
      return <svg {...common}><path d="M5 3l12 10-5 1 2 6-3 1-2-6-4 3z"/></svg>;
    case 'save':
      return <svg {...common}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>;
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
    case 'topdown':
      return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8z"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>;
    case 'isometric':
      return <svg {...common}><path d="M12 3l8 4.5-8 4.5-8-4.5z"/><path d="M4 7.5V16l8 5 8-5V7.5"/><path d="M12 12v9"/></svg>;
    case 'soft':
      return <svg {...common}><path d="M12 5l7 4-7 4-7-4z"/><path d="M5 9v5l7 4 7-4V9"/><path d="M4 17l8 4 8-4" opacity="0.7"/></svg>;
    case 'perspective':
      return <svg {...common}><path d="M3 8l9-4 9 4v8l-9 4-9-4z"/><path d="M3 8l9 4 9-4"/><path d="M12 12v8"/></svg>;
    case 'walk':
      return <svg {...common}><circle cx="12" cy="5.5" r="2"/><path d="M12 7.5v5l3 2"/><path d="M12 12.5l-3 4"/><path d="M12 12.5l2 5"/><path d="M9 16.5l-3 3"/><path d="M14 17.5l3 3"/></svg>;
    case 'menu':
      return <svg {...common}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>;
    case 'calendar':
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M13 14h3M8 17h2M13 17h3"/></svg>;
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

/* ---------- Isometric 3D item glyph — Minecraft-style cube blocks ---------- */
const ItemGlyph = ({ id, size = 36 }) => {
  const v = "0 0 48 48";
  // Standard cube (tiles, furniture)
  const CT = "24,4 44,16 24,28 4,16";
  const CL = "4,16 24,28 24,44 4,32";
  const CR = "24,28 44,16 44,32 24,44";
  // Tall cube (buildings)
  const TT = "24,2 44,12 24,22 4,12";
  const TL = "4,12 24,22 24,46 4,36";
  const TR = "24,22 44,12 44,36 24,46";
  const sw = 1.4;
  const common = { width: size, height: size, viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (id) {
    /* Tiles */
    case 'soil_barren':
      return <svg width={size} height={size} viewBox={v}>
        <polygon points={CT} fill="#8e6d48"/>
        <polygon points={CL} fill="#5a3e26"/>
        <polygon points={CR} fill="#3e2c1a"/>
        {/* cracks */}
        <path d="M17 13l3 5M25 11l2 4" stroke="#3a2810" strokeWidth="0.8" fill="none" strokeOpacity="0.6"/>
        {/* pebbles */}
        <ellipse cx="15" cy="19" rx="2.2" ry="1.4" fill="#7a7268"/>
        <ellipse cx="30" cy="16" rx="1.8" ry="1.1" fill="#a89c8c"/>
        <ellipse cx="22" cy="22" rx="1.5" ry="0.9" fill="#4e3e2c"/>
        {/* dry grass */}
        <path d="M19 14l-1-4M20 14l0-4.5M21 14l1-4" stroke="#b8a040" strokeWidth="0.9" fill="none" strokeOpacity="0.85"/>
        <path d="M28 20l-1-3.5M29.5 20l0.5-4" stroke="#c0a848" strokeWidth="0.9" fill="none" strokeOpacity="0.85"/>
      </svg>;

    case 'soil_ash':
      return <svg width={size} height={size} viewBox={v}>
        <polygon points={CT} fill="#b2aba0"/>
        <polygon points={CL} fill="#7d7569"/>
        <polygon points={CR} fill="#675f54"/>
        {/* soft ash highlight */}
        <polygon points="24,8 37,15 24,22 11,15" fill="#d8d3ca" fillOpacity="0.42"/>
        {/* thin cracks */}
        <path d="M14 14l7 6M27 12l3 5M20 21l4-3" stroke="#6a6258" strokeWidth="0.75" fill="none" strokeOpacity="0.58"/>
        {/* soot stains */}
        <ellipse cx="16" cy="20" rx="3.2" ry="1.8" fill="#2a241f" fillOpacity="0.30"/>
        <ellipse cx="31" cy="16" rx="2.8" ry="1.6" fill="#2a241f" fillOpacity="0.26"/>
        {/* ash grains + pebbles */}
        <circle cx="18" cy="13.6" r="1.5" fill="#ddd9d1"/>
        <circle cx="26" cy="19.4" r="1.2" fill="#c5bdb1"/>
        <circle cx="21.2" cy="18.4" r="1.8" fill="#8b8276"/>
        <circle cx="30.5" cy="21.2" r="1.4" fill="#766d62"/>
        {/* subtle reflective fleck */}
        <rect x="22.4" y="15.8" width="3.6" height="0.9" rx="0.45" fill="#ece8e0" fillOpacity="0.42" transform="rotate(-18 24.2 16.2)"/>
      </svg>;

    case 'soil_toxic':
      return <svg width={size} height={size} viewBox={v}>
        <polygon points={CT} fill="#748662"/>
        <polygon points={CL} fill="#4f5f44"/>
        <polygon points={CR} fill="#3d4b36"/>
        {/* muted contaminated traces */}
        <ellipse cx="18" cy="18.8" rx="4.2" ry="2.3" fill="#819767" fillOpacity="0.40" transform="rotate(-18 18 18.8)"/>
        <ellipse cx="29.5" cy="14.8" rx="3.3" ry="2.0" fill="#6f8658" fillOpacity="0.36" transform="rotate(22 29.5 14.8)"/>
        {/* soft cracks */}
        <path d="M13 14l6 6M24 12l3 5M19 21l4-3" stroke="#454b39" strokeWidth="0.75" fill="none" strokeOpacity="0.62"/>
        {/* blackened remains */}
        <ellipse cx="15.8" cy="21.5" rx="2.9" ry="1.6" fill="#2b3025" fillOpacity="0.28"/>
        <ellipse cx="31.2" cy="17.6" rx="2.5" ry="1.4" fill="#2b3025" fillOpacity="0.24"/>
        {/* pebbles and grains */}
        <circle cx="17.8" cy="13.8" r="1.4" fill="#b8ba9f"/>
        <circle cx="26.2" cy="19.2" r="1.2" fill="#9da185"/>
        <circle cx="21.1" cy="18.1" r="1.7" fill="#72785f"/>
        <circle cx="30.3" cy="21.1" r="1.3" fill="#5a624f"/>
        {/* dead grass debris */}
        <path d="M12.5 24.5l1.0-3.0M34 23.5l-0.9-2.7M22.8 25l0.6-2.2" stroke="#7a8263" strokeWidth="0.8" strokeOpacity="0.85" fill="none"/>
        {/* faint sheen */}
        <rect x="22.2" y="15.9" width="3.3" height="0.85" rx="0.42" fill="#dbe3d2" fillOpacity="0.24" transform="rotate(-15 23.8 16.3)"/>
      </svg>;

    case 'soil_cracked':
      return <svg width={size} height={size} viewBox={v}>
        <polygon points={CT} fill="#9b8469"/>
        <polygon points={CL} fill="#6e5a46"/>
        <polygon points={CR} fill="#584738"/>
        {/* major deep cracks */}
        <path d="M10 14l12 9M20 9l10 10M25 23l9-9" stroke="#251c15" strokeWidth="1.35" fill="none" strokeOpacity="0.86"/>
        {/* crack edges */}
        <path d="M10.4 14.8l11 8.3M20.8 9.8l8.8 8.7M25.6 22.6l7.9-8.0" stroke="#4a3a2b" strokeWidth="0.72" fill="none" strokeOpacity="0.55"/>
        {/* crumbled chunks */}
        <rect x="12.4" y="21.0" width="3.5" height="2.2" rx="0.4" fill="#ad9678" transform="rotate(-16 14.1 22.1)"/>
        <rect x="28.0" y="17.8" width="3.1" height="2.0" rx="0.4" fill="#8c755c" transform="rotate(14 29.5 18.8)"/>
        <rect x="20.4" y="24.1" width="2.8" height="1.7" rx="0.35" fill="#b9a184" transform="rotate(-10 21.8 25.0)"/>
        {/* pebbles */}
        <circle cx="16.7" cy="13.5" r="1.3" fill="#bea88a"/>
        <circle cx="27.1" cy="20.2" r="1.2" fill="#927961"/>
        <circle cx="31.6" cy="13.9" r="1.0" fill="#a48a6e"/>
        {/* dry grass remnants */}
        <path d="M13.2 25.2l0.9-2.8M33.2 22.8l-0.8-2.4M24.4 26.1l0.6-2.1" stroke="#8f7b5e" strokeWidth="0.82" strokeOpacity="0.88" fill="none"/>
        {/* slight dry sheen */}
        <rect x="22.1" y="15.7" width="3.2" height="0.82" rx="0.4" fill="#e8dcc9" fillOpacity="0.22" transform="rotate(-14 23.7 16.1)"/>
      </svg>;

    case 'path_broken':
      return <svg width={size} height={size} viewBox={v}>
        <polygon points={CT} fill="#746d66"/>
        <polygon points={CL} fill="#524d47"/>
        <polygon points={CR} fill="#3a3734"/>
        {/* deep road cracks */}
        <path d="M9.8 15.1l13.4 8.6M19.8 9.8l10.7 9.7M24.7 24l9-8.7" stroke="#23211f" strokeWidth="1.26" fill="none" strokeOpacity="0.84"/>
        {/* crack edges */}
        <path d="M10.6 15.7l12.0 7.8M20.6 10.4l9.6 8.8M25.4 23.4l8.1-7.7" stroke="#4e4943" strokeWidth="0.68" fill="none" strokeOpacity="0.56"/>
        {/* collapsed paving remnants */}
        <rect x="11.8" y="11.4" width="8.3" height="5.7" rx="0.5" fill="#8a837a" transform="rotate(10 16 14.2)"/>
        <rect x="26.8" y="13.7" width="7.6" height="5.4" rx="0.5" fill="#726b63" transform="rotate(-12 30.6 16.4)"/>
        <rect x="19.5" y="20.2" width="6.5" height="4.7" rx="0.45" fill="#93867b" transform="rotate(8 22.8 22.5)"/>
        {/* chipped edges */}
        <path d="M8.7 23.6l3.7-1.3 1.5 2.0-4.1 1.2z" fill="#322f2c" fillOpacity="0.48"/>
        <path d="M34.8 16.9l2.8-1.0 1.0 1.6-3.2 1.1z" fill="#322f2c" fillOpacity="0.42"/>
        {/* rubble + pebbles */}
        <circle cx="17.4" cy="13.8" r="1.3" fill="#9c9286"/>
        <circle cx="27.2" cy="20.3" r="1.2" fill="#6a625a"/>
        <circle cx="31.1" cy="14.4" r="1.0" fill="#84786c"/>
        <rect x="14.1" y="24.1" width="2.3" height="1.4" rx="0.3" fill="#7b6f63" transform="rotate(-14 15.2 24.8)"/>
        <rect x="29.3" y="21.8" width="2.0" height="1.3" rx="0.3" fill="#696057" transform="rotate(12 30.3 22.5)"/>
        {/* dry dust veil */}
        <ellipse cx="21.7" cy="17.2" rx="3.5" ry="1.7" fill="#b8ab99" fillOpacity="0.22" transform="rotate(-10 21.7 17.2)"/>
        {/* subtle calm highlight */}
        <rect x="22.4" y="15.8" width="3.1" height="0.8" rx="0.4" fill="#ddd3c4" fillOpacity="0.20" transform="rotate(-16 24 16.2)"/>
      </svg>;

    case 'water_murky':
      return <svg width={size} height={size} viewBox={v}>
        <polygon points={CT} fill="#5b7579"/>
        <polygon points={CL} fill="#3c5259"/>
        <polygon points={CR} fill="#2b3e45"/>
        {/* muddy shallow bed patches */}
        <ellipse cx="17.6" cy="18.8" rx="4.0" ry="2.1" fill="#7a6d5e" fillOpacity="0.30" transform="rotate(18 17.6 18.8)"/>
        <ellipse cx="29.8" cy="14.9" rx="3.3" ry="1.9" fill="#675e52" fillOpacity="0.28" transform="rotate(-16 29.8 14.9)"/>
        {/* gentle ripples */}
        <ellipse cx="16.4" cy="15.0" rx="2.2" ry="1.0" stroke="#9dc0c8" strokeWidth="0.65" fill="none" strokeOpacity="0.62"/>
        <ellipse cx="27.4" cy="20.1" rx="1.9" ry="0.9" stroke="#9dc0c8" strokeWidth="0.62" fill="none" strokeOpacity="0.56"/>
        <ellipse cx="22.2" cy="13.0" rx="1.4" ry="0.7" stroke="#8ab0b8" strokeWidth="0.56" fill="none" strokeOpacity="0.52"/>
        {/* submerged pebbles */}
        <circle cx="14.6" cy="13.8" r="1.2" fill="#b0b1a4"/>
        <circle cx="23.1" cy="19.3" r="1.1" fill="#7f8179"/>
        <circle cx="31.2" cy="16.2" r="1.0" fill="#6f675d"/>
        {/* dry grass remnants */}
        <path d="M11.8 24.5l0.9-2.7M33.8 22.6l-0.8-2.3M24.6 25.5l0.6-2.0" stroke="#8f846e" strokeWidth="0.78" strokeOpacity="0.84" fill="none"/>
        {/* thin dirty film + calm sheen */}
        <ellipse cx="22.3" cy="17.1" rx="3.5" ry="1.6" fill="#c8d2cd" fillOpacity="0.18" transform="rotate(-10 22.3 17.1)"/>
        <rect x="21.9" y="15.7" width="3.4" height="0.85" rx="0.42" fill="#e1eaeb" fillOpacity="0.26" transform="rotate(-14 23.6 16.1)"/>
      </svg>;

    case 'brick_ruin':
      return <svg width={size} height={size} viewBox={v}>
        <polygon points={CT} fill="#996251"/>
        <polygon points={CL} fill="#67483b"/>
        <polygon points={CR} fill="#4a342b"/>
        {/* broken brick rows */}
        <rect x="9.2" y="11.2" width="8.8" height="5.3" rx="0.45" fill="#b07058" transform="rotate(7 13.6 13.8)"/>
        <rect x="20.0" y="10.5" width="8.1" height="5.0" rx="0.42" fill="#985d49" transform="rotate(-5 24.0 13.0)"/>
        <rect x="30.0" y="11.3" width="7.4" height="4.8" rx="0.4" fill="#84584a" transform="rotate(6 33.7 13.7)"/>
        <rect x="10.4" y="18.0" width="8.0" height="4.8" rx="0.42" fill="#c07e62" transform="rotate(-8 14.4 20.4)"/>
        <rect x="20.8" y="18.4" width="8.8" height="5.1" rx="0.45" fill="#a86650" transform="rotate(6 25.2 21.0)"/>
        <rect x="31.2" y="18.7" width="6.7" height="4.4" rx="0.38" fill="#8a5b4b" transform="rotate(-7 34.6 20.9)"/>
        {/* soil/sand in gaps */}
        <path d="M9.8 16.7h28.0M11.0 24.1h25.8" stroke="#6a5a4c" strokeWidth="1.0" strokeOpacity="0.56"/>
        {/* fracture traces */}
        <path d="M14.2 14.3l5.2 3.5M24.8 13.8l4.4 4.0M31.0 21.7l3.5-3.1" stroke="#3f2f27" strokeWidth="0.78" fill="none" strokeOpacity="0.70"/>
        <path d="M14.5 14.8l4.7 3.2M25.1 14.3l4.0 3.6M31.4 21.3l3.1-2.8" stroke="#6a5043" strokeWidth="0.45" fill="none" strokeOpacity="0.46"/>
        {/* chipped fragments + pebbles */}
        <rect x="7.8" y="21.2" width="2.3" height="1.4" rx="0.3" fill="#915f4f" transform="rotate(18 8.9 21.9)"/>
        <rect x="27.8" y="24.0" width="2.0" height="1.3" rx="0.3" fill="#ad735b" transform="rotate(-12 28.8 24.6)"/>
        <circle cx="16.7" cy="24.3" r="1.15" fill="#b6a894"/>
        <circle cx="33.1" cy="16.7" r="1.0" fill="#8e8275"/>
        {/* dry grass remnants */}
        <path d="M12.1 26.2l0.8-2.4M36.2 24.3l-0.8-2.1M23.6 26.9l0.6-1.9" stroke="#9a8a72" strokeWidth="0.78" strokeOpacity="0.85" fill="none"/>
        {/* warm subtle sheen */}
        <rect x="22.0" y="15.7" width="3.2" height="0.82" rx="0.4" fill="#f0ddc8" fillOpacity="0.22" transform="rotate(-14 23.6 16.1)"/>
      </svg>;

    /* Farming — original 2D */
    case 'field_barren':
      return <svg {...common}><rect x="4" y="14" width="40" height="22" rx="2" fill="#3a2e1e" stroke="#1c1410"/><path d="M4 20h40M4 26h40M4 32h40" stroke="#2a2014"/></svg>;
    case 'potato_field_0':
      return <svg {...common}><rect x="4" y="26" width="40" height="12" rx="2" fill="#2c1e0e" stroke="#1c1008"/><path d="M4 32h40M4 37h40" stroke="#1e1408" strokeWidth="0.8"/><ellipse cx="16" cy="27" rx="4" ry="2.5" fill="#3a2412"/><ellipse cx="28" cy="27" rx="4" ry="2.5" fill="#3a2412"/><ellipse cx="40" cy="27" rx="4" ry="2.5" fill="#3a2412"/><rect x="14" y="25" width="4" height="1.5" rx="0.5" fill="#1a1008"/><rect x="26" y="25" width="4" height="1.5" rx="0.5" fill="#1a1008"/><rect x="38" y="25" width="4" height="1.5" rx="0.5" fill="#1a1008"/></svg>;
    case 'potato_field_50':
      return <svg {...common}><rect x="4" y="30" width="40" height="8" rx="2" fill="#2c1e0e" stroke="#1c1008"/><path d="M15 30v-8M26 30v-10M37 30v-7" stroke="#4a5a28" strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="13" cy="20" rx="4" ry="2.5" fill="#5a6a30" transform="rotate(-20,13,20)"/><ellipse cx="17" cy="21" rx="4" ry="2.5" fill="#5a6a30" transform="rotate(15,17,21)"/><ellipse cx="24" cy="18" rx="4.5" ry="2.5" fill="#5a6a30" transform="rotate(-25,24,18)"/><ellipse cx="28" cy="17" rx="4" ry="2.5" fill="#5a6a30" transform="rotate(20,28,17)"/><ellipse cx="35" cy="21" rx="4" ry="2.5" fill="#5a6a30" transform="rotate(-15,35,21)"/><ellipse cx="39" cy="22" rx="4" ry="2.5" fill="#5a6a30" transform="rotate(18,39,22)"/></svg>;
    case 'potato_field_100':
      return <svg {...common}><rect x="4" y="34" width="40" height="4" rx="2" fill="#2c1e0e" stroke="#1c1008"/><path d="M15 34v-18M26 34v-20M37 34v-17" stroke="#3a4820" strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="11" cy="14" rx="5" ry="3" fill="#4a6028" transform="rotate(-25,11,14)"/><ellipse cx="19" cy="13" rx="5" ry="3" fill="#4a6028" transform="rotate(20,19,13)"/><ellipse cx="22" cy="11" rx="5.5" ry="3" fill="#4a6028" transform="rotate(-30,22,11)"/><ellipse cx="30" cy="10" rx="5" ry="3" fill="#4a6028" transform="rotate(25,30,10)"/><ellipse cx="33" cy="13" rx="5" ry="3" fill="#4a6028" transform="rotate(-18,33,13)"/><ellipse cx="41" cy="15" rx="4.5" ry="2.5" fill="#4a6028" transform="rotate(22,41,15)"/><ellipse cx="18" cy="33" rx="4" ry="2.5" fill="#8a6a3a"/><ellipse cx="30" cy="33" rx="4" ry="2.5" fill="#8a6a3a"/></svg>;
    case 'hoe_rust':
      return <svg {...common}><rect x="22" y="10" width="4" height="28" rx="2" fill="#5a4228" stroke="#2a1e10"/><rect x="10" y="18" width="16" height="5" rx="1" fill="#6a5038" stroke="#2a1e10"/><path d="M12 18l-4 8 4 0" stroke="#5a4028" strokeWidth="1.5" fill="none"/><rect x="8" y="22" width="6" height="8" rx="1" fill="#5a3e24" stroke="#3a2214"/><path d="M8 24h6M8 27h6" stroke="#3a2810" strokeWidth="0.8"/></svg>;
    case 'pickaxe_rust':
      return <svg {...common}>
        {/* wooden handle */}
        <rect x="22.1" y="8.6" width="3.8" height="30.8" rx="1.6" fill="#7a5b3e" stroke="#3a2a1a"/>
        <rect x="22.8" y="11.2" width="2.4" height="25.4" rx="1.0" fill="#8b6a49" fillOpacity="0.45"/>
        {/* wrapped cloth */}
        <rect x="20.6" y="24.8" width="6.8" height="2.4" rx="0.8" fill="#b9a88d"/>
        <rect x="20.8" y="27.6" width="6.4" height="2.2" rx="0.8" fill="#a79880"/>
        {/* repaired metal collar */}
        <rect x="20.6" y="14.6" width="6.8" height="2.4" rx="0.8" fill="#5a534d" stroke="#2d2925"/>
        {/* rusted pickaxe head */}
        <path d="M10.2 16.0h27.6l-3.2 3.6H13.4z" fill="#8a5138" stroke="#3b2418"/>
        <path d="M9.8 16.0l-3.0 3.2 6.0 0.2 2.2-3.4z" fill="#6e4330" stroke="#3b2418"/>
        <path d="M38.2 16.0l3.0 3.0-6.2 0.4-2.0-3.4z" fill="#73503a" stroke="#3b2418"/>
        {/* chipped tip / scratches */}
        <rect x="34.8" y="18.0" width="1.8" height="0.9" rx="0.4" fill="#2f2b28"/>
        <path d="M13.4 17.6l2.0 0M28.0 18.4l1.8 0" stroke="#b27759" strokeWidth="0.7" strokeLinecap="round"/>
      </svg>;
    case 'potato_seed':
      return <svg {...common}><ellipse cx="24" cy="28" rx="9" ry="6" fill="#5a4a28" stroke="#2a2010"/><ellipse cx="18" cy="26" rx="6" ry="4" fill="#4a3c20" stroke="#2a2010"/><path d="M24 22c0 0 1-6 5-8" stroke="#4a6028" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M20 23c0 0-1-5-4-6" stroke="#4a6028" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M24 22c1-2 4-4 3-7" stroke="#4a6028" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>;
    case 'potato_harvest':
      return <svg {...common}><ellipse cx="24" cy="26" rx="11" ry="8" fill="#8a6a3a" stroke="#4a3818"/><ellipse cx="16" cy="28" rx="7" ry="5.5" fill="#7a5e30" stroke="#3a2c14"/><ellipse cx="32" cy="24" rx="7" ry="5" fill="#9a7844" stroke="#4a3818"/><path d="M24 18c0 0 2-5 5-5 1 0 2 1 1 2" stroke="#4a6028" strokeWidth="1.5" fill="none"/><path d="M18 20c0 0-1-4-4-4" stroke="#4a6028" strokeWidth="1.5" fill="none"/></svg>;
    case 'iron_rust_fragment':
      return <svg {...common}>
        <path d="M9.6 27.8l8.0-10.2 10.8-2.4 10.4 5.6-5.2 11.2-12.6 3.1z" fill="#8a4f38" stroke="#3a2418"/>
        <path d="M17.8 18.0l-1.6 7.2 6.2 6.0 6.8-5.0 2.9-8.4" stroke="#2d2724" strokeWidth="1.0"/>
        <rect x="24.8" y="23.6" width="4.2" height="1.4" rx="0.6" fill="#5b514a"/>
      </svg>;

    /* Furniture — original 2D */
    case 'desk_iron':
      return <svg {...common}><rect x="6" y="20" width="36" height="4" fill="#4a4036" stroke="#2a2218"/><path d="M10 24v18M38 24v18"/><rect x="14" y="14" width="10" height="3" fill="#8a5635" stroke="none"/><rect x="26" y="16" width="8" height="2" fill="#c8b896" stroke="none"/></svg>;
    case 'chair_iron':
      return <svg {...common}><rect x="12" y="24" width="22" height="4" fill="#4a4036" stroke="#2a2218"/><rect x="32" y="10" width="3" height="18" fill="#4a4036" stroke="#2a2218"/><path d="M14 28v14M32 28v14"/></svg>;
    case 'shelf_rust':
      return <svg {...common}>
        {/* frame */}
        <rect x="10" y="7" width="4" height="34" rx="1" fill="#4e4a46" stroke="#2e2a27"/>
        <rect x="34" y="7" width="4" height="34" rx="1" fill="#55504b" stroke="#2e2a27"/>
        <rect x="14" y="7" width="20" height="3" rx="1" fill="#4a4541" stroke="none"/>
        <rect x="14" y="38" width="20" height="3" rx="1" fill="#6c4631" stroke="none"/>
        {/* warped shelves */}
        <path d="M14 17.5h20" stroke="#5d5851" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M14 25.8h20" stroke="#615b54" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M14 34.2h20" stroke="#5b5550" strokeWidth="3.2" strokeLinecap="round"/>
        {/* paint chips / rust */}
        <rect x="19.2" y="16.1" width="3.8" height="0.9" rx="0.4" fill="#8d8377"/>
        <rect x="28.0" y="24.2" width="3.1" height="0.9" rx="0.4" fill="#7a4c34"/>
        <rect x="17.6" y="32.7" width="2.8" height="0.9" rx="0.4" fill="#7a4c34"/>
        {/* stored objects */}
        <rect x="16.2" y="22.2" width="4.6" height="2.0" rx="0.4" fill="#7a6149"/>
        <rect x="24.6" y="31.1" width="5.0" height="2.2" rx="0.4" fill="#6a5a4b"/>
        <rect x="30.4" y="15.2" width="1.5" height="3.1" rx="0.6" fill="#98a097"/>
      </svg>;
    case 'bed_iron':
      return <svg {...common}><rect x="6" y="22" width="36" height="12" rx="2" fill="#4a3a32" stroke="#2a1c14"/><rect x="6" y="28" width="36" height="6" fill="#4a4036" stroke="none"/><rect x="8" y="20" width="8" height="4" fill="#8a7c66" stroke="none"/></svg>;
    case 'lamp_broken':
      return <svg {...common}>
        {/* base + bent pole */}
        <rect x="22" y="38" width="7" height="3.6" rx="1.2" fill="#545b61" stroke="#2f3438"/>
        <path d="M25.6 38V18.2l-5.2-4.4" stroke="#575f66" strokeWidth="2.7" strokeLinecap="round"/>
        <path d="M20.4 13.8l-4.6 4.3" stroke="#575f66" strokeWidth="2.5" strokeLinecap="round"/>
        {/* support + hanging wire */}
        <path d="M22.3 26.4l-2.5 6.2" stroke="#744f37" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M14.8 18.6v6.2" stroke="#2d2522" strokeWidth="1.2" strokeLinecap="round"/>
        {/* broken lamp head */}
        <rect x="8.6" y="10.4" width="11.5" height="7.6" rx="1.2" fill="#4f565d" stroke="#2f3438"/>
        <rect x="10.8" y="12.2" width="7.2" height="4.0" rx="0.8" fill="#2f3235"/>
        <rect x="8.5" y="16.5" width="4.2" height="1.5" rx="0.7" fill="#96a0aa" fillOpacity="0.62" transform="rotate(-20 10.6 17.2)"/>
        <rect x="15.0" y="15.6" width="3.9" height="1.4" rx="0.7" fill="#96a0aa" fillOpacity="0.55" transform="rotate(18 17.0 16.3)"/>
        {/* faint warm glow */}
        <circle cx="14.2" cy="16.2" r="2.4" fill="#ffd7a7"/>
        <circle cx="14.2" cy="16.2" r="1.2" fill="#ffb66f"/>
      </svg>;
    case 'drum_oil':
      return <svg {...common}><rect x="14" y="10" width="20" height="30" rx="3" fill="#9a4336" stroke="#4a2018"/><path d="M14 18h20M14 30h20" stroke="#4a2018"/></svg>;

    /* Buildings — original 2D */
    case 'shack_scrap':
      return <svg {...common}><path d="M8 34l16-14 16 14v8H8z" fill="#3a2a1c" stroke="#1a140e"/><rect x="20" y="33" width="8" height="9" fill="#1a1410"/><rect x="8" y="29" width="32" height="3" fill="#5e3a20" opacity="0.7"/><text x="35" y="12" fontSize="9" fill="#c97b4a" fontFamily="monospace">1</text></svg>;
    case 'shack_scrap_2':
      return <svg {...common}><path d="M6 34l18-15 18 15v8H6z" fill="#3e2c1c" stroke="#1a140e"/><rect x="18" y="31" width="9" height="11" fill="#1a1410"/><rect x="30" y="25" width="6" height="7" fill="#1a2830" opacity="0.8" stroke="#3c2816" strokeWidth="1"/><rect x="6" y="27" width="36" height="3" fill="#6a5838" opacity="0.8"/><text x="33" y="12" fontSize="9" fill="#c97b4a" fontFamily="monospace">2</text></svg>;
    case 'shack_scrap_3':
      return <svg {...common}><path d="M4 34l20-17 20 17v8H4z" fill="#422e1e" stroke="#1a140e"/><rect x="17" y="30" width="10" height="12" fill="#1a1410"/><rect x="30" y="24" width="7" height="8" fill="#3a2810" opacity="0.9" stroke="#3e2a18" strokeWidth="1"/><rect x="4" y="25" width="40" height="3" fill="#5a4c30" opacity="0.9"/><rect x="28" y="14" width="5" height="11" fill="#2c2820"/><text x="31" y="12" fontSize="9" fill="#c97b4a" fontFamily="monospace">3</text></svg>;
    case 'warehouse_rust':
      return <svg {...common}><rect x="6" y="18" width="36" height="24" fill="#6a3c28" stroke="#3a1c10"/><rect x="6" y="16" width="36" height="4" fill="#5a4828"/><rect x="18" y="26" width="12" height="16" fill="#1c1410"/><rect x="6" y="26" width="36" height="2" fill="#3a2410" opacity="0.7"/><rect x="6" y="33" width="36" height="2" fill="#3a2410" opacity="0.7"/><text x="33" y="14" fontSize="9" fill="#c97b4a" fontFamily="monospace">1</text></svg>;
    case 'warehouse_rust_2':
      return <svg {...common}><rect x="5" y="16" width="38" height="26" fill="#6a3c28" stroke="#3a1c10"/><rect x="5" y="14" width="38" height="4" fill="#4a3c28"/><rect x="16" y="24" width="16" height="18" fill="#1c1410"/><rect x="23" y="24" width="2" height="18" fill="#3c2816"/><rect x="5" y="23" width="38" height="2" fill="#4a3c28"/><rect x="5" y="33" width="38" height="2" fill="#4a3c28"/><rect x="36" y="28" width="5" height="9" fill="#3c2816" opacity="0.8"/><text x="31" y="13" fontSize="9" fill="#c97b4a" fontFamily="monospace">2</text></svg>;
    case 'warehouse_rust_3':
      return <svg {...common}><rect x="4" y="14" width="40" height="28" fill="#6a3c28" stroke="#3a1c10"/><rect x="4" y="12" width="40" height="4" fill="#4a3c28"/><rect x="15" y="22" width="18" height="20" fill="#1c1410"/><rect x="23" y="22" width="2" height="20" fill="#3c2816"/><rect x="4" y="21" width="40" height="3" fill="#4a3c28"/><rect x="4" y="32" width="40" height="3" fill="#4a3c28"/><rect x="37" y="24" width="5" height="14" fill="#3c2816"/><rect x="37" y="26" width="5" height="2" fill="#5a4828"/><rect x="37" y="32" width="5" height="2" fill="#5a4828"/><circle cx="23" cy="20" r="2" fill="#d08020" opacity="0.85"/><text x="29" y="12" fontSize="9" fill="#c97b4a" fontFamily="monospace">3</text></svg>;

    /* Ore — original 2D */
    case 'iron_rust':
      return <svg {...common}>
        <path d="M8.8 30.4l8.6-12.2 14.8-2.8 10.2 6.3-5.8 12.9-15.5 3.8z" fill="#8a4f38" stroke="#3a2418"/>
        <path d="M17.2 18.2l-2.0 8.8 7.4 7.2 8.0-5.8 3.5-10.0" stroke="#2d2724" strokeWidth="1.0"/>
        <rect x="27.5" y="20.2" width="4.5" height="1.6" rx="0.6" fill="#5b514a"/>
        <rect x="13.3" y="25.0" width="3.8" height="1.4" rx="0.6" fill="#6f5b48"/>
      </svg>;

    default:
      return <svg {...common}><rect x="8" y="8" width="32" height="32" rx="2" fill="#3a3028" stroke="#2a2218"/></svg>;
  }
};
window.ItemGlyph = ItemGlyph;
