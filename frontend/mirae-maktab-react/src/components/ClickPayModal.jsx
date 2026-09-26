import { useEffect, useState } from 'react';
import { sx } from '../utils/sx.js';
import Icon from './Icon.jsx';
import { fmt } from '../data/mock.js';

const CLICK_BLUE = '#0098EB';
const CLICK_GREEN = '#22C55E';

function ClickLogo({ size = 26 }) {
  return (
    <span style={sx('display:inline-flex;align-items:center;gap:7px')}>
      <span style={sx(`width:${size}px;height:${size}px;border-radius:8px;background:${CLICK_BLUE};display:flex;align-items:center;justify-content:center;position:relative`)}>
        <span style={sx('color:#fff;font-weight:900;font-size:13px')}>C</span>
        <span style={sx(`position:absolute;bottom:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:${CLICK_GREEN};border:2px solid #fff`)} />
      </span>
      <span style={sx(`font-weight:900;font-size:${size * 0.7}px;color:${CLICK_BLUE};letter-spacing:-.5px`)}>Click</span>
    </span>
  );
}

function formatUzPhone(v) {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  const p = ['+998'];
  if (d.length) p.push(' ' + d.slice(0, 2));
  if (d.length > 2) p.push(' ' + d.slice(2, 5));
  if (d.length > 5) p.push(' ' + d.slice(5, 7));
  if (d.length > 7) p.push(' ' + d.slice(7, 9));
  return p.join('');
}

