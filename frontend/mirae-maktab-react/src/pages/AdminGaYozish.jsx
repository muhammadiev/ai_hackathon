import { useEffect, useRef, useState } from 'react';
import { sx } from '../utils/sx.js';
import Icon from '../components/Icon.jsx';

const SEED = [
  { id: 'm1', from: 'admin', text: 'Assalomu alaykum! Mirae qo‘llab-quvvatlash xizmatiga xush kelibsiz. Sizga qanday yordam bera olamiz?', time: '2026-09-12T10:00:00' },
  { id: 'm2', from: 'me', text: "To'lov qaytarilishi haqida savolim bor edi.", time: '2026-09-12T10:05:00' },
  { id: 'm3', from: 'admin', text: "So'rovingiz ko'rib chiqildi, mablag' 24 soat ichida qaytariladi.", time: '2026-09-12T10:22:00' },
];
const QUICK = ["To'lov bo'yicha", 'Texnik muammo', 'Dars/video', 'Boshqa savol'];
const REPLIES = [
  'Rahmat! So‘rovingizni qabul qildik, tez orada javob beramiz.',
  'Aniqlashtirib beraman — biroz kuting, iltimos.',
  'Ma‘lumot uchun rahmat. Administrator ko‘rib chiqmoqda.',
];

/** Admin social accounts — open in new tab */
const ADMIN_SOCIALS = [
  {
    id: 'tg',
    label: 'Telegram',
    handle: '@mirae_support',
    url: 'https://t.me/mirae_support',
    icon: 'telegram',
    fg: '#2AABEE',
    bg: 'rgba(42,171,238,.12)',
  },
  {
    id: 'ig',
    label: 'Instagram',
    handle: '@mirae.edu',
    url: 'https://instagram.com/mirae.edu',
    icon: 'instagram',
    fg: '#E1306C',
    bg: 'rgba(225,48,108,.12)',
  },
  {
    id: 'fb',
    label: 'Facebook',
    handle: 'Mirae Education',
    url: 'https://facebook.com/mirae.edu',
    icon: 'facebook',
    fg: '#1877F2',
    bg: 'rgba(24,119,242,.12)',
  },
];

const timeStr = (iso) => new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
function dayLabel(iso) {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(iso)) / 864e5);
  if (diff <= 0) return 'Bugun';
  if (diff === 1) return 'Kecha';
  return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
}

