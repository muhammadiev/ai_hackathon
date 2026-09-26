import { NavLink, useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import { getNav, APP_NAME, USER, fmt } from '../data/mock.js';
import Icon from './Icon.jsx';
import { useI18n } from '../I18nContext.jsx';
import { logout } from '../session.js';
import { NAV_KEY } from '../i18n.js';

// Slide-in full menu used on mobile (every nav item, nothing hidden).
export default function Drawer({ open, onClose }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const initial = (USER.name || 'M')[0].toUpperCase();
  return (
    <div aria-hidden={!open} style={sx(`position:fixed;inset:0;z-index:100;pointer-events:${open ? 'auto' : 'none'}`)}>
      <div onClick={onClose} style={sx(`position:absolute;inset:0;background:rgba(15,31,51,.45);opacity:${open ? 1 : 0};transition:opacity .25s`)} />
      <aside style={sx(`position:absolute;top:0;left:0;bottom:0;width:280px;max-width:86%;background:var(--sbar);border-right:1px solid var(--bd);padding:16px 14px;display:flex;flex-direction:column;gap:4px;overflow-y:auto;transform:translateX(${open ? '0' : '-100%'});transition:transform .28s cubic-bezier(.22,1,.36,1);box-shadow:0 0 50px rgba(0,0,0,.3)`)}>
        <div style={sx('display:flex;align-items:center;justify-content:space-between;padding:2px 4px 14px')}>
          <div style={sx('display:flex;align-items:center;gap:9px')}>
            <div style={sx("width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#3D7DF6,#4C7DF0);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px")}>M</div>
            <div style={sx('font-weight:800;font-size:18px;color:var(--tx)')}>{APP_NAME}</div>
          </div>
          <div onClick={onClose} style={sx('width:34px;height:34px;border-radius:9px;background:var(--soft);display:flex;align-items:center;justify-content:center;color:var(--sub);font-size:18px;cursor:pointer')}>✕</div>
        </div>

        {/* user card */}
        <div style={sx('display:flex;align-items:center;gap:11px;padding:12px;border:1px solid var(--bd);border-radius:14px;background:var(--card);margin-bottom:8px')}>
          <span style={sx('width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:17px;flex:none')}>{initial}</span>
          <div style={sx('min-width:0;flex:1')}>
            <div style={sx('font-size:13.5px;font-weight:800;color:var(--tx)')}>{USER.name} {USER.surname}</div>
            <div style={sx('font-size:11.5px;color:#17A673;font-weight:700')}>{fmt(USER.balance)} so‘m</div>
          </div>
        </div>

        {getNav(USER.grade).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={onClose} style={({ isActive }) => sx(
            `display:flex;align-items:center;gap:13px;padding:12px;border-radius:11px;font-size:15px;white-space:nowrap;background:${isActive ? 'var(--chip)' : 'transparent'};color:${isActive ? '#3D7DF6' : 'var(--sub)'};font-weight:${isActive ? '700' : '500'}`
          )}>
            <Icon name={n.icon} size={19} /><span>{t(NAV_KEY[n.to]) || n.label}</span>
          </NavLink>
        ))}

        <NavLink to="/sozlamalar" onClick={onClose} style={({ isActive }) => sx(
          `margin-top:6px;display:flex;align-items:center;gap:13px;padding:12px;border-radius:11px;font-size:15px;background:${isActive ? 'var(--chip)' : 'transparent'};color:${isActive ? '#3D7DF6' : 'var(--sub)'};font-weight:500`
        )}>
          <Icon name="settings" size={19} /><span>{t('nav.settings')}</span>
        </NavLink>

        <button onClick={() => { onClose(); logout(); navigate('/login'); }} style={sx('margin-top:auto;display:flex;align-items:center;gap:13px;padding:12px;border-radius:11px;font-size:15px;background:rgba(219,61,111,.08);border:none;cursor:pointer;color:#DB3D6F;font-weight:700')}>
          <Icon name="logout" size={19} color="#DB3D6F" /><span>Hisobdan chiqish</span>
        </button>
      </aside>
    </div>
  );
}
