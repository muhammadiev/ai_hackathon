import { NavLink } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import { getNav, APP_NAME, USER } from '../data/mock.js';
import { NAV_KEY } from '../i18n.js';
import { useI18n } from '../I18nContext.jsx';
import Icon from './Icon.jsx';

export default function Sidebar({ collapsed = false }) {
  const { t } = useI18n();
  const width = collapsed ? 74 : 220;
  const itemStyle = (isActive) => sx(
    `display:flex;align-items:center;gap:12px;${collapsed ? 'justify-content:center;padding:11px 0' : 'padding:10.5px 12px'};border-radius:12px;font-size:14px;cursor:pointer;white-space:nowrap;background:${isActive ? 'var(--chip)' : 'transparent'};color:${isActive ? '#3D7DF6' : 'var(--sub)'};font-weight:${isActive ? '700' : '500'};transition:background .15s`
  );

  return (
    <aside className="sidebar-desktop" style={sx(`width:${width}px;flex:none;background:var(--sbar);border-right:1px solid var(--bd);padding:18px ${collapsed ? '12px' : '14px'};display:flex;flex-direction:column;gap:4px;min-height:100dvh;height:100dvh;position:sticky;top:0;align-self:stretch;transition:width .2s ease`)}>
      <div style={sx(`display:flex;align-items:center;gap:10px;${collapsed ? 'justify-content:center' : ''};padding:2px 4px 20px`)}>
        <div style={sx("width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#3D7DF6,#4C7DF0);display:flex;align-items:center;justify-content:center;color:#fff;flex:none;box-shadow:0 6px 14px -6px rgba(61,125,246,.6);font-weight:800;font-size:16px")}>M</div>
        {!collapsed && <div style={sx('font-weight:800;font-size:18px;color:var(--tx);letter-spacing:-.02em;white-space:nowrap')}>{APP_NAME}</div>}
      </div>

      {!collapsed && <div style={sx('font-size:11px;font-weight:700;color:var(--sub);letter-spacing:.04em;padding:6px 12px 8px')}>{t('menu.menu')}</div>}
      {collapsed && <div style={sx('height:8px')} />}

      {getNav(USER.grade).map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} title={collapsed ? n.label : undefined} className="navit" style={({ isActive }) => itemStyle(isActive)}>
          {({ isActive }) => (
            <>
              <Icon name={n.icon} size={19} strokeWidth={isActive ? 2.2 : 1.8} />
              {!collapsed && <span>{t(NAV_KEY[n.to]) || n.label}</span>}
            </>
          )}
        </NavLink>
      ))}

      <NavLink to="/sozlamalar" title={collapsed ? 'Sozlamalar' : undefined} className="navit" style={({ isActive }) => ({ ...itemStyle(isActive), marginTop: 'auto' })}>
        {({ isActive }) => (
          <>
            <Icon name="settings" size={19} strokeWidth={isActive ? 2.2 : 1.8} />
            {!collapsed && <span>{t('nav.settings')}</span>}
          </>
        )}
      </NavLink>
    </aside>
  );
}
