import { useMemo, useState } from 'react';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { NOTIFICATIONS } from '../data/mock.js';

const KIND_META = {
  video: { icon: 'video', fg: '#2F6FED', bg: 'rgba(47,111,237,.12)' },
  assignment: { icon: 'clipboard', fg: '#DB8A17', bg: 'rgba(245,165,36,.16)' },
  payment: { icon: 'wallet', fg: '#17A673', bg: 'rgba(23,166,115,.12)' },
  rank: { icon: 'trophy', fg: '#7A5AF8', bg: 'rgba(122,90,248,.13)' },
  admin: { icon: 'send', fg: '#DB3D6F', bg: 'rgba(219,61,111,.12)' },
};

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
function dayLabel(iso) {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(iso)) / 864e5);
  if (diff <= 0) return 'Bugun';
  if (diff === 1) return 'Kecha';
  if (diff < 7) return `${diff} kun oldin`;
  return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
}
const timeStr = (iso) => new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

export default function Bildirishnomalar() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;
  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const readOne = (id) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));

  // group by relative day, preserving order (newest first)
  const groups = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(b.time) - new Date(a.time));
    const out = [];
    let cur = null;
    for (const n of sorted) {
      const label = dayLabel(n.time);
      if (!cur || cur.label !== label) { cur = { label, items: [] }; out.push(cur); }
      cur.items.push(n);
    }
    return out;
  }, [items]);

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader
        title="Bildirishnomalar"
        subtitle={unread ? `${unread} ta o'qilmagan bildirishnoma` : 'Barchasi o\u2019qilgan'}
        right={unread > 0 && (
          <button onClick={markAllRead} style={sx('font-size:12.5px;font-weight:600;color:#3D7DF6;background:rgba(61,125,246,.1);border:none;padding:8px 14px;border-radius:10px;cursor:pointer')}>
            Barchasini o'qilgan deb belgilash
          </button>
        )}
      />

      <div style={sx('max-width:680px')}>
        {groups.map((g) => (
          <div key={g.label} style={sx('margin-bottom:6px')}>
            {/* day marker */}
            <div style={sx('display:flex;align-items:center;gap:10px;margin:6px 0 10px')}>
              <span style={sx('font-size:12px;font-weight:800;color:var(--tx);background:var(--chip);padding:5px 12px;border-radius:99px')}>{g.label}</span>
              <span style={sx('flex:1;height:1px;background:var(--bd)')} />
            </div>

            {g.items.map((n) => {
              const meta = KIND_META[n.kind] || KIND_META.admin;
              return (
                <div key={n.id} onClick={() => readOne(n.id)} style={sx('display:flex;gap:14px;cursor:pointer')}>
                  {/* rail */}
                  <div style={sx('position:relative;width:40px;flex:none')}>
                    <span style={sx('position:absolute;left:19px;top:0;bottom:0;width:2px;background:var(--bd)')} />
                    <span style={sx(`position:absolute;left:8px;top:14px;width:24px;height:24px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${meta.bg};box-shadow:0 0 0 4px var(--bg)`)}>
                      <Icon name={meta.icon} size={13} color={meta.fg} />
                    </span>
                  </div>
                  {/* card */}
                  <div className="card-h" style={sx(`flex:1;min-width:0;margin-bottom:12px;background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:13px 16px;position:relative;transition:transform .15s,box-shadow .15s;border-left:3px solid ${n.read ? 'var(--bd)' : meta.fg}`)}>
                    <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:10px')}>
                      <div style={sx(`font-size:13.5px;color:var(--tx);font-weight:${n.read ? '600' : '800'}`)}>{n.title}</div>
                      <div style={sx('display:flex;align-items:center;gap:8px;flex:none')}>
                        <span style={sx('font-size:11px;color:var(--sub)')}>{timeStr(n.time)}</span>
                        {!n.read && <span style={sx(`width:8px;height:8px;border-radius:50%;background:${meta.fg}`)} />}
                      </div>
                    </div>
                    <div style={sx('font-size:12.5px;color:var(--sub);margin-top:4px;line-height:1.5')}>{n.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
