import { useState } from 'react';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import { useWallet } from '../WalletContext.jsx';
import { useSubject } from '../SubjectContext.jsx';
import { VIDEO_LESSONS, fmt, subjectIdOf } from '../data/mock.js';

export default function Videodarslar() {
  const { hasPurchased, purchase } = useWallet();
  const { active } = useSubject();
  const subjectVideos = VIDEO_LESSONS.filter((v) => subjectIdOf(v.course) === active.id);
  const [buy, setBuy] = useState(null);
  const [watching, setWatching] = useState(null);

  const owned = (v) => v.free || v.granted || hasPurchased(`video:${v.id}`);

  const confirmBuy = () => {
    const v = buy;
    const res = purchase({ key: `video:${v.id}`, amount: v.price, title: `Video dars: ${v.title}` });
    setBuy(null);
    if (res.ok) setWatching(v);
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title="Videodarslar" subtitle={`${active.name} — video darslar. Dastlabki darslar bepul, qolganlari sotib olinadi yoki guruh a\u2019zolariga ochiladi.`} />

      <div className="videos-grid">
        {subjectVideos.map((v) => {
          const has = owned(v);
          return (
            <div key={v.id} className="card-h" style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;transition:transform .15s,box-shadow .15s')}>
              <div style={sx('aspect-ratio:1/1;background:linear-gradient(135deg,#2E6BE6,#4C7DF0);display:flex;align-items:center;justify-content:center;position:relative')}>
                <div style={sx('width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.24);display:flex;align-items:center;justify-content:center')}>
                  <Icon name={has ? 'play' : 'lock'} size={19} color="#fff" />
                </div>
                <span style={sx('position:absolute;bottom:8px;right:10px;font-size:11px;font-weight:700;color:#fff;background:rgba(0,0,0,.35);padding:2px 8px;border-radius:99px')}>{v.minutes} daq</span>
                {!has && <span style={sx('position:absolute;top:8px;left:10px;font-size:10.5px;font-weight:800;color:#fff;background:rgba(219,61,111,.9);padding:3px 8px;border-radius:99px')}>{fmt(v.price)} so'm</span>}
              </div>
              <div style={sx('padding:13px;display:flex;flex-direction:column;gap:8px;flex:1')}>
                <div style={sx('font-size:11px;font-weight:700;color:#3D7DF6')}>{v.course}</div>
                <div style={sx('font-size:13.5px;font-weight:700;color:var(--tx);line-height:1.35;flex:1')}>{v.title}</div>
                {has ? (
                  <button onClick={() => setWatching(v)} style={sx('display:flex;align-items:center;justify-content:center;gap:7px;padding:9px;border-radius:10px;border:1px solid var(--bd);background:var(--soft);color:var(--tx);font-size:12.5px;font-weight:700;cursor:pointer')}>
                    <Icon name="play" size={13} /> Ko'rish
                  </button>
                ) : (
                  <button onClick={() => setBuy(v)} style={sx('display:flex;align-items:center;justify-content:center;gap:7px;padding:9px;border-radius:10px;border:none;background:linear-gradient(135deg,#3D7DF6,#4C7DF0);color:#fff;font-size:12.5px;font-weight:700;cursor:pointer')}>
                    <Icon name="lock" size={13} color="#fff" /> Sotib olish
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {subjectVideos.length === 0 && (
        <div style={sx('text-align:center;padding:48px 20px;color:var(--sub);font-size:13.5px')}>{active.name} bo‘yicha video dars hozircha qo‘shilmagan.</div>
      )}

      <PurchaseModal
        open={!!buy}
        item={buy && { title: buy.title, price: buy.price, icon: 'video', note: `${buy.course} · ${buy.minutes} daqiqa · doimiy ochiq`, confirmLabel: 'Sotib olish' }}
        onConfirm={confirmBuy}
        onClose={() => setBuy(null)}
      />

      {watching && (
        <div style={sx('position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(15,31,51,.6);padding:20px')} onClick={() => setWatching(null)}>
          <div onClick={(e) => e.stopPropagation()} style={sx('background:#000;border-radius:16px;overflow:hidden;width:min(760px,100%);aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;position:relative')}>
            <div style={sx('color:#fff;text-align:center')}>
              <Icon name="play" size={36} color="#fff" />
              <div style={sx('margin-top:10px;font-size:13px;color:rgba(255,255,255,.7)')}>{watching.title}</div>
            </div>
            <div onClick={() => setWatching(null)} style={sx('position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;font-size:15px')}>✕</div>
          </div>
        </div>
      )}
    </div>
  );
}
