/* ============================================================
   State Store — single source of truth, persists to localStorage
   ============================================================ */

(function () {
  const STORAGE_KEY = 'world-builder-v1';
  const SAVE_SLOTS_KEY = 'world-builder-save-slots-v1';
  const ACTIVE_SAVE_KEY = 'world-builder-active-save-v1';
  const TIME_TO_WEATHER = {
    morning: 'morning',
    noon: 'noon',
    evening: 'evening',
    night: 'night',
    deep_night: 'deep_night',
  };
  const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  const WEATHER_MODES = ['clear', 'cloudy', 'rain', 'storm', 'snow'];
  const SPECIAL_WEATHERS = ['night_starry', 'seabed', 'collapse', 'blood_moon'];
  const WORLD_CATEGORIES = ['tile', 'furniture', 'decoration', 'building', 'farming', 'ore', 'items'];
  // Building upgrade chains: placing same building on same tile merges into the next level
  const BUILDING_MERGES = {
    'shack_scrap':     'shack_scrap_2',
    'shack_scrap_2':   'shack_scrap_3',
    'warehouse_rust':  'warehouse_rust_2',
    'warehouse_rust_2':'warehouse_rust_3',
  };
  const STARTER_TILES = [
    { x: 0, z: 0, type: 'soil_ash' },
    { x: 1, z: 0, type: 'soil_ash', item: 'desk_iron',  itemCategory: 'furniture', itemRotation: 0 },
    { x: 0, z: 1, type: 'soil_ash' },
    { x: 1, z: 1, type: 'soil_ash', item: 'chair_iron', itemCategory: 'furniture', itemRotation: 2 },
  ];
  const DEFAULT_SPAWN = { x: 0, z: 0 };
  const STARTER_TILE_KEYS = new Set(STARTER_TILES.map(t => `${t.x},${t.z}`));
  function isStarterTileProtected(x, z) {
    return STARTER_TILE_KEYS.has(`${x},${z}`);
  }

  // ---------- Catalog ----------
  const CATALOG = {
    tile: [
      { id: 'soil_barren',  name: '荒土',         kind: '土',     price: 1 },
      { id: 'soil_ash',     name: '灰土',         kind: '土',     price: 1 },
      { id: 'soil_toxic',   name: '汚染土',       kind: '土',     price: 1 },
      { id: 'soil_cracked', name: 'ひび割れた土', kind: '土',     price: 1 },
      { id: 'path_broken',  name: '崩れた道',     kind: '道',     price: 1 },
      { id: 'water_murky',  name: '濁水',         kind: '水',     price: 1 },
      { id: 'brick_ruin',   name: '崩れたレンガ', kind: 'レンガ', price: 2 },
    ],
    furniture: [
      { id: 'desk_iron',    name: '鉄製の机',     kind: '机',   price: 1 },
      { id: 'chair_iron',   name: '鉄製の椅子',   kind: '椅子', price: 1 },
      { id: 'shelf_rust',   name: '錆びた棚',     kind: '収納', price: 2 },
      { id: 'bed_iron',     name: '鉄製ベッド',   kind: '休憩', price: 3 },
    ],
    decoration: [
      { id: 'lamp_broken',  name: '折れた街灯',   kind: '装飾', price: 2 },
      { id: 'drum_oil',     name: 'ドラム缶',     kind: '装飾', price: 1 },
    ],
    building: [
      { id: 'shack_scrap',   name: '廃材小屋 Lv1', kind: '住居', price: 10 },
      { id: 'shack_scrap_2', name: '廃材小屋 Lv2', kind: '住居', price: null, shopHidden: true },
      { id: 'shack_scrap_3', name: '廃材小屋 Lv3', kind: '住居', price: null, shopHidden: true },
      { id: 'warehouse_rust',   name: '錆びた倉庫 Lv1', kind: '倉庫', price: 15 },
      { id: 'warehouse_rust_2', name: '錆びた倉庫 Lv2', kind: '倉庫', price: null, shopHidden: true },
      { id: 'warehouse_rust_3', name: '錆びた倉庫 Lv3', kind: '倉庫', price: null, shopHidden: true },
    ],
    farming: [
      { id: 'field_barren',    name: '荒れた耕地',          kind: '土',   price: 2,    shopHidden: true, noReturn: true },
      { id: 'potato_field_0',  name: '廃土ポテト (0%)',      kind: '作物', price: null, shopHidden: true, noReturn: true },
      { id: 'potato_field_50', name: '廃土ポテト (50%)',     kind: '作物', price: null, shopHidden: true, noReturn: true },
      { id: 'potato_field_100',name: '廃土ポテト (収穫可)',  kind: '作物', price: null, shopHidden: true, noReturn: true },
      { id: 'potato_seed',     name: '廃土ポテトの種',       kind: '種',   price: 3,    usable: true, harvestMin: 15 },
    ],
    ore: [
      { id: 'iron_rust',    name: '錆鉄',         kind: '鉄',   price: 1, harvestMin: 15 },
    ],
    items: [
      { id: 'potato_harvest',  name: '廃土ポテト',   kind: '食材', price: null, shopHidden: true },
      { id: 'iron_rust_fragment', name: '錆鉄片',    kind: '素材', price: null, shopHidden: true },
    ],
    carry: [
      { id: 'hoe_rust',      name: '錆びたクワ',       kind: '道具',   price: 10, usable: true, maxDurability: 10, noStack: true },
      { id: 'pickaxe_rust',  name: '錆びたピッケル',   kind: '道具',   price: 10, usable: true, maxDurability: 10, noStack: true },
    ],
  };

  // Build map id -> item
  const CATALOG_MAP = {};
  Object.entries(CATALOG).forEach(([cat, items]) => {
    items.forEach(it => { CATALOG_MAP[it.id] = { ...it, category: cat }; });
  });

  // ---------- Defaults ----------
  function defaultState() {
    return {
      version: 4,
      currency: { dust: 12 },
      character: {
        name: '白群',          // White-haired girl
        level: 1,
        xp: 0,
        happiness: 0,         // 0-100
        position: { x: 0, z: 0 },
      },
      world: {
        // 4 starting tiles (corners around origin), with one having a desk and another a chair
        // Coordinates: tiles indexed as { x, z, type, item? }
        tiles: STARTER_TILES.map(t => ({ ...t })),
        weather: 'morning',
        timeOfDay: 'morning',
        hour: 6,
        season: 'spring',
        weatherMode: 'clear',
        specialWeather: null,
        homeAnchor: { x: 0, z: 0 },
        spawnTile: { ...DEFAULT_SPAWN },
        spawnBedKey: null,
        shelfStorages: {},
      },
      inventory: {
        tile: { soil_barren: 2, soil_ash: 1 },
        furniture: { desk_iron: 0, chair_iron: 0 },
        decoration: {},
        building: {},
        farming: {},
        ore: {},
        items: {}, // generic resources (DUST is currency)
      },
      carried: {
        hotbar: Array(10).fill(null),
        bag:    Array(30).fill(null),
      },
      tasks: {
        statuses: [
          { id: 's_todo',     name: 'To do',       color: '#6a6155' },
          { id: 's_pending',  name: 'Pending',     color: '#a08456' },
          { id: 's_progress', name: 'In progress', color: '#5b8aa4' },
          { id: 's_done',     name: 'Done',        color: '#6f8a5b' },
        ],
        labels: [
          { id: 'l_work',  name: '仕事',  color: '#c97b4a' },
          { id: 'l_study', name: '勉強',  color: '#5b8aa4' },
          { id: 'l_life',  name: '生活',  color: '#6f8a5b' },
          { id: 'l_idea',  name: '構想',  color: '#a08456' },
        ],
        items: [
          {
            id: 't_seed_1',
            title: '崩壊都市の地形を設計する',
            note: 'タイル配置の方針を決め、最初のエリアをモデリング。',
            statusId: 's_progress',
            labelIds: ['l_work'],
            level: 'Hard',
            rank: 'High',
            parentId: null,
            assignees: ['白群'],
            startDate: '2026-05-01',
            endDate: '2026-05-31',
            createdAt: Date.now() - 86400e3,
            updatedAt: Date.now() - 3600e3,
          },
          {
            id: 't_seed_1a',
            title: '中央広場のラフ',
            statusId: 's_done',
            labelIds: ['l_work'],
            level: 'Normal', rank: 'Medium',
            parentId: 't_seed_1',
            createdAt: Date.now() - 86000e3, updatedAt: Date.now() - 80000e3,
          },
          {
            id: 't_seed_1b',
            title: '崩れた橋の配置',
            statusId: 's_progress',
            labelIds: ['l_work'],
            level: 'Normal', rank: 'High',
            parentId: 't_seed_1',
            createdAt: Date.now() - 70000e3, updatedAt: Date.now() - 30000e3,
          },
          {
            id: 't_seed_1c',
            title: '海底都市の入口',
            statusId: 's_todo',
            labelIds: ['l_work', 'l_idea'],
            level: 'Hard', rank: 'High',
            parentId: 't_seed_1',
            createdAt: Date.now() - 60000e3, updatedAt: Date.now() - 60000e3,
          },
          {
            id: 't_seed_2',
            title: '線形代数 — 章2の演習',
            note: '固有値・固有ベクトル。',
            statusId: 's_todo',
            labelIds: ['l_study'],
            level: 'Normal',
            rank: 'Medium',
            parentId: null,
            assignees: [],
            startDate: '2026-05-20',
            endDate: '2026-05-27',
            createdAt: Date.now() - 7200e3, updatedAt: Date.now() - 3600e3,
          },
          {
            id: 't_seed_3',
            title: 'TOEFL 単語 30個',
            statusId: 's_pending',
            labelIds: ['l_study'],
            level: 'Easy', rank: 'Low',
            parentId: null,
            createdAt: Date.now() - 100000e3, updatedAt: Date.now() - 90000e3,
          },
          {
            id: 't_seed_4',
            title: '美しい星空エリアの設計案',
            note: 'チャペル＋崩れた天文台のスケッチ。',
            statusId: 's_progress',
            labelIds: ['l_idea', 'l_work'],
            level: 'Expert', rank: 'Critical',
            parentId: null,
            assignees: ['白群'],
            startDate: '2026-05-10',
            endDate: '2026-06-30',
            createdAt: Date.now() - 200000e3, updatedAt: Date.now() - 1200e3,
          },
          {
            id: 't_seed_5',
            title: '部屋を片付ける',
            statusId: 's_done',
            labelIds: ['l_life'],
            level: 'Easy', rank: 'Low',
            parentId: null,
            createdAt: Date.now() - 86400e3 * 2, updatedAt: Date.now() - 86400e3,
          },
        ],
      },
      timer: {
        workMin: 25,
        breakMin: 5,
        cycles: 3,
        alertSound: 'alarm', // 'alarm' | 'warning'
        musicTrack: 0, // 0..N
      },
      stats: {
        sessions: 0,
        focusSeconds: 0,
        breakSeconds: 0,
        daily: (() => {
          const arr = [];
          for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            arr.push({ date: d.toISOString().slice(0,10), minutes: 0 });
          }
          return arr;
        })(),
      },
      daily: {
        claimed: [false, false, false, false, false, false, false],
        today: 0,
        lastClaimDate: null,
      },
      missions: [
        { id: 'm1', text: '集中セッションを1回完了する', reward: 3, done: false, type: 'session' },
        { id: 'm2', text: '15分以上の作業を達成する',     reward: 2, done: false, type: 'focus' },
        { id: 'm3', text: 'タスクを1つDoneに移動する',    reward: 2, done: false, type: 'task' },
        { id: 'm4', text: 'タイルを1つ配置する',          reward: 1, done: false, type: 'place' },
      ],
      settings: {
        language: 'ja',
        sfx: true,
      },
    };
  }

  // ---------- Load / save ----------
  function inferTimeOfDayFromWeather(weather) {
    if (weather === 'morning') return 'morning';
    if (weather === 'noon') return 'noon';
    if (weather === 'evening') return 'evening';
    if (weather === 'deep_night') return 'deep_night';
    return 'night';
  }

  function timeOfDayFromHour(hour) {
    const h = Math.max(0, Math.min(23, Number(hour) || 0));
    if (h >= 5 && h < 10) return 'morning';
    if (h >= 10 && h < 16) return 'noon';
    if (h >= 16 && h < 19) return 'evening';
    if (h >= 19 || h < 1) return 'night';
    return 'deep_night';
  }

  function hourFromTimeOfDay(timeOfDay) {
    if (timeOfDay === 'morning') return 7;
    if (timeOfDay === 'noon') return 12;
    if (timeOfDay === 'evening') return 17;
    if (timeOfDay === 'deep_night') return 2;
    return 21;
  }

  function cloneStateSnapshot(src) {
    return JSON.parse(JSON.stringify(src));
  }

  function readSaveSlotsRaw() {
    try {
      const raw = localStorage.getItem(SAVE_SLOTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeSaveSlotsRaw(list) {
    try {
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    } catch (e) {
      console.warn('save slots write failed', e);
    }
  }

  function getActiveSaveId() {
    try {
      return localStorage.getItem(ACTIVE_SAVE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setActiveSaveId(id) {
    try {
      if (!id) localStorage.removeItem(ACTIVE_SAVE_KEY);
      else localStorage.setItem(ACTIVE_SAVE_KEY, id);
    } catch (e) {}
  }

  function hydrateState(parsed, { bootResetTime = false } = {}) {
    const fallback = defaultState();
    if (!parsed || parsed.version !== 4 || !parsed.world) return fallback;

    const next = cloneStateSnapshot(parsed);
    next.version = 4;

    next.currency = { ...(fallback.currency || {}), ...(next.currency || {}) };
    next.character = { ...(fallback.character || {}), ...(next.character || {}) };
    next.character.position = { ...(fallback.character.position || { x: 0, z: 0 }), ...(next.character.position || {}) };

    next.world = { ...(fallback.world || {}), ...(next.world || {}) };
    next.world.tiles = Array.isArray(next.world.tiles) && next.world.tiles.length
      ? next.world.tiles.map(t => ({ ...t }))
      : STARTER_TILES.map(t => ({ ...t }));
    if (!next.world.timeOfDay) {
      next.world.timeOfDay = inferTimeOfDayFromWeather(next.world.weather);
    }
    if (typeof next.world.hour !== 'number') {
      next.world.hour = hourFromTimeOfDay(next.world.timeOfDay);
    }
    if (!SEASONS.includes(next.world.season)) next.world.season = 'spring';
    if (!WEATHER_MODES.includes(next.world.weatherMode)) next.world.weatherMode = 'clear';
    if (next.world.specialWeather !== null && !SPECIAL_WEATHERS.includes(next.world.specialWeather)) {
      next.world.specialWeather = null;
    }
    if (!next.world.spawnTile) next.world.spawnTile = { ...DEFAULT_SPAWN };
    next.world.spawnTile = {
      x: Number.isFinite(next.world.spawnTile.x) ? Math.round(next.world.spawnTile.x) : DEFAULT_SPAWN.x,
      z: Number.isFinite(next.world.spawnTile.z) ? Math.round(next.world.spawnTile.z) : DEFAULT_SPAWN.z,
    };
    next.world.spawnBedKey = typeof next.world.spawnBedKey === 'string' ? next.world.spawnBedKey : null;
    next.world.shelfStorages = ensureShelfStoragesShape(next.world.shelfStorages);
    if (next.world.spawnBedKey) {
      const bedPos = parseCellKey(next.world.spawnBedKey);
      const bedExists = bedPos && next.world.tiles.some(t => t.x === bedPos.x && t.z === bedPos.z && t.item === 'bed_iron');
      if (!bedExists) {
        next.world.spawnBedKey = null;
        next.world.spawnTile = { ...DEFAULT_SPAWN };
      } else {
        next.world.spawnTile = { x: bedPos.x, z: bedPos.z };
      }
    }

    next.inventory = ensureInventoryShape(next.inventory);
    migrateLegacyDecorationInventory(next.inventory);
    next.carried = ensureCarriedShape(next.carried);
    next.tasks = next.tasks || fallback.tasks;
    next.timer = { ...(fallback.timer || {}), ...(next.timer || {}) };
    next.stats = next.stats || fallback.stats;
    next.daily = next.daily || fallback.daily;
    next.missions = Array.isArray(next.missions) ? next.missions : fallback.missions;
    next.settings = { ...(fallback.settings || {}), ...(next.settings || {}) };

    if (bootResetTime) {
      next.world.timeOfDay = 'morning';
      next.world.hour = 6;
      next.world.weather = 'morning';
      next.world.specialWeather = null;
      const freeTile = (next.world.tiles || []).find(t => !t.item);
      next.character.position = freeTile
        ? { x: freeTile.x, z: freeTile.z }
        : { ...(fallback.character.position || { x: 0, z: 0 }) };
    }

    return next;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return hydrateState(parsed, { bootResetTime: true });
    } catch (e) {
      console.warn('state load failed', e);
      return defaultState();
    }
  }
  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('state save failed', e); }
  }

  function syncActiveSaveSnapshot(currentState) {
    const activeId = getActiveSaveId();
    if (!activeId) return;
    const list = readSaveSlotsRaw();
    const idx = list.findIndex(s => s && s.id === activeId);
    if (idx < 0) return;
    list[idx] = {
      ...list[idx],
      ts: Date.now(),
      state: cloneStateSnapshot(currentState),
    };
    writeSaveSlotsRaw(list);
  }

  function listWorldSaves() {
    const activeId = getActiveSaveId();
    return readSaveSlotsRaw()
      .map(s => ({
        id: s.id,
        name: s.name || 'Untitled world',
        ts: s.ts || 0,
        active: s.id === activeId,
      }))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  function saveWorldSave(name) {
    const list = readSaveSlotsRaw();
    const safeName = (name || '').trim() || ('World ' + (list.length + 1));
    const id = 'ws_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    const slot = {
      id,
      name: safeName,
      ts: Date.now(),
      state: cloneStateSnapshot(state),
    };
    list.unshift(slot);
    writeSaveSlotsRaw(list.slice(0, 50));
    setActiveSaveId(id);
    return { id, name: safeName, ts: slot.ts };
  }

  function loadWorldSave(id) {
    if (!id) return false;
    const list = readSaveSlotsRaw();
    const slot = list.find(s => s && s.id === id);
    if (!slot || !slot.state) return false;
    state = hydrateState(slot.state, { bootResetTime: false });
    save(state);
    setActiveSaveId(id);
    listeners.forEach(fn => fn(state));
    return true;
  }

  function deleteWorldSave(id) {
    if (!id) return false;
    const list = readSaveSlotsRaw();
    const next = list.filter(s => s && s.id !== id);
    if (next.length === list.length) return false;
    writeSaveSlotsRaw(next);
    if (getActiveSaveId() === id) setActiveSaveId('');
    return true;
  }

  // ---------- Store ----------
  const listeners = new Set();
  let state = load();

  function get() { return state; }
  function set(updater) {
    state = (typeof updater === 'function') ? updater(state) : updater;
    save(state);
    syncActiveSaveSnapshot(state);
    listeners.forEach(fn => fn(state));
  }
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function reset() {
    state = defaultState();
    save(state);
    syncActiveSaveSnapshot(state);
    listeners.forEach(fn => fn(state));
  }

  function ensureInventoryShape(inv) {
    const next = { ...(inv || {}) };
    WORLD_CATEGORIES.forEach(cat => {
      next[cat] = { ...(next[cat] || {}) };
    });
    next.items = { ...(next.items || {}) };
    return next;
  }

  function ensureCarriedShape(c) {
    return {
      hotbar: Array(10).fill(null).map((_, i) => c?.hotbar?.[i] ?? null),
      bag:    Array(30).fill(null).map((_, i) => c?.bag?.[i]    ?? null),
    };
  }

  function cloneCarried(c) {
    return {
      hotbar: (c?.hotbar || []).map(s => s ? { ...s } : null),
      bag:    (c?.bag    || []).map(s => s ? { ...s } : null),
    };
  }

  const SHELF_CAPACITY = 12; // 3 x 4
  function shelfKey(x, z) {
    return `${x},${z}`;
  }
  function parseCellKey(key) {
    if (typeof key !== 'string') return null;
    const [sx, sz] = key.split(',');
    const x = Number(sx);
    const z = Number(sz);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
    return { x: Math.round(x), z: Math.round(z) };
  }
  function normalizeShelfSlot(slot) {
    if (!slot || typeof slot !== 'object') return null;
    const kind = slot.kind;
    const id = slot.id;
    const count = Math.max(1, Number(slot.count) || 0);
    if (!id || !Number.isFinite(count)) return null;
    const meta = CATALOG_MAP[id];
    if (!meta) return null;
    if (kind === 'material' && meta.category === 'items') return { kind, id, count };
    if (kind === 'carry' && meta.category === 'carry') return { kind, id, count };
    return null;
  }
  function ensureShelfSlots(arr) {
    const slots = Array(SHELF_CAPACITY).fill(null);
    if (!Array.isArray(arr)) return slots;
    for (let i = 0; i < SHELF_CAPACITY; i++) {
      slots[i] = normalizeShelfSlot(arr[i]);
    }
    return slots;
  }
  function ensureShelfStoragesShape(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    Object.entries(src).forEach(([k, arr]) => {
      out[k] = ensureShelfSlots(arr);
    });
    return out;
  }
  function cloneShelfStorages(raw) {
    const src = ensureShelfStoragesShape(raw);
    const out = {};
    Object.entries(src).forEach(([k, arr]) => {
      out[k] = arr.map(s => (s ? { ...s } : null));
    });
    return out;
  }
  function findShelfSlotForPut(slots, kind, id) {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (s && s.kind === kind && s.id === id) return i;
    }
    return slots.findIndex(s => !s);
  }
  function canPlaceIntoCarried(carried, id) {
    for (const zone of ['bag', 'hotbar']) {
      for (let i = 0; i < carried[zone].length; i++) {
        if (carried[zone][i]?.id === id) return true;
      }
    }
    for (const zone of ['bag', 'hotbar']) {
      for (let i = 0; i < carried[zone].length; i++) {
        if (!carried[zone][i]) return true;
      }
    }
    return false;
  }
  function addCarryToCarried(carried, id, count) {
    for (const zone of ['bag', 'hotbar']) {
      for (let i = 0; i < carried[zone].length; i++) {
        if (carried[zone][i]?.id === id) {
          carried[zone][i] = { id, count: carried[zone][i].count + count };
          return true;
        }
      }
    }
    for (const zone of ['bag', 'hotbar']) {
      for (let i = 0; i < carried[zone].length; i++) {
        if (!carried[zone][i]) {
          carried[zone][i] = { id, count };
          return true;
        }
      }
    }
    return false;
  }

  function buyCarryItem(id) {
    const it = CATALOG_MAP[id];
    if (!it || it.category !== 'carry') return false;
    if (!Number.isFinite(it.price) || it.price < 0) return false;
    let ok = false;
    set(s => {
      if (s.currency.dust < it.price) return s;
      const carried = cloneCarried(s.carried);
      // Stack onto existing slot (unless noStack)
      if (!it.noStack) {
        for (const zone of ['bag', 'hotbar']) {
          for (let i = 0; i < carried[zone].length; i++) {
            if (carried[zone][i]?.id === id) {
              carried[zone][i] = { ...carried[zone][i], count: carried[zone][i].count + 1 };
              ok = true;
              return { ...s, currency: { ...s.currency, dust: s.currency.dust - it.price }, carried };
            }
          }
        }
      }
      // First empty slot
      for (const zone of ['bag', 'hotbar']) {
        for (let i = 0; i < carried[zone].length; i++) {
          if (!carried[zone][i]) {
            const slot = { id, count: 1 };
            if (it.maxDurability !== undefined) slot.uses = it.maxDurability;
            carried[zone][i] = slot;
            ok = true;
            return { ...s, currency: { ...s.currency, dust: s.currency.dust - it.price }, carried };
          }
        }
      }
      return s; // full
    });
    return ok;
  }

  function moveCarriedSlot(from, to) {
    // from / to: { zone: 'hotbar'|'bag', index: number }
    set(s => {
      const carried = cloneCarried(s.carried);
      const fArr = carried[from.zone];
      const tArr = carried[to.zone];
      const tmp = tArr[to.index];
      tArr[to.index] = fArr[from.index];
      fArr[from.index] = tmp;
      return { ...s, carried };
    });
  }

  function removeCarriedSlot(zone, index) {
    set(s => {
      const carried = cloneCarried(s.carried);
      carried[zone][index] = null;
      return { ...s, carried };
    });
  }

  function getShelfSlots(x, z) {
    const s = get();
    const storages = ensureShelfStoragesShape(s.world?.shelfStorages);
    return ensureShelfSlots(storages[shelfKey(x, z)]).map(slot => (slot ? { ...slot } : null));
  }

  function depositMaterialToShelf(x, z, id, amount = 1) {
    const count = Math.max(1, Math.floor(Number(amount) || 0));
    let result = { ok: false, reason: 'invalid' };
    set(s => {
      const tile = s.world.tiles.find(t => t.x === x && t.z === z);
      if (!tile || tile.item !== 'shelf_rust') {
        result = { ok: false, reason: 'not_shelf' };
        return s;
      }
      const itemMeta = CATALOG_MAP[id];
      if (!itemMeta || itemMeta.category !== 'items') {
        result = { ok: false, reason: 'not_material' };
        return s;
      }
      const inv = ensureInventoryShape(s.inventory);
      if ((inv.items[id] || 0) < count) {
        result = { ok: false, reason: 'not_enough' };
        return s;
      }

      const storages = cloneShelfStorages(s.world.shelfStorages);
      const key = shelfKey(x, z);
      const slots = ensureShelfSlots(storages[key]);
      const si = findShelfSlotForPut(slots, 'material', id);
      if (si < 0) {
        result = { ok: false, reason: 'shelf_full' };
        return s;
      }

      if (slots[si]) slots[si] = { ...slots[si], count: slots[si].count + count };
      else slots[si] = { kind: 'material', id, count };
      takeInventoryCount(inv, 'items', id, count);
      storages[key] = slots;
      result = { ok: true, stored: count };
      return { ...s, inventory: inv, world: { ...s.world, shelfStorages: storages } };
    });
    return result;
  }

  function depositCarryToShelf(x, z, zone, index) {
    let result = { ok: false, reason: 'invalid' };
    set(s => {
      const tile = s.world.tiles.find(t => t.x === x && t.z === z);
      if (!tile || tile.item !== 'shelf_rust') {
        result = { ok: false, reason: 'not_shelf' };
        return s;
      }
      const carried = cloneCarried(s.carried);
      if (!carried[zone] || index < 0 || index >= carried[zone].length) {
        result = { ok: false, reason: 'bad_slot' };
        return s;
      }
      const source = carried[zone][index];
      if (!source) {
        result = { ok: false, reason: 'empty' };
        return s;
      }
      const itemMeta = CATALOG_MAP[source.id];
      if (!itemMeta || itemMeta.category !== 'carry') {
        result = { ok: false, reason: 'not_carry' };
        return s;
      }

      const storages = cloneShelfStorages(s.world.shelfStorages);
      const key = shelfKey(x, z);
      const slots = ensureShelfSlots(storages[key]);
      const si = findShelfSlotForPut(slots, 'carry', source.id);
      if (si < 0) {
        result = { ok: false, reason: 'shelf_full' };
        return s;
      }

      if (slots[si]) slots[si] = { ...slots[si], count: slots[si].count + source.count };
      else slots[si] = { kind: 'carry', id: source.id, count: source.count };
      carried[zone][index] = null;
      storages[key] = slots;
      result = { ok: true, stored: source.count };
      return { ...s, carried, world: { ...s.world, shelfStorages: storages } };
    });
    return result;
  }

  function withdrawShelfSlot(x, z, slotIndex) {
    let result = { ok: false, reason: 'invalid' };
    set(s => {
      const tile = s.world.tiles.find(t => t.x === x && t.z === z);
      if (!tile || tile.item !== 'shelf_rust') {
        result = { ok: false, reason: 'not_shelf' };
        return s;
      }
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= SHELF_CAPACITY) {
        result = { ok: false, reason: 'bad_slot' };
        return s;
      }

      const storages = cloneShelfStorages(s.world.shelfStorages);
      const key = shelfKey(x, z);
      const slots = ensureShelfSlots(storages[key]);
      const slot = slots[slotIndex];
      if (!slot) {
        result = { ok: false, reason: 'empty' };
        return s;
      }

      if (slot.kind === 'material') {
        const inv = ensureInventoryShape(s.inventory);
        addInventoryCount(inv, 'items', slot.id, slot.count);
        slots[slotIndex] = null;
        storages[key] = slots;
        result = { ok: true, kind: 'material', count: slot.count };
        return { ...s, inventory: inv, world: { ...s.world, shelfStorages: storages } };
      }

      if (slot.kind === 'carry') {
        const carried = cloneCarried(s.carried);
        if (!canPlaceIntoCarried(carried, slot.id)) {
          result = { ok: false, reason: 'carry_full' };
          return s;
        }
        addCarryToCarried(carried, slot.id, slot.count);
        slots[slotIndex] = null;
        storages[key] = slots;
        result = { ok: true, kind: 'carry', count: slot.count };
        return { ...s, carried, world: { ...s.world, shelfStorages: storages } };
      }

      result = { ok: false, reason: 'invalid_slot' };
      return s;
    });
    return result;
  }

  function migrateLegacyDecorationInventory(inv) {
    if (!inv || !inv.furniture) return;
    if (!inv.decoration) inv.decoration = {};
    ['lamp_broken', 'drum_oil'].forEach((id) => {
      const legacy = Number(inv.furniture[id] || 0);
      if (legacy <= 0) return;
      inv.decoration[id] = (inv.decoration[id] || 0) + legacy;
      delete inv.furniture[id];
    });
  }

  function addInventoryCount(inv, category, id, amount = 1) {
    if (!category || !id || !Number.isFinite(amount) || amount <= 0) return;
    if (!inv[category]) inv[category] = {};
    inv[category][id] = (inv[category][id] || 0) + amount;
  }

  function takeInventoryCount(inv, category, id, amount = 1) {
    if (!category || !id || !Number.isFinite(amount) || amount <= 0) return;
    if (!inv[category]) inv[category] = {};
    const curr = inv[category][id] || 0;
    inv[category][id] = Math.max(0, curr - amount);
  }

  function returnWorldToInventory(inv, tiles, includeTiles = false) {
    (tiles || []).forEach(t => {
      if (includeTiles) addInventoryCount(inv, 'tile', t.type, 1);
      const itemCategory = t.item ? (CATALOG_MAP[t.item]?.category || t.itemCategory) : null;
      if (t.item && itemCategory && !CATALOG_MAP[t.item]?.noReturn) addInventoryCount(inv, itemCategory, t.item, 1);
    });
  }

  function consumeStarterFromInventory(inv) {
    STARTER_TILES.forEach(t => {
      takeInventoryCount(inv, 'tile', t.type, 1);
      if (t.item && t.itemCategory) takeInventoryCount(inv, t.itemCategory, t.item, 1);
    });
  }

  // ---------- Helpers ----------
  function addDust(amount) {
    set(s => ({ ...s, currency: { ...s.currency, dust: s.currency.dust + amount } }));
  }
  function spendDust(amount) {
    if (state.currency.dust < amount) return false;
    set(s => ({ ...s, currency: { ...s.currency, dust: s.currency.dust - amount } }));
    return true;
  }

  function buyItem(category, id) {
    const item = CATALOG_MAP[id];
    if (!item) return false;
    if (state.currency.dust < item.price) return false;
    set(s => {
      const inv = { ...s.inventory };
      inv[category] = { ...inv[category], [id]: (inv[category]?.[id] || 0) + 1 };
      return {
        ...s,
        currency: { ...s.currency, dust: s.currency.dust - item.price },
        inventory: inv,
      };
    });
    return true;
  }

  // Place a tile or item on a coordinate. type = 'tile' | 'furniture' | 'decoration' | 'building' | 'farming' | 'ore'
  function placeAt(category, id, x, z, rotation = 0) {
    set(s => {
      const tiles = [...s.world.tiles];
      const idx = tiles.findIndex(t => t.x === x && t.z === z);
      let placed = false;
      if (category === 'tile') {
        // Adjacency required: must be next to an existing tile (not diagonal)
        const adjacent = tiles.some(t =>
          (Math.abs(t.x - x) === 1 && t.z === z) ||
          (t.x === x && Math.abs(t.z - z) === 1)
        );
        if (!adjacent && tiles.length > 0) return s;
        if (idx >= 0) tiles[idx] = { ...tiles[idx], type: id };
        else tiles.push({ x, z, type: id, itemRotation: 0 });
        placed = true;
      } else {
        // need a tile underneath
        if (idx < 0) return s;

        // Building merge: place same building on occupied tile → upgrade
        if (category === 'building' && tiles[idx].item === id && BUILDING_MERGES[id]) {
          const mergedId = BUILDING_MERGES[id];
          const inv = ensureInventoryShape(s.inventory);
          const curr = inv.building?.[id] || 0;
          if (curr <= 0) return s;
          const newInv = { ...inv, building: { ...inv.building, [id]: curr - 1 } };
          const newTiles = [...tiles];
          newTiles[idx] = { ...newTiles[idx], item: mergedId, itemCategory: 'building' };
          return { ...s, world: { ...s.world, tiles: newTiles }, inventory: newInv };
        }

        if (tiles[idx].item) return s;
        const nextTile = { ...tiles[idx], item: id, itemCategory: category, itemRotation: rotation };
        if (category === 'ore') nextTile.orePlacedAt = Date.now();
        else if (nextTile.orePlacedAt !== undefined) delete nextTile.orePlacedAt;
        tiles[idx] = nextTile;
        placed = true;
      }
      if (!placed) return s;

      const inv = { ...s.inventory };
      const curr = inv[category]?.[id] || 0;
      if (curr <= 0) return s; // nothing to place
      inv[category] = { ...inv[category], [id]: curr - 1 };

      // Mission progress
      const missions = s.missions.map(m =>
        (m.type === 'place' && !m.done) ? { ...m, done: true } : m
      );

      // Happiness bump
      const happiness = Math.min(100, s.character.happiness + 1);

      return { ...s, world: { ...s.world, tiles }, inventory: inv, missions, character: { ...s.character, happiness } };
    });
  }

  function setWeather(w) {
    set(s => {
      const nextTime =
        (w === 'morning' || w === 'noon' || w === 'evening' || w === 'night' || w === 'deep_night')
          ? w
          : s.world.timeOfDay;
      const nextHour = hourFromTimeOfDay(nextTime);
      return { ...s, world: { ...s.world, weather: w, timeOfDay: nextTime, hour: nextHour } };
    });
  }

  function setTimeOfDay(timeOfDay) {
    if (!TIME_TO_WEATHER[timeOfDay]) return;
    const hour = hourFromTimeOfDay(timeOfDay);
    set(s => ({
      ...s,
      world: {
        ...s.world,
        timeOfDay,
        hour,
        weather: TIME_TO_WEATHER[timeOfDay],
        specialWeather: null,
      },
    }));
  }

  function setHour(hour) {
    const h = Math.max(0, Math.min(23, Math.round(Number(hour) || 0)));
    const timeOfDay = timeOfDayFromHour(h);
    set(s => ({
      ...s,
      world: {
        ...s.world,
        hour: h,
        timeOfDay,
        weather: TIME_TO_WEATHER[timeOfDay],
        specialWeather: null,
      },
    }));
  }

  function setSeason(season) {
    if (!SEASONS.includes(season)) return;
    set(s => ({ ...s, world: { ...s.world, season } }));
  }

  function setWeatherMode(weatherMode) {
    if (!WEATHER_MODES.includes(weatherMode)) return;
    set(s => ({ ...s, world: { ...s.world, weatherMode } }));
  }

  function setSpecialWeather(key) {
    const next = (key && SPECIAL_WEATHERS.includes(key)) ? key : null;
    set(s => ({ ...s, world: { ...s.world, specialWeather: next } }));
  }

  function setSpawnToBed(x, z) {
    let result = { ok: false, reason: 'invalid' };
    set(s => {
      const bx = Math.round(Number(x));
      const bz = Math.round(Number(z));
      if (!Number.isFinite(bx) || !Number.isFinite(bz)) {
        result = { ok: false, reason: 'invalid_coord' };
        return s;
      }
      const bed = s.world.tiles.find(t => t.x === bx && t.z === bz && t.item === 'bed_iron');
      if (!bed) {
        result = { ok: false, reason: 'not_bed' };
        return s;
      }
      const key = shelfKey(bx, bz);
      result = { ok: true, x: bx, z: bz };
      return {
        ...s,
        world: {
          ...s.world,
          spawnTile: { x: bx, z: bz },
          spawnBedKey: key,
        },
      };
    });
    return result;
  }

  function resetWorldToStarter() {
    set(s => {
      const inv = ensureInventoryShape(s.inventory);
      returnWorldToInventory(inv, s.world.tiles, true);
      consumeStarterFromInventory(inv);

      const starterTiles = STARTER_TILES.map(t => ({ ...t }));
      return {
        ...s,
        world: {
          ...s.world,
          tiles: starterTiles,
          homeAnchor: { x: 0, z: 0 },
          spawnTile: { ...DEFAULT_SPAWN },
          spawnBedKey: null,
          shelfStorages: {},
        },
        character: {
          ...s.character,
          position: { x: 0, z: 0 },
        },
        inventory: inv,
      };
    });
  }

  function clearToGrass() {
    set(s => {
      const inv = ensureInventoryShape(s.inventory);
      returnWorldToInventory(inv, s.world.tiles, false);
      const tiles = s.world.tiles.map(t => {
        const { item, itemCategory, itemRotation, cropPlantedAt, orePlacedAt, ...rest } = t;
        return { ...rest };
      });
      return {
        ...s,
        world: {
          ...s.world,
          tiles,
          shelfStorages: {},
          spawnTile: { ...DEFAULT_SPAWN },
          spawnBedKey: null,
        },
        inventory: inv,
      };
    });
  }

  function removeAt(x, z) {
    let result = { ok: false, reason: 'empty' };
    set(s => {
      const tiles = [...s.world.tiles];
      const idx = tiles.findIndex(t => t.x === x && t.z === z);
      if (idx < 0) return s;

      const tile = tiles[idx];
      const inv = ensureInventoryShape(s.inventory);

      if (tile.item) {
        if (tile.item === 'shelf_rust') {
          const storagesCheck = ensureShelfStoragesShape(s.world.shelfStorages);
          const shelfSlots = ensureShelfSlots(storagesCheck[shelfKey(tile.x, tile.z)]);
          if (shelfSlots.some(Boolean)) {
            result = { ok: false, reason: 'shelf_not_empty' };
            return s;
          }
        }
        const itemId = tile.item;
        const itemCategory = CATALOG_MAP[itemId]?.category || tile.itemCategory || null;
        if (itemCategory && !CATALOG_MAP[itemId]?.noReturn) addInventoryCount(inv, itemCategory, itemId, 1);
        const { item, itemCategory: _, itemRotation, cropPlantedAt, orePlacedAt, ...rest } = tile;
        tiles[idx] = { ...rest };
        result = {
          ok: true,
          kind: 'item',
          id: itemId,
          category: itemCategory,
          name: CATALOG_MAP[itemId]?.name || itemId,
        };
        let nextWorld = { ...s.world, tiles };
        if (itemId === 'shelf_rust') {
          const storages = cloneShelfStorages(s.world.shelfStorages);
          delete storages[shelfKey(tile.x, tile.z)];
          nextWorld = { ...nextWorld, shelfStorages: storages };
        }
        if (itemId === 'bed_iron') {
          const key = shelfKey(tile.x, tile.z);
          if (s.world.spawnBedKey === key) {
            nextWorld = { ...nextWorld, spawnTile: { ...DEFAULT_SPAWN }, spawnBedKey: null };
          }
        }
        return { ...s, world: nextWorld, inventory: inv };
      }

      if (isStarterTileProtected(tile.x, tile.z)) {
        result = { ok: false, reason: 'protected_tile' };
        return s;
      }

      if (tiles.length <= 1) {
        result = { ok: false, reason: 'last_tile' };
        return s;
      }

      const tileId = tile.type;
      addInventoryCount(inv, 'tile', tileId, 1);
      tiles.splice(idx, 1);

      const oldSpawn = s.world.spawnTile || { x: 0, z: 0 };
      const spawnStillExists = tiles.some(t => t.x === oldSpawn.x && t.z === oldSpawn.z);
      const fallbackSpawnTile = tiles.find(t => !t.item) || tiles[0] || oldSpawn;
      const nextSpawn = spawnStillExists ? oldSpawn : { x: fallbackSpawnTile.x, z: fallbackSpawnTile.z };

      const charPos = s.character.position || { x: 0, z: 0 };
      const roundedChar = { x: Math.round(charPos.x), z: Math.round(charPos.z) };
      const charOnAnyTile = tiles.some(t => t.x === roundedChar.x && t.z === roundedChar.z);
      const nextCharPos = charOnAnyTile ? charPos : { x: nextSpawn.x, z: nextSpawn.z };

      result = {
        ok: true,
        kind: 'tile',
        id: tileId,
        category: 'tile',
        name: CATALOG_MAP[tileId]?.name || tileId,
      };
      const removedKey = shelfKey(tile.x, tile.z);
      const nextSpawnBedKey = s.world.spawnBedKey === removedKey ? null : s.world.spawnBedKey;
      const nextSpawnTile = (s.world.spawnBedKey === removedKey) ? { ...DEFAULT_SPAWN } : nextSpawn;
      return {
        ...s,
        world: {
          ...s.world,
          tiles,
          spawnTile: nextSpawnTile,
          spawnBedKey: nextSpawnBedKey,
        },
        character: { ...s.character, position: nextCharPos },
        inventory: inv,
      };
    });
    return result;
  }

  // ---------- Task helpers ----------
  function addTask(partial) {
    const id = 't_' + Math.random().toString(36).slice(2, 9);
    const now = Date.now();
    const task = {
      id,
      title: partial.title || '新しいタスク',
      note: partial.note || '',
      statusId: partial.statusId || (state.tasks.statuses[0]?.id ?? 's_todo'),
      labelIds: partial.labelIds || [],
      level: partial.level || 'Normal',
      rank: partial.rank || 'Medium',
      parentId: partial.parentId || null,
      assignees: partial.assignees || [],
      startDate: partial.startDate || null,
      endDate: partial.endDate || null,
      createdAt: now,
      updatedAt: now,
    };
    set(s => ({ ...s, tasks: { ...s.tasks, items: [...s.tasks.items, task] } }));
    return id;
  }
  function updateTask(id, patch) {
    set(s => {
      const items = s.tasks.items.map(t =>
        t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t
      );
      // Check mission progress for moving to Done
      let missions = s.missions;
      if (patch.statusId) {
        const doneStatus = s.tasks.statuses.find(st => /done|完了/i.test(st.name));
        if (doneStatus && patch.statusId === doneStatus.id) {
          missions = s.missions.map(m =>
            (m.type === 'task' && !m.done) ? { ...m, done: true } : m
          );
        }
      }
      return { ...s, tasks: { ...s.tasks, items }, missions };
    });
  }
  function deleteTask(id) {
    set(s => {
      const items = s.tasks.items.filter(t => t.id !== id && t.parentId !== id);
      return { ...s, tasks: { ...s.tasks, items } };
    });
  }
  function addStatus(name) {
    const id = 's_' + Math.random().toString(36).slice(2, 8);
    set(s => ({ ...s, tasks: { ...s.tasks, statuses: [...s.tasks.statuses, { id, name, color: '#6a6155' }] } }));
  }
  function updateStatus(id, patch) {
    set(s => ({ ...s, tasks: { ...s.tasks, statuses: s.tasks.statuses.map(st => st.id === id ? { ...st, ...patch } : st) } }));
  }
  function deleteStatus(id) {
    set(s => {
      const fallback = s.tasks.statuses.find(st => st.id !== id)?.id;
      const items = s.tasks.items.map(t => t.statusId === id ? { ...t, statusId: fallback } : t);
      return { ...s, tasks: { ...s.tasks, statuses: s.tasks.statuses.filter(st => st.id !== id), items } };
    });
  }
  function addLabel(name, color) {
    const id = 'l_' + Math.random().toString(36).slice(2, 8);
    set(s => ({ ...s, tasks: { ...s.tasks, labels: [...s.tasks.labels, { id, name, color: color || '#a08456' }] } }));
  }
  function updateLabel(id, patch) {
    set(s => ({ ...s, tasks: { ...s.tasks, labels: s.tasks.labels.map(l => l.id === id ? { ...l, ...patch } : l) } }));
  }
  function deleteLabel(id) {
    set(s => {
      const items = s.tasks.items.map(t => ({ ...t, labelIds: t.labelIds.filter(x => x !== id) }));
      return { ...s, tasks: { ...s.tasks, labels: s.tasks.labels.filter(l => l.id !== id), items } };
    });
  }

  // ---------- Timer / stats ----------
  function recordFocusTick(seconds) {
    // Called each second the timer's work phase is running
    set(s => {
      const today = new Date().toISOString().slice(0,10);
      const daily = [...s.stats.daily];
      const idx = daily.findIndex(d => d.date === today);
      if (idx >= 0) {
        daily[idx] = { ...daily[idx], minutes: daily[idx].minutes + seconds / 60 };
      } else {
        daily.shift();
        daily.push({ date: today, minutes: seconds / 60 });
      }
      // Award 1 DUST per 5 minutes (300s) of focus
      const newFocus = s.stats.focusSeconds + seconds;
      const dustAwarded = Math.floor(newFocus / 300) - Math.floor(s.stats.focusSeconds / 300);
      return {
        ...s,
        stats: { ...s.stats, focusSeconds: newFocus, daily },
        currency: { ...s.currency, dust: s.currency.dust + dustAwarded },
      };
    });
  }
  function recordBreakTick(seconds) {
    set(s => ({ ...s, stats: { ...s.stats, breakSeconds: s.stats.breakSeconds + seconds } }));
  }
  function completeSession() {
    set(s => {
      const missions = s.missions.map(m =>
        (m.type === 'session' && !m.done) ? { ...m, done: true } : m
      );
      // Also award 15+ min focus mission if not already
      const focusMissions = missions.map(m =>
        (m.type === 'focus' && !m.done) ? { ...m, done: true } : m
      );
      const happiness = Math.min(100, s.character.happiness + 4);
      return {
        ...s,
        stats: { ...s.stats, sessions: s.stats.sessions + 1 },
        missions: focusMissions,
        character: { ...s.character, happiness, xp: s.character.xp + 50 },
      };
    });
  }

  function setTimerConfig(patch) {
    set(s => ({ ...s, timer: { ...s.timer, ...patch } }));
  }
  function setSettings(patch) {
    set(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  }

  function claimDaily(idx) {
    set(s => {
      if (idx !== s.daily.today) return s;
      if (s.daily.claimed[idx]) return s;
      const claimed = [...s.daily.claimed];
      claimed[idx] = true;
      const reward = [1, 2, 2, 3, 3, 5, 8][idx] || 1;
      return {
        ...s,
        daily: { ...s.daily, claimed, lastClaimDate: new Date().toISOString().slice(0,10) },
        currency: { ...s.currency, dust: s.currency.dust + reward },
      };
    });
  }

  function claimMission(id) {
    set(s => {
      const m = s.missions.find(x => x.id === id);
      if (!m || !m.done || m.claimed) return s;
      const missions = s.missions.map(x => x.id === id ? { ...x, claimed: true } : x);
      return { ...s, missions, currency: { ...s.currency, dust: s.currency.dust + m.reward } };
    });
  }

  function moveCharacter(dx, dz) {
    set(s => {
      const nx = Math.max(-12, Math.min(12, s.character.position.x + dx));
      const nz = Math.max(-12, Math.min(12, s.character.position.z + dz));
      return { ...s, character: { ...s.character, position: { x: nx, z: nz } } };
    });
  }
  let _charPosSaveTimer = null;
  function setCharacterPos(x, z) {
    // Update state + notify listeners immediately (no localStorage, no slot sync)
    state = { ...state, character: { ...state.character, position: { x, z } } };
    listeners.forEach(fn => fn(state));
    // Debounce the expensive localStorage write to avoid blocking the render loop
    clearTimeout(_charPosSaveTimer);
    _charPosSaveTimer = setTimeout(() => { save(state); }, 2000);
  }

  // ---------- Farming ----------
  function useHoeAt(x, z, hotbarIdx) {
    let ok = false;
    set(s => {
      const tile = s.world.tiles.find(t => t.x === x && t.z === z);
      if (!tile || tile.type !== 'soil_barren' || tile.item) return s;
      const carried = cloneCarried(s.carried);
      let found = false;
      if (hotbarIdx !== undefined) {
        const sl = carried.hotbar[hotbarIdx];
        if (sl?.id === 'hoe_rust') {
          const rem = sl.uses !== undefined ? sl.uses : sl.count;
          if (rem > 0) {
            const newUses = rem - 1;
            carried.hotbar[hotbarIdx] = newUses > 0 ? { id: 'hoe_rust', count: 1, uses: newUses } : null;
            found = true;
          }
        }
      }
      if (!found) {
        for (const zone of ['hotbar', 'bag']) {
          for (let i = 0; i < carried[zone].length; i++) {
            const sl = carried[zone][i];
            if (sl?.id !== 'hoe_rust') continue;
            const rem = sl.uses !== undefined ? sl.uses : sl.count;
            if (rem <= 0) continue;
            const newUses = rem - 1;
            carried[zone][i] = newUses > 0 ? { id: 'hoe_rust', count: 1, uses: newUses } : null;
            found = true;
            break;
          }
          if (found) break;
        }
      }
      if (!found) return s;
      const tiles = s.world.tiles.map(t =>
        t.x === x && t.z === z ? { ...t, item: 'field_barren', itemCategory: 'farming', itemRotation: 0 } : t
      );
      ok = true;
      return { ...s, world: { ...s.world, tiles }, carried };
    });
    return ok;
  }

  function usePickaxeAt(x, z, hotbarIdx) {
    let result = { ok: false, reason: 'invalid' };
    set(s => {
      const tile = s.world.tiles.find(t => t.x === x && t.z === z);
      if (!tile || tile.item !== 'iron_rust') {
        result = { ok: false, reason: 'not_ore' };
        return s;
      }

      const requiredMs = Math.max(0, Math.round((CATALOG_MAP.iron_rust?.harvestMin || 0) * 60000));
      const placedAt = Number(tile.orePlacedAt || 0);
      const elapsed = placedAt ? (Date.now() - placedAt) : requiredMs;
      if (requiredMs > 0 && elapsed < requiredMs) {
        result = { ok: false, reason: 'not_ready', remainingMs: requiredMs - elapsed };
        return s;
      }

      const carried = cloneCarried(s.carried);
      let found = false;
      let remainingUses = 0;
      const consumeAt = (zone, idx) => {
        const sl = carried[zone][idx];
        if (!sl || sl.id !== 'pickaxe_rust') return false;
        const rem = sl.uses !== undefined ? sl.uses : sl.count;
        if (rem <= 0) return false;
        const nextUses = rem - 1;
        remainingUses = nextUses;
        carried[zone][idx] = nextUses > 0 ? { id: 'pickaxe_rust', count: 1, uses: nextUses } : null;
        return true;
      };

      if (hotbarIdx !== undefined) {
        found = consumeAt('hotbar', hotbarIdx);
      }
      if (!found) {
        outer: for (const zone of ['hotbar', 'bag']) {
          for (let i = 0; i < carried[zone].length; i++) {
            if (consumeAt(zone, i)) { found = true; break outer; }
          }
        }
      }
      if (!found) {
        result = { ok: false, reason: 'no_pickaxe' };
        return s;
      }

      const inv = ensureInventoryShape(s.inventory);
      addInventoryCount(inv, 'items', 'iron_rust_fragment', 1);
      const tiles = s.world.tiles.map(t => {
        if (t.x !== x || t.z !== z) return t;
        const { item, itemCategory, itemRotation, orePlacedAt, ...rest } = t;
        return { ...rest };
      });

      result = { ok: true, gained: 'iron_rust_fragment', remainingUses };
      return { ...s, world: { ...s.world, tiles }, inventory: inv, carried };
    });
    return result;
  }

  function plantSeedAt(x, z) {
    let ok = false;
    set(s => {
      const tile = s.world.tiles.find(t => t.x === x && t.z === z);
      if (!tile || tile.item !== 'field_barren') return s;
      const inv = ensureInventoryShape(s.inventory);
      if ((inv.farming?.potato_seed || 0) <= 0) return s;
      const tiles = s.world.tiles.map(t =>
        t.x === x && t.z === z
          ? { ...t, item: 'potato_field_0', itemCategory: 'farming', itemRotation: 0, cropPlantedAt: Date.now() }
          : t
      );
      takeInventoryCount(inv, 'farming', 'potato_seed', 1);
      ok = true;
      return { ...s, world: { ...s.world, tiles }, inventory: inv };
    });
    return ok;
  }

  function advanceCrop(x, z) {
    set(s => {
      const tile = s.world.tiles.find(t => t.x === x && t.z === z);
      if (!tile) return s;
      const next = tile.item === 'potato_field_0'  ? 'potato_field_50'
                 : tile.item === 'potato_field_50' ? 'potato_field_100'
                 : null;
      if (!next) return s;
      const tiles = s.world.tiles.map(t =>
        t.x === x && t.z === z ? { ...t, item: next } : t
      );
      return { ...s, world: { ...s.world, tiles } };
    });
  }

  function harvestCrop(x, z) {
    let ok = false;
    set(s => {
      const tile = s.world.tiles.find(t => t.x === x && t.z === z);
      if (!tile || tile.item !== 'potato_field_100') return s;
      const inv = ensureInventoryShape(s.inventory);
      addInventoryCount(inv, 'items', 'potato_harvest', 1);
      const tiles = s.world.tiles.map(t =>
        t.x === x && t.z === z
          ? { ...t, item: 'field_barren', itemCategory: 'farming', cropPlantedAt: undefined }
          : t
      );
      ok = true;
      return { ...s, world: { ...s.world, tiles }, inventory: inv };
    });
    return ok;
  }

  function giveItem(id, amount) {
    const it = CATALOG_MAP[id];
    if (!it) return false;
    const amt = Math.max(1, amount || 1);
    set(s => {
      if (it.category === 'carry') {
        const carried = cloneCarried(s.carried);
        if (it.noStack) {
          for (let a = 0; a < amt; a++) {
            for (const zone of ['hotbar', 'bag']) {
              const emptyIdx = carried[zone].findIndex(sl => !sl);
              if (emptyIdx !== -1) {
                const slot = { id, count: 1 };
                if (it.maxDurability !== undefined) slot.uses = it.maxDurability;
                carried[zone][emptyIdx] = slot;
                break;
              }
            }
          }
        } else {
          addCarryToCarried(carried, id, amt);
        }
        return { ...s, carried };
      }
      const inv = ensureInventoryShape(s.inventory);
      addInventoryCount(inv, it.category, id, amt);
      return { ...s, inventory: inv };
    });
    return true;
  }

  function discardItem(category, id, slotIdx, all) {
    set(s => {
      if (category === 'carry') {
        const carried = cloneCarried(s.carried);
        let zone, idx;
        if (slotIdx !== undefined) {
          zone = 'hotbar'; idx = slotIdx;
        } else {
          outer: for (const z of ['hotbar', 'bag']) {
            for (let i = 0; i < carried[z].length; i++) {
              if (carried[z][i]?.id === id) { zone = z; idx = i; break outer; }
            }
          }
        }
        if (zone === undefined) return s;
        const sl = carried[zone][idx];
        if (!sl) return s;
        carried[zone][idx] = (!all && sl.count > 1) ? { ...sl, count: sl.count - 1 } : null;
        return { ...s, carried };
      }
      const inv = { ...s.inventory };
      inv[category] = { ...(inv[category] || {}) };
      const curr = inv[category][id] || 0;
      if (curr <= 0) return s;
      inv[category][id] = all ? 0 : curr - 1;
      return { ...s, inventory: inv };
    });
  }

  // ---------- Export ----------
  window.Store = {
    get, set, subscribe, reset,
    CATALOG, CATALOG_MAP,
    addDust, spendDust, buyItem, placeAt, removeAt, setWeather, setTimeOfDay, setHour, setSeason, setWeatherMode, setSpecialWeather, setSpawnToBed,
    resetWorldToStarter, clearToGrass,
    isStarterTileProtected,
    listWorldSaves, saveWorldSave, loadWorldSave, deleteWorldSave, getActiveSaveId,
    addTask, updateTask, deleteTask,
    addStatus, updateStatus, deleteStatus,
    addLabel, updateLabel, deleteLabel,
    recordFocusTick, recordBreakTick, completeSession,
    setTimerConfig, setSettings,
    claimDaily, claimMission,
    moveCharacter, setCharacterPos,
    buyCarryItem, moveCarriedSlot, removeCarriedSlot,
    getShelfSlots, depositMaterialToShelf, depositCarryToShelf, withdrawShelfSlot,
    useHoeAt, usePickaxeAt, plantSeedAt, advanceCrop, harvestCrop,
    giveItem, discardItem,
  };
})();