export default function AdminGaYozish() {
  const [messages, setMessages] = useState(SEED);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const scroller = useRef(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = (preset) => {
    const t = (preset ?? text).trim();
    if (!t) return;
    setMessages((prev) => [...prev, { id: `me${Date.now()}`, from: 'me', text: t, time: new Date().toISOString(), read: false }]);
    if (!preset) setText('');
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) =>
        prev
          .map((m) => (m.from === 'me' ? { ...m, read: true } : m))
          .concat({
            id: `ad${Date.now()}`,
            from: 'admin',
            text: REPLIES[Math.floor(Math.random() * REPLIES.length)],
            time: new Date().toISOString(),
          })
      );
      setTyping(false);
    }, 1300);
  };
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const rows = [];
  let lastDay = null;
  messages.forEach((m) => {
    const dl = dayLabel(m.time);
    if (dl !== lastDay) {
      rows.push({ sep: dl, id: `s-${dl}-${m.id}` });
      lastDay = dl;
    }
    rows.push(m);
  });

  return (
    <div
      className="chat-page"
      style={sx(
        'padding:16px 20px 20px;display:flex;flex-direction:column;height:calc(100vh - 72px);max-height:calc(100dvh - 72px);box-sizing:border-box'
      )}
    >
      {/* Outer shell: constrained height so the page itself does not scroll.
          Messages area scrolls internally; header + socials + composer stay pinned. */}
      <div
        style={sx(
          'display:flex;flex-direction:column;flex:1;min-height:0;max-width:780px;width:100%;margin:0 auto;background:var(--card);border:1px solid var(--bd);border-radius:18px;overflow:hidden;box-shadow:var(--shadow)'
        )}
      >
        {/* Header */}
        <div style={sx('display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--bd);background:var(--card);flex:none')}>
          <div style={sx('position:relative;flex:none')}>
            <div
              style={sx(
                'width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px'
              )}
            >
              M
            </div>
            <span
              style={sx(
                'position:absolute;right:-2px;bottom:-2px;width:12px;height:12px;border-radius:50%;background:#17A673;border:2.5px solid var(--card)'
              )}
            />
          </div>
          <div style={sx('flex:1;min-width:0')}>
            <div style={sx('font-size:15px;font-weight:800;color:var(--tx)')}>Administrator</div>
            <div style={sx('font-size:12px;color:var(--sub);margin-top:1px')}>Onlayn · odatda 5 daqiqada javob beradi</div>
          </div>
        </div>

        {/* Admin social accounts — quick access without leaving chat */}
        <div
          style={sx(
            'display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid var(--bd);background:var(--soft);flex:none;flex-wrap:wrap'
          )}
        >
          {ADMIN_SOCIALS.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              title={`${s.label}: ${s.handle}`}
              style={sx(
                `display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:99px;background:var(--card);border:1px solid var(--bd);text-decoration:none;color:var(--tx);font-size:12.5px;font-weight:600;transition:border-color .15s,box-shadow .15s`
              )}
              className="admin-social"
            >
              <span
                style={sx(
                  `width:26px;height:26px;border-radius:8px;background:${s.bg};display:flex;align-items:center;justify-content:center;flex:none`
                )}
              >
                <Icon name={s.icon} size={14} color={s.fg} strokeWidth={2} />
              </span>
              <span style={sx('white-space:nowrap')}>{s.label}</span>
              <span style={sx('color:var(--sub);font-weight:500;font-size:11.5px')}>{s.handle}</span>
            </a>
          ))}
        </div>

        {/* Messages — only this region scrolls */}
        <div
          ref={scroller}
          className="noscroll"
          style={sx(
            'flex:1;min-height:0;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:10px;background:var(--soft)'
          )}
        >
          {rows.map((r) =>
            r.sep ? (
              <div
                key={r.id}
                style={sx(
                  'align-self:center;font-size:11px;font-weight:700;color:var(--sub);background:var(--card);border:1px solid var(--bd);padding:4px 12px;border-radius:99px;margin:4px 0'
                )}
              >
                {r.sep}
              </div>
            ) : (
              <div
                key={r.id}
                style={sx(
                  `display:flex;align-items:flex-end;gap:8px;${r.from === 'me' ? 'flex-direction:row-reverse' : ''}`
                )}
              >
                {r.from === 'admin' && (
                  <div
                    style={sx(
                      'width:28px;height:28px;border-radius:9px;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px;flex:none'
                    )}
                  >
                    M
                  </div>
                )}
                <div
                  style={sx(
                    `max-width:74%;padding:10px 14px;font-size:13.5px;line-height:1.5;border-radius:16px;${
                      r.from === 'me'
                        ? 'background:linear-gradient(135deg,#3D7DF6,#4C7DF0);color:#fff;border-bottom-right-radius:5px'
                        : 'background:var(--card);color:var(--tx);border:1px solid var(--bd);border-bottom-left-radius:5px'
                    }`
                  )}
                >
                  {r.text}
                  <div
                    style={sx(
                      `display:flex;align-items:center;gap:4px;justify-content:flex-end;font-size:10px;margin-top:4px;${
                        r.from === 'me' ? 'color:rgba(255,255,255,.8)' : 'color:var(--sub)'
                      }`
                    )}
                  >
                    {timeStr(r.time)}
                    {r.from === 'me' && (
                      <span style={sx('font-weight:800;letter-spacing:-2px')}>{r.read ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
          {typing && (
            <div style={sx('display:flex;align-items:flex-end;gap:8px')}>
              <div
                style={sx(
                  'width:28px;height:28px;border-radius:9px;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px;flex:none'
                )}
              >
                M
              </div>
              <div
                style={sx(
                  'padding:12px 16px;border-radius:16px;border-bottom-left-radius:5px;background:var(--card);border:1px solid var(--bd);display:flex;gap:4px'
                )}
              >
                <Dot />
                <Dot d=".15s" />
                <Dot d=".3s" />
              </div>
            </div>
          )}
        </div>

        {/* Quick topics (only near the start of a thread) */}
        {messages.length <= 3 && (
          <div style={sx('display:flex;gap:8px;padding:10px 14px 0;flex-wrap:wrap;flex:none')}>
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                style={sx(
                  'font-size:12.5px;font-weight:600;color:#3D7DF6;background:rgba(61,125,246,.10);border:1px solid rgba(61,125,246,.22);border-radius:99px;padding:7px 13px;cursor:pointer'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Composer — always visible at the bottom of the card */}
        <div
          style={sx(
            'display:flex;align-items:flex-end;gap:8px;padding:12px 14px;border-top:1px solid var(--bd);background:var(--card);flex:none'
          )}
        >
          <button
            aria-label="Fayl biriktirish"
            style={sx(
              'width:42px;height:42px;border-radius:12px;border:1px solid var(--bd);background:var(--soft);color:var(--sub);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none'
            )}
          >
            <Icon name="paperclip" size={17} color="var(--sub)" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Xabar yozing..."
            style={sx(
              'flex:1;resize:none;max-height:100px;padding:11px 14px;border:1px solid var(--bd);border-radius:14px;background:var(--field);color:var(--tx);font-size:13.5px;font-family:inherit;line-height:1.4'
            )}
          />
          <button
            onClick={() => send()}
            disabled={!text.trim()}
            aria-label="Yuborish"
            style={sx(
              `width:44px;height:44px;border-radius:13px;border:none;flex:none;display:flex;align-items:center;justify-content:center;cursor:${
                text.trim() ? 'pointer' : 'not-allowed'
              };background:${text.trim() ? 'linear-gradient(135deg,#3D7DF6,#4C7DF0)' : 'var(--track)'}`
            )}
          >
            <Icon name="send" size={17} color={text.trim() ? '#fff' : 'var(--sub)'} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Dot({ d = '0s' }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: 'var(--sub)',
        display: 'inline-block',
        animation: `floaty 1s ease-in-out infinite ${d}`,
      }}
    />
  );
}
