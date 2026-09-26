import { useState } from 'react';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { fmt } from '../data/mock.js';
import { useWallet } from '../WalletContext.jsx';
import ClickPayModal from '../components/ClickPayModal.jsx';

const AMOUNTS = [10000, 25000, 50000, 100000];
const STATUS_META = {
  success: { label: 'Muvaffaqiyatli', fg: '#17A673', bg: 'rgba(23,166,115,.12)' },
  failed: { label: 'Bekor qilindi', fg: '#DB3D6F', bg: 'rgba(219,61,111,.12)' },
};

export default function Tolovlar() {
  const { balance, transactions, topUp } = useWallet();
  const [amount, setAmount] = useState(AMOUNTS[1]);
  const [custom, setCustom] = useState('');
  const [toast, setToast] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const chosen = custom ? Number(custom) : amount;

  const doTopUp = () => {
    if (!chosen || chosen <= 0) return;
    setPayOpen(true);
  };
  const onPaid = (amt) => {
    topUp(amt);
    setToast(`${fmt(amt)} so'm balansingizga qo'shildi ✅`);
    setCustom('');
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title="To'lovlar" subtitle="Click orqali hisobingizni to'ldiring va xarid tarixini kuzating." />

      <div style={sx('display:grid;grid-template-columns:1fr 1.15fr;gap:18px;margin-bottom:20px')}>
        <div style={sx('background:linear-gradient(135deg,#1E3A8A,#2E6BE6);border-radius:20px;padding:26px;color:#fff')}>
          <div style={sx('display:flex;align-items:center;gap:9px;font-size:13px;color:rgba(255,255,255,.75);margin-bottom:8px')}>
            <Icon name="wallet" size={16} color="#fff" /> Joriy balans
          </div>
          <div className="statnum" style={sx('font-size:36px;margin-bottom:22px')}>{fmt(balance)} <span style={sx('font-size:16px;font-weight:600;color:rgba(255,255,255,.7)')}>so'm</span></div>

          <div style={sx('font-size:12.5px;color:rgba(255,255,255,.75);margin-bottom:10px')}>Tezkor summa tanlang</div>
          <div style={sx('display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px')}>
            {AMOUNTS.map((a) => (
              <button key={a} onClick={() => { setAmount(a); setCustom(''); }} style={sx(`padding:11px;border-radius:11px;font-weight:700;font-size:13.5px;cursor:pointer;border:1.5px solid ${!custom && amount === a ? '#fff' : 'rgba(255,255,255,.3)'};background:${!custom && amount === a ? '#fff' : 'transparent'};color:${!custom && amount === a ? '#1E3A8A' : '#fff'}`)}>
                {fmt(a)}
              </button>
            ))}
          </div>
          <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} placeholder="Boshqa summa" style={sx('width:100%;padding:11px 14px;border-radius:11px;border:1.5px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;font-size:13.5px;margin-bottom:16px')} />

          <button onClick={doTopUp} style={sx('width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;border-radius:12px;border:none;background:#fff;color:#1E3A8A;font-weight:700;font-size:14px;cursor:pointer')}>
            <Icon name="bolt" size={15} color="#1E3A8A" /> Click orqali {fmt(chosen)} so'm to'ldirish
          </button>
          {toast && <div style={sx('margin-top:12px;font-size:12.5px;color:#fff;background:rgba(255,255,255,.16);border-radius:10px;padding:9px 12px;text-align:center')}>{toast}</div>}
        </div>

        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:20px;padding:22px')}>
          <div style={sx('font-family:Inter;font-weight:700;font-size:15px;color:var(--tx);margin-bottom:4px')}>Sarflash bo'yicha ma'lumot</div>
          <div style={sx('font-size:12.5px;color:var(--sub);margin-bottom:16px')}>Balans video darslar, tasodifiy testlar va biletlar uchun ishlatiladi.</div>
          <div style={sx('display:flex;flex-direction:column;gap:10px')}>
            {[
              { icon: 'target', label: 'Tasodifiy testlar', note: '30 ta \u2014 7 000 so\u2019m, 50 ta \u2014 10 000 so\u2019m' },
              { icon: 'video', label: 'Videodarslar', note: 'Har birining narxi mavzuga qarab farqlanadi' },
              { icon: 'layers', label: 'Vazifalar', note: "O'qituvchi tomonidan biriktirilgan \u2014 bepul" },
            ].map((r) => (
              <div key={r.label} style={sx('display:flex;align-items:center;gap:12px;padding:11px 13px;border:1px solid var(--bd);border-radius:12px')}>
                <div style={sx('width:36px;height:36px;border-radius:10px;background:rgba(61,125,246,.12);display:flex;align-items:center;justify-content:center;flex:none')}>
                  <Icon name={r.icon} size={16} color="#3D7DF6" />
                </div>
                <div>
                  <div style={sx('font-size:13.5px;font-weight:600;color:var(--tx)')}>{r.label}</div>
                  <div style={sx('font-size:12px;color:var(--sub);margin-top:1px')}>{r.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:20px')}>
        <div style={sx('font-family:Inter;font-weight:700;font-size:15px;color:var(--tx);margin-bottom:14px')}>Tranzaksiyalar tarixi</div>
        <div style={sx('display:flex;flex-direction:column')}>
          {transactions.map((t) => {
            const meta = STATUS_META[t.status];
            const topup = t.type === 'topup';
            return (
              <div key={t.id} style={sx('display:flex;align-items:center;gap:14px;padding:13px 6px;border-bottom:1px solid var(--bd);flex-wrap:wrap')}>
                <div style={sx(`width:38px;height:38px;border-radius:11px;background:${topup ? 'rgba(23,166,115,.12)' : 'rgba(61,125,246,.12)'};display:flex;align-items:center;justify-content:center;flex:none`)}>
                  <Icon name={topup ? 'bolt' : 'wallet'} size={16} color={topup ? '#17A673' : '#3D7DF6'} />
                </div>
                <div style={sx('flex:1;min-width:160px')}>
                  <div style={sx('font-size:13.5px;font-weight:600;color:var(--tx)')}>{t.title}</div>
                  <div style={sx('font-size:11.5px;color:var(--sub)')}>{new Date(t.date).toLocaleString('uz-UZ')}</div>
                </div>
                <span style={sx(`font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;color:${meta.fg};background:${meta.bg};flex:none`)}>{meta.label}</span>
                <div className="statnum-sm" style={sx(`font-size:14px;width:120px;text-align:right;color:${t.amount > 0 ? '#17A673' : 'var(--tx)'}`)}>
                  {t.amount > 0 ? '+' : ''}{fmt(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ClickPayModal open={payOpen} amount={chosen} onClose={() => setPayOpen(false)} onSuccess={onPaid} />
    </div>
  );
}
