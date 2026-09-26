import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { applyGameResult } from '../gamePortal.js';

/**
 * Callback page: game portal redirects here with result query or POST body.
 * Query example:
 * /oyin/natija?payload={"gametype":"homework","homeworkId":"hw1","passed":true,"xpEarned":40,"correct":16,"total":20,"pct":80}
 */
export default function OyinNatija() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    let raw = params.get('payload') || params.get('result');
    if (!raw) {
      try {
        raw = sessionStorage.getItem('mirae-game-last-result');
      } catch { /* ignore */ }
    }
    if (!raw) return;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setResult(applyGameResult(parsed));
    } catch {
      setResult({ error: true });
    }
  }, [params]);

  const passed = result?.passed;
  const isHw = result?.gametype === 'homework';

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem;max-width:28rem')}>
      <PageHeader title="O‘yin natijasi" subtitle="Game portal javobi" />
      {!result && (
        <p style={sx('color:var(--sub)')}>Natija kutilmoqda… Portaldan qaytgan ma’lumot yo‘q.</p>
      )}
      {result?.error && (
        <p style={sx('color:#DB3D6F')}>Natijani o‘qib bo‘lmadi.</p>
      )}
      {result && !result.error && (
        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.15rem;padding:1.35rem;text-align:center')}>
          <div
            style={sx(
              `width:3.5rem;height:3.5rem;border-radius:1rem;margin:0 auto 0.85rem;display:grid;place-items:center;background:${passed ? 'rgba(23,166,115,.15)' : 'rgba(219,61,111,.12)'}`
            )}
          >
            <Icon name={passed ? 'checkCircle' : 'target'} size={26} color={passed ? '#17A673' : '#DB3D6F'} />
          </div>
          <div style={sx('font-weight:800;font-size:1.15rem;color:var(--tx)')}>
            {isHw ? (passed ? 'Uyga vazifa bajarildi' : 'Uyga vazifa bajarilmadi') : 'O‘yin yakunlandi'}
          </div>
          <p style={sx('font-size:0.875rem;color:var(--sub);line-height:1.5;margin:0.5rem 0 1rem')}>
            {result.correct != null && (
              <>
                {result.correct}/{result.total} · {result.pct ?? '—'}%
                {result.xpEarned != null ? ` · +${result.xpEarned} XP` : ''}
              </>
            )}
            {!passed && isHw && (
              <>
                <br />
                Qayta urinib ko‘rishingiz mumkin.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => navigate(isHw ? '/vazifalar' : '/')}
            style={sx('width:100%;padding:0.8rem;border-radius:0.85rem;border:none;background:#3D7DF6;color:#fff;font-weight:800;cursor:pointer')}
          >
            {isHw ? 'Vazifalarga' : 'Bosh sahifa'}
          </button>
        </div>
      )}
    </div>
  );
}
