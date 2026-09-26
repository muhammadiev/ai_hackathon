import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import Drawer from './Drawer.jsx';
import Icon from './Icon.jsx';
import { useI18n } from '../I18nContext.jsx';
import { NAV_KEY } from '../i18n.js';

// Bottom tab bar (mobile only) — 5 equal tabs; active tab gets an accent pill
// behind the icon + accent label. Solid background so icons stay crisp on all
// phones (no reliance on backdrop-filter / color-mix).
const ITEMS = [
  { to: '/', icon: 'home', label: 'Bosh', end: true },
  { to: '/test', icon: 'target', label: 'Test' },
  { to: '/darslar', icon: 'cap', label: 'Darslar' },
  { to: '/vazifalar', icon: 'clipboard', label: 'Vazifalar' },
];

const cell = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:52px;width:100%;overflow:hidden';
const pill = (active) => `display:flex;align-items:center;justify-content:center;width:44px;height:28px;border-radius:99px;transition:background .2s;background:${active ? 'rgba(61,125,246,.14)' : 'transparent'}`;
const lbl = (active) => `font-size:10.5px;line-height:1;font-weight:${active ? '800' : '600'};color:${active ? '#3D7DF6' : 'var(--sub)'};white-space:nowrap`;

export default function MobileNav() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className="mobilenav" style={sx('position:fixed;left:0;right:0;bottom:0;z-index:60;align-items:stretch;justify-content:space-around;background:var(--card);border-top:1px solid var(--bd);box-shadow:0 -6px 24px -16px rgba(20,40,80,.6);overflow:hidden')}>
        {ITEMS.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} aria-label={t(NAV_KEY[n.to]) || n.label} style={{ textDecoration: 'none', flex: '1 1 0', minWidth: 0 }}>
            {({ isActive }) => (
              <div style={sx(cell)}>
                <span style={sx(pill(isActive))}>
                  <Icon name={n.icon} size={21} color={isActive ? '#3D7DF6' : 'var(--sub)'} strokeWidth={isActive ? 2.4 : 1.9} />
                </span>
                <span style={sx(lbl(isActive))}>{t(NAV_KEY[n.to]) || n.label}</span>
              </div>
            )}
          </NavLink>
        ))}
        <button onClick={() => setOpen(true)} aria-label="Yana" style={sx(`flex:1 1 0;min-width:0;background:none;border:none;cursor:pointer;${cell}`)}>
          <span style={sx(pill(false))}><Icon name="layers" size={20} color="var(--sub)" /></span>
          <span style={sx(lbl(false))}>{lang === 'ru' ? 'Ещё' : lang === 'en' ? 'More' : 'Yana'}</span>
        </button>
      </nav>
      <Drawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
