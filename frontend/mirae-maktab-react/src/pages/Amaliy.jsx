import { useState } from 'react';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { useSubject } from '../SubjectContext.jsx';
import { PRACTICAL_TASKS, SUBJECT_BY_ID, scoreColor } from '../data/mock.js';

const STATUS = {
  not_started: { label: 'Boshlanmagan', fg: 'var(--sub)', bg: 'var(--chip)' },
  in_progress: { label: 'Jarayonda', fg: '#DB8A17', bg: 'rgba(245,165,36,.16)' },
  submitted: { label: 'Tekshirilmoqda', fg: '#2F6FED', bg: 'rgba(47,111,237,.12)' },
  checked: { label: 'Tekshirildi', fg: '#17A673', bg: 'rgba(23,166,115,.12)' },
};

export default function Amaliy() {
  const { active } = useSubject();
  const [open, setOpen] = useState(null); // task being uploaded to
  const list = PRACTICAL_TASKS.filter((t) => t.subjectId === active.id);

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title="Amaliy mashg‘ulotlar" subtitle={`${active.name} — qog‘ozda ishlab, rasmini yuklang. AI yoki o‘qituvchi tekshiradi.`} />

      <div style={sx('display:flex;flex-direction:column;gap:12px;max-width:820px')}>
        {list.length === 0 && <div style={sx('text-align:center;padding:48px;color:var(--sub);font-size:13.5px')}>{active.name} bo‘yicha amaliy topshiriq yo‘q.</div>}
        {list.map((t) => {
          const st = STATUS[t.status];
          return (
            <div key={t.id} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px 18px')}>
              <div style={sx('display:flex;align-items:center;gap:14px;flex-wrap:wrap')}>
                <div style={sx(`width:44px;height:44px;border-radius:13px;background:${active.color}1f;display:flex;align-items:center;justify-content:center;flex:none`)}><Icon name="flask" size={20} color={active.color} /></div>
                <div style={sx('flex:1;min-width:180px')}>
                  <div style={sx('font-size:14.5px;font-weight:700;color:var(--tx)')}>{t.title}</div>
                  <div style={sx('font-size:12.5px;color:var(--sub);margin-top:2px')}>{t.topic} · {t.xp} XP · muddat: {new Date(t.deadline).toLocaleDateString('uz-UZ')}</div>
                </div>
                <span style={sx(`font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:99px;color:${st.fg};background:${st.bg}`)}>{st.label}</span>
                {t.status === 'checked'
                  ? <div className="statnum-sm" style={sx(`font-size:16px;font-weight:800;color:${scoreColor(t.score)};width:48px;text-align:right`)}>{t.score}%</div>
                  : <button onClick={() => setOpen(t)} style={sx('display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:11px;border:none;background:#3D7DF6;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer')}><Icon name="video" size={13} color="#fff" /> Yuklash</button>}
              </div>
            </div>
          );
        })}
      </div>

      {open && <UploadSheet task={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function UploadSheet({ task, onClose }) {
  const [files, setFiles] = useState([1, 2]); // mock photo slots
  const [sent, setSent] = useState(false);
  return (
    <div onClick={onClose} style={sx('position:fixed;inset:0;z-index:120;background:rgba(15,31,51,.5);display:flex;align-items:center;justify-content:center;padding:18px')}>
      <div onClick={(e) => e.stopPropagation()} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:22px;width:min(480px,100%)')}>
        <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px')}>
          <div style={sx('font-weight:800;font-size:16px;color:var(--tx)')}>{task.title}</div>
          <button onClick={onClose} style={sx('width:30px;height:30px;border-radius:8px;border:none;background:var(--soft);color:var(--sub);cursor:pointer')}>✕</button>
        </div>
        {sent ? (
          <div style={sx('text-align:center;padding:24px 0')}>
            <div style={sx('width:60px;height:60px;border-radius:50%;background:rgba(23,166,115,.14);display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}><Icon name="checkCircle" size={28} color="#17A673" /></div>
            <div style={sx('font-weight:800;font-size:17px;color:var(--tx)')}>Yuborildi!</div>
            <div style={sx('font-size:13px;color:var(--sub);margin-top:6px')}>Ishingiz tekshirilmoqda. Natija tayyor bo‘lganda bildirishnoma olasiz.</div>
          </div>
        ) : (
          <>
            <div style={sx('font-size:13px;color:var(--sub);margin-bottom:14px')}>Ishlangan qog‘oz rasmlarini qo‘shing (kamerada yoki galereyadan). Telegram bot orqali ham yuborish mumkin.</div>
            <div className="amaliy-meta" style={sx('display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px')}>
              {files.map((f) => (
                <div key={f} style={sx('position:relative;aspect-ratio:3/4;border-radius:12px;background:var(--soft);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center')}>
                  <Icon name="video" size={22} color="var(--sub)" />
                  <button onClick={() => setFiles((p) => p.filter((x) => x !== f))} style={sx('position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:7px;border:none;background:var(--card);color:#DB3D6F;cursor:pointer')}><Icon name="trash" size={12} color="#DB3D6F" /></button>
                </div>
              ))}
              <button onClick={() => setFiles((p) => [...p, Date.now()])} style={sx('aspect-ratio:3/4;border-radius:12px;border:1.5px dashed var(--bd);background:transparent;color:var(--sub);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px')}>
                <span style={sx('font-size:22px')}>+</span><span style={sx('font-size:11px;font-weight:600')}>Rasm</span>
              </button>
            </div>
            <button onClick={() => setSent(true)} disabled={!files.length} style={sx(`width:100%;padding:13px;border-radius:12px;border:none;font-weight:700;font-size:14px;cursor:${files.length ? 'pointer' : 'not-allowed'};background:${files.length ? '#3D7DF6' : 'var(--track)'};color:${files.length ? '#fff' : 'var(--sub)'}`)}>Yuborish ({files.length} ta rasm)</button>
          </>
        )}
      </div>
    </div>
  );
}
