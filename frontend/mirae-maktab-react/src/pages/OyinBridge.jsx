import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { GAME_PORTAL_URL } from '../gamePortal.js';

/**
 * Temporary bridge when VITE_GAME_PORTAL_URL is not set.
 * Shows the exact JSON that will be sent to the game website.
 * No game UI — portal owns games.
 */
export default function OyinBridge() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const gametype = params.get('gametype') || 'simple';

  const payload = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('mirae-game-bridge-payload') || 'null');
    } catch {
      return null;
    }
  }, []);

  const jsonPretty = payload ? JSON.stringify(payload, null, 2) : '—';

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem;max-width:48rem')}>
      <PageHeader
        title="O‘yin portaliga yuborish"
        subtitle="O‘yinni biz yasamaymiz — tashqi game website qabul qiladi. Hozir demo ko‘rinish."
      />

      <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1rem;padding:1.15rem;margin-bottom:1rem')}>
        <div style={sx('display:flex;align-items:center;gap:0.65rem;margin-bottom:0.75rem')}>
          <Icon name="send" size={18} color="#7A5AF8" />
          <span style={sx('font-weight:800;color:var(--tx)')}>
            gametype: <span style={sx('color:#7A5AF8')}>{gametype}</span>
          </span>
        </div>
        <p style={sx('font-size:0.875rem;color:var(--sub);line-height:1.5;margin:0 0 0.75rem')}>
          Haqiqiy manzil: <code style={sx('font-size:0.8rem')}>{GAME_PORTAL_URL}</code>
          <br />
          .env da <code>VITE_GAME_PORTAL_URL</code> ni o‘rnating — shunda JSON avtomatik POST qilinadi.
        </p>
        <pre
          style={sx(
            'margin:0;padding:1rem;border-radius:0.75rem;background:#0f172a;color:#e2e8f0;font-size:0.75rem;line-height:1.45;overflow:auto;max-height:22rem'
          )}
        >
          {jsonPretty}
        </pre>
      </div>

      <div style={sx('display:flex;gap:0.65rem;flex-wrap:wrap')}>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(jsonPretty);
          }}
          style={sx('padding:0.75rem 1.1rem;border-radius:0.75rem;border:1px solid var(--bd);background:var(--soft);font-weight:700;cursor:pointer;color:var(--tx)')}
        >
          JSON nusxa
        </button>
        <button
          type="button"
          onClick={() => navigate(gametype === 'homework' ? '/vazifalar' : '/')}
          style={sx('padding:0.75rem 1.1rem;border-radius:0.75rem;border:none;background:#3D7DF6;color:#fff;font-weight:800;cursor:pointer')}
        >
          Orqaga
        </button>
      </div>
    </div>
  );
}
