/* ============================================================
   Topbar — left (character + missions/daily) + right (weather/music/view + settings)
   ============================================================ */

const TopBar = ({ openModal, timerActive, viewMode, setViewMode, showcaseMode, onToggleShowcase }) => {
  const s = window.useStore();
  const [viewOpen, setViewOpen] = React.useState(false);
  const [cameraControlOpen, setCameraControlOpen] = React.useState(false);
  const [timeWeatherOpen, setTimeWeatherOpen] = React.useState(false);
  const [musicOpen, setMusicOpen] = React.useState(false);
  const [missionOpen, setMissionOpen] = React.useState(false);
  const [dailyOpen, setDailyOpen] = React.useState(false);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [cameraMode, setCameraMode] = React.useState(() => window.World?.getCameraMode?.() || 'perspective');
  const [removeMode, setRemoveMode] = React.useState(() => !!window.World?.getRemoveModeEnabled?.());
  const [devOverlay, setDevOverlay] = React.useState(() => !!window.World?.getDeveloperOverlayEnabled?.());

  React.useEffect(() => {
    window.World?.onCameraModeChange?.((mode) => setCameraMode(mode));
    window.World?.onRemoveModeChange?.((enabled) => setRemoveMode(!!enabled));
    window.World?.onDeveloperOverlayChange?.((enabled) => setDevOverlay(!!enabled));
    setCameraMode(window.World?.getCameraMode?.() || 'perspective');
    setRemoveMode(!!window.World?.getRemoveModeEnabled?.());
    setDevOverlay(!!window.World?.getDeveloperOverlayEnabled?.());
  }, []);

  const tipAttrs = (label) => ({ 'aria-label': label, 'data-tip': label });
  const closePanels = () => {
    setViewOpen(false);
    setCameraControlOpen(false);
    setTimeWeatherOpen(false);
    setMusicOpen(false);
    setMissionOpen(false);
    setDailyOpen(false);
    setSaveOpen(false);
  };

  return (
    <div className="topbar">
      <div className="left-column">
        <div className="status-window">
          <CharacterCard state={s} />
        </div>

        <div className="left-sidebar glass">
          <div className="icon-col">
            <button className="icon-btn" {...tipAttrs('設定')} onClick={() => { openModal('settings'); closePanels(); }}>
              <window.Icon name="settings" />
            </button>
            <button className="icon-btn" {...tipAttrs('統計')} onClick={() => { openModal('stats'); closePanels(); }}>
              <window.Icon name="stats" />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className={'icon-btn ' + (missionOpen ? 'active' : '')}
                {...tipAttrs('MISSIONS')}
                onClick={() => {
                  const next = !missionOpen;
                  closePanels();
                  setMissionOpen(next);
                }}
              >
                <window.Icon name="check" />
              </button>
              {missionOpen && (
                <div className="sidebar-popup">
                  <MissionCard state={s} />
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button
                className={'icon-btn ' + (dailyOpen ? 'active' : '')}
                {...tipAttrs('DAILY LOGIN')}
                onClick={() => {
                  const next = !dailyOpen;
                  closePanels();
                  setDailyOpen(next);
                }}
              >
                <window.Icon name="star" />
              </button>
              {dailyOpen && (
                <div className="sidebar-popup">
                  <DailyCard state={s} />
                </div>
              )}
            </div>
            <button className="icon-btn" {...tipAttrs('タスク')} onClick={() => { openModal('tasks'); closePanels(); }}>
              <window.Icon name="tasks" />
            </button>
            <button className="icon-btn" {...tipAttrs('タイマー')} onClick={() => { openModal('timer'); closePanels(); }}>
              <window.Icon name="timer" />
            </button>
            {timerActive && (
              <button
                className={'icon-btn ' + (viewMode === 'fullscreen' ? 'active' : '')}
                {...tipAttrs(viewMode === 'fullscreen' ? '世界に戻る' : 'タイマー全画面')}
                onClick={() => { setViewMode(viewMode === 'fullscreen' ? 'world' : 'fullscreen'); closePanels(); }}
              >
                <window.Icon name={viewMode === 'fullscreen' ? 'eye' : 'fullscreen'} />
              </button>
            )}
          </div>

          <div className="sidebar-sep" />

          <div className="icon-col">
            <div style={{ position: 'relative' }}>
              <button
                className={'icon-btn ' + (cameraControlOpen ? 'active' : '')}
                {...tipAttrs('カメラ操作')}
                onClick={() => {
                  const next = !cameraControlOpen;
                  closePanels();
                  setCameraControlOpen(next);
                }}
              >
                <window.Icon name="camera" />
              </button>
              {cameraControlOpen && (
                <CameraControlPicker />
              )}
            </div>
            <button
              className="icon-btn"
              {...tipAttrs('Center on your grid')}
              onClick={() => {
                window.World?.centerOnGrid?.();
                window.toast?.('グリッド中央へ移動');
                closePanels();
              }}
            >
              <window.Icon name="home" />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className={'icon-btn ' + (viewOpen ? 'active' : '')}
                {...tipAttrs('View modes')}
                onClick={() => {
                  const next = !viewOpen;
                  closePanels();
                  setViewOpen(next);
                }}
              >
                <window.Icon name="eye" />
              </button>
              {viewOpen && (
                <ViewModePicker
                  current={cameraMode}
                  onPick={(nextMode) => {
                    const mode = window.World?.setCameraMode?.(nextMode) || cameraMode;
                    setCameraMode(mode);
                    setViewOpen(false);
                    const label = {
                      topdown: 'Top-down',
                      isometric: 'Isometric',
                      soft: 'Soft',
                      perspective: 'Perspective',
                      fp: 'Walk (first-person)',
                    }[mode] || mode;
                    window.toast?.(label + '表示');
                  }}
                />
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button
                className={'icon-btn ' + (timeWeatherOpen ? 'active' : '')}
                {...tipAttrs('Time & weather')}
                onClick={() => {
                  const next = !timeWeatherOpen;
                  closePanels();
                  setTimeWeatherOpen(next);
                }}
              >
                <window.Icon name="sun" />
              </button>
              {timeWeatherOpen && (
                <TimeWeatherPicker
                  state={s}
                  onClose={() => setTimeWeatherOpen(false)}
                />
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button
                className={'icon-btn ' + (musicOpen ? 'active' : '')}
                {...tipAttrs('音楽')}
                onClick={() => {
                  const next = !musicOpen;
                  closePanels();
                  setMusicOpen(next);
                }}
              >
                <window.Icon name="music" />
              </button>
              {musicOpen && <MusicPicker onClose={() => setMusicOpen(false)} current={s.timer.musicTrack} />}
            </div>
            <button
              className={'icon-btn ' + (showcaseMode ? 'active' : '')}
              {...tipAttrs('Showcase mode (Escで終了)')}
              onClick={() => {
                onToggleShowcase?.();
                closePanels();
              }}
            >
              <window.Icon name="menu" />
            </button>
            <button
              className={'icon-btn ' + (devOverlay ? 'active' : '')}
              {...tipAttrs('Developer overlay')}
              onClick={() => {
                const next = window.World?.toggleDeveloperOverlay?.();
                if (typeof next === 'boolean') setDevOverlay(next);
                closePanels();
              }}
            >
              <window.Icon name="stats" />
            </button>
          </div>

          <div className="sidebar-sep" />

          <div className="icon-col">
            <button
              className={'icon-btn ' + (removeMode ? 'active' : '')}
              {...tipAttrs(removeMode ? '削除モード: ON' : '削除モード')}
              onClick={() => {
                const next = window.World?.toggleRemoveMode?.();
                if (typeof next === 'boolean') setRemoveMode(next);
                closePanels();
              }}
            >
              <window.Icon name="cursor" />
            </button>
            <button
              className="icon-btn"
              {...tipAttrs('Reset world')}
              onClick={async () => {
                if (!window.gameConfirm) return;
                const ok = await window.gameConfirm({
                  title: 'Reset world',
                  message: '世界を初期レイアウト（4タイル+机+椅子）に戻します。\nDUSTは維持されます。実行しますか？',
                  confirmText: '実行',
                  cancelText: 'キャンセル',
                  danger: true,
                });
                if (ok) {
                  window.Store.resetWorldToStarter();
                  window.toast?.('世界を初期レイアウトに戻しました', 'success');
                }
                closePanels();
              }}
            >
              <window.Icon name="reset" />
            </button>
            <button
              className="icon-btn"
              {...tipAttrs('Clear to grass')}
              onClick={async () => {
                if (!window.gameConfirm) return;
                const ok = await window.gameConfirm({
                  title: 'Clear to grass',
                  message: 'タイル上の配置物を回収してインベントリへ戻します。\nDUSTは維持されます。実行しますか？',
                  confirmText: '回収する',
                  cancelText: 'キャンセル',
                  danger: true,
                });
                if (ok) {
                  window.Store.clearToGrass();
                  window.toast?.('配置物を回収しました', 'success');
                }
                closePanels();
              }}
            >
              <window.Icon name="trash" />
            </button>
            <button
              className={'icon-btn ' + (saveOpen ? 'active' : '')}
              {...tipAttrs('World saves')}
              onClick={() => {
                const next = !saveOpen;
                closePanels();
                setSaveOpen(next);
              }}
            >
              <window.Icon name="save" />
            </button>
          </div>
        </div>
      </div>
      {saveOpen && (
        <SaveWorldPanel onClose={() => setSaveOpen(false)} />
      )}
    </div>
  );
};

const CharacterCard = ({ state }) => {
  const c = state.character;
  const xpForLevel = c.level * 100;
  return (
    <div className="glass char-card">
      <div className="row">
        <div className="char-avatar" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="char-name">{c.name}</div>
          <div className="char-level">Lv.{c.level} · {c.xp}/{xpForLevel} XP</div>
        </div>
        <div className="dust-pill">{state.currency.dust} DUST</div>
      </div>
      <div>
        <div className="bar-row"><span>HAPPINESS</span><span>{c.happiness}%</span></div>
        <div className="bar happy"><div style={{ width: c.happiness + '%' }} /></div>
      </div>
      <div>
        <div className="bar-row"><span>EXPERIENCE</span><span>Lv.{c.level}</span></div>
        <div className="bar"><div style={{ width: (c.xp / xpForLevel * 100) + '%' }} /></div>
      </div>
    </div>
  );
};

const MissionCard = ({ state }) => {
  const missions = state.missions;
  return (
    <div className="glass mission-card">
      <div className="mission-head">
        <span>MISSIONS</span>
        <span>{missions.filter(m => m.done).length}/{missions.length}</span>
      </div>
      {missions.map(m => (
        <div key={m.id} className={'mission-item ' + (m.done ? 'done' : '')}>
          <div className={'mission-check ' + (m.done ? 'done' : '')} />
          <span className="mission-text" style={{ flex: 1, fontFamily: 'var(--font-jp)' }}>{m.text}</span>
          {m.done && !m.claimed && (
            <button className="btn small primary" onClick={() => { window.Store.claimMission(m.id); window.toast('+' + m.reward + ' DUST', 'success'); }}>
              +{m.reward}
            </button>
          )}
          {m.claimed && <span className="mission-reward">+{m.reward}</span>}
          {!m.done && <span className="mission-reward">+{m.reward}</span>}
        </div>
      ))}
    </div>
  );
};

const DailyCard = ({ state }) => {
  const days = ['月', '火', '水', '木', '金', '土', '日'];
  const rewards = [1, 2, 2, 3, 3, 5, 8];
  return (
    <div className="glass mission-card">
      <div className="mission-head">
        <span>DAILY LOGIN</span>
        <span>{state.daily.claimed.filter(Boolean).length}/7</span>
      </div>
      <div className="daily-row">
        {state.daily.claimed.map((c, i) => {
          const isToday = i === state.daily.today;
          const cls = 'daily-dot' + (c ? ' claimed' : '') + (isToday ? ' today' : '');
          return (
            <button
              key={i}
              className={cls}
              style={{ background: c ? undefined : 'transparent', cursor: (isToday && !c) ? 'pointer' : 'default' }}
              title={`+${rewards[i]} DUST`}
              onClick={() => {
                if (isToday && !c) {
                  window.Store.claimDaily(i);
                  window.toast('+' + rewards[i] + ' DUST', 'success');
                }
              }}
            >
              {c ? '✓' : (isToday ? '!' : days[i])}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CameraControlPicker = () => {
  return (
    <div className="glass sidebar-popup camera-control-popup">
      <button className="btn small ghost" onClick={() => {
        const ok = window.World?.zoomInCamera?.();
        if (!ok) window.toast?.('この視点ではズームできません', 'warn');
      }}>
        <window.Icon name="zoomIn" size={13} /> ズームアップ
      </button>
      <button className="btn small ghost" onClick={() => {
        const ok = window.World?.zoomOutCamera?.();
        if (!ok) window.toast?.('この視点ではズームできません', 'warn');
      }}>
        <window.Icon name="zoomOut" size={13} /> ズームアウト
      </button>
      <button className="btn small ghost" onClick={() => {
        const ok = window.World?.rotateCamera?.(Math.PI / 8);
        if (!ok) window.toast?.('この視点では回転できません', 'warn');
      }}>
        <window.Icon name="rotate" size={13} /> カメラ回転
      </button>
    </div>
  );
};

const SaveWorldPanel = ({ onClose }) => {
  const [name, setName] = React.useState('');
  const [slots, setSlots] = React.useState(() => window.Store.listWorldSaves?.() || []);

  React.useEffect(() => {
    const refresh = () => setSlots(window.Store.listWorldSaves?.() || []);
    refresh();
    return window.Store.subscribe(refresh);
  }, []);

  React.useEffect(() => {
    const blockEscape = (e) => {
      if ((e.key || '').toLowerCase() !== 'escape') return false;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      return true;
    };
    const onKeyDown = (e) => {
      if (!blockEscape(e)) return;
      onClose?.();
    };
    const onKeyUp = (e) => { blockEscape(e); };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [onClose]);

  const createSave = () => {
    const info = window.Store.saveWorldSave(name);
    setName(info?.name || '');
    setSlots(window.Store.listWorldSaves?.() || []);
    window.toast?.('セーブ完了: ' + (info?.name || 'World'), 'success');
  };

  const loadSave = async (id, label) => {
    if (!window.gameConfirm) return;
    const ok = await window.gameConfirm({
      title: 'セーブデータ読込',
      message: `「${label}」を読み込みます。\n現在の進行に上書きされます。実行しますか？`,
      confirmText: '読み込む',
      cancelText: 'キャンセル',
      danger: true,
    });
    if (!ok) return;
    const loaded = window.Store.loadWorldSave(id);
    if (loaded) {
      setSlots(window.Store.listWorldSaves?.() || []);
      window.toast?.('読み込み: ' + label, 'success');
      onClose?.();
    }
  };

  const deleteSave = async (id, label) => {
    if (!window.gameConfirm) return;
    const ok = await window.gameConfirm({
      title: 'セーブデータ削除',
      message: `「${label}」を削除します。\nこの操作は取り消せません。`,
      confirmText: '削除',
      cancelText: 'キャンセル',
      danger: true,
    });
    if (!ok) return;
    const deleted = window.Store.deleteWorldSave(id);
    if (deleted) {
      setSlots(window.Store.listWorldSaves?.() || []);
      window.toast?.('削除: ' + label, 'success');
    }
  };

  return (
    <div className="save-world-modal-scrim" onClick={() => onClose?.()}>
      <div className="glass save-world-popup save-world-modal" onClick={(e) => e.stopPropagation()}>
        <div className="save-world-head-row">
          <div className="save-world-head">WORLD SAVE</div>
          <button className="modal-close save-world-close" onClick={() => onClose?.()} aria-label="閉じる">
            <window.Icon name="close" size={12} />
          </button>
        </div>
        <div className="save-world-new">
          <input
            className="text-input"
            placeholder="ワールド名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
          <button className="btn small primary" onClick={createSave}>
            保存
          </button>
        </div>

        <div className="save-world-list">
          {slots.length === 0 ? (
            <div className="save-world-empty">セーブデータなし</div>
          ) : (
            slots.map(slot => (
              <div key={slot.id} className={'save-world-row' + (slot.active ? ' active' : '')}>
                <button className="save-world-meta" onClick={() => loadSave(slot.id, slot.name)}>
                  <span className="save-world-name">{slot.name}</span>
                  <span className="save-world-date">
                    {slot.ts ? new Date(slot.ts).toLocaleString('ja-JP') : '-'}
                  </span>
                </button>
                <button className="icon-btn save-delete-btn" onClick={() => deleteSave(slot.id, slot.name)} aria-label="削除">
                  <window.Icon name="trash" size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ViewModePicker = ({ onPick, current }) => {
  const options = [
    { key: 'topdown', label: 'Top-down', desc: '俯瞰', icon: 'topdown' },
    { key: 'isometric', label: 'Isometric', desc: '斜め上', icon: 'isometric' },
    { key: 'soft', label: 'Soft', desc: '柔らかい遠景', icon: 'soft' },
    { key: 'perspective', label: 'Perspective', desc: '近距離表示', icon: 'perspective' },
    { key: 'fp', label: 'Walk (first-person)', desc: 'Escで終了', icon: 'walk' },
  ];

  return (
    <div className="glass" style={{ position: 'absolute', top: -4, left: 46, padding: 8, minWidth: 220, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onPick(o.key)}
          className={'btn small ' + (current === o.key ? 'primary' : 'ghost')}
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <window.Icon name={o.icon} size={14} />
            <span>{o.label}</span>
          </span>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>{o.desc}</span>
        </button>
      ))}
    </div>
  );
};

const TimeWeatherPicker = ({ state, onClose }) => {
  const todOptions = [
    { key: 'morning', label: '朝' },
    { key: 'noon', label: '昼' },
    { key: 'evening', label: '夕方' },
    { key: 'night', label: '夜' },
    { key: 'deep_night', label: '深夜' },
  ];
  const seasonOptions = [
    { key: 'spring', label: '春' },
    { key: 'summer', label: '夏' },
    { key: 'autumn', label: '秋' },
    { key: 'winter', label: '冬' },
  ];
  const weatherOptions = [
    { key: 'clear',  label: 'Clear',  icon: 'sun'     },
    { key: 'cloudy', label: 'Cloudy', icon: 'cloud'   },
    { key: 'rain',   label: 'Rain',   icon: 'wave'    },
    { key: 'storm',  label: 'Storm',  icon: 'eclipse' },
    { key: 'snow',   label: 'Snow',   icon: 'star'    },
  ];
  const specialOptions = [
    { key: 'night_starry', label: '星空', icon: 'star' },
    { key: 'seabed', label: '海底', icon: 'wave' },
    { key: 'collapse', label: '崩壊', icon: 'eclipse' },
    { key: 'blood_moon', label: 'Blood Moon', icon: 'moon' },
  ];
  const hour = state.world.hour ?? 21;
  const hourLabel = String(hour).padStart(2, '0') + ':00';
  const currentSpecial = state.world.specialWeather || null;

  return (
    <div className="glass" style={{ position: 'absolute', top: -4, left: 46, padding: 10, minWidth: 260, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>
        <span>Time Weather</span>
        <span>{hourLabel}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>Time &amp; Day</span>
        <input
          type="range"
          min="0"
          max="23"
          value={hour}
          onChange={(e) => window.Store.setHour(Number(e.target.value))}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {todOptions.map(o => (
            <button
              key={o.key}
              onClick={() => window.Store.setTimeOfDay(o.key)}
              className={'btn small ' + ((state.world.timeOfDay || 'night') === o.key ? 'primary' : 'ghost')}
              style={{ justifyContent: 'center', paddingLeft: 0, paddingRight: 0 }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>Season</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {seasonOptions.map(o => (
            <button
              key={o.key}
              onClick={() => window.Store.setSeason(o.key)}
              className={'btn small ' + ((state.world.season || 'spring') === o.key ? 'primary' : 'ghost')}
              style={{ justifyContent: 'center', paddingLeft: 0, paddingRight: 0 }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>Weather</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {weatherOptions.map(o => (
            <button
              key={o.key}
              onClick={() => window.Store.setWeatherMode(o.key)}
              className={'btn small ' + ((state.world.weatherMode || 'clear') === o.key ? 'primary' : 'ghost')}
              style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center', paddingLeft: 0, paddingRight: 0, gap: 2, display: 'flex', padding: '4px 2px' }}
            >
              <window.Icon name={o.icon} size={11} />
              <span style={{ fontSize: 9, lineHeight: 1 }}>{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>Special</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {specialOptions.map(o => (
            <button
              key={o.key}
              onClick={() => {
                const next = currentSpecial === o.key ? null : o.key;
                window.Store.setSpecialWeather(next);
                if (next) window.toast?.(o.label);
              }}
              className={'btn small ' + (currentSpecial === o.key ? 'primary' : 'ghost')}
              style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center', paddingLeft: 0, paddingRight: 0, gap: 2, display: 'flex', padding: '4px 2px' }}
            >
              <window.Icon name={o.icon} size={11} />
              <span style={{ fontSize: 9, lineHeight: 1 }}>{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button className="btn small ghost" onClick={onClose}>閉じる</button>
    </div>
  );
};

const MusicPicker = ({ onClose, current }) => {
  const tracks = [
    { id: 0, name: 'Silence',  desc: '無音' },
    { id: 1, name: 'Horizon I',  desc: '地平の風' },
    { id: 2, name: 'Horizon II', desc: '海の余韻' },
    { id: 3, name: 'Ripple',     desc: '崩壊の波紋' },
  ];
  return (
    <div className="glass" style={{ position: 'absolute', top: -4, left: 46, padding: 8, minWidth: 200, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {tracks.map(t => (
        <button
          key={t.id}
          className={'btn small ' + (current === t.id ? 'primary' : 'ghost')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
          onClick={() => { window.Store.setTimerConfig({ musicTrack: t.id }); window.toast('♪ ' + t.name); }}
        >
          <span>{t.name}</span>
          <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>{t.desc}</span>
        </button>
      ))}
    </div>
  );
};

Object.assign(window, { TopBar });
