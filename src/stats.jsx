/* ============================================================
   Stats — sessions, focus time, break time, chart
   ============================================================ */

const statsStyles = {
  body: { padding: 28, display: 'flex', flexDirection: 'column', gap: 24 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  kpi: { background: 'var(--bg-soil)', border: '1px solid var(--line)', borderRadius: 10, padding: 16 },
  kpiLabel: { fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' },
  kpiValue: { fontFamily: 'var(--font-jp)', fontSize: 28, fontWeight: 300, marginTop: 6, lineHeight: 1 },
  kpiUnit: { fontSize: 11, color: 'var(--muted)', marginLeft: 4 },

  chart: { background: 'var(--bg-soil)', border: '1px solid var(--line)', borderRadius: 10, padding: 20 },
  chartHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
};

const Stats = () => {
  const s = window.useStore();
  const st = s.stats;

  const fmtH = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return { val: h + '時間 ' + m, unit: '分' };
    return { val: m, unit: '分' };
  };
  const focus = fmtH(st.focusSeconds);
  const brk = fmtH(st.breakSeconds);

  const maxMin = Math.max(60, ...st.daily.map(d => d.minutes));

  return (
    <div style={statsStyles.body}>
      <div style={statsStyles.kpiRow}>
        <div style={statsStyles.kpi}>
          <div style={statsStyles.kpiLabel}>集中セッション</div>
          <div style={statsStyles.kpiValue}>{st.sessions}<span style={statsStyles.kpiUnit}>回</span></div>
        </div>
        <div style={statsStyles.kpi}>
          <div style={statsStyles.kpiLabel}>集中時間</div>
          <div style={statsStyles.kpiValue}>{focus.val}<span style={statsStyles.kpiUnit}>{focus.unit}</span></div>
        </div>
        <div style={statsStyles.kpi}>
          <div style={statsStyles.kpiLabel}>休憩時間</div>
          <div style={statsStyles.kpiValue}>{brk.val}<span style={statsStyles.kpiUnit}>{brk.unit}</span></div>
        </div>
        <div style={statsStyles.kpi}>
          <div style={statsStyles.kpiLabel}>所持 DUST</div>
          <div style={statsStyles.kpiValue} style={{ ...statsStyles.kpiValue, color: 'var(--dust)' }}>{s.currency.dust}</div>
        </div>
      </div>

      <div style={statsStyles.chart}>
        <div style={statsStyles.chartHead}>
          <div>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: 14, fontWeight: 500 }}>過去14日の集中時間</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', marginTop: 2, textTransform: 'uppercase' }}>DAILY FOCUS (MIN)</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            平均 {Math.round(st.daily.reduce((a, d) => a + d.minutes, 0) / st.daily.length)} 分 / 日
          </div>
        </div>
        <Chart data={st.daily} maxMin={maxMin} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={statsStyles.chart}>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 13, marginBottom: 12 }}>セッション分布</div>
          <RingChart focus={st.focusSeconds} brk={st.breakSeconds} />
        </div>
        <div style={statsStyles.chart}>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 13, marginBottom: 12 }}>累計獲得</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StatRow label="獲得 DUST (集中)" value={Math.floor(st.focusSeconds / 300)} unit="DUST" color="var(--dust)" />
            <StatRow label="平均セッション長" value={st.sessions > 0 ? Math.round(st.focusSeconds / st.sessions / 60) : 0} unit="分" color="var(--ink)" />
            <StatRow label="集中:休憩 比" value={st.breakSeconds > 0 ? (st.focusSeconds / st.breakSeconds).toFixed(1) : '—'} unit="" color="var(--moss)" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, unit, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
    <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-jp)' }}>{label}</span>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color }}>{value}<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>{unit}</span></span>
  </div>
);

const Chart = ({ data, maxMin }) => {
  const w = 720, h = 200;
  const pad = { l: 32, r: 12, t: 12, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const barW = innerW / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 200, display: 'block' }}>
      {/* Y gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((g, i) => {
        const y = pad.t + innerH - g * innerH;
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="var(--line-soft)" strokeWidth={0.7} strokeDasharray={i === 0 ? '' : '2 3'} />
            <text x={pad.l - 8} y={y + 3} fontSize="9" fill="var(--muted)" textAnchor="end" fontFamily="var(--font-mono)">{Math.round(g * maxMin)}</text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x = pad.l + i * barW + barW * 0.18;
        const bw = barW * 0.64;
        const bh = (d.minutes / maxMin) * innerH;
        const y = pad.t + innerH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill={i === data.length - 1 ? 'var(--dust)' : 'rgba(201,123,74,0.55)'} rx={2} />
            <text x={x + bw / 2} y={h - 10} fontSize="8" fill="var(--muted)" textAnchor="middle" fontFamily="var(--font-mono)">
              {d.date.slice(5).replace('-', '/')}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const RingChart = ({ focus, brk }) => {
  const total = focus + brk;
  const focusPct = total > 0 ? focus / total : 0.83;
  const size = 160;
  const r = 60;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(111,138,91,0.3)" strokeWidth={14} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--dust)" strokeWidth={14}
                strokeDasharray={`${c * focusPct} ${c}`} strokeLinecap="round"
                transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2 - 4} textAnchor="middle" fill="var(--ink)" fontSize="22" fontFamily="var(--font-jp)" fontWeight="300">
          {Math.round(focusPct * 100)}%
        </text>
        <text x={size/2} y={size/2 + 16} textAnchor="middle" fill="var(--muted)" fontSize="9" letterSpacing="0.2em">FOCUS</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, fontFamily: 'var(--font-jp)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: 'var(--dust)', borderRadius: 2 }} /> 集中 {Math.round(focus / 60)} 分
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: 'var(--moss)', borderRadius: 2 }} /> 休憩 {Math.round(brk / 60)} 分
        </div>
      </div>
    </div>
  );
};

window.Stats = Stats;
