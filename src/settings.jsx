/* ============================================================
   Settings — alert sound, reset
   ============================================================ */

const Settings = () => {
  const s = window.useStore();

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <section>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>終了音</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'alarm',   label: 'アラーム', desc: '長く澄んだ音' },
            { id: 'warning', label: '警告音',   desc: '短く強い音' },
          ].map(o => (
            <button
              key={o.id}
              className={'btn ' + (s.timer.alertSound === o.id ? 'primary' : 'ghost')}
              style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
              onClick={() => {
                window.Store.setTimerConfig({ alertSound: o.id });
                playPreview(o.id);
              }}
            >
              <span style={{ fontFamily: 'var(--font-jp)', fontSize: 14, fontWeight: 500 }}>{o.label}</span>
              <span style={{ fontSize: 10, opacity: 0.7, fontFamily: 'var(--font-jp)' }}>{o.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>言語</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'ja', label: '日本語' }, { id: 'en', label: 'English' }].map(o => (
            <button
              key={o.id}
              className={'btn ' + (s.settings.language === o.id ? 'primary' : 'ghost')}
              onClick={() => window.Store.setSettings({ language: o.id })}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-jp)' }}>
          ※ 現在のビルドではUIテキストは日本語固定
        </div>
      </section>

      <section style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>データ</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
          <button
            className="btn ghost"
            onClick={async () => {
              if (!window.gameConfirm) return;
              const ok = await window.gameConfirm({
                title: 'Reset world',
                message: '世界を初期レイアウト（4タイル+机+椅子）に戻します。\nDUSTは維持され、現在の配置物はインベントリへ戻ります。実行しますか？',
                confirmText: '実行',
                cancelText: 'キャンセル',
                danger: true,
              });
              if (ok) {
                window.Store.resetWorldToStarter();
                window.toast('世界を初期レイアウトに戻しました', 'success');
              }
            }}
          >
            <window.Icon name="reset" size={12} /> Reset world（初期世界）
          </button>
          <button
            className="btn ghost"
            onClick={async () => {
              if (!window.gameConfirm) return;
              const ok = await window.gameConfirm({
                title: 'Clear to grass',
                message: 'タイル上の家具・建物・農業・鉱石を回収してインベントリに戻します。\nDUSTは維持されます。実行しますか？',
                confirmText: '回収する',
                cancelText: 'キャンセル',
                danger: true,
              });
              if (ok) {
                window.Store.clearToGrass();
                window.toast('配置物を回収しました', 'success');
              }
            }}
          >
            <window.Icon name="trash" size={12} /> Clear to grass（配置物を回収）
          </button>
        </div>
        <button
          className="btn ghost"
          style={{ color: 'var(--rank-critical)', borderColor: 'rgba(166,74,58,0.4)' }}
          onClick={async () => {
            if (!window.gameConfirm) return;
            const ok = await window.gameConfirm({
              title: '全データ初期化',
              message: '全データをリセットします。この操作は取り消せません。実行しますか？',
              confirmText: '初期化',
              cancelText: 'キャンセル',
              danger: true,
            });
            if (ok) {
              window.Store.reset();
              window.toast('リセット完了', 'success');
            }
          }}
        >
          <window.Icon name="reset" size={12} /> データを初期化
        </button>
      </section>
    </div>
  );
};

let audioCtx;
function playPreview(kind) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    if (kind === 'alarm') {
      // soft chime
      [880, 1320].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02 + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9 + i * 0.15);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.15);
        o.stop(ctx.currentTime + 1 + i * 0.15);
      });
    } else {
      // warning beeps
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square'; o.frequency.value = 660;
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01 + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14 + i * 0.18);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.18);
        o.stop(ctx.currentTime + 0.16 + i * 0.18);
      }
    }
  } catch (e) { console.warn(e); }
}
window.playPreview = playPreview;
window.Settings = Settings;
