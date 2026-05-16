/* ============================================================
   Topbar — left (character + missions/daily) + right (weather/music/view + settings)
   ============================================================ */

const TopBar = ({ openModal, timerActive, viewMode, setViewMode }) => {
  const s = window.useStore();
  const [viewOpen, setViewOpen] = React.useState(false);
  const [timeWeatherOpen, setTimeWeatherOpen] = React.useState(false);
  const [musicOpen, setMusicOpen] = React.useState(false);
  const [cameraMode, setCameraMode] = React.useState(() => window.World?.getCameraMode?.() || 'perspective');

  React.useEffect(() => {
    window.World?.onCameraModeChange?.((mode) => setCameraMode(mode));
    setCameraMode(window.World?.getCameraMode?.() || 'perspective');
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* Settings + Stats row */}
        <div className="icon-row">
          <button className="icon-btn" title="設定" onClick={() => openModal('settings')}>
            <window.Icon name="settings" />
          </button>
          <button className="icon-btn" title="統計" onClick={() => openModal('stats')}>
            <window.Icon name="stats" />
          </button>
          <button className="icon-btn" title="タスク" onClick={() => openModal('tasks')}>
            <window.Icon name="tasks" />
          </button>
          <button className="icon-btn" title="タイマー" onClick={() => openModal('timer')}>
            <window.Icon name="timer" />
          </button>
        </div>

        <CharacterCard state={s} />
        <MissionCard state={s} />
        <DailyCard state={s} />
      </div>

      <div className="topbar-right">
        <div className="icon-row">
          {timerActive && (
            <button
              className={'icon-btn ' + (viewMode === 'fullscreen' ? 'active' : '')}
              title={viewMode === 'fullscreen' ? '世界に戻る' : 'タイマー全画面'}
              onClick={() => setViewMode(viewMode === 'fullscreen' ? 'world' : 'fullscreen')}
            >
              <window.Icon name={viewMode === 'fullscreen' ? 'eye' : 'fullscreen'} />
            </button>
          )}
          <button
            className="icon-btn"
            title="Center on your grid"
            onClick={() => {
              window.World?.centerOnGrid?.();
              window.toast?.('グリッド中央へ移動');
            }}
          >
            <window.Icon name="home" />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className={'icon-btn ' + (viewOpen ? 'active' : '')}
              title="View modes"
              onClick={() => {
                setViewOpen(!viewOpen);
                setTimeWeatherOpen(false);
                setMusicOpen(false);
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
              title="Time & weather"
              onClick={() => { setTimeWeatherOpen(!timeWeatherOpen); setMusicOpen(false); setViewOpen(false); }}
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
              title="音楽"
              onClick={() => { setMusicOpen(!musicOpen); setTimeWeatherOpen(false); setViewOpen(false); }}
            >
              <window.Icon name="music" />
            </button>
            {musicOpen && <MusicPicker onClose={() => setMusicOpen(false)} current={s.timer.musicTrack} />}
          </div>
        </div>
      </div>
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

const ViewModePicker = ({ onPick, current }) => {
  const options = [
    { key: 'topdown', label: 'Top-down', desc: '俯瞰', icon: 'topdown' },
    { key: 'isometric', label: 'Isometric', desc: '斜め上', icon: 'isometric' },
    { key: 'soft', label: 'Soft', desc: '柔らかい遠景', icon: 'soft' },
    { key: 'perspective', label: 'Perspective', desc: '近距離表示', icon: 'perspective' },
    { key: 'fp', label: 'Walk (first-person)', desc: 'Escで終了', icon: 'walk' },
  ];
  return (
    <div className="glass" style={{ position: 'absolute', top: 46, right: 0, padding: 8, minWidth: 220, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
    { key: 'clear', label: 'Clear' },
    { key: 'cloudy', label: 'Cloudy' },
    { key: 'rain', label: 'Rain' },
    { key: 'storm', label: 'Storm' },
    { key: 'snow', label: 'Snow' },
  ];
  const hour = state.world.hour ?? 21;
  const hourLabel = String(hour).padStart(2, '0') + ':00';

  return (
    <div className="glass" style={{ position: 'absolute', top: 46, right: 0, padding: 10, minWidth: 260, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>
        <span>Time & weather</span>
        <span>{hourLabel}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>Time of day</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {weatherOptions.map(o => (
            <button
              key={o.key}
              onClick={() => window.Store.setWeatherMode(o.key)}
              className={'btn small ' + ((state.world.weatherMode || 'clear') === o.key ? 'primary' : 'ghost')}
              style={{ justifyContent: 'center', paddingLeft: 0, paddingRight: 0 }}
            >
              {o.label}
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
    <div className="glass" style={{ position: 'absolute', top: 46, right: 0, padding: 8, minWidth: 200, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
