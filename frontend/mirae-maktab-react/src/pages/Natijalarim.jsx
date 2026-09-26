import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Ring from '../components/Ring.jsx';
import Icon from '../components/Icon.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import { useWallet } from '../WalletContext.jsx';
import { useSubject } from '../SubjectContext.jsx';
import { useI18n } from '../I18nContext.jsx';
import {
  RESULTS,
  AVERAGE_SCORE,
  TOPICS,
  TEST_PRESETS,
  USER,
  fmt,
  scoreColor,
  buildResultReview,
  subjectIdOf,
} from '../data/mock.js';

const PAGE_SIZE = 8;

export default function Natijalarim() {
  const navigate = useNavigate();
  const { purchase } = useWallet();
  const { active } = useSubject();
  const [buyPreset, setBuyPreset] = useState(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const subjectResults = useMemo(() => RESULTS.filter((r) => subjectIdOf(r.course) === active.id), [active.id]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return subjectResults;
    return subjectResults.filter((r) => r.type === typeFilter);
  }, [typeFilter, subjectResults]);

  const rows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, filtered]
  );

  const subjAvg = subjectResults.length ? Math.round(subjectResults.reduce((a, r) => a + r.pct, 0) / subjectResults.length) : 0;
  const best = subjectResults.length ? Math.max(...subjectResults.map((r) => r.pct)) : 0;
  const totalQuestions = subjectResults.reduce((a, r) => a + r.size, 0);
  const totalCorrect = subjectResults.reduce((a, r) => a + r.correct, 0);

  const { t, lang } = useI18n();
  const [confirmPreset, setConfirmPreset] = useState(null);

  const buildSubjectPreset = (preset) => ({
    ...preset,
    pedagogika: 0,
    type: 'Tasodifiy test',
    subject: active.name,
    subjectId: active.id,
    mix: [{ topicId: active.id, count: preset.size || 30 }],
  });

  const startRandom = (preset) => {
    // Always confirm subject before generating
    setConfirmPreset(buildSubjectPreset(preset));
  };

  const confirmStart = () => {
    const p = confirmPreset;
    setConfirmPreset(null);
    if (!p) return;
    if ((p.price || 0) > 0) { setBuyPreset(p); return; }
    navigate('/test/jarayon', {
      state: {
        preset: p,
        from: `${active.name} — ${p.size} savol`,
      },
    });
  };
  const confirmBuy = () => {
    const p = buyPreset; setBuyPreset(null);
    const res = purchase({ amount: p.price, title: p.title || `${p.size} savollik test` });
    if (res.ok) navigate('/test/jarayon', { state: { preset: { ...p, type: 'Tasodifiy test' } } });
  };

  return (
    <div className="page-wide page-test" style={sx('padding:1.5rem 1.75rem 2.5rem;max-width:none;width:100%;margin:0;box-sizing:border-box')}>
      <PageHeader
        title="Test"
        subtitle={`${active.name} — testlar, natijalar statistikasi va to\u2019liq tarix.`}
      />

      {/* ===== Random test launcher (same spirit as Bosh sahifa) ===== */}
      <div
        style={sx(
          'background:linear-gradient(135deg,rgba(61,125,246,.12),rgba(76,125,240,.08));border:1px solid rgba(61,125,246,.25);border-radius:20px;padding:22px;margin-bottom:22px'
        )}
      >
        <div style={sx('display:flex;align-items:center;gap:10px;margin-bottom:14px')}>
          <Icon name="target" size={22} />
          <div style={sx('font-family:Inter;font-weight:800;font-size:17px;color:var(--tx)')}>
            Yangi tasodifiy test boshlash
          </div>
        </div>
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px')}>
          {TEST_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => startRandom(p)}
              style={sx(
                'text-align:left;background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;cursor:pointer;transition:transform .15s,box-shadow .15s'
              )}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 24px -12px rgba(61,125,246,.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div style={sx('font-family:Inter;font-weight:700;font-size:15px;color:var(--tx);margin-bottom:4px')}>
                {p.title || `${p.size} savollik test`}
              </div>
              <div style={sx('font-size:12.5px;color:var(--sub);margin-bottom:10px')}>
                {active.name} fanidan
              </div>
              <div style={sx('display:flex;justify-content:space-between;align-items:center')}>
                <span style={sx('font-size:13px;font-weight:700;color:#3D7DF6')}>
                  {(p.price || 0) > 0 ? `${fmt(p.price)} so‘m` : 'Bepul'}
                </span>
                <span
                  style={sx(
                    'font-size:12px;font-weight:700;padding:5px 12px;border-radius:99px;background:linear-gradient(135deg,#3D7DF6,#4C7DF0);color:#fff'
                  )}
                >
                  Boshlash →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ===== KPI row ===== */}
      <div className="natija-kpi" style={sx('display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px')}>
        <StatCard icon="target" kit="purple" label="O'rtacha natija" value={`${subjAvg}%`} sub={`${subjectResults.length} ta test`} />
        <StatCard icon="trophy" kit="amber" label="Eng yaxshi natija" value={`${best}%`} />
        <StatCard icon="checkCircle" kit="blue" label="Jami to'g'ri javoblar" value={totalCorrect} unit={`/ ${totalQuestions}`} />
        <StatCard icon="layers" kit="green" label="Jami testlar" value={subjectResults.length} />
      </div>

      {/* ===== Ring + readiness ===== */}
      <div style={sx('display:grid;grid-template-columns:1fr 1.5fr;gap:16px;margin-bottom:20px')}>
        <div
          style={sx(
            'background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px;display:flex;align-items:center;gap:20px'
          )}
        >
          <Ring percent={subjAvg} size={92} stroke={9} color={active.color}>
            <div style={sx('text-align:center')}>
              <div className="statnum" style={sx(`font-size:20px;color:${active.color}`)}>
                {subjAvg}%
              </div>
              <div style={sx('font-size:10.5px;color:var(--sub)')}>o'rtacha</div>
            </div>
          </Ring>
          <div style={sx('font-size:13px;color:var(--sub);line-height:1.6')}>
            Barcha turdagi testlar (tasodifiy, vazifa, bilet) hisobga olingan holda hisoblangan umumiy o'rtacha natija.
            Har bir testning to'liq javoblari saqlanadi.
          </div>
        </div>

        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px')}>
          <div style={sx("font-family:Inter;font-weight:700;font-size:14.5px;color:var(--tx);margin-bottom:14px")}>
            {active.name} — mavzular bo'yicha tayyorlik
          </div>
          <div style={sx('display:flex;flex-direction:column;gap:11px')}>
            {active.topics.map((t) => {
              const pct = t.total ? Math.round((t.solved / t.total) * 100) : 0;
              return (
                <div key={t.name}>
                  <div style={sx('display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px')}>
                    <span style={sx('color:var(--tx);font-weight:500')}>{t.name}</span>
                    <span style={sx(`font-weight:700;color:${scoreColor(pct)}`)}>{pct}%</span>
                  </div>
                  <div style={sx('height:6px;border-radius:99px;background:var(--track);overflow:hidden')}>
                    <div style={sx(`height:100%;width:${pct}%;background:${scoreColor(pct)};border-radius:99px`)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Results table ===== */}
      <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px')}>
        <div style={sx('display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px')}>
          <div style={sx('font-family:Inter;font-weight:700;font-size:15px;color:var(--tx)')}>
            Barcha natijalar
          </div>
          <div style={sx('display:flex;gap:6px;flex-wrap:wrap')}>
            {['all', 'Tasodifiy test', 'Vazifa', 'Bilet'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t);
                  setPage(1);
                }}
                style={sx(
                  `padding:6px 12px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid ${
                    typeFilter === t ? '#3D7DF6' : 'var(--bd)'
                  };background:${typeFilter === t ? 'var(--chip)' : 'transparent'};color:${
                    typeFilter === t ? '#3D7DF6' : 'var(--sub)'
                  }`
                )}
              >
                {t === 'all' ? 'Barchasi' : t}
              </button>
            ))}
          </div>
        </div>

        <div style={sx('overflow-x:auto')}>
          <table style={sx('width:100%;border-collapse:collapse;font-size:13px;min-width:660px')}>
            <thead>
              <tr style={sx('text-align:left;color:var(--sub);font-size:11.5px')}>
                <th style={sx('padding:8px')}>Turi</th>
                <th style={sx('padding:8px')}>Fan</th>
                <th style={sx('padding:8px')}>Savollar</th>
                <th style={sx('padding:8px')}>Vaqt</th>
                <th style={sx('padding:8px')}>Sana</th>
                <th style={sx('padding:8px;text-align:right')}>Natija</th>
                <th style={sx('padding:8px;text-align:center')}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const openReview = () =>
                  navigate('/test/natija', {
                    state: {
                      review: buildResultReview(r),
                      summary: { total: r.size, correct: r.correct, pct: r.pct, duration: r.duration, type: r.type, course: r.course, date: r.date },
                    },
                  });
                return (
                  <tr key={r.id} className="rrow" style={sx('border-top:1px solid var(--bd)')}>
                    <td style={sx('padding:11px 8px;color:var(--tx)')}>{r.type}</td>
                    <td style={sx('padding:11px 8px;color:var(--sub)')}>{r.course}</td>
                    <td style={sx('padding:11px 8px')}>{r.correct}/{r.size}</td>
                    <td style={sx('padding:11px 8px;color:var(--sub)')}>{r.duration}</td>
                    <td style={sx('padding:11px 8px;color:var(--sub)')}>{new Date(r.date).toLocaleDateString('uz-UZ')}</td>
                    <td style={sx(`padding:11px 8px;text-align:right;font-weight:700;color:${scoreColor(r.pct)}`)}>{r.pct}%</td>
                    <td style={sx('padding:8px;text-align:center')}>
                      <button
                        onClick={openReview}
                        title="To'liq natijani ko'rish — tanlagan javobingiz, to'g'ri javob va yechim"
                        aria-label="To'liq natijani ko'rish"
                        style={sx('width:34px;height:34px;border-radius:10px;border:1px solid var(--bd);background:var(--soft);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#3D7DF6')}
                      >
                        <Icon name="eye" size={16} color="#3D7DF6" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} style={sx('padding:36px 8px;text-align:center;color:var(--sub);font-size:13px')}>{active.name} bo‘yicha hali natija yo‘q. Birinchi testni boshlang!</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div style={sx('display:flex;justify-content:center;gap:8px;margin-top:18px')}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={sx(
              `padding:8px 14px;border-radius:10px;border:1px solid var(--bd);background:var(--card);cursor:${
                page <= 1 ? 'not-allowed' : 'pointer'
              };opacity:${page <= 1 ? 0.5 : 1}`
            )}
          >
            ←
          </button>
          <span style={sx('padding:8px 12px;font-size:13px;color:var(--sub)')}>
            {page} / {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          </span>
          <button
            disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)}
            onClick={() => setPage((p) => p + 1)}
            style={sx(
              `padding:8px 14px;border-radius:10px;border:1px solid var(--bd);background:var(--card);cursor:${
                page >= Math.ceil(filtered.length / PAGE_SIZE) ? 'not-allowed' : 'pointer'
              };opacity:${page >= Math.ceil(filtered.length / PAGE_SIZE) ? 0.5 : 1}`
            )}
          >
            →
          </button>
        </div>
      </div>
      
      {/* Ready confirmation — subject + count */}
      {confirmPreset && (
        <div
          role="dialog"
          onClick={() => setConfirmPreset(null)}
          style={sx('position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:1rem')}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.15rem;padding:1.35rem 1.25rem;width:min(22rem,100%);box-shadow:0 1.5rem 3rem -1rem rgba(15,23,42,.35)')}
          >
            <div style={sx('font-weight:800;font-size:1.15rem;color:var(--tx);margin-bottom:0.5rem')}>
              {t('test.readyTitle') || 'Tayyormisiz?'}
            </div>
            <p style={sx('font-size:0.9rem;color:var(--sub);line-height:1.5;margin:0 0 1rem')}>
              {(t('test.readyBody') || '{n} ta savol «{subject}» fanidan tanlanadi. Fan to\'g\'ri tanlanganiga ishonchingiz komilmi?')
                .replace('{n}', String(confirmPreset.size))
                .replace('{subject}', active.name)}
            </p>
            <div style={sx('display:flex;gap:0.6rem')}>
              <button
                type="button"
                onClick={() => setConfirmPreset(null)}
                style={sx('flex:1;padding:0.75rem;border-radius:0.75rem;border:1px solid var(--bd);background:var(--soft);font-weight:700;cursor:pointer;color:var(--tx)')}
              >
                {t('common.cancel') || 'Bekor'}
              </button>
              <button
                type="button"
                onClick={confirmStart}
                style={sx('flex:1;padding:0.75rem;border-radius:0.75rem;border:none;background:#3D7DF6;color:#fff;font-weight:800;cursor:pointer')}
              >
                {t('test.start') || 'Boshlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PurchaseModal
        open={!!buyPreset}
        item={buyPreset && { title: buyPreset.title || `${buyPreset.size} savollik tasodifiy test`, price: buyPreset.price, icon: 'target', note: `${buyPreset.size} ta savol · har safar to'lov`, confirmLabel: 'Boshlash' }}
        onConfirm={confirmBuy}
        onClose={() => setBuyPreset(null)}
      />
    </div>
  );
}
