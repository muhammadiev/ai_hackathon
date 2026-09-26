import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { SUBJECTS, DTM_MANDATORY, DTM_BLOCKS, DTM_RESULTS, scoreColor } from '../data/mock.js';

const FIELD_INFO = {
  't3': ['Muhandislik', 'Arxitektura', 'Energetika'],
  't6': ['Dasturiy injiniring', 'Sun\u2019iy intellekt', 'Kiberxavfsizlik'],
  't1': ['Iqtisodiyot', 'Bank ishi', 'Statistika'],
};

export default function DTM() {
  const navigate = useNavigate();
  const [pick, setPick] = useState(null);       // field popup open
  const [primary, setPrimary] = useState('t1');
  const [secondary, setSecondary] = useState('t3');

  const start = () => {
    const mix = [{ topicId: primary, count: DTM_BLOCKS.primary.q }, { topicId: secondary, count: DTM_BLOCKS.secondary.q }];
    DTM_MANDATORY.forEach((m) => mix.push({ topicId: m.id, count: m.q }));
    navigate('/test/jarayon', { state: { preset: { size: 90, price: 0, mix, timeLimitMinutes: 180 }, from: 'DTM sinov imtihoni' } });
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title="DTM" subtitle="Universitetga kirish imtihoni simulyatsiyasi (90 savol, 3 soat)." />

      {/* start card */}
      <div style={sx('position:relative;overflow:hidden;border-radius:22px;padding:28px;background:linear-gradient(120deg,#2E6BE6,#3D7DF6 55%,#7A5AF8);color:#fff;margin-bottom:20px')}>
        <div style={sx('position:absolute;top:-40px;right:20px;width:170px;height:170px;border-radius:50%;background:rgba(255,255,255,.08)')} />
        <div style={sx('position:relative;max-width:560px')}>
          <div style={sx('font-size:24px;font-weight:800')}>DTM testni boshlash</div>
          <div style={sx('font-size:14px;color:rgba(255,255,255,.85);margin:8px 0 18px;line-height:1.6')}>
            Birlamchi fan (30) + ikkilamchi fan (30) + Ona tili, Matematika, Tarix (10 tadan). Jami 90 savol, maksimal 189 ball. Vaqt cheklovi bor.
          </div>
          <button onClick={() => setPick(true)} style={sx('display:inline-flex;align-items:center;gap:8px;background:#fff;color:#2E6BE6;border:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px;cursor:pointer')}>
            <Icon name="play" size={15} color="#2E6BE6" /> Boshlash
          </button>
        </div>
      </div>

      {/* results */}
      <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px;max-width:820px')}>
        <div style={sx('font-weight:700;font-size:15px;color:var(--tx);margin-bottom:14px')}>DTM natijalari</div>
        <div style={sx('display:flex;flex-direction:column;gap:10px')}>
          {DTM_RESULTS.map((r) => {
            const pct = Math.round(r.total / r.max * 100);
            return (
              <div key={r.id} style={sx('display:flex;align-items:center;gap:14px;padding:12px 14px;border:1px solid var(--bd);border-radius:12px')}>
                <div style={sx('flex:1;min-width:0')}>
                  <div style={sx('font-size:14px;font-weight:700;color:var(--tx)')}>{r.primary} + {r.secondary}</div>
                  <div style={sx('font-size:12px;color:var(--sub)')}>{new Date(r.date).toLocaleDateString('uz-UZ')}</div>
                </div>
                <div style={sx('text-align:right')}>
                  <div className="statnum-sm" style={sx(`font-size:17px;font-weight:800;color:${scoreColor(pct)}`)}>{r.total}</div>
                  <div style={sx('font-size:11px;color:var(--sub)')}>/ {r.max} ball</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {pick && (
        <div onClick={() => setPick(null)} style={sx('position:fixed;inset:0;z-index:120;background:rgba(15,31,51,.5);display:flex;align-items:center;justify-content:center;padding:18px')}>
          <div onClick={(e) => e.stopPropagation()} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:24px;width:min(520px,100%);max-height:90vh;overflow:auto')}>
            <div style={sx('font-weight:800;font-size:18px;color:var(--tx);margin-bottom:4px')}>Yo‘nalishni tanlang</div>
            <div style={sx('font-size:13px;color:var(--sub);margin-bottom:16px')}>Birlamchi va ikkilamchi fanni belgilang. Ona tili, Matematika va Tarix avtomatik qo‘shiladi.</div>

            {[['Birlamchi fan', primary, setPrimary], ['Ikkilamchi fan', secondary, setSecondary]].map(([lbl, val, set]) => (
              <div key={lbl} style={sx('margin-bottom:14px')}>
                <div style={sx('font-size:12px;font-weight:700;color:var(--sub);margin-bottom:7px')}>{lbl}</div>
                <div style={sx('display:flex;gap:8px;flex-wrap:wrap')}>
                  {SUBJECTS.map((s) => (
                    <button key={s.id} onClick={() => set(s.id)} style={sx(`padding:8px 13px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid ${val === s.id ? s.color : 'var(--bd)'};background:${val === s.id ? s.color + '18' : 'var(--card)'};color:${val === s.id ? s.color : 'var(--sub)'}`)}>{s.name}</button>
                  ))}
                </div>
              </div>
            ))}

            <div style={sx('background:var(--soft);border:1px solid var(--bd);border-radius:12px;padding:13px;margin:8px 0 18px')}>
              <div style={sx('font-size:12px;font-weight:700;color:var(--tx);margin-bottom:6px')}>Bu kombinatsiya qaysi yo‘nalishlarga olib boradi:</div>
              <div style={sx('display:flex;gap:7px;flex-wrap:wrap')}>
                {(FIELD_INFO[secondary] || FIELD_INFO.t3).map((f) => (
                  <span key={f} style={sx('font-size:12px;color:#3D7DF6;background:rgba(61,125,246,.1);padding:5px 11px;border-radius:99px')}>{f}</span>
                ))}
              </div>
              <div style={sx('font-size:11px;color:var(--sub);margin-top:8px')}>* Admin kiritgan yo‘nalishlar katalogi asosida.</div>
            </div>

            <button onClick={start} style={sx('width:100%;padding:13px;border-radius:12px;border:none;background:#3D7DF6;color:#fff;font-weight:700;font-size:14.5px;cursor:pointer')}>Tasdiqlash va boshlash</button>
          </div>
        </div>
      )}
    </div>
  );
}
