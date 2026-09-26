import { sx } from '../utils/sx.js';

// Standard page header — stacks cleanly on mobile; title scales with rem.
export default function PageHeader({ title, subtitle, right }) {
  return (
    <header className="page-header" style={sx('display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;margin-bottom:1.25rem;flex-wrap:wrap')}>
      <div style={sx('min-width:0;flex:1 1 12rem')}>
        <div className="page-header-title" style={sx('font-family:Inter;font-weight:800;font-size:clamp(1.25rem,4.5vw,1.65rem);color:var(--tx);letter-spacing:-.02em;line-height:1.2')}>{title}</div>
        {subtitle && <div className="page-header-sub" style={sx('color:var(--sub);font-size:0.875rem;margin-top:0.3rem;line-height:1.45;max-width:70ch')}>{subtitle}</div>}
      </div>
      {right && <div className="page-header-right" style={sx('display:flex;align-items:center;gap:0.45rem;flex:1 1 auto;flex-wrap:wrap;justify-content:flex-end')}>{right}</div>}
    </header>
  );
}
