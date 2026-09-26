import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import Icon from '../components/Icon.jsx';
import { applyGameResult } from '../utils/gamePortal.js';

/**
 * Return URL target for the external game portal.
 * Portal redirects here with ?result=<base64 json> or posts message.
 * We never run the game here.
 */
export default function OyinCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let result = null;
    const raw = params.get('result') || params.get('data');
    if (raw) {
      try {
        const json = decodeURIComponent(escape(atob(raw)));
        result = JSON.parse(json);
      } catch {
        try {
          result = JSON.parse(decodeURIComponent(raw));
        } catch { /* ignore */ }
      }
    }
    if (result) {
      applyGameResult(result);
      setInfo(result);
    } else {
      setInfo({ empty: true });
    }

    const onMsg = (e) => {
      if (e.data?.type === 'mirae-game-result') {
        applyGameResult(e.data.result);
        setInfo(e.data.result);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [params]);

  const passed = info && !info.empty && info.passed;
  const failed = info && !info.empty && info.passed === false;

  return (
    <div style={sx('padding:1.5rem;max-width:26rem;margin:0 auto')}>
      <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.15rem;padding:1.5rem;text-align:center')}>
        <div style={sx('font-weight:800;font-size:1.15rem;color:var(--tx);margin-bottom:0.5rem')}>
          O‘yin portali
        </div>
        {info?.empty && (
          <p style={sx('font-size:0.9rem;color:var(--sub);line-height:1.5')}>
            Natija kutilmoqda. O‘yin sayti yakunlagach bu yerga qaytaradi.
          </p>
        )}
        {passed && (
          <p style={sx('font-size:0.9rem;color:#17A673;line-height:1.5;font-weight:700')}>
            O‘tdingiz · +{info.xpEarned || 0} XP · uyga vazifa bajarildi
          </p>
        )}
        {failed && (
          <p style={sx('font-size:0.9rem;color:#DB3D6F;line-height:1.5;font-weight:700')}>
            O‘tmadingiz · uyga vazifa bajarilmagan
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate('/vazifalar')}
          style={sx('margin-top:1.1rem;width:100%;padding:0.8rem;border-radius:0.85rem;border:none;background:#3D7DF6;color:#fff;font-weight:800;cursor:pointer')}
        >
          Vazifalarga qaytish
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={sx('margin-top:0.5rem;width:100%;padding:0.7rem;border-radius:0.85rem;border:1px solid var(--bd);background:var(--soft);color:var(--tx);font-weight:700;cursor:pointer')}
        >
          Bosh sahifa
        </button>
      </div>
    </div>
  );
}
