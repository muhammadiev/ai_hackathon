import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import Icon from '../components/Icon.jsx';
import Calculator from '../components/Calculator.jsx';
import { TEST_PRESETS, TOPICS, USER, buildExamQuestions, topicLabel, PEDAGOGIKA_ID } from '../data/mock.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const topicName = (id) => topicLabel(id);
const EXAM_ID = '2035' + String(USER.rank).padStart(4, '0');

export default function TestJarayoni({ initialSheet = false } = {}) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const preset = state?.preset || TEST_PRESETS[1];
  const from = state?.from;

  const questions = useMemo(() => buildExamQuestions(preset), [preset]);
  const total = questions.length;

  // Question map is split into sections only when there is a Pedagogika block
  // (the 50-question real exam = 40 subject + 10 pedagogika). A 30-question test
  // stays a single, un-separated map.
  const sections = useMemo(() => {
    const runs = [];
    questions.forEach((q, i) => {
      const ped = q.topicId === PEDAGOGIKA_ID;
      const last = runs[runs.length - 1];
      if (!last || last.ped !== ped) runs.push({ ped, name: ped ? 'Pedagogika' : (preset.subject || USER.fan || 'Asosiy qism'), items: [] });
      runs[runs.length - 1].items.push({ q, no: i + 1 });
    });
    return runs;
  }, [questions, preset]);
  const splitMap = sections.length > 1;

  const totalSecs = (preset.timeLimitMinutes ? preset.timeLimitMinutes * 60 : Math.max(60, total * 72));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(totalSecs);
  const [sheet, setSheet] = useState(initialSheet);
  const [calc, setCalc] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    let correct = 0;
    const review = questions.map((qq, i) => {
      const correctIndex = Array.isArray(qq.correct) ? qq.correct[0] : qq.correct;
      const selected = answers[qq.id];
      const isCorrect = selected === correctIndex;
      if (isCorrect) correct++;
      return { q: qq, no: i + 1, selected: selected == null ? null : selected, correctIndex, isCorrect };
    });
    navigate('/test/natija', { replace: true, state: { review, summary: { total, correct, pct: Math.round((correct / total) * 100), duration: totalSecs - secondsLeft, from } } });
  };

  // countdown + auto-submit at 0
  useEffect(() => {
    if (secondsLeft <= 0) { finish(); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (!total) return <div style={sx('padding:60px;text-align:center;color:var(--sub)')}>Savollar topilmadi.</div>;

  const q = questions[idx];
  const answeredCount = Object.keys(answers).length;
  const pct = Math.round((answeredCount / total) * 100);
  const hh = Math.floor(secondsLeft / 3600), mm = Math.floor((secondsLeft % 3600) / 60), ss = secondsLeft % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const warn = secondsLeft <= 300 && secondsLeft > 60;
  const crit = secondsLeft <= 60;
  const timerBd = crit ? '#DB3D6F' : warn ? '#F5A524' : 'var(--bd)';
  const timerFg = crit ? '#DB3D6F' : warn ? '#DB8A17' : 'var(--tx)';

  const choose = (i) => setAnswers((p) => ({ ...p, [q.id]: i }));
  const goTo = (n) => { if (n >= 0 && n < total) { setIdx(n); setSheet(false); } };

  // faint candidate watermark (theme-neutral ink)
  const wmSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='84'><text x='-6' y='34' transform='rotate(-24 75 42)' font-family='Arial' font-size='10.5' fill='rgba(120,132,150,0.10)'>${EXAM_ID}</text><text x='46' y='74' transform='rotate(-24 75 42)' font-family='Arial' font-size='10.5' fill='rgba(120,132,150,0.10)'>${EXAM_ID}</text></svg>`;
  const wmUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(wmSvg)}")`;

  /* IMPORTANT: never use minmax(X, 1fr) for question cells — 1fr stretches
     a single cell into a giant square when the row is sparse. Fixed px tracks only. */
  const QuestionMap = (
    <>
      <div className="ex2-cand" style={sx('display:flex;align-items:flex-start;gap:11px;padding-bottom:13px;border-bottom:1px solid var(--bd)')}>
        <div style={sx('width:42px;height:50px;border-radius:6px;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;flex:none')}>{(USER.name[0] + USER.surname[0]).toUpperCase()}</div>
        <div style={sx('font-size:12px;line-height:1.5;min-width:0')}>
          <div style={sx('font-weight:800;color:var(--tx);font-size:13px')}>{USER.name} {USER.surname}</div>
          <div style={sx('color:var(--sub)')}>ID: <b style={sx('color:var(--tx)')}>{EXAM_ID}</b></div>
          <div style={sx('color:var(--sub)')}>Fan: <b style={sx('color:var(--tx)')}>{USER.fan}</b></div>
        </div>
      </div>

      <div className="ex2-prog" style={sx('padding-top:13px')}>
        <div style={sx('display:flex;justify-content:space-between;align-items:center;margin-bottom:6px')}>
          <span style={sx('font-size:11px;color:var(--sub);font-weight:600')}>Bajarilishi</span>
          <span style={sx('font-size:12px;color:var(--tx);font-weight:800')}>{answeredCount}/{total}</span>
        </div>
        <div style={sx('height:6px;border-radius:99px;background:var(--track);overflow:hidden')}>
          <div style={sx(`height:100%;width:${pct}%;background:linear-gradient(90deg,#17A673,#37c26a);transition:width .3s`)} />
        </div>
      </div>

      {sections.map((sec, si) => (
        <div key={si} className="ex2-sec" style={sx('margin-top:14px')}>
          {splitMap && (
            <div style={sx('display:flex;align-items:center;justify-content:space-between;margin-bottom:8px')}>
              <span style={sx(`font-size:11.5px;font-weight:800;color:${sec.ped ? '#DB8A17' : 'var(--tx)'}`)}>{sec.name}</span>
              <span style={sx('font-size:10.5px;color:var(--sub)')}>{sec.items[0].no}&ndash;{sec.items[sec.items.length - 1].no}</span>
            </div>
          )}
          {/* 7 fixed columns — small cards, never stretch */}
          <div className="ex2-qgrid">
            {sec.items.map(({ q: qq, no }) => {
              const isAns = answers[qq.id] != null;
              const isCur = no - 1 === idx;
              const fl = flags[qq.id];
              return (
                <button
                  key={qq.id}
                  type="button"
                  onClick={() => goTo(no - 1)}
                  aria-label={`Savol ${no}`}
                  aria-current={isCur ? 'true' : undefined}
                  className={`ex2-qcell${isAns ? ' is-ans' : ''}${isCur ? ' is-cur' : ''}${fl ? ' is-flag' : ''}`}
                >
                  {no}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="ex2-legend" style={sx('display:flex;flex-wrap:wrap;gap:10px 14px;margin-top:14px;padding-top:12px;border-top:1px solid var(--bd);font-size:10.5px;color:var(--sub)')}>
        <span style={sx('display:flex;align-items:center;gap:6px')}><span style={sx('width:11px;height:11px;border-radius:3px;background:#17A673;flex:none')} />Javob berilgan</span>
        <span style={sx('display:flex;align-items:center;gap:6px')}><span style={sx('width:11px;height:11px;border-radius:3px;background:#4a86f7;flex:none')} />Javobsiz</span>
        <span style={sx('display:flex;align-items:center;gap:6px')}><span style={sx('width:11px;height:11px;border-radius:50%;background:#F5A524;flex:none')} />Belgilangan</span>
      </div>
    </>
  );

  return (
    <div className="ex2-shell" style={sx('height:100vh;display:flex;flex-direction:column;background:var(--bg);overflow:hidden')}>
      {/* top bar */}
      <header className="ex2-header" style={sx('flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:9px 14px;background:var(--card);border-bottom:1px solid var(--bd)')}>
        <div className="ex2-brand" style={sx('display:flex;align-items:center;gap:10px;min-width:0;flex:1')}>
          <div style={sx('width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#3D7DF6,#1d3f9e);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-style:italic;flex:none')}>M</div>
          <div style={sx('line-height:1.15;min-width:0')}>
            <div style={sx('font-size:13px;font-weight:800;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{from || 'Mirae — imtihon'}</div>
            <div className="ex2-sublabel" style={sx('font-size:11px;color:var(--sub)')}>Test markazi</div>
          </div>
        </div>

        {/* Desktop: 3 boxes. Mobile: compact chip via CSS */}
        <div className="ex2-timer-desk" style={sx('display:flex;align-items:center;gap:6px')}>
          {[[pad(hh), 'soat'], [pad(mm), 'minut'], [pad(ss), 'sekund']].map(([v, l], i) => (
            <span key={l} style={sx('display:flex;align-items:center;gap:6px')}>
              {i > 0 && <span style={sx('color:var(--sub);font-weight:700;padding-bottom:14px')}>:</span>}
              <span style={sx('display:flex;flex-direction:column;align-items:center')}>
                <span className="statnum" style={sx(`width:42px;height:42px;border:1.5px solid ${timerBd};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:17px;color:${timerFg};background:var(--card)`)}>{v}</span>
                <span style={sx('font-size:10px;color:var(--sub);margin-top:3px')}>{l}</span>
              </span>
            </span>
          ))}
        </div>
        <div className="ex2-timer-mob" style={sx(`display:none;align-items:center;gap:6px;padding:7px 11px;border-radius:10px;border:1.5px solid ${timerBd};background:var(--card);flex:none`)}>
          <span className="statnum" style={sx(`font-size:15px;font-weight:800;color:${timerFg};letter-spacing:.02em`)}>
            {hh > 0 ? `${pad(hh)}:` : ''}{pad(mm)}:{pad(ss)}
          </span>
        </div>

        <button className="ex2-finish" onClick={() => setConfirmFinish(true)} style={sx('padding:9px 16px;border-radius:8px;border:none;background:#17A673;color:#fff;font-weight:700;font-size:13.5px;cursor:pointer;flex:none')}>Yakunlash</button>
      </header>

      {/* body grid */}
      <div className="ex2-grid" style={sx('flex:1;min-height:0;display:grid;grid-template-columns:minmax(230px,270px) minmax(0,1fr) minmax(84px,104px);gap:8px;padding:8px 12px')}>
        {/* left rail (desktop) / bottom sheet (mobile) */}
        <aside className="ex2-left noscroll" data-open={sheet ? '1' : '0'} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:13px;overflow-y:auto;min-height:0')}>
          <div className="ex2-grab" aria-hidden />
          <div className="ex2-sheet-head">
            <div className="ex2-sheet-title">Savollar xaritasi</div>
            <button type="button" className="ex2-sheet-close" onClick={() => setSheet(false)} aria-label="Yopish">×</button>
          </div>
          {QuestionMap}
        </aside>

        {/* center */}
        <main style={sx('position:relative;background:var(--card);border:1px solid var(--bd);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:0')}>
          <div style={sx('position:absolute;inset:0;pointer-events:none;opacity:.6')} aria-hidden />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: wmUrl, backgroundRepeat: 'repeat', backgroundSize: '150px 84px' }} aria-hidden />
          <div className="noscroll" style={sx('position:relative;z-index:1;padding:22px 24px 0;overflow-y:auto;flex:1;min-height:0')}>
            <div style={sx('display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap')}>
              <span style={sx('font-size:15px;font-weight:800;color:var(--tx)')}>Savol {idx + 1}<span style={sx('color:var(--sub);font-weight:400')}>:</span></span>
              <span style={sx('font-size:11px;font-weight:700;color:#0d9488;background:rgba(13,148,136,.12);padding:3px 10px;border-radius:20px')}>{topicName(q.topicId)}</span>
              <button onClick={() => setFlags((p) => ({ ...p, [q.id]: !p[q.id] }))} style={sx(`margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;border:1.5px solid ${flags[q.id] ? '#F5A524' : 'var(--bd)'};border-radius:8px;padding:6px 11px;cursor:pointer;background:${flags[q.id] ? 'rgba(245,165,36,.12)' : 'var(--card)'};color:${flags[q.id] ? '#DB8A17' : 'var(--sub)'}`)}>
                <Icon name="flame" size={12} color={flags[q.id] ? '#DB8A17' : 'var(--sub)'} /> Belgilash
              </button>
            </div>

            <div style={sx('font-size:14.5px;line-height:1.65;color:var(--tx);margin-bottom:20px')}>
              {q.html ? <span dangerouslySetInnerHTML={{ __html: q.html }} /> : q.text}
            </div>
            {q.latex && <div style={sx('font-family:monospace;font-size:13px;color:var(--sub);margin:-10px 0 16px')}>{q.latex}</div>}
            {Array.isArray(q.images) && q.images.map((s, k) => <img key={k} src={s} alt="" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 14, border: '1px solid var(--bd)' }} />)}

            <div style={sx('display:flex;flex-direction:column;gap:10px;padding-bottom:16px')}>
              {q.options.map((opt, i) => {
                const sel = answers[q.id] === i;
                return (
                  <button key={i} onClick={() => choose(i)} style={sx(`display:flex;align-items:flex-start;gap:13px;text-align:left;padding:13px 16px;border:1.5px solid ${sel ? '#3D7DF6' : 'var(--bd)'};border-radius:9px;cursor:pointer;background:${sel ? 'rgba(61,125,246,.10)' : 'var(--card)'}`)}>
                    <span style={sx(`width:19px;height:19px;min-width:19px;margin-top:1px;border-radius:50%;border:2px solid ${sel ? '#3D7DF6' : 'var(--sub)'};display:flex;align-items:center;justify-content:center`)}>{sel && <span style={sx('width:9px;height:9px;border-radius:50%;background:#3D7DF6')} />}</span>
                    <span style={sx(`font-weight:700;font-size:13px;color:${sel ? '#2258c4' : 'var(--sub)'};min-width:16px`)}>{LETTERS[i]})</span>
                    <span style={sx('font-size:14px;color:var(--tx);padding-top:1px')}>{opt.html ? <span dangerouslySetInnerHTML={{ __html: opt.html }} /> : (opt.text ?? opt)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* nav footer — on mobile the center control opens the question map (no floating FAB over Keyingi) */}
          <div className="ex2-footer" style={sx('position:relative;z-index:1;flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-top:1px solid var(--bd);background:var(--card)')}>
            <button disabled={idx === 0} onClick={() => goTo(idx - 1)} style={sx(`padding:10px 18px;border-radius:7px;border:none;font-weight:600;font-size:14px;cursor:${idx === 0 ? 'not-allowed' : 'pointer'};background:${idx === 0 ? 'var(--track)' : '#3D7DF6'};color:${idx === 0 ? 'var(--sub)' : '#fff'};flex:none`)}>Oldingi</button>

            {/* Desktop: plain counter. Mobile: tappable map opener */}
            <span className="ex2-footer-count" style={sx('font-size:13px;font-weight:700;color:var(--sub)')}>{idx + 1}/{total}</span>
            <button
              type="button"
              className="ex2-footer-map"
              onClick={() => setSheet(true)}
              aria-label="Savollar xaritasi"
              style={sx('display:none;align-items:center;gap:7px;padding:9px 14px;border-radius:999px;border:1.5px solid var(--bd);background:var(--soft);color:var(--tx);font-weight:700;font-size:13px;cursor:pointer;-webkit-tap-highlight-color:transparent')}
            >
              <Icon name="layers" size={14} color="var(--tx)" />
              {answeredCount}/{total}
            </button>

            {idx === total - 1
              ? <button onClick={() => setConfirmFinish(true)} style={sx('padding:10px 18px;border-radius:7px;border:none;background:#17A673;color:#fff;font-weight:700;font-size:14px;cursor:pointer;flex:none')}>Yakunlash</button>
              : <button onClick={() => goTo(idx + 1)} style={sx('padding:10px 18px;border-radius:7px;border:none;background:#3D7DF6;color:#fff;font-weight:600;font-size:14px;cursor:pointer;flex:none')}>Keyingi</button>}
          </div>
        </main>

        {/* right rail (desktop tools) */}
        <aside className="ex2-right" style={sx('background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:8px')}>
          <button onClick={() => setCalc((v) => !v)} title="Kalkulyator" style={sx(`display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 4px;border-radius:10px;border:none;cursor:pointer;background:${calc ? 'rgba(61,125,246,.12)' : 'transparent'};color:${calc ? '#3D7DF6' : 'var(--sub)'}`)}>
            <Icon name="calc" size={20} color={calc ? '#3D7DF6' : 'var(--sub)'} />
            <span style={sx('font-size:10px;font-weight:700')}>Kalkulyator</span>
          </button>

          {/* tiny proctoring camera — decorative "exam vibe" only, pinned bottom */}
          <div style={sx('margin-top:auto;position:relative;aspect-ratio:3/4;border-radius:8px;overflow:hidden;background:#0b0f14;display:flex;align-items:center;justify-content:center')}>
            <Icon name="video" size={18} color="rgba(255,255,255,.34)" />
            <span style={sx('position:absolute;top:4px;left:4px;display:flex;align-items:center;gap:3px')}>
              <span className="rec-dot" style={sx('width:5px;height:5px;border-radius:50%;background:#ff4d4f')} />
              <span style={sx('font-size:7.5px;font-weight:800;color:#fff;letter-spacing:.05em')}>REC</span>
            </span>
          </div>
        </aside>
      </div>

      {/* Backdrop for mobile question-map sheet (map opens from footer, not a floating FAB) */}
      {sheet && <div className="ex2-backdrop" onClick={() => setSheet(false)} style={sx('position:fixed;inset:0;z-index:64;background:rgba(15,31,51,.42)')} />}

      {calc && <Calculator onClose={() => setCalc(false)} />}

      {/* finish modal */}
      {confirmFinish && (
        <div onClick={() => setConfirmFinish(false)} style={sx('position:fixed;inset:0;z-index:130;background:rgba(15,31,51,.5);display:flex;align-items:center;justify-content:center;padding:18px')}>
          <div onClick={(e) => e.stopPropagation()} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:24px;width:min(420px,100%);text-align:center')}>
            <div style={sx('width:52px;height:52px;border-radius:50%;background:rgba(23,166,115,.14);display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}><Icon name="checkCircle" size={26} color="#17A673" /></div>
            <div style={sx('font-weight:800;font-size:18px;color:var(--tx);margin-bottom:7px')}>Imtihonni yakunlaysizmi?</div>
            <div style={sx('color:var(--sub);font-size:14px;margin-bottom:18px')}>{answeredCount}/{total} savolga javob berdingiz{answeredCount < total ? `, ${total - answeredCount} ta bo‘sh.` : '.'} Yakunlagach natija chiqadi.</div>
            <div style={sx('display:flex;gap:10px')}>
              <button onClick={() => setConfirmFinish(false)} style={sx('flex:1;padding:11px;border-radius:11px;border:1.5px solid var(--bd);background:var(--card);color:var(--tx);font-weight:600;font-size:13.5px;cursor:pointer')}>Davom etish</button>
              <button onClick={finish} style={sx('flex:1;padding:11px;border-radius:11px;border:none;background:#17A673;color:#fff;font-weight:700;font-size:13.5px;cursor:pointer')}>Ha, yakunlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
