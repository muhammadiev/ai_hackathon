import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import { useTheme } from '../ThemeContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import { updateMyProfile, changePassword, linkTelegram, unlinkTelegram } from '../api/accounts.js';
import { createParentLink, fetchMyParentLinks } from '../api/parents.js';
import Icon from '../components/Icon.jsx';
import { USER as MOCK_USER, fmt } from '../data/mock.js';

function SectionCard({ icon, title, desc, children }) {
  return (
    <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:22px 24px')}>
      <div style={sx('display:flex;align-items:center;gap:12px;margin-bottom:18px')}>
        <div style={sx('width:40px;height:40px;border-radius:12px;background:rgba(61,125,246,.12);display:flex;align-items:center;justify-content:center;flex:none')}>
          <Icon name={icon} size={18} color="#3D7DF6" />
        </div>
        <div>
          <div style={sx('font-weight:800;font-size:16px;color:var(--tx)')}>{title}</div>
          {desc && <div style={sx('font-size:12.5px;color:var(--sub);margin-top:1px')}>{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={sx('font-size:12px;font-weight:700;color:var(--sub);margin-bottom:7px')}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = 'width:100%;padding:11px 14px;border:1px solid var(--bd);border-radius:11px;background:var(--field);font-size:14px;color:var(--tx)';
const readonlyStyle = 'padding:11px 14px;border:1px solid var(--bd);border-radius:11px;background:var(--soft);font-size:14px;color:var(--sub)';

export default function Sozlamalar() {
  const { dark, mode, setMode } = useTheme();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [compact, setCompact] = useState(false);
  const [lang, setLang] = useState('uz');
  const [notif, setNotif] = useState({ hw: true, test: true, rank: true, admin: true });
  const [showRank, setShowRank] = useState(true);
  const [parentPhone, setParentPhone] = useState('');
  const [parentLinks, setParentLinks] = useState([]);
  const [parentMsg, setParentMsg] = useState('');
  const [parentErr, setParentErr] = useState('');

  const [username, setUsername] = useState(user?.username || MOCK_USER.login);
  const [telegram, setTelegram] = useState(user?.telegram_username || '');
  const [tgConnected, setTgConnected] = useState(() => {
    try { return localStorage.getItem('mirae-tg-connected') === '1'; } catch { return false; }
  });
  // restore linked username
  useEffect(() => {
    try {
      if (localStorage.getItem('mirae-tg-connected') === '1') {
        const u = localStorage.getItem('mirae-tg-user');
        if (u) setTelegram(u);
      }
    } catch { /* ignore */ }
  }, []);
  const [tgCode, setTgCode] = useState('');
  const [tgInput, setTgInput] = useState('');
  const [tgMsg, setTgMsg] = useState('');
  const [tgErr, setTgErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    setUsername(user?.username || MOCK_USER.login);
    setTelegram(user?.telegram_username || '');
  }, [user]);

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || `${MOCK_USER.name} ${MOCK_USER.surname}`;
  const initial = (user?.first_name || MOCK_USER.name)[0].toUpperCase();
  const fan = user?.fan || MOCK_USER.fan;


  const persistTg = (on, username = '') => {
    try {
      localStorage.setItem('mirae-tg-connected', on ? '1' : '0');
      if (username) localStorage.setItem('mirae-tg-user', username);
      else localStorage.removeItem('mirae-tg-user');
    } catch { /* ignore */ }
    setTgConnected(on);
    if (username) setTelegram(username);
  };
  // Only admin issues codes — student enters admin-given code to link
  const connectTelegram = async () => {
    setTgMsg(''); setTgErr('');
    const code = tgInput.trim();
    if (!code || code.length < 4) { setTgErr('Admin bergan kodni kiriting.'); return; }
    try {
      await linkTelegram(code);
      const uname = telegram || '@telegram';
      persistTg(true, uname);
      setTgMsg('Telegram hisobi ulandi.');
      setTgInput('');
    } catch (e) {
      setTgErr(e.message || 'Kod noto‘g‘ri yoki muddati o‘tgan.');
    }
  };
  const disconnectTelegram = async () => {
    if (!window.confirm('Telegram hisobini uzmoqchimisiz?')) return;
    try { await unlinkTelegram(); } catch { /* still clear local */ }
    persistTg(false);
    setTelegram('');
    setTgMsg('Telegram uzildi.');
    setTgErr('');
  };

  const Toggle = ({ on, onClick }) => (
    <div onClick={onClick} style={sx(`width:46px;height:27px;border-radius:99px;background:${on ? '#3D7DF6' : 'var(--track)'};padding:3px;cursor:pointer;flex:none;display:flex;justify-content:${on ? 'flex-end' : 'flex-start'};transition:.15s`)}>
      <div style={sx('width:21px;height:21px;border-radius:99px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3)')} />
    </div>
  );

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg(''); setProfileErr('');
    try { await updateMyProfile({ username, telegram_username: telegram }); await refreshProfile(); setProfileMsg('Saqlandi.'); }
    catch (err) { setProfileErr(err.message || "Saqlab bo'lmadi."); }
    finally { setSavingProfile(false); }
  };
  const submitPasswordChange = async () => {
    setSavingPw(true); setPwMsg(''); setPwErr('');
    try { await changePassword(oldPw, newPw); setPwMsg("Parol o'zgartirildi."); setOldPw(''); setNewPw(''); }
    catch (err) { setPwErr(err.message || "Parolni o'zgartirib bo'lmadi."); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <header style={sx('margin-bottom:22px')}>
        <div style={sx('font-weight:800;font-size:26px;color:var(--tx);letter-spacing:-.02em')}>Sozlamalar</div>
        <div style={sx('color:var(--sub);font-size:14px;margin-top:4px')}>Hisob, ko‘rinish va xavfsizlikni boshqaring.</div>
      </header>

      <div style={sx('display:flex;flex-direction:column;gap:1.1rem;max-width:none;width:100%')}>
        {/* profile hero */}
        <div style={sx('position:relative;overflow:hidden;border-radius:20px;padding:24px;background:linear-gradient(120deg,#2E6BE6,#3D7DF6 55%,#4C7DF0);color:#fff')}>
          <div style={sx('position:absolute;top:-30px;right:-10px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.10)')} />
          <div style={sx('position:relative;display:flex;align-items:center;gap:16px;flex-wrap:wrap')}>
            <div style={sx('width:66px;height:66px;border-radius:20px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;flex:none')}>{initial}</div>
            <div style={sx('min-width:0;flex:1')}>
              <div style={sx('font-size:20px;font-weight:800')}>{fullName}</div>
              <div style={sx('font-size:13px;color:rgba(255,255,255,.85);margin-top:2px')}>Sinf: {fan} &middot; @{username}</div>
              <div style={sx('display:flex;gap:8px;margin-top:12px;flex-wrap:wrap')}>
                <span style={sx('display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);padding:6px 12px;border-radius:99px;font-size:12.5px;font-weight:700')}><Icon name="wallet" size={13} color="#fff" /> {fmt(MOCK_USER.balance)} so‘m</span>
                <span style={sx('display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);padding:6px 12px;border-radius:99px;font-size:12.5px;font-weight:700')}><Icon name="trophy" size={13} color="#fff" /> #{MOCK_USER.rank}-o‘rin</span>
              </div>
            </div>
          </div>
        </div>

        {/* profile */}
        <SectionCard icon="user" title="Profil ma'lumotlari" desc="Ism-familiya o‘qituvchi/admin tomonidan boshqariladi.">
          <div className="set-grid" style={sx('display:grid;grid-template-columns:1fr 1fr;gap:16px')}>
            <Field label="Sinf"><div style={sx(readonlyStyle)}>{fan}</div></Field>
            <Field label="Login"><div style={sx(readonlyStyle)}>{MOCK_USER.login}</div></Field>
            <Field label="Username"><input value={username} onChange={(e) => setUsername(e.target.value)} style={sx(inputStyle)} /></Field>
            <Field label="Telegram">
              <div style={sx(readonlyStyle)}>
                {tgConnected ? (telegram || 'Ulangan') : 'Ulanmagan — pastdagi bo‘limdan ulang'}
              </div>
            </Field>
          </div>
          {profileMsg && <div style={sx('margin-top:14px;font-size:13px;color:#17A673')}>{profileMsg}</div>}
          {profileErr && <div style={sx('margin-top:14px;font-size:13px;color:#DB3D6F')}>{profileErr}</div>}
          <div style={sx('display:flex;justify-content:flex-end;margin-top:18px')}>
            <button onClick={saveProfile} disabled={savingProfile} style={sx(`padding:11px 22px;border-radius:11px;border:none;background:${savingProfile ? 'var(--track)' : '#3D7DF6'};color:#fff;font-size:13px;font-weight:700;cursor:pointer`)}>{savingProfile ? 'Saqlanmoqda…' : 'Saqlash'}</button>
          </div>
        </SectionCard>

        <SectionCard icon="telegram" title="Telegram hisobi" desc="Faqat admin bergan kod bilan ulanadi. Uzish istalgan vaqtda.">
          {tgConnected ? (
            <div style={sx('display:flex;flex-direction:column;gap:14px')}>
              <div style={sx('display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;background:rgba(23,166,115,.1);border:1px solid rgba(23,166,115,.25)')}>
                <div style={sx('width:42px;height:42px;border-radius:12px;background:rgba(23,166,115,.18);display:flex;align-items:center;justify-content:center;flex:none')}>
                  <Icon name="telegram" size={20} color="#17A673" />
                </div>
                <div style={sx('flex:1;min-width:0')}>
                  <div style={sx('font-weight:800;font-size:14px;color:var(--tx)')}>Ulangan</div>
                  <div style={sx('font-size:13px;color:var(--sub);margin-top:2px')}>{telegram || '@telegram'}</div>
                </div>
                <span style={sx('font-size:11px;font-weight:800;color:#17A673;background:rgba(23,166,115,.15);padding:5px 10px;border-radius:99px')}>Faol</span>
              </div>
              <p style={sx('margin:0;font-size:12.5px;color:var(--sub);line-height:1.45')}>
                Bildirishnomalar va kirish uchun Telegram ishlatiladi. Uzsangiz, qayta ulash uchun maktab adminidan yangi kod so‘rang.
              </p>
              <button type="button" onClick={disconnectTelegram} style={sx('align-self:flex-start;padding:10px 16px;border-radius:11px;border:1px solid rgba(219,61,111,.35);background:rgba(219,61,111,.08);color:#DB3D6F;font-size:13px;font-weight:800;cursor:pointer')}>
                Uzish (disconnect)
              </button>
            </div>
          ) : (
            <div style={sx('display:flex;flex-direction:column;gap:14px')}>
              <div style={sx('padding:14px;border-radius:14px;background:var(--soft);border:1px solid var(--bd);font-size:13px;color:var(--sub);line-height:1.5')}>
                <b style={sx('color:var(--tx)')}>Kod faqat admindan.</b> O‘quvchi o‘zi kod yarata olmaydi.
                Admin panelda «Telegram ulash kodi» beradi — shu kodni shu yerga kiriting.
              </div>
              <Field label="Admin bergan ulash kodi">
                <input value={tgInput} onChange={(e) => setTgInput(e.target.value)} placeholder="Masalan: MIR-A7K2Q9" style={sx(inputStyle)} autoComplete="off" />
              </Field>
              {tgErr && <div style={sx('font-size:13px;color:#DB3D6F')}>{tgErr}</div>}
              {tgMsg && <div style={sx('font-size:13px;color:#17A673')}>{tgMsg}</div>}
              <button type="button" onClick={connectTelegram} style={sx('align-self:flex-start;padding:11px 18px;border-radius:11px;border:none;background:#3D7DF6;color:#fff;font-size:13px;font-weight:800;cursor:pointer')}>
                Telegramni ulash
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard icon="users" title="Ota-ona bog‘lanishi" desc="Ota-ona telefoni — 5 daqiqalik haftalik maslahat uchun (ParentLink).">
          <div style={sx('display:flex;flex-direction:column;gap:12px')}>
            <Field label="Ota-ona telefoni">
              <input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+998 XX XXX XX XX"
                style={sx(inputStyle)}
                inputMode="tel"
              />
            </Field>
            {parentErr && <div style={sx('font-size:13px;color:#DB3D6F')}>{parentErr}</div>}
            {parentMsg && <div style={sx('font-size:13px;color:#17A673')}>{parentMsg}</div>}
            <button
              type="button"
              onClick={async () => {
                setParentErr(''); setParentMsg('');
                const phone = parentPhone.trim();
                if (phone.length < 9) { setParentErr('Telefon raqamini kiriting'); return; }
                try {
                  await createParentLink(phone);
                } catch { /* demo */ }
                const row = { id: Date.now(), phone, createdAt: new Date().toISOString() };
                const next = [row, ...parentLinks];
                setParentLinks(next);
                try { localStorage.setItem('mirae-parent-links', JSON.stringify(next)); } catch { /* ignore */ }
                setParentMsg('So‘rov saqlandi. Ota-ona tasdiqlagach bog‘lanadi.');
                setParentPhone('');
              }}
              style={sx('align-self:flex-start;padding:11px 18px;border-radius:11px;border:none;background:#3D7DF6;color:#fff;font-size:13px;font-weight:800;cursor:pointer')}
            >
              Bog‘lash
            </button>
            {parentLinks.length > 0 && (
              <div style={sx('margin-top:4px')}>
                {parentLinks.map((l) => (
                  <div key={l.id} style={sx('font-size:13px;color:var(--sub);padding:8px 0;border-top:1px solid var(--bd)')}>
                    {l.phone}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>


        {/* appearance */}
        <SectionCard icon="palette" title="Ko'rinish" desc="Mavzu, til va interfeys sozlamalari.">
          <div style={sx('font-size:12.5px;font-weight:700;color:var(--sub);margin-bottom:11px')}>Mavzu</div>
          <div className="theme-grid" style={sx('display:grid;grid-template-columns:repeat(3,1fr);gap:12px')}>
            {[
              { id: 'light', label: "Yorug'", icon: 'sun', prev: 'linear-gradient(135deg,#F3F7FF,#E9F1FF)', pbd: '#DCE8FA', ic: '#3D7DF6' },
              { id: 'dark', label: 'Tungi', icon: 'moon', prev: 'linear-gradient(135deg,#0F1728,#0B1220)', pbd: '#243449', ic: '#AFCBF9' },
              { id: 'system', label: 'Tizim', icon: 'monitor', prev: 'linear-gradient(135deg,#E9F1FF 0 50%,#0F1728 50% 100%)', pbd: 'var(--bd)', ic: '#7A5AF8' },
            ].map((t) => {
              const on = mode === t.id;
              return (
                <div key={t.id} onClick={() => setMode(t.id)} style={sx(`border:2px solid ${on ? '#3D7DF6' : 'var(--bd)'};border-radius:14px;padding:12px;cursor:pointer;background:var(--bg)`)}>
                  <div style={sx(`height:56px;border-radius:9px;background:${t.prev};border:1px solid ${t.pbd};display:flex;align-items:center;justify-content:center`)}><Icon name={t.icon} size={22} color={t.ic} /></div>
                  <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-top:10px')}>
                    <span style={sx('font-weight:700;font-size:13.5px;color:var(--tx)')}>{t.label}</span>
                    {on && <Icon name="check" size={15} color="#3D7DF6" strokeWidth={2.4} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={sx('font-size:11px;color:var(--sub);margin-top:10px')}>“Tizim” tanlansa, mavzu qurilmangiz sozlamasiga qarab avtomatik o‘zgaradi{mode === 'system' ? ` (hozir: ${dark ? 'tungi' : 'yorug‘'})` : ''}.</div>

          <div style={sx('height:1px;background:var(--bd);margin:20px 0')} />
          <div style={sx('font-size:12.5px;font-weight:700;color:var(--sub);margin-bottom:11px')}>Til</div>
          <div style={sx('display:inline-flex;gap:4px;background:var(--soft);border:1px solid var(--bd);border-radius:12px;padding:4px')}>
            {[['uz', "O'zbek"], ['ru', 'Русский'], ['en', 'English']].map(([id, label]) => (
              <button key={id} onClick={() => setLang(id)} style={sx(`padding:8px 15px;border-radius:9px;border:none;font-size:13px;font-weight:700;cursor:pointer;background:${lang === id ? 'var(--card)' : 'transparent'};color:${lang === id ? '#3D7DF6' : 'var(--sub)'};box-shadow:${lang === id ? 'var(--shadow)' : 'none'}`)}>{label}</button>
            ))}
          </div>

          <div style={sx('height:1px;background:var(--bd);margin:20px 0')} />
          {[['Animatsiyani kamaytirish', 'Harakatlarni minimallashtirish', reduceMotion, () => setReduceMotion((v) => !v)],
            ["Ixcham ko'rinish", "Ro'yxatlarni zichroq ko'rsatish", compact, () => setCompact((v) => !v)]].map(([t, s, on, fn]) => (
            <div key={t} style={sx('display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 0')}>
              <div><div style={sx('font-weight:600;font-size:14px;color:var(--tx)')}>{t}</div><div style={sx('font-size:12px;color:var(--sub);margin-top:2px')}>{s}</div></div>
              <Toggle on={on} onClick={fn} />
            </div>
          ))}
          <div style={sx('font-size:11px;color:var(--sub);margin-top:10px')}>* Til va interfeys sozlamalari hozircha shu qurilmada saqlanadi.</div>
        </SectionCard>

        {/* security */}
        <SectionCard icon="lock" title="Xavfsizlik" desc="Parolni yangilang yoki hisobdan chiqing.">
          <div className="set-grid" style={sx('display:grid;grid-template-columns:1fr 1fr;gap:16px')}>
            <Field label="Joriy parol"><input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} style={sx(inputStyle)} /></Field>
            <Field label="Yangi parol"><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={sx(inputStyle)} /></Field>
          </div>
          {pwMsg && <div style={sx('margin-top:14px;font-size:13px;color:#17A673')}>{pwMsg}</div>}
          {pwErr && <div style={sx('margin-top:14px;font-size:13px;color:#DB3D6F')}>{pwErr}</div>}
          <div style={sx('display:flex;justify-content:flex-end;margin-top:16px')}>
            <button onClick={submitPasswordChange} disabled={savingPw} style={sx(`padding:11px 22px;border-radius:11px;border:none;background:${savingPw ? 'var(--track)' : '#3D7DF6'};color:#fff;font-size:13px;font-weight:700;cursor:pointer`)}>{savingPw ? 'Saqlanmoqda…' : "O'zgartirish"}</button>
          </div>

          <div style={sx('height:1px;background:var(--bd);margin:22px 0')} />
          <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap')}>
            <div style={sx('display:flex;align-items:center;gap:13px')}>
              <div style={sx('width:40px;height:40px;border-radius:12px;background:rgba(219,61,111,.1);display:flex;align-items:center;justify-content:center;flex:none')}><Icon name="logout" size={17} color="#DB3D6F" /></div>
              <div>
                <div style={sx('font-weight:700;font-size:14px;color:#DB3D6F')}>Hisobdan chiqish</div>
                <div style={sx('font-size:12px;color:var(--sub);margin-top:2px')}>Bu qurilmadan tizimdan chiqasiz.</div>
              </div>
            </div>
            <button onClick={() => navigate('/')} style={sx('padding:10px 18px;border-radius:11px;border:1px solid rgba(219,61,111,.3);background:rgba(219,61,111,.08);color:#DB3D6F;font-size:13px;font-weight:700;cursor:pointer')}>Chiqish</button>
          </div>
        </SectionCard>

        <SectionCard icon="bell" title="Bildirishnomalar" desc="Qaysi eslatmalar kelishini tanlang.">
          <div style={sx('display:flex;flex-direction:column;gap:14px')}>
            {[
              { k: 'hw', label: 'Uyga vazifa', desc: 'Yangi vazifa va muddat' },
              { k: 'test', label: 'Test natijasi', desc: 'Tekshiruv tugaganda' },
              { k: 'rank', label: 'Reyting', desc: 'O‘rin o‘zgarganda' },
              { k: 'admin', label: 'Admin xabari', desc: 'Adminga yozish javoblari' },
            ].map((row) => (
              <div key={row.k} style={sx('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
                <div>
                  <div style={sx('font-weight:700;font-size:14px;color:var(--tx)')}>{row.label}</div>
                  <div style={sx('font-size:12.5px;color:var(--sub)')}>{row.desc}</div>
                </div>
                <Toggle on={notif[row.k]} onClick={() => setNotif((n) => ({ ...n, [row.k]: !n[row.k] }))} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon="shield" title="Maxfiylik" desc="Profil ko‘rinishi.">
          <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
            <div>
              <div style={sx('font-weight:700;font-size:14px;color:var(--tx)')}>Reytingda ko‘rsatish</div>
              <div style={sx('font-size:12.5px;color:var(--sub)')}>Ism sinf reytingida chiqadi</div>
            </div>
            <Toggle on={showRank} onClick={() => setShowRank((v) => !v)} />
          </div>
        </SectionCard>

        <SectionCard icon="cap" title="Ilova haqida" desc="Mirae Maktab — o‘quvchi ilovasi.">
          <div style={sx('font-size:13.5px;color:var(--sub);line-height:1.55')}>
            Versiya 1.0.0 (demo). Fan, vazifa va testlar maktab tizimiga bog‘langan.
            O‘yin moduli uyga vazifa testlarini interaktiv topshirish uchun.
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
