import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import { KPI_KIT } from '../components/StatCard.jsx';
import Icon from '../components/Icon.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import { useWallet } from '../WalletContext.jsx';
import { useSubject } from '../SubjectContext.jsx';
import { COURSES, VIDEO_LESSONS, fmt, subjectIdOf } from '../data/mock.js';

export default function Darslar() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'video' ? 'video' : 'courses';
  const { active } = useSubject();
  const { hasPurchased, purchase } = useWallet();
  const [buy, setBuy] = useState(null);
  const [watching, setWatching] = useState(null);

  const courses = useMemo(
    () => COURSES.filter((c) => (c.subjectIds || [c.topicId]).includes(active.id)),
    [active.id]
  );
  const subjectVideos = useMemo(
    () => VIDEO_LESSONS.filter((v) => subjectIdOf(v.course) === active.id),
    [active.id]
  );

  const setTab = (id) => {
    const next = new URLSearchParams(params);
    if (id === 'video') next.set('tab', 'video');
    else next.delete('tab');
    setParams(next, { replace: true });
  };

  const owned = (v) => v.free || v.granted || hasPurchased(`video:${v.id}`);
  const confirmBuy = () => {
    const v = buy;
    const res = purchase({ key: `video:${v.id}`, amount: v.price, title: `Video dars: ${v.title}` });
    setBuy(null);
    if (res.ok) setWatching(v);
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader
        title="Darslar"
        subtitle={`${active.name} — kurslar va video darslar bir joyda.`}
      />

      <div
        className="seg-tabs"
        style={sx('display:inline-flex;gap:4px;background:var(--soft);border:1px solid var(--bd);border-radius:14px;padding:4px;margin-bottom:1.1rem;flex-wrap:wrap')}
      >
        {[
          { id: 'courses', label: 'Kurslar', icon: 'cap' },
          { id: 'video', label: 'Videodarslar', icon: 'video' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={sx(
              `display:inline-flex;align-items:center;gap:0.4rem;padding:0.55rem 0.95rem;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:0.85rem;background:${tab === t.id ? 'var(--card)' : 'transparent'};color:${tab === t.id ? 'var(--tx)' : 'var(--sub)'};box-shadow:${tab === t.id ? '0 4px 12px -6px rgba(20,40,80,.2)' : 'none'}`
            )}
          >
            <Icon name={t.icon} size={15} color={tab === t.id ? '#3D7DF6' : 'var(--sub)'} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'courses' && (
        <div className="courses-grid" style={sx('display:grid;grid-template-columns:repeat(2,1fr);gap:16px')}>
          {courses.length === 0 && (
            <div style={sx('grid-column:1/-1;padding:2rem;text-align:center;color:var(--sub);background:var(--card);border:1px solid var(--bd);border-radius:16px')}>
              Bu fan uchun kurs hali yo‘q.
            </div>
          )}
          {courses.map((c) => {
            const kit = KPI_KIT[c.kit] || { bg: 'rgba(61,125,246,.12)', fg: '#3D7DF6' };
            const topicCount = c.paragraphs.reduce((s, p) => s + p.topics.length, 0);
            const testCount = c.paragraphs.reduce((s, p) => s + p.topics.filter((t) => t.hasTest).length, 0);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/darslar/${c.id}`)}
                className="card-h"
                style={sx('text-align:left;background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px;cursor:pointer;display:flex;flex-direction:column;gap:14px')}
              >
                <div style={sx('display:flex;align-items:center;gap:14px')}>
                  <div style={sx(`width:50px;height:50px;border-radius:15px;background:${kit.bg};display:flex;align-items:center;justify-content:center;flex:none`)}>
                    <Icon name={c.icon || 'cap'} size={23} color={kit.fg} />
                  </div>
                  <div style={sx('flex:1;min-width:0')}>
                    <div style={sx('font-size:16px;font-weight:800;color:var(--tx)')}>{c.title}</div>
                    <div style={sx('font-size:12.5px;color:var(--sub);margin-top:2px')}>{c.teacher}</div>
                  </div>
                  <Icon name="chevronRight" size={18} color="var(--sub)" />
                </div>
                <div style={sx('display:flex;gap:8px;flex-wrap:wrap')}>
                  <span style={sx('font-size:11.5px;font-weight:700;color:var(--sub);background:var(--soft);border:1px solid var(--bd);padding:5px 11px;border-radius:99px')}>{c.paragraphs.length} bob</span>
                  <span style={sx('font-size:11.5px;font-weight:700;color:var(--sub);background:var(--soft);border:1px solid var(--bd);padding:5px 11px;border-radius:99px')}>{topicCount} mavzu</span>
                  <span style={sx('font-size:11.5px;font-weight:700;color:#3D7DF6;background:rgba(61,125,246,.1);border:1px solid rgba(61,125,246,.2);padding:5px 11px;border-radius:99px')}>{testCount} test</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'video' && (
        <>
          <div style={sx('font-size:0.875rem;color:var(--sub);margin-bottom:0.9rem;line-height:1.45')}>
            Dastlabki darslar bepul. Qolganlari sotib olinadi yoki guruh a’zolariga ochiladi.
          </div>
          <div className="videos-grid">
            {subjectVideos.length === 0 && (
              <div style={sx('grid-column:1/-1;padding:2rem;text-align:center;color:var(--sub);background:var(--card);border:1px solid var(--bd);border-radius:16px')}>
                Bu fan uchun video dars yo‘q.
              </div>
            )}
            {subjectVideos.map((v) => {
              const has = owned(v);
              return (
                <div key={v.id} className="card-h" style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;overflow:hidden;display:flex;flex-direction:column')}>
                  <div style={sx('aspect-ratio:1/1;background:linear-gradient(135deg,#2E6BE6,#4C7DF0);display:flex;align-items:center;justify-content:center;position:relative')}>
                    <div style={sx('width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.24);display:flex;align-items:center;justify-content:center')}>
                      <Icon name={has ? 'play' : 'lock'} size={19} color="#fff" />
                    </div>
                    <span style={sx('position:absolute;bottom:8px;right:10px;font-size:11px;font-weight:700;color:#fff;background:rgba(0,0,0,.35);padding:2px 8px;border-radius:99px')}>{v.minutes} daq</span>
                    {!has && (
                      <span style={sx('position:absolute;top:8px;left:10px;font-size:10.5px;font-weight:800;color:#fff;background:rgba(219,61,111,.9);padding:3px 8px;border-radius:99px')}>{fmt(v.price)} so‘m</span>
                    )}
                  </div>
                  <div style={sx('padding:13px;display:flex;flex-direction:column;gap:10px;flex:1')}>
                    <div style={sx('font-size:13.5px;font-weight:800;color:var(--tx);line-height:1.35')}>{v.title}</div>
                    <div style={sx('font-size:12px;color:var(--sub)')}>{v.course}</div>
                    <button
                      type="button"
                      onClick={() => (has ? setWatching(v) : setBuy(v))}
                      style={sx(`margin-top:auto;width:100%;padding:10px;border-radius:11px;border:none;font-weight:800;font-size:12.5px;cursor:pointer;background:${has ? '#3D7DF6' : 'var(--soft)'};color:${has ? '#fff' : 'var(--tx)'}`)}
                    >
                      {has ? 'Tomosha qilish' : 'Sotib olish'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {buy && (
        <PurchaseModal
          open
          onClose={() => setBuy(null)}
          onConfirm={confirmBuy}
          item={{ title: `Video: ${buy.title}`, price: buy.price, icon: 'video', note: `${buy.minutes} daqiqa`, confirmLabel: 'Sotib olish' }}
        />
      )}
      {watching && (
        <div role="dialog" onClick={() => setWatching(null)} style={sx('position:fixed;inset:0;z-index:80;background:rgba(10,15,30,.72);display:flex;align-items:center;justify-content:center;padding:1rem')}>
          <div onClick={(e) => e.stopPropagation()} style={sx('background:var(--card);border-radius:16px;padding:1rem;width:min(640px,96vw)')}>
            <div style={sx('display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem')}>
              <b style={sx('color:var(--tx)')}>{watching.title}</b>
              <button type="button" onClick={() => setWatching(null)} style={sx('border:none;background:var(--soft);border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:700')}>Yopish</button>
            </div>
            <div style={sx('aspect-ratio:16/9;border-radius:12px;background:#0f172a;display:flex;align-items:center;justify-content:center;color:#94a3b8')}>
              Video pleer (demo)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
