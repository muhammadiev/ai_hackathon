import { sx } from '../utils/sx.js';
import Icon from './Icon.jsx';

/** Choose: oddiy test vs o'yin for test-type homework */
export default function HwModeModal({ open, homework, subjectName, onClose, onPickTest, onPickGame }) {
  if (!open || !homework) return null;
  return (
    <div
      role="dialog"
      onClick={onClose}
      style={sx('position:fixed;inset:0;z-index:85;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:1rem')}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.15rem;padding:1.35rem 1.25rem;width:min(24rem,100%);box-shadow:0 1.5rem 3rem -1rem rgba(15,23,42,.35)')}
      >
        <div style={sx('font-weight:800;font-size:1.1rem;color:var(--tx);margin-bottom:0.35rem')}>
          Qanday topshirasiz?
        </div>
        <p style={sx('font-size:0.875rem;color:var(--sub);line-height:1.5;margin:0 0 1rem')}>
          <b style={sx('color:var(--tx)')}>{subjectName}</b> — {homework.topic}.{' '}
          {homework.questions} savol · {homework.xp} XP. Oddiy test yoki o‘yin rejimini tanlang.
        </p>
        <div style={sx('display:flex;flex-direction:column;gap:0.65rem')}>
          <button
            type="button"
            onClick={onPickTest}
            style={sx('display:flex;align-items:center;gap:0.75rem;width:100%;text-align:left;padding:0.9rem 1rem;border-radius:0.9rem;border:1.5px solid var(--bd);background:var(--soft);cursor:pointer')}
          >
            <span style={sx('width:2.5rem;height:2.5rem;border-radius:0.75rem;background:rgba(61,125,246,.14);display:grid;place-items:center;flex:none')}>
              <Icon name="target" size={18} color="#3D7DF6" />
            </span>
            <span style={sx('flex:1;min-width:0')}>
              <span style={sx('display:block;font-weight:800;font-size:0.95rem;color:var(--tx)')}>Oddiy test</span>
              <span style={sx('font-size:0.8rem;color:var(--sub)')}>Klassik savol–javob sahifasi</span>
            </span>
            <Icon name="chevronRight" size={16} color="var(--sub)" />
          </button>
          <button
            type="button"
            onClick={onPickGame}
            style={sx('display:flex;align-items:center;gap:0.75rem;width:100%;text-align:left;padding:0.9rem 1rem;border-radius:0.9rem;border:1.5px solid rgba(122,90,248,.35);background:linear-gradient(135deg,rgba(122,90,248,.12),rgba(61,125,246,.08));cursor:pointer')}
          >
            <span style={sx('width:2.5rem;height:2.5rem;border-radius:0.75rem;background:rgba(122,90,248,.18);display:grid;place-items:center;flex:none')}>
              <Icon name="trophy" size={18} color="#7A5AF8" />
            </span>
            <span style={sx('flex:1;min-width:0')}>
              <span style={sx('display:block;font-weight:800;font-size:0.95rem;color:var(--tx)')}>O‘yin bilan</span>
              <span style={sx('font-size:0.8rem;color:var(--sub)')}>O‘yin portaliga yuboriladi · u yerda topshirasiz</span>
            </span>
            <Icon name="chevronRight" size={16} color="#7A5AF8" />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={sx('margin-top:0.85rem;width:100%;padding:0.7rem;border-radius:0.75rem;border:1px solid var(--bd);background:transparent;font-weight:700;cursor:pointer;color:var(--sub)')}
        >
          Bekor qilish
        </button>
      </div>
    </div>
  );
}
