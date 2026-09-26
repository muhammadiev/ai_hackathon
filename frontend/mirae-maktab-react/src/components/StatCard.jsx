import { sx } from '../utils/sx.js';
import { useTheme } from '../ThemeContext.jsx';
import Icon from './Icon.jsx';

// Named accent kits so every KPI card gets a distinct, deliberate colour
// rather than one accent repeated four times.
export const KPI_KIT = {
  blue: { fg: '#2F6FED', bg: 'rgba(47,111,237,.12)', ring: '#2F6FED' },
  green: { fg: '#17A673', bg: 'rgba(23,166,115,.12)', ring: '#17A673' },
  purple: { fg: '#7A5AF8', bg: 'rgba(122,90,248,.13)', ring: '#7A5AF8' },
  amber: { fg: '#DB8A17', bg: 'rgba(245,165,36,.16)', ring: '#F5A524' },
  rose: { fg: '#DB3D6F', bg: 'rgba(219,61,111,.12)', ring: '#DB3D6F' },
};

export default function StatCard({ icon, kit = 'purple', label, value, unit, delta, deltaLabel, sub, children }) {
  const { dark: d } = useTheme();
  const c = KPI_KIT[kit];
  const deltaUp = typeof delta === 'number' ? delta >= 0 : null;
  return (
    <div
      className="card-h"
      style={sx(
        `background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:12px;transition:transform .18s,box-shadow .18s,border-color .18s`
      )}
    >
      <div style={sx('display:flex;align-items:flex-start;justify-content:space-between')}>
        <div style={sx(`width:42px;height:42px;border-radius:13px;background:${c.bg};display:flex;align-items:center;justify-content:center;flex:none`)}>
          <Icon name={icon} size={20} color={c.fg} strokeWidth={2} />
        </div>
        {delta != null && (
          <div style={sx(`display:flex;align-items:center;gap:3px;font-size:12px;font-weight:700;color:${deltaUp ? '#17A673' : '#DB3D6F'}`)}>
            <Icon name={deltaUp ? 'arrowUp' : 'arrowDown'} size={12} strokeWidth={2.4} />
            {Math.abs(delta)}{typeof delta === 'number' && Number.isInteger(delta) === false ? '' : '%'}
          </div>
        )}
      </div>

      <div>
        <div className="statnum" style={sx('font-size:26px;color:var(--tx);line-height:1.1;display:flex;align-items:baseline;gap:5px')}>
          {value}
          {unit && <span style={sx('font-size:13px;font-weight:600;color:var(--sub)')}>{unit}</span>}
        </div>
        <div style={sx('font-size:12.5px;color:var(--sub);margin-top:5px;font-weight:500')}>{label}</div>
      </div>

      {children}
      {sub && <div style={sx('font-size:11.5px;color:var(--sub);margin-top:-4px')}>{sub}</div>}
    </div>
  );
}
