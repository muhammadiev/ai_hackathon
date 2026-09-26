import { useEffect, useRef, useState } from 'react';
import { sx } from '../utils/sx.js';
import Icon from './Icon.jsx';
import { submitUnderstandingAnswer } from '../api/understanding.js';

const SECONDS = 30;

/**
 * Full-screen understanding check after ≥95% result.
 * On expire still POSTs timed_out.
 */
export default function UnderstandingCheck({ check, onDone }) {
  const [left, setLeft] = useState(SECONDS);
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);
  const [expired, setExpired] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!check) return;
    setLeft(SECONDS);
    setExpired(false);
    setAnswer('');
    doneRef.current = false;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [check?.id]);

  useEffect(() => {
    if (expired && check && !doneRef.current) {
      doneRef.current = true;
      (async () => {
        setSending(true);
        try {
          await submitUnderstandingAnswer(check.id, { answer: '', timed_out: true });
        } catch { /* demo offline ok */ }
        setSending(false);
        onDone?.({ timed_out: true });
      })();
    }
  }, [expired, check, onDone]);

  if (!check) return null;

  const submit = async () => {
    if (sending || doneRef.current) return;
    doneRef.current = true;
    setSending(true);
    try {
      await submitUnderstandingAnswer(check.id, { answer: answer.trim(), timed_out: false });
    } catch { /* demo */ }
    setSending(false);
    onDone?.({ timed_out: false });
  };

  const pct = Math.round((left / SECONDS) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={sx('position:fixed;inset:0;z-index:100;background:rgba(10,15,30,.82);display:flex;align-items:center;justify-content:center;padding:1rem')}
    >
      <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.25rem;padding:1.5rem 1.35rem;width:min(26rem,100%);box-shadow:0 1.5rem 3rem -1rem rgba(0,0,0,.4)')}>
        <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:1rem')}>
          <div style={sx('display:flex;align-items:center;gap:0.6rem')}>
            <span style={sx('width:2.4rem;height:2.4rem;border-radius:0.75rem;background:rgba(61,125,246,.14);display:grid;place-items:center')}>
              <Icon name="bolt" size={18} color="#3D7DF6" />
            </span>
            <div>
              <div style={sx('font-weight:800;font-size:1.05rem;color:var(--tx)')}>Tushunish tasdig‘i</div>
              <div style={sx('font-size:0.75rem;color:var(--sub)')}>30 soniya ichida qisqa javob yozing</div>
            </div>
          </div>
          <div style={sx(`font-weight:800;font-size:1.25rem;color:${left <= 5 ? '#DB3D6F' : '#3D7DF6'};font-variant-numeric:tabular-nums`)}>{left}s</div>
        </div>

        <div style={sx('height:0.35rem;border-radius:99px;background:var(--track);overflow:hidden;margin-bottom:1rem')}>
          <div style={sx(`height:100%;width:${pct}%;background:linear-gradient(90deg,#3D7DF6,#7A5AF8);transition:width .2s linear`)} />
        </div>

        <p style={sx('font-size:0.95rem;font-weight:700;color:var(--tx);line-height:1.45;margin:0 0 0.85rem')}>
          {check.prompt || 'Asosiy g‘oyani 1–2 jumla bilan tushuntiring. Bu “yodlagan” emas, “tushungan” ekanligingizni tekshiradi.'}
        </p>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={expired || sending}
          rows={4}
          placeholder="Javobingiz…"
          style={sx('width:100%;padding:0.85rem 1rem;border-radius:0.85rem;border:1.5px solid var(--bd);background:var(--field);color:var(--tx);font-size:0.9rem;resize:vertical;font-family:inherit;box-sizing:border-box')}
        />

        {expired ? (
          <div style={sx('margin-top:0.85rem;padding:0.75rem;border-radius:0.75rem;background:rgba(219,61,111,.1);color:#DB3D6F;font-size:0.85rem;font-weight:700;text-align:center')}>
            Vaqt tugadi — o‘qituvchiga belgi qo‘yildi
          </div>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={sending || !answer.trim()}
            style={sx(`margin-top:0.85rem;width:100%;padding:0.85rem;border-radius:0.85rem;border:none;font-weight:800;cursor:pointer;background:${answer.trim() ? '#3D7DF6' : 'var(--track)'};color:${answer.trim() ? '#fff' : 'var(--sub)'}`)}
          >
            {sending ? 'Yuborilmoqda…' : 'Yuborish'}
          </button>
        )}
      </div>
    </div>
  );
}