export default function ClickPayModal({ open, amount, onClose, onSuccess }) {
  const [step, setStep] = useState('form'); // form | otp | processing | done
  const [phone, setPhone] = useState('+998 ');
  const [card, setCard] = useState('');
  const [method, setMethod] = useState('card'); // card | phone
  const [otp, setOtp] = useState('');

  useEffect(() => { if (open) { setStep('form'); setOtp(''); } }, [open]);
  if (!open) return null;

  const pay = () => { setStep('otp'); };
  const confirmOtp = () => {
    setStep('processing');
    setTimeout(() => { setStep('done'); onSuccess?.(amount); }, 1500);
  };

  return (
    <div onClick={onClose} style={sx('position:fixed;inset:0;z-index:150;background:rgba(15,31,51,.55);display:flex;align-items:center;justify-content:center;padding:18px')}>
      <div onClick={(e) => e.stopPropagation()} style={sx('width:min(400px,100%);background:var(--card);border-radius:20px;overflow:hidden;box-shadow:var(--shadowLg)')}>
        {/* header */}
        <div style={sx('display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--bd)')}>
          <ClickLogo />
          <button onClick={onClose} aria-label="Yopish" style={sx('width:30px;height:30px;border-radius:8px;border:none;background:var(--soft);color:var(--sub);cursor:pointer;font-weight:800')}>✕</button>
        </div>

        {/* amount banner */}
        <div style={sx(`padding:18px;text-align:center;background:linear-gradient(135deg,${CLICK_BLUE},#00c2ff);color:#fff`)}>
          <div style={sx('font-size:12px;opacity:.85')}>To‘lov summasi</div>
          <div className="statnum" style={sx('font-size:30px;margin-top:2px')}>{fmt(amount)} <span style={sx('font-size:15px;font-weight:600;opacity:.85')}>so‘m</span></div>
        </div>

        <div style={sx('padding:18px')}>
          {step === 'form' && (
            <>
              <div style={sx('display:flex;gap:8px;margin-bottom:16px')}>
                {[['card', 'Karta', 'wallet'], ['phone', 'Telefon', 'send']].map(([id, label, ic]) => (
                  <button key={id} onClick={() => setMethod(id)} style={sx(`flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer;border:1.5px solid ${method === id ? CLICK_BLUE : 'var(--bd)'};background:${method === id ? 'rgba(0,152,235,.08)' : 'var(--card)'};color:${method === id ? CLICK_BLUE : 'var(--sub)'}`)}>
                    <Icon name={ic} size={15} color={method === id ? CLICK_BLUE : 'var(--sub)'} /> {label}
                  </button>
                ))}
              </div>

              {method === 'card' ? (
                <div style={sx('display:flex;flex-direction:column;gap:12px')}>
                  <div>
                    <div style={sx('font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px')}>Karta raqami</div>
                    <input value={card} onChange={(e) => setCard(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())} placeholder="8600 0000 0000 0000" inputMode="numeric" style={sx('width:100%;padding:12px 14px;border:1px solid var(--bd);border-radius:12px;background:var(--field);font-size:15px;letter-spacing:1px;color:var(--tx)')} />
                  </div>
                  <div style={sx('display:grid;grid-template-columns:1fr 1fr;gap:12px')}>
                    <div><div style={sx('font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px')}>Amal qilish</div><input placeholder="MM/YY" style={sx('width:100%;padding:12px 14px;border:1px solid var(--bd);border-radius:12px;background:var(--field);font-size:14px;color:var(--tx)')} /></div>
                    <div><div style={sx('font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px')}>SMS uchun</div><input value={phone} onChange={(e) => setPhone(formatUzPhone(e.target.value))} inputMode="tel" style={sx('width:100%;padding:12px 14px;border:1px solid var(--bd);border-radius:12px;background:var(--field);font-size:14px;color:var(--tx)')} /></div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={sx('font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px')}>Click hisobi (telefon)</div>
                  <input value={phone} onChange={(e) => setPhone(formatUzPhone(e.target.value))} inputMode="tel" style={sx('width:100%;padding:12px 14px;border:1px solid var(--bd);border-radius:12px;background:var(--field);font-size:15px;color:var(--tx)')} />
                </div>
              )}

              <button onClick={pay} style={sx(`width:100%;margin-top:18px;padding:13px;border-radius:12px;border:none;background:${CLICK_BLUE};color:#fff;font-weight:800;font-size:14.5px;cursor:pointer`)}>To‘lash</button>
              <div style={sx('display:flex;align-items:center;justify-content:center;gap:6px;margin-top:12px;font-size:11px;color:var(--sub)')}>
                <Icon name="lock" size={12} color="var(--sub)" /> Click Evolution xavfsiz to‘lov tizimi
              </div>
            </>
          )}

          {step === 'otp' && (
            <div style={sx('text-align:center')}>
              <div style={sx('font-size:14px;color:var(--tx);font-weight:700;margin-bottom:6px')}>SMS kodni kiriting</div>
              <div style={sx('font-size:12.5px;color:var(--sub);margin-bottom:16px')}>{phone} raqamiga yuborilgan 5 xonali kod</div>
              <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="• • • • •" inputMode="numeric" style={sx('width:100%;text-align:center;letter-spacing:10px;padding:14px;border:1px solid var(--bd);border-radius:12px;background:var(--field);font-size:22px;font-weight:800;color:var(--tx)')} />
              <div style={sx('font-size:11px;color:var(--sub);margin-top:8px')}>Demo: istalgan 5 raqamni kiriting</div>
              <button onClick={confirmOtp} disabled={otp.length < 5} style={sx(`width:100%;margin-top:16px;padding:13px;border-radius:12px;border:none;background:${otp.length < 5 ? 'var(--track)' : CLICK_BLUE};color:${otp.length < 5 ? 'var(--sub)' : '#fff'};font-weight:800;font-size:14.5px;cursor:${otp.length < 5 ? 'not-allowed' : 'pointer'}`)}>Tasdiqlash</button>
            </div>
          )}

          {step === 'processing' && (
            <div style={sx('text-align:center;padding:26px 0')}>
              <div className="click-spin" style={sx(`width:48px;height:48px;border-radius:50%;border:4px solid var(--track);border-top-color:${CLICK_BLUE};margin:0 auto 16px`)} />
              <div style={sx('font-size:14px;color:var(--sub)')}>To‘lov amalga oshirilmoqda…</div>
            </div>
          )}

          {step === 'done' && (
            <div style={sx('text-align:center;padding:14px 0')}>
              <div style={sx(`width:60px;height:60px;border-radius:50%;background:rgba(34,197,94,.14);display:flex;align-items:center;justify-content:center;margin:0 auto 14px`)}>
                <Icon name="checkCircle" size={30} color={CLICK_GREEN} />
              </div>
              <div style={sx('font-size:17px;font-weight:800;color:var(--tx)')}>To‘lov muvaffaqiyatli!</div>
              <div style={sx('font-size:13px;color:var(--sub);margin-top:6px')}>{fmt(amount)} so‘m balansingizga qo‘shildi.</div>
              <button onClick={onClose} style={sx('width:100%;margin-top:18px;padding:13px;border-radius:12px;border:none;background:#17A673;color:#fff;font-weight:800;font-size:14.5px;cursor:pointer')}>Yopish</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
