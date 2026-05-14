/* ============================================================
   State Store — single source of truth, persists to localStorage
   ============================================================ */

(function () {
  const STORAGE_KEY = 'world-builder-v1';

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
      { id: 'lamp_broken',  name: '折れた街灯',   kind: '装飾', price: 2 },
      { id: 'drum_oil',     name: 'ドラム缶',     kind: '装飾', price: 1 },
    ],
    building: [
      { id: 'shack_scrap',  name: '廃材小屋',     kind: '住居', price: 10, mergeCap: 3 },
      { id: 'warehouse_rust', name: '錆びた倉庫', kind: '倉庫', price: 15, mergeCap: 3 },
    ],
    farming: [
      { id: 'field_barren', name: '荒れた耕地',   kind: '土',   price: 2 },
      { id: 'moss_gray',    name: '灰色の苔',     kind: '苔',   price: 2 },
      { id: 'potato_waste', name: '廃土ポテト',   kind: '作物', price: 3, harvestMin: 15 },
    ],
    ore: [
      { id: 'iron_rust',    name: '錆鉄',         kind: '鉄',   price: 1, harvestMin: 30 },
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
      version: 1,
      currency: { dust: 12 },
      character: {
        name: '白群',          // White-haired girl
        level: 1,
        xp: 0,
        happiness: 72,        // 0-100
        position: { x: 0, z: 0 },
      },
      world: {
        // 4 starting tiles (corners around origin), with one having a desk and another a chair
        // Coordinates: tiles indexed as { x, z, type, item? }
        tiles: [
          { x:  0, z:  0, type: 'soil_barren', item: 'desk_iron' },
          { x:  1, z:  0, type: 'soil_barren', item: 'chair_iron' },
          { x:  0, z:  1, type: 'soil_ash' },
          { x:  1, z:  1, type: 'soil_ash' },
        ],
        weather: 'night_starry', // default = beautiful starry night
        homeAnchor: { x: 0, z: 0 }, // desk position
      },
      inventory: {
        // counts by item id
        tile: { soil_barren: 2, soil_ash: 1 },
        furniture: { desk_iron: 0, chair_iron: 0 },
        building: {},
        farming: {},
        ore: {},
        items: {}, // generic resources (DUST is currency)
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
        sessions: 4,
        focusSeconds: 4 * 25 * 60,  // total focus seconds
        breakSeconds: 3 * 5 * 60,   // total break seconds
        // last 14 days of focus (in minutes) for the chart
        daily: (() => {
          const arr = [];
          for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const minutes = [0, 25, 0, 50, 30, 75, 0, 100, 0, 25, 60, 45, 0, 50][13 - i] || 0;
            arr.push({ date: d.toISOString().slice(0,10), minutes });
          }
          return arr;
        })(),
      },
      daily: {
        // 7 days streak
        claimed: [true, true, true, false, false, false, false],
        today: 3, // index of today
        lastClaimDate: new Date(Date.now() - 86400e3 * 1).toISOString().slice(0,10),
      },
      missions: [
        { id: 'm1', text: '集中セッションを1回完了する', reward: 3, done: false, type: 'session' },
        { id: 'm2', text: '15分以上の作業を達成する',     reward: 2, done: true,  type: 'focus' },
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
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // basic version check
      if (!parsed || parsed.version !== 1) return defaultState();
      return parsed;
    } catch (e) {
      console.warn('state load failed', e);
      return defaultState();
    }
  }
  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('state save failed', e); }
  }

  // ---------- Store ----------
  const listeners = new Set();
  let state = load();

  function get() { return state; }
  function set(updater) {
    state = (typeof updater === 'function') ? updater(state) : updater;
    save(state);
    listeners.forEach(fn => fn(state));
  }
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function reset() {
    state = defaultState();
    save(state);
    listeners.forEach(fn => fn(state));
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

  // Place a tile or item on a coordinate. type = 'tile' | 'furniture' | 'building' | 'farming' | 'ore'
  function placeAt(category, id, x, z) {
    set(s => {
      const tiles = [...s.world.tiles];
      const idx = tiles.findIndex(t => t.x === x && t.z === z);
      let placed = false;
      if (category === 'tile') {
        if (idx >= 0) tiles[idx] = { ...tiles[idx], type: id };
        else tiles.push({ x, z, type: id });
        placed = true;
      } else {
        // need a tile underneath
        if (idx < 0) return s; // can't place an object on nothing
        if (tiles[idx].item) return s; // occupied
        tiles[idx] = { ...tiles[idx], item: id, itemCategory: category };
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
    set(s => ({ ...s, world: { ...s.world, weather: w } }));
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
  function setCharacterPos(x, z) {
    set(s => ({ ...s, character: { ...s.character, position: { x, z } } }));
  }

  // ---------- Export ----------
  window.Store = {
    get, set, subscribe, reset,
    CATALOG, CATALOG_MAP,
    addDust, spendDust, buyItem, placeAt, setWeather,
    addTask, updateTask, deleteTask,
    addStatus, updateStatus, deleteStatus,
    addLabel, updateLabel, deleteLabel,
    recordFocusTick, recordBreakTick, completeSession,
    setTimerConfig, setSettings,
    claimDaily, claimMission,
    moveCharacter, setCharacterPos,
  };
})();
