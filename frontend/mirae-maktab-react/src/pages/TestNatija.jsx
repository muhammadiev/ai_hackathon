import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import Icon from '../components/Icon.jsx';
import UnderstandingCheck from '../components/UnderstandingCheck.jsx';
import { fetchPendingUnderstanding } from '../api/understanding.js';
import Ring from '../components/Ring.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { scoreColor, gradeFor } from '../data/mock.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const fmtDur = (d) => {
  if (typeof d === 'string') return d;
  const s = Math.max(0, Number(d) || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function optText(q, i) {
  const o = q?.options?.[i];
  if (!o) return '';
  return o.text ?? (typeof o === 'string' ? o : '');
}

function Stat({ b, s, c, small }) {
  return (
    <div style={sx('background:var(--soft);border:1px solid var(--bd);border-radius:11px;padding:10px 12px')}>
      <div className={small ? 'statnum-sm' : 'statnum'} style={sx(`font-size:${small ? '14px' : '20px'};color:${c}`)}>{b}</div>
      <div style={sx('font-size:11px;color:var(--sub);margin-top:3px')}>{s}</div>
    </div>
  );
}

function ReviewRow({ item, onSolution }) {
  const { q, no, selected, correctIndex, isCorrect } = item;
  const skipped = selected == null;
  const border = isCorrect ? '#17A673' : skipped ? 'var(--sub)' : '#DB3D6F';
  const badge = isCorrect
    ? { t: "To'g'ri", fg: '#17A673', bg: 'rgba(23,166,115,.14)' }
    : skipped
      ? { t: 'Belgilanmagan', fg: 'var(--sub)', bg: 'var(--chip)' }
      : { t: 'Xato', fg: '#DB3D6F', bg: 'rgba(219,61,111,.14)' };
  const hasSol = !!(q?.solution || q?.solutionHtml || q?.solutionVideo);

  return (
    <div style={sx(`background:var(--card);border:1px solid var(--bd);border-left:5px solid ${border};border-radius:12px;padding:14px 16px`)}>
      <div style={sx('display:flex;align-items:center;gap:9px;margin-bottom:8px;flex-wrap:wrap')}>
        <span style={sx('font-weight:800;font-size:13.5px;color:var(--tx)')}>{no}-savol</span>
        <span style={sx(`font-size:11px;font-weight:700;padding:3px 9px;border-radius:14px;color:${badge.fg};background:${badge.bg}`)}>{badge.t}</span>
        {hasSol && (
          <button type="button" onClick={onSolution} style={sx('margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;border:1.5px solid var(--bd);border-radius:9px;padding:6px 12px;cursor:pointer;background:rgba(61,125,246,.08);color:#3D7DF6')}>
            <Icon name="play" size={12} color="#3D7DF6" /> Yechim
          </button>
        )}
      </div>
      <div style={sx('font-size:14px;color:var(--tx);line-height:1.5;margin-bottom:9px')}>
        {q?.html ? <span dangerouslySetInnerHTML={{ __html: q.html }} /> : (q?.text || '')}
      </div>
      <div style={sx('display:flex;flex-wrap:wrap;gap:7px;font-size:12.5px')}>
        <span style={sx(`padding:4px 10px;border-radius:7px;font-weight:700;${skipped ? 'background:var(--chip);color:var(--sub)' : isCorrect ? 'background:rgba(23,166,115,.14);color:#17A673' : 'background:rgba(219,61,111,.14);color:#DB3D6F'}`)}>
          Siz: {selected != null ? `${LETTERS[selected]}) ${optText(q, selected)}` : 'belgilanmagan'}
        </span>
        {!isCorrect && (
          <span style={sx('padding:4px 10px;border-radius:7px;font-weight:700;background:rgba(23,166,115,.14);color:#17A673')}>
            To‘g‘ri: {LETTERS[correctIndex]}) {optText(q, correctIndex)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TestNatija() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [uc, setUc] = useState(null);
  const [ucDone, setUcDone] = useState(false);

  const review = state?.review || [];
  const summary = state?.summary || (state ? { total: state.total, correct: state.correct, duration: state.duration, from: state.from } : {});
  const total = summary.total ?? review.length;
  const correct = summary.correct ?? review.filter((r) => r.isCorrect).length;
  const skipped = review.filter((r) => r.selected == null).length;
  const wrong = Math.max(0, total - correct - skipped);
  const pct = summary.pct ?? (total ? Math.round((correct / total) * 100) : 0);
  const grade = gradeFor(pct);

  useEffect(() => {
    if (!state || pct < 95 || ucDone) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchPendingUnderstanding();
        if (cancelled) return;
        if (list?.length) {
          setUc(list[0]);
          return;
        }
      } catch { /* offline demo */ }
      if (cancelled) return;
      setUc({
        id: 'demo-uc',
        prompt: 'Bu testda eng muhim tushunchani 1–2 jumla bilan yozing. Nima uchun to‘g‘ri javob ishlaydi?',
      });
    })();
    return () => { cancelled = true; };
  }, [state, pct, ucDone]);

  useEffect(() => {
    if (!state || !total) return;
    try {
      const key = 'mirae-feedback-history';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const entry = {
        id: `fb-${Date.now()}`,
        type: 'test',
        title: summary.from || state.from || 'Test',
        pct,
        correct,
        total,
        grade: grade?.label || '',
        at: new Date().toISOString(),
      };
      const last = prev[0];
      if (!last || last.pct !== pct || last.total !== total || Date.now() - new Date(last.at).getTime() > 2000) {
        localStorage.setItem(key, JSON.stringify([entry, ...prev].slice(0, 40)));
      }
    } catch { /* ignore */ }
  }, [state, total, pct, correct, grade, summary.from]);

  const shown = useMemo(() => review.filter((r) => {
    if (filter === 'correct') return r.isCorrect;
    if (filter === 'wrong') return !r.isCorrect && r.selected != null;
    if (filter === 'skipped') return r.selected == null;
    return true;
  }), [review, filter]);

  if (!state) return <Navigate to="/" replace />;

  const openSolution = (item) => navigate('/test/yechim', { state: { item } });

  const FILTERS = [
    ['all', 'Hammasi', total],
    ['correct', "To'g'ri", correct],
    ['wrong', 'Xato', wrong],
    ['skipped', 'Belgilanmagan', skipped],
  ];

  const feedbackTitle =
    pct >= 95 ? 'Ajoyib natija' :
    pct >= 80 ? 'Yaxshi natija' :
    pct >= 60 ? 'O‘rtacha — mustahkamlang' :
    'Yana mashq qiling';

  const feedbackBody =
    pct >= 95
      ? 'Siz deyarli barcha savollarga to‘g‘ri javob berdingiz. Tushunish tasdig‘i chiqishi mumkin — qisqa javob yozing.'
      : pct >= 80
        ? `Kuchli natija (${correct}/${total}). Xato qilgan mavzularni yechim orqali qayta ko‘rib chiqing.`
        : pct >= 60
          ? `Asos bor, lekin ${wrong} ta xato bor. Zaif mavzularni «Men bilaman» va Darslar orqali mustahkamlang.`
          : `Natija past. Avval asosiy mavzularni qayta o‘qing, keyin 30 ta savollik testni qayta yeching.`;

  return (
    <div style={sx('min-height:100vh;background:var(--bg)')}>
      <MobileTopBar back title="Natija" />
      <div style={sx('max-width:920px;margin:0 auto;padding:26px 18px 60px')}>
        <div className="res-hero" style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:26px;display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:center;margin-bottom:20px')}>
          <Ring percent={pct} size={132} stroke={12} color={scoreColor(pct)}>
            <div style={sx('text-align:center')}>
              <div className="statnum" style={sx(`font-size:30px;color:${scoreColor(pct)}`)}>{pct}%</div>
              <div style={sx('font-size:10px;color:var(--sub);letter-spacing:.1em;text-transform:uppercase')}>natija</div>
            </div>
          </Ring>
          <div style={sx('min-width:0')}>
            <div style={sx('font-weight:800;font-size:22px;color:var(--tx)')}>Test yakunlandi</div>
            <div style={sx('color:var(--sub);font-size:14px;margin:3px 0 10px')}>
              {summary.from || `${correct}/${total} savolga to‘g‘ri javob berdingiz`}
            </div>
            <span style={sx(`display:inline-block;font-weight:700;font-size:12px;padding:5px 12px;border-radius:99px;margin-bottom:12px;color:${grade?.fg || scoreColor(pct)};background:${grade?.bg || (scoreColor(pct) + '22')}`)}>
              {grade?.label || '—'}
            </span>
            <div className="res-stats" style={sx('display:grid;grid-template-columns:repeat(4,1fr);gap:10px')}>
              <Stat b={correct} s="To'g'ri" c="#17A673" />
              <Stat b={wrong} s="Xato" c="#DB3D6F" />
              <Stat b={skipped} s="Belgilanmagan" c="var(--sub)" />
              <Stat b={fmtDur(summary.duration)} s="Sarflangan vaqt" c="var(--tx)" small />
            </div>
          </div>
        </div>

        <div style={sx(`background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px 18px;margin-bottom:18px;border-left:4px solid ${scoreColor(pct)}`)}>
          <div style={sx('font-weight:800;font-size:14px;color:var(--tx);margin-bottom:6px')}>{feedbackTitle}</div>
          <p style={sx('margin:0;font-size:13.5px;color:var(--sub);line-height:1.55')}>{feedbackBody}</p>
          <button type="button" onClick={() => navigate('/feedback-tarix')} style={sx('margin-top:10px;font-size:12.5px;font-weight:700;color:#3D7DF6;background:none;border:none;cursor:pointer;padding:0')}>
            Feedback tarixi →
          </button>
        </div>

        {review.length > 0 && (
          <>
            <div style={sx('display:flex;align-items:center;gap:12px;margin:22px 4px 12px;flex-wrap:wrap')}>
              <div style={sx('font-weight:800;font-size:17px;color:var(--tx)')}>Savollar tahlili</div>
              <div style={sx('margin-left:auto;display:flex;gap:7px;flex-wrap:wrap')}>
                {FILTERS.map(([id, label, n]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    style={sx(`font-size:12.5px;font-weight:700;border-radius:18px;padding:6px 13px;cursor:pointer;border:1.5px solid ${filter === id ? 'var(--tx)' : 'var(--bd)'};background:${filter === id ? 'var(--tx)' : 'var(--card)'};color:${filter === id ? 'var(--bg)' : 'var(--sub)'}`)}
                  >
                    {label} {n}
                  </button>
                ))}
              </div>
            </div>
            <div style={sx('display:grid;gap:11px')}>
              {shown.map((item) => (
                <ReviewRow key={item.no} item={item} onSolution={() => openSolution(item)} />
              ))}
              {shown.length === 0 && (
                <div style={sx('color:var(--sub);font-size:13.5px;padding:20px;text-align:center;border:1px dashed var(--bd);border-radius:14px')}>
                  Bu bo‘limda savol yo‘q.
                </div>
              )}
            </div>
          </>
        )}

        <div style={sx('display:flex;gap:10px;margin-top:22px;flex-wrap:wrap')}>
          <button type="button" onClick={() => navigate('/test')} style={sx('padding:12px 18px;border-radius:12px;border:none;background:#3D7DF6;color:#fff;font-weight:700;font-size:13.5px;cursor:pointer')}>
            Yangi test
          </button>
          <button type="button" onClick={() => navigate('/feedback-tarix')} style={sx('padding:12px 18px;border-radius:12px;border:1.5px solid var(--bd);background:var(--card);color:var(--tx);font-weight:600;font-size:13.5px;cursor:pointer')}>
            Feedback tarixi
          </button>
          <button type="button" onClick={() => navigate('/')} style={sx('padding:12px 18px;border-radius:12px;border:1.5px solid var(--bd);background:var(--card);color:var(--tx);font-weight:600;font-size:13.5px;cursor:pointer')}>
            Bosh sahifa
          </button>
        </div>
      </div>

      {uc && !ucDone && (
        <UnderstandingCheck
          check={uc}
          onDone={() => {
            setUcDone(true);
            setUc(null);
          }}
        />
      )}
    </div>
  );
}
