import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthed, setOnboarded, formatUzPhone } from '../session.js';
import { login as apiLogin } from '../api/auth.js';
import { useSubject } from '../SubjectContext.jsx';
import '../login-page.css';

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [phone, setPhone] = useState('+998');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.cssText += ';overflow:auto!important;height:auto!important;position:static!important;';
    body.style.cssText += ';overflow:auto!important;height:auto!important;position:static!important;';
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();
    setErr('');
    if (mode === 'signup') {
      setErr("Hisobni maktab administratori yaratadi. Login orqali kiring.");
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length < 12) {
      setErr("To'liq telefon raqam kiriting.");
      return;
    }
    if (!pw || pw.length < 4) {
      setErr('Parolni kiriting.');
      return;
    }

    setLoading(true);
    try {
      await apiLogin(phone, pw);
      setAuthed(true);
      setOnboarded(true);
      navigate('/', { replace: true });
    } catch (error) {
      const msg = error?.message || "Telefon raqam yoki parol xato";
      if (/failed to fetch|networkerror|load failed/i.test(msg)) {
        setErr("Serverga ulanib bo'lmadi. Backend (8000) va VITE_API_BASE_URL ni tekshiring.");
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const tgLogin = () => {
    setErr('Telegram orqali kirish tez orada.');
  };

  return (
    <div className="login-page">
      <div className="lp-wrap">
        <aside className="lp-hero">
          <div className="lp-brand">
            <span className="lp-brand-mark">M</span>
            <span>MIRAE MAKTAB</span>
          </div>
          <p className="lp-kicker">MAKTAB PLATFORMAASI</p>
          <h1 className="lp-headline">
            Keyingi natija
            <br />
            shu yerdan
            <br />
            <span>boshlanadi.</span>
          </h1>
          <p className="lp-sub">
            Bugungi darslar, vazifalar, testlar va natijalar — bitta joyda.
          </p>
        </aside>

        <section className="lp-card-wrap">
          <div className="lp-card">
            <div className="lp-tabs">
              <button
                type="button"
                className={mode === 'login' ? 'is-on' : ''}
                onClick={() => {
                  setMode('login');
                  setErr('');
                }}
              >
                Kirish
              </button>
              <button
                type="button"
                className={mode === 'signup' ? 'is-on' : ''}
                onClick={() => {
                  setMode('signup');
                  setErr('');
                }}
              >
                Ro&apos;yxat
              </button>
            </div>

            <h2 className="lp-title">
              {mode === 'login' ? 'Xush kelibsiz!' : 'Hisob yaratish'}
            </h2>
            <p className="lp-desc">
              {mode === 'login'
                ? 'Telefon va parol bilan davom eting.'
                : 'Hisobni maktab administratori yaratadi.'}
            </p>

            <form onSubmit={submit}>
              <label className="lp-label">Telefon raqam</label>
              <div className="lp-input">
                <span>📱</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                  placeholder="+998 90 123 45 67"
                />
              </div>

              <label className="lp-label">Parol</label>
              <div className="lp-input">
                <span>🔒</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Parolingiz"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>

              {mode === 'login' && (
                <div className="lp-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Meni eslab qol
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setErr('Parolni tiklash uchun adminga murojaat qiling.')
                    }
                  >
                    Unutdingizmi?
                  </button>
                </div>
              )}

              <button className="lp-submit" type="submit" disabled={loading}>
                {loading ? 'Kutilmoqda…' : mode === 'login' ? 'Kirish' : 'Davom etish'}
              </button>
              {err ? <p className="lp-err">{err}</p> : <p className="lp-err" />}
            </form>

            <div className="lp-or">yoki</div>
            <div className="lp-social">
              <button type="button" onClick={tgLogin}>
                ✈ Telegram
              </button>
              <button type="button" onClick={() => setErr('Google tez orada')}>
                G Google
              </button>
            </div>
            <p className="lp-switch">
              {mode === 'login' ? 'Yangi foydalanuvchi?' : 'Hisobingiz bormi?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setErr('');
                }}
              >
                {mode === 'login' ? "Ro'yxat" : 'Kirish'}
              </button>
            </p>
          </div>
          <p className="lp-foot">
            © 2026 Mirae Maktab · Demo: +998 90 200 00 09 / mirae123
          </p>
        </section>
      </div>
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  useSubject();
  return (
    <div className="login-page" style={{ display: 'grid', placeItems: 'center', padding: '1.5em' }}>
      <div style={{ maxWidth: '22em', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 0.5em' }}>Ro&apos;yxatdan o&apos;tish</h2>
        <p style={{ color: '#64748b', lineHeight: 1.5, fontSize: '0.9em' }}>
          Hisobni maktab administratori yaratadi.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            marginTop: '1.25em',
            height: '3em',
            padding: '0 1.5em',
            border: 0,
            borderRadius: '0.85em',
            background: 'linear-gradient(110deg,#3D7DF6,#7A5AF8)',
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Kirish sahifasiga
        </button>
      </div>
    </div>
  );
}