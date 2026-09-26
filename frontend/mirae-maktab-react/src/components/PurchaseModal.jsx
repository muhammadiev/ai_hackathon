import { useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import Icon from './Icon.jsx';
import { useWallet } from '../WalletContext.jsx';
import { fmt } from '../data/mock.js';

/**
 * Confirmation popup for any money-based action (paid test, bilet, video).
 * item: { title, price, icon?, note?, confirmLabel? }
 * onConfirm() runs only when the balance is sufficient and the user confirms.
 */
export default function PurchaseModal({ open, item, onConfirm, onClose }) {
  const { balance } = useWallet();
  const navigate = useNavigate();
  if (!open || !item) return null;

  const price = item.price || 0;
  const enough = balance >= price;
  const after = balance - price;

  return (
    <div onClick={onClose} style={sx('position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,31,51,.45);backdrop-filter:blur(3px)')}>
      <div onClick={(e) => e.stopPropagation()} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:20px;width:min(400px,100%);overflow:hidden;box-shadow:var(--shadowLg)')}>
        <div style={sx('padding:24px 24px 6px;text-align:center')}>
          <div style={sx(`width:56px;height:56px;border-radius:17px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;background:${enough ? 'rgba(61,125,246,.12)' : 'rgba(219,61,111,.12)'}`)}>
            <Icon name={item.icon || 'wallet'} size={24} color={enough ? '#3D7DF6' : '#DB3D6F'} />
          </div>
          <div style={sx('font-weight:800;font-size:17px;color:var(--tx)')}>{enough ? 'Xaridni tasdiqlang' : 'Balans yetarli emas'}</div>
          <div style={sx('font-size:13.5px;color:var(--sub);margin-top:5px')}>{item.title}</div>
          {item.note && <div style={sx('font-size:12px;color:var(--sub);margin-top:4px')}>{item.note}</div>}
        </div>

        <div style={sx('padding:16px 24px 4px')}>
          <div style={sx('background:var(--soft);border:1px solid var(--bd);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px')}>
            <Row label="Narx" value={`${fmt(price)} so'm`} strong />
            <Row label="Joriy balans" value={`${fmt(balance)} so'm`} />
            <div style={sx('height:1px;background:var(--bd)')} />
            <Row
              label="To'lovdan keyin"
              value={enough ? `${fmt(after)} so'm` : `${fmt(price - balance)} so'm yetishmaydi`}
              color={enough ? '#17A673' : '#DB3D6F'} strong
            />
          </div>
        </div>

        <div style={sx('padding:16px 24px 22px;display:flex;gap:10px')}>
          <button onClick={onClose} style={sx('flex:1;padding:12px;border-radius:12px;border:1px solid var(--bd);background:var(--card);color:var(--tx);font-weight:600;font-size:13.5px;cursor:pointer')}>Bekor qilish</button>
          {enough ? (
            <button onClick={onConfirm} style={sx('flex:1.4;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#3D7DF6,#4C7DF0);color:#fff;font-weight:700;font-size:13.5px;cursor:pointer')}>
              {item.confirmLabel || 'Tasdiqlash'}
            </button>
          ) : (
            <button onClick={() => { onClose(); navigate('/tolovlar'); }} style={sx('flex:1.4;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#17A673,#0F9E67);color:#fff;font-weight:700;font-size:13.5px;cursor:pointer')}>
              Balansni to‘ldirish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color, strong }) {
  return (
    <div style={sx('display:flex;align-items:center;justify-content:space-between')}>
      <span style={sx('font-size:13px;color:var(--sub)')}>{label}</span>
      <span style={sx(`font-size:13.5px;font-weight:${strong ? '800' : '600'};color:${color || 'var(--tx)'}`)}>{value}</span>
    </div>
  );
}
