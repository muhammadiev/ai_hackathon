// Dependency-free chart + data-viz primitives.
// These bring the signature elements of the reference dashboards
// (donut with a centre total, KPI sparklines, grouped weekly bars,
// icon-labelled progress rows) into the Mirae design system — pure SVG/HTML,
// themed with the same CSS variables + accent kits as the rest of the app.
import { useId } from 'react';
import { sx } from '../utils/sx.js';
import Icon from './Icon.jsx';

/* ------------------------------------------------------------------ *
 * Sparkline — soft area + line trend, sized to its container.
 * Used inside KPI cards and the readiness hero.
 * ------------------------------------------------------------------ */
export function Sparkline({ data = [], color = '#3D7DF6', height = 44, strokeWidth = 2.25, fill = true }) {
  const gid = useId().replace(/:/g, '');
  const W = 100, H = 100;
  if (data.length < 2) return <div style={{ height }} />;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const stepX = W / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, H - ((v - min) / span) * (H - 12) - 6]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sp${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#sp${gid})`} stroke="none" />}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.4" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * MiniBars — tiny bar sparkline for KPI cards.
 * ------------------------------------------------------------------ */
export function MiniBars({ data = [], color = '#3D7DF6', height = 40 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={sx(`display:flex;align-items:flex-end;gap:3px;height:${height}px`)}>
      {data.map((v, i) => (
        <div key={i} style={sx(`flex:1;border-radius:4px 4px 2px 2px;background:${color};opacity:${0.35 + (v / max) * 0.65};height:${Math.max(8, (v / max) * 100)}%`)} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Donut — multi-segment ring with a centre label + optional legend.
 * segments: [{ value, color, label }]
 * ------------------------------------------------------------------ */
export function Donut({ segments = [], size = 168, thickness = 20, centerTop, centerSub, children }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const len = frac * C;
          const off = -acc * C;
          acc += frac;
          return (
            <circle
              key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={off}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray .6s ease' }}
            />
          );
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {children || (
          <>
            <div className="statnum" style={sx('font-size:26px;color:var(--tx);line-height:1')}>{centerTop}</div>
            {centerSub && <div style={sx('font-size:11.5px;color:var(--sub);margin-top:3px;font-weight:600')}>{centerSub}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export function DonutLegend({ segments = [], fmt = (n) => n }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div style={sx('display:flex;flex-direction:column;gap:9px;min-width:0;flex:1')}>
      {segments.map((s, i) => (
        <div key={i} style={sx('display:flex;align-items:center;gap:9px')}>
          <span style={sx(`width:10px;height:10px;border-radius:4px;flex:none;background:${s.color}`)} />
          <span style={sx('flex:1;min-width:0;font-size:12.5px;color:var(--tx);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{s.label}</span>
          <span style={sx('font-size:12.5px;color:var(--sub);font-weight:600')}>{fmt(s.value)}</span>
          <span className="statnum-sm" style={sx('font-size:12px;color:var(--sub);width:40px;text-align:right')}>{Math.round((s.value / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * BarChart — grouped rounded bars with baseline + x labels.
 * series: [{ name, color, data:number[] }]  categories: string[]
 * ------------------------------------------------------------------ */
export function BarChart({ series = [], categories = [], height = 190, unit = '' }) {
  const max = Math.max(1, ...series.flatMap((s) => s.data));
  const ticks = 4;
  return (
    <div>
      {series.length > 1 && (
        <div style={sx('display:flex;gap:16px;margin-bottom:12px')}>
          {series.map((s) => (
            <div key={s.name} style={sx('display:flex;align-items:center;gap:6px;font-size:12px;color:var(--sub);font-weight:600')}>
              <span style={sx(`width:9px;height:9px;border-radius:3px;background:${s.color}`)} /> {s.name}
            </div>
          ))}
        </div>
      )}
      <div style={sx(`display:flex;gap:10px`)}>
        {/* y axis ticks */}
        <div style={sx(`display:flex;flex-direction:column;justify-content:space-between;height:${height}px;padding:2px 0 18px;font-size:10.5px;color:var(--sub);text-align:right;min-width:26px`)}>
          {Array.from({ length: ticks + 1 }).map((_, i) => (
            <div key={i}>{Math.round((max / ticks) * (ticks - i))}{unit}</div>
          ))}
        </div>
        {/* plot */}
        <div style={sx(`position:relative;flex:1;height:${height}px`)}>
          {/* gridlines */}
          {Array.from({ length: ticks + 1 }).map((_, i) => (
            <div key={i} style={sx(`position:absolute;left:0;right:0;top:${(i / ticks) * (height - 18)}px;height:1px;background:var(--bd)`)} />
          ))}
          {/* bars */}
          <div style={sx(`position:absolute;inset:0 0 18px;display:flex;align-items:flex-end;gap:${categories.length > 8 ? 4 : 12}px`)}>
            {categories.map((cat, ci) => (
              <div key={cat} style={sx('flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px')}>
                {series.map((s) => (
                  <div
                    key={s.name}
                    title={`${cat} · ${s.name}: ${s.data[ci]}${unit}`}
                    style={sx(`width:${series.length > 1 ? '42%' : '58%'};max-width:26px;height:${(s.data[ci] / max) * 100}%;min-height:4px;border-radius:6px 6px 3px 3px;background:linear-gradient(180deg,${s.color},${s.color}bb)`)}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* x labels */}
          <div style={sx('position:absolute;left:0;right:0;bottom:0;display:flex;gap:0;font-size:10.5px;color:var(--sub);text-align:center')}>
            {categories.map((cat) => (
              <div key={cat} style={sx('flex:1')}>{cat}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ProgressRow — icon badge + label + track + value/fraction.
 * (Staff-schedule / budget-progress style from the references.)
 * ------------------------------------------------------------------ */
export function ProgressRow({ icon, color = '#3D7DF6', bg, label, value, right }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={sx('display:flex;align-items:center;gap:11px')}>
      {icon && (
        <div style={sx(`width:34px;height:34px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;background:${bg || color + '22'}`)}>
          <Icon name={icon} size={16} color={color} />
        </div>
      )}
      <div style={sx('flex:1;min-width:0')}>
        <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px')}>
          <span style={sx('font-size:12.5px;font-weight:600;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{label}</span>
          <span className="statnum-sm" style={sx(`font-size:12px;color:${color};margin-left:8px`)}>{right != null ? right : `${pct}%`}</span>
        </div>
        <div style={sx('height:8px;border-radius:99px;background:var(--track);overflow:hidden')}>
          <div style={sx(`height:100%;width:${pct}%;border-radius:99px;background:linear-gradient(90deg,${color},${color}cc);transition:width .6s ease`)} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FloatBadge — soft glossy tile that hovers near the hero, echoing the
 * floating 3D badges in the reference dashboards. Decorative only.
 * ------------------------------------------------------------------ */
export function FloatBadge({ icon, color = '#3D7DF6', style, delay = 0, size = 46 }) {
  return (
    <div
      aria-hidden
      style={sx(
        `position:absolute;width:${size}px;height:${size}px;border-radius:15px;` +
        `display:flex;align-items:center;justify-content:center;` +
        `background:linear-gradient(145deg,#ffffff,#e9f1ff);` +
        `box-shadow:0 14px 26px -12px rgba(20,40,80,.42),inset 0 1px 0 rgba(255,255,255,.9);` +
        `animation:floaty ${5 + delay}s ease-in-out infinite ${delay}s;` + (style || '')
      )}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} color={color} />
    </div>
  );
}
