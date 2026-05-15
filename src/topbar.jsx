/* ============================================================
   Topbar — left (character + missions/daily) + right (weather/music/view + settings)
   ============================================================ */

const TopBar = ({ openModal, timerActive, viewMode, setViewMode }) => {
  const s = window.useStore();
  const [weatherOpen, setWeatherOpen] = React.useState(false);
  const [musicOpen, setMusicOpen] = React.useState(false);

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
            title="グリッド中央へ"
            onClick={() => {
              window.World?.centerOnGrid?.();
              window.toast?.('グリッド中央へ移動');
            }}
          >
            <window.Icon name="home" />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className={'icon-btn ' + (weatherOpen ? 'active' : '')}
              title="天候"
              onClick={() => { setWeatherOpen(!weatherOpen); setMusicOpen(false); }}
            >
              <window.Icon name="star" />
            </button>
            {weatherOpen && <WeatherPicker onPick={(k) => { window.Store.setWeather(k); setWeatherOpen(false); }} current={s.world.weather} />}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              className={'icon-btn ' + (musicOpen ? 'active' : '')}
              title="音楽"
              onClick={() => { setMusicOpen(!musicOpen); setWeatherOpen(false); }}
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

const WeatherPicker = ({ onPick, current }) => {
  const options = [
    { key: 'morning',      label: '朝' },
    { key: 'noon',         label: '昼' },
    { key: 'evening',      label: '夕方' },
    { key: 'night',        label: '夜' },
    { key: 'deep_night',   label: '深夜' },
    { key: 'night_starry', label: '星空' },
    { key: 'seabed',       label: '海底' },
    { key: 'collapse',     label: '崩壊' },
  ];
  return (
    <div className="glass" style={{ position: 'absolute', top: 46, right: 0, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, minWidth: 200, zIndex: 30 }}>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onPick(o.key)}
          className={'btn small ' + (current === o.key ? 'primary' : 'ghost')}
          style={{ justifyContent: 'center' }}
        >
          {o.label}
        </button>
      ))}
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
