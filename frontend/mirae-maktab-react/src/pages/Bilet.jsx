import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import { useWallet } from '../WalletContext.jsx';
import { useSubject } from '../SubjectContext.jsx';
import { useI18n } from '../I18nContext.jsx';
import { BILETS, fmt, subjectIdOf, hasGroupMembership } from '../data/mock.js';

export default function Bilet() {
  const navigate = useNavigate();
  const { hasPurchased, purchase } = useWallet();
  const { active } = useSubject();
  const { t } = useI18n();
  const member = hasGroupMembership();
  const [filter, setFilter] = useState('all');
  const [buy, setBuy] = useState(null);

  const isOpen = (b) => b.free || member || hasPurchased(`bilet:${b.id}`);

  const subjectBilets = BILETS.filter((b) => subjectIdOf(b.topic) === active.id);
  const filtered = useMemo(() => subjectBilets.filter((b) => {
    if (filter === 'free') return b.free;
    if (filter === 'paid') return !b.free;
    if (filter === 'unlocked') return isOpen(b);
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [filter, hasPurchased, active.id]);

  const startBilet = (b) => navigate('/test/jarayon', { state: { preset: { size: b.questions, mix: b.mix, title: b.title, type: 'Bilet' }, from: b.title } });

  const confirmBuy = () => {
    const b = buy;
    const res = purchase({ key: `bilet:${b.id}`, amount: b.price, title: `Bilet: ${b.title}` });
    setBuy(null);
    if (res.ok) startBilet(b);
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title="Bilet" subtitle={`${active.name} — biletlar. Bepullari darhol; guruh a\u2019zolariga bepul; pullilar bir marta to\u2019lov bilan doimiy ochiladi.`} />

      <div style={sx('display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px')}>
        {[{ key: 'all', label: 'Barchasi' }, { key: 'free', label: 'Bepul' }, { key: 'paid', label: 'Pullik' }, { key: 'unlocked', label: 'Ochilgan' }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={sx(`padding:8px 14px;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid ${filter === f.key ? '#3D7DF6' : 'var(--bd)'};background:${filter === f.key ? 'var(--chip)' : 'var(--card)'};color:${filter === f.key ? '#3D7DF6' : 'var(--sub)'}`)}>{f.label}</button>
        ))}
      </div>

      <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px')}>
        {filtered.map((b) => {
          const open = isOpen(b);
          return (
            <div key={b.id} className="card-h" style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:12px;transition:transform .15s,box-shadow .15s')}>
              <div style={sx('display:flex;justify-content:space-between;align-items:flex-start')}>
                <span style={sx(`font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;${b.free ? 'background:rgba(23,166,115,.12);color:#17A673' : open ? 'background:rgba(76,125,240,.12);color:#4C7DF0' : 'background:rgba(245,165,36,.14);color:#DB8A17'}`)}>
                  {b.free ? 'Bepul' : (member && !hasPurchased(`bilet:${b.id}`)) ? t('bilet.groupFree') : open ? t('bilet.owned') : `${fmt(b.price)} so'm`}
                </span>
                <div style={sx('width:38px;height:38px;border-radius:11px;background:rgba(61,125,246,.10);display:flex;align-items:center;justify-content:center')}>
                  <Icon name="ticket" size={18} color="#3D7DF6" />
                </div>
              </div>
              <div>
                <div style={sx('font-weight:700;font-size:15.5px;color:var(--tx);margin-bottom:4px')}>{b.title}</div>
                <div style={sx('font-size:12.5px;color:var(--sub)')}>{b.topic} &middot; {b.questions} ta savol</div>
              </div>
              <div style={sx('margin-top:auto')}>
                {open ? (
                  <button onClick={() => startBilet(b)} style={sx('width:100%;padding:11px;border-radius:12px;background:linear-gradient(135deg,#3D7DF6,#4C7DF0);color:#fff;font-weight:700;font-size:13.5px;border:none;cursor:pointer')}>Testni boshlash</button>
                ) : (
                  <button onClick={() => setBuy(b)} style={sx('width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;border-radius:12px;background:var(--chip);color:#3D7DF6;font-weight:700;font-size:13.5px;border:1px solid #3D7DF6;cursor:pointer')}>
                    <Icon name="lock" size={14} color="#3D7DF6" /> {fmt(b.price)} so'm — sotib olish
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div style={sx('text-align:center;padding:48px 20px;color:var(--sub)')}>Bu filtr bo‘yicha bilet topilmadi.</div>}

      <PurchaseModal
        open={!!buy}
        item={buy && { title: buy.title, price: buy.price, icon: 'ticket', note: `${buy.questions} ta savol · bir marta to'lov, doimiy ochiq`, confirmLabel: 'Sotib olish' }}
        onConfirm={confirmBuy}
        onClose={() => setBuy(null)}
      />
    </div>
  );
}
