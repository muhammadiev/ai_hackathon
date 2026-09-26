import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import Icon from './Icon.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useTheme } from '../ThemeContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import { useWallet } from '../WalletContext.jsx';
import { useSubject } from '../SubjectContext.jsx';
import { useI18n } from '../I18nContext.jsx';
import { logout } from '../session.js';
import { LANGS, PLANS } from '../data/mock.js';
import { USER, APP_NAME, NOTIFICATIONS, fmt, subjectReadiness } from '../data/mock.js';

const KIND_FG = { video: '#2F6FED', assignment: '#DB8A17', payment: '#17A673', rank: '#7A5AF8', admin: '#DB3D6F' };
const KIND_ICON = { video: 'video', assignment: 'clipboard', payment: 'wallet', rank: 'trophy', admin: 'send' };
const timeAgo = (iso) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 36e5);
  if (h < 1) return 'hozirgina';
  if (h < 24) return `${h} soat oldin`;
  return `${Math.round(h / 24)} kun oldin`;
};

function useOutside(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return ref;
}

export default function TopBar({ onToggleSidebar, collapsed }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useWallet();
  const { enrolled, active, setActive } = useSubject();
  const [openBell, setOpenBell] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openLang, setOpenLang] = useState(false);
  const [openSub, setOpenSub] = useState(false);
  const { t, lang, setLang } = useI18n();

  const name = user?.first_name || USER.name;
  const surname = user?.last_name || USER.surname;
  const fan = user?.fan || USER.fan;
  const initial = (name || 'M')[0].toUpperCase();
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  const bellRef = useOutside(() => setOpenBell(false));
  const userRef = useOutside(() => setOpenUser(false));
  const langRef = useOutside(() => setOpenLang(false));
  const subRef = useOutside(() => setOpenSub(false));
  const curLang = LANGS.find((l) => l.id === lang) || LANGS[0];
  const plan = PLANS[user?.plan || USER.plan] || PLANS.free;

  return (
    <header className="topbar" style={sx('position:sticky;top:0;z-index:45;display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--card);border-bottom:1px solid var(--bd);min-width:0')}>
      {/* desktop sidebar collapse (Unfold-style) */}
      <button onClick={onToggleSidebar} aria-label="Menyuni yig‘ish" title="Menyuni yig‘ish/ochish" className="topbar-collapse" style={sx('display:none;width:40px;height:40px;border-radius:12px;background:var(--soft);border:1px solid var(--bd);align-items:center;justify-content:center;cursor:pointer;color:var(--tx)')}>
        <Icon name={collapsed ? 'chevronRight' : 'menu'} size={18} color="var(--tx)" />
      </button>

      {/* mobile logo (desktop has sidebar logo) */}
      <Link to="/" className="topbar-logo" style={sx('display:none;align-items:center;gap:8px;text-decoration:none;flex:none;min-width:0')}>
        <span style={sx('width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#3D7DF6,#4C7DF0);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;flex:none')}>M</span>
        <span className="topbar-logo-text" style={sx('font-weight:800;font-size:16px;color:var(--tx);white-space:nowrap')}>{APP_NAME}</span>
      </Link>

      {/* Subject dropdown — ~4 rows visible, scroll for the rest. No add. */}
      <div ref={subRef} className="topbar-subject" style={sx('position:relative')}>
        <button
          type="button"
          onClick={() => { setOpenSub((v) => !v); setOpenBell(false); setOpenUser(false); setOpenLang(false); }}
          style={sx('display:flex;align-items:center;gap:9px;padding:7px 12px;border-radius:12px;background:var(--soft);border:1px solid var(--bd);cursor:pointer;max-width:min(280px,48vw)')}
        >
          <span style={sx(`width:9px;height:9px;border-radius:3px;flex:none;background:${active.color}`)} />
          <span style={sx('display:flex;flex-direction:column;line-height:1.1;text-align:left;min-width:0')}>
            <span style={sx('font-size:9.5px;color:var(--sub);font-weight:600')}>{t('topbar.subject')}</span>
            <span style={sx('font-size:13px;font-weight:800;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{active.name}</span>
          </span>
          <Icon name="chevronDown" size={15} color="var(--sub)" />
        </button>
        {openSub && (
          <div
            style={sx('position:absolute;left:0;top:52px;width:300px;max-width:min(300px,92vw);background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:var(--shadowLg);z-index:60;overflow:hidden')}
          >
            <div style={sx('padding:12px 16px;border-bottom:1px solid var(--bd);font-weight:800;font-size:13px;color:var(--tx)')}>
              {t('topbar.mysubjects') || 'Fanlarim'}
            </div>
            {/* max-height ≈ 4 rows (~52px each) */}
            <div style={sx('max-height:208px;overflow-y:auto;overscroll-behavior:contain;padding:4px 0')}>
              {enrolled.map((s) => {
                const on = s.id === active.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setActive(s.id); setOpenSub(false); }}
                    style={sx(`display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:11px 16px;border:none;cursor:pointer;background:${on ? 'var(--chip)' : 'transparent'}`)}
                  >
                    <span style={sx(`width:10px;height:10px;border-radius:3px;flex:none;background:${s.color}`)} />
                    <span style={sx('flex:1;min-width:0')}>
                      <span style={sx(`display:block;font-size:13.5px;font-weight:${on ? '800' : '600'};color:var(--tx)`)}>{s.name}</span>
                      <span style={sx('display:block;font-size:11px;color:var(--sub)')}>Tayyorgarlik {subjectReadiness(s)}%{s.rank != null ? ` · #${s.rank}` : ''}</span>
                    </span>
                    {on && <Icon name="check" size={15} color="#3D7DF6" strokeWidth={2.4} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="topbar-spacer" style={sx('flex:1;min-width:4px')} />

      {/* balance */}
      <Link to="/tolovlar" className="topbar-balance" style={sx('display:flex;align-items:center;gap:8px;padding:8px 13px;border-radius:12px;background:var(--soft);border:1px solid var(--bd);text-decoration:none;color:var(--tx)')}>
        <span style={sx('width:24px;height:24px;border-radius:7px;background:rgba(23,166,115,.14);display:flex;align-items:center;justify-content:center')}>
          <Icon name="wallet" size={14} color="#17A673" />
        </span>
        <span style={sx('font-weight:800;font-size:13.5px')}>{fmt(balance)}</span>
        <span style={sx('font-size:12px;color:var(--sub);font-weight:600')}>{t('topbar.balance')}</span>
      </Link>

      {/* language switcher */}
      <div ref={langRef} style={sx('position:relative')}>
        <button onClick={() => { setOpenLang((v) => !v); setOpenBell(false); setOpenUser(false); }} aria-label="Til" style={sx('display:flex;align-items:center;gap:6px;height:40px;padding:0 11px;border-radius:12px;background:var(--soft);border:1px solid var(--bd);cursor:pointer')}>
          <span style={sx('font-size:17px;line-height:1')}>{curLang.flag}</span>
          <Icon name="chevronDown" size={13} color="var(--sub)" />
        </button>
        {openLang && (
          <div style={sx('position:absolute;right:0;top:48px;width:172px;background:var(--card);border:1px solid var(--bd);border-radius:14px;box-shadow:var(--shadowLg);overflow:hidden;z-index:60')}>
            {LANGS.map((l) => (
              <button key={l.id} onClick={() => { setLang(l.id); setOpenLang(false); }} style={sx(`display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:11px 14px;border:none;cursor:pointer;background:${l.id === lang ? 'var(--chip)' : 'transparent'}`)}>
                <span style={sx('font-size:18px')}>{l.flag}</span>
                <span style={sx(`flex:1;font-size:13.5px;font-weight:${l.id === lang ? '800' : '600'};color:var(--tx)`)}>{l.label}</span>
                {l.id === lang && <Icon name="check" size={14} color="#3D7DF6" strokeWidth={2.4} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <ThemeToggle />

      {/* bell */}
      <div ref={bellRef} style={sx('position:relative')}>
        <button onClick={() => { setOpenBell((v) => !v); setOpenUser(false); }} aria-label="Bildirishnomalar" style={sx('position:relative;width:40px;height:40px;border-radius:12px;background:var(--soft);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--tx)')}>
          <Icon name="bell" size={18} color="var(--tx)" />
          {unread > 0 && <span style={sx('position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:#DB3D6F;color:#fff;font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--card)')}>{unread}</span>}
        </button>
        {openBell && (
          <div style={sx('position:absolute;right:0;top:48px;width:340px;max-width:86vw;background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:var(--shadowLg);overflow:hidden;z-index:60')}>
            <div style={sx('display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--bd)')}>
              <div style={sx('font-weight:800;font-size:14px;color:var(--tx)')}>{t('topbar.notifications')}</div>
              <span style={sx('font-size:11.5px;color:var(--sub)')}>{unread} {t('topbar.new')}</span>
            </div>
            <div style={sx('max-height:340px;overflow-y:auto')}>
              {NOTIFICATIONS.slice(0, 5).map((n) => (
                <button key={n.id} onClick={() => { setOpenBell(false); navigate('/bildirishnomalar'); }} style={sx(`display:flex;gap:11px;width:100%;text-align:left;padding:12px 16px;border:none;border-bottom:1px solid var(--bd);background:${n.read ? 'transparent' : 'var(--soft)'};cursor:pointer`)}>
                  <span style={sx(`width:32px;height:32px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center;background:${(KIND_FG[n.kind] || '#3D7DF6')}22`)}>
                    <Icon name={KIND_ICON[n.kind] || 'bell'} size={15} color={KIND_FG[n.kind] || '#3D7DF6'} />
                  </span>
                  <span style={sx('min-width:0;flex:1')}>
                    <span style={sx(`display:block;font-size:13px;color:var(--tx);font-weight:${n.read ? '600' : '800'}`)}>{n.title}</span>
                    <span style={sx('display:block;font-size:11.5px;color:var(--sub);margin-top:2px')}>{timeAgo(n.time)}</span>
                  </span>
                </button>
              ))}
            </div>
            <Link to="/bildirishnomalar" onClick={() => setOpenBell(false)} style={sx('display:block;text-align:center;padding:12px;font-size:13px;font-weight:700;color:#3D7DF6;text-decoration:none')}>{t('topbar.seeAll')}</Link>
          </div>
        )}
      </div>

      {/* user */}
      <div ref={userRef} className="topbar-user" style={sx('position:relative;flex:none')}>
        <button onClick={() => { setOpenUser((v) => !v); setOpenBell(false); }} style={sx('display:flex;align-items:center;gap:8px;padding:4px;border-radius:99px;background:var(--soft);border:1px solid var(--bd);cursor:pointer;flex:none')}>
          <span style={sx('width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;flex:none')}>{initial}</span>
          <span className="topbar-user-meta" style={sx('display:flex;flex-direction:column;line-height:1.15;padding-right:6px')}>
            <span style={sx('font-size:12.5px;font-weight:800;color:var(--tx)')}>{name}</span>
            <span style={sx('font-size:10.5px;color:var(--sub)')}>{fan}</span>
          </span>
        </button>
        {openUser && (
          <div style={sx('position:absolute;right:0;top:52px;width:270px;max-width:86vw;background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:var(--shadowLg);overflow:hidden;z-index:60')}>
            <div style={sx('display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--bd)')}>
              <span style={sx('width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:19px;flex:none')}>{initial}</span>
              <div style={sx('min-width:0')}>
                <div style={sx('font-size:14.5px;font-weight:800;color:var(--tx)')}>{name} {surname}</div>
                <div style={sx('display:flex;align-items:center;gap:7px;margin-top:3px')}>
                  <span style={sx(`font-size:10.5px;font-weight:800;color:#fff;background:${plan.color};padding:2px 8px;border-radius:99px`)}>{plan.name}</span>
                  <span style={sx('font-size:12px;color:var(--sub)')}>{fan}</span>
                </div>
              </div>
            </div>
            <Link to="/tolovlar" onClick={() => setOpenUser(false)} style={sx('display:flex;align-items:center;justify-content:space-between;padding:12px 16px;text-decoration:none;border-bottom:1px solid var(--bd)')}>
              <span style={sx('display:flex;align-items:center;gap:9px;color:var(--tx);font-size:13.5px;font-weight:600')}><Icon name="wallet" size={16} color="#17A673" /> {t('topbar.balanceLabel')}</span>
              <span style={sx('font-weight:800;font-size:13.5px;color:#17A673')}>{fmt(balance)} so‘m</span>
            </Link>
            <MenuRow icon="user" label={t('topbar.profile')} onClick={() => { setOpenUser(false); navigate('/sozlamalar'); }} />
            <MenuRow icon="trophy" label={t('topbar.upgrade')} onClick={() => { setOpenUser(false); navigate('/tarif'); }} />
            <MenuRow icon="settings" label={t('topbar.settings')} onClick={() => { setOpenUser(false); navigate('/sozlamalar'); }} />
            <MenuRow icon="send" label={t('topbar.contact')} onClick={() => { setOpenUser(false); navigate('/adminga-yozish'); }} />
            <div style={sx('height:1px;background:var(--bd)')} />
            <MenuRow icon="logout" label={t('topbar.logout')} danger onClick={() => { setOpenUser(false); logout(); navigate('/login'); }} />
          </div>
        )}
      </div>
    </header>
  );
}

function MenuRow({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={sx(`display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:12px 16px;border:none;background:transparent;cursor:pointer;font-size:13.5px;font-weight:600;color:${danger ? '#DB3D6F' : 'var(--tx)'}`)}>
      <Icon name={icon} size={16} color={danger ? '#DB3D6F' : 'var(--sub)'} /> {label}
    </button>
  );
}
