import { useState } from 'react';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import Icon from '../components/Icon.jsx';
import { useWallet } from '../WalletContext.jsx';
import { useI18n } from '../I18nContext.jsx';
import { PLANS, PLAN_ORDER, USER, fmt } from '../data/mock.js';

export default function Tarif() {
  const { t } = useI18n();
  const { purchase } = useWallet();
  const [current, setCurrent] = useState(USER.plan || 'free');
  const [buy, setBuy] = useState(null);
  const [msg, setMsg] = useState('');

  const choose = (p) => {
    if (p.id === current) return;
    if (p.id === 'free') { setCurrent('free'); setMsg(t('plans.activated')); return; }
    if (p.adminOnly) return;
    setBuy(p);
  };
  const confirmBuy = () => {
    const p = buy; setBuy(null);
    const res = purchase({ amount: p.price, title: `${p.name} tarif` });
    if (res.ok) { setCurrent(p.id); setMsg(t('plans.activated')); }
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title={t('plans.title')} subtitle={t('plans.subtitle')} />
      {msg && <div style={sx('margin-bottom:16px;font-size:13.5px;color:#17A673;background:rgba(23,166,115,.1);border:1px solid rgba(23,166,115,.25);padding:10px 14px;border-radius:12px')}>{msg}</div>}

      <div className="plans-grid" style={sx('display:grid;grid-template-columns:repeat(4,1fr);gap:16px')}>
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const on = id === current;
          const featured = id === 'vip';
          return (
            <div key={id} style={sx(`position:relative;background:var(--card);border:2px solid ${on ? p.color : featured ? p.color + '66' : 'var(--bd)'};border-radius:20px;padding:22px;display:flex;flex-direction:column`)}>
              {featured && !on && <span style={sx(`position:absolute;top:-11px;left:22px;font-size:10.5px;font-weight:800;color:#fff;background:${p.color};padding:3px 10px;border-radius:99px`)}>Ommabop</span>}
              {on && <span style={sx(`position:absolute;top:-11px;left:22px;font-size:10.5px;font-weight:800;color:#fff;background:${p.color};padding:3px 10px;border-radius:99px`)}>{t('plans.current')}</span>}
              <div style={sx(`width:44px;height:44px;border-radius:13px;background:${p.color}22;display:flex;align-items:center;justify-content:center;margin-bottom:14px`)}>
                <Icon name={id === 'free' ? 'user' : id === 'vip2' ? 'bolt' : 'trophy'} size={20} color={p.color} />
              </div>
              <div style={sx('font-size:18px;font-weight:800;color:var(--tx)')}>{p.name}</div>
              <div style={sx('font-size:12.5px;color:var(--sub);margin-top:2px')}>{p.tagline}</div>
              <div style={sx('margin:16px 0')}>
                {p.price === null
                  ? <span style={sx('font-size:22px;font-weight:800;color:var(--tx)')}>—</span>
                  : p.price === 0
                    ? <span style={sx('font-size:22px;font-weight:800;color:var(--tx)')}>{t('plans.free')}</span>
                    : <><span className="statnum" style={sx('font-size:24px;color:var(--tx)')}>{fmt(p.price)}</span><span style={sx('font-size:13px;color:var(--sub);font-weight:600')}> so‘m/{t('plans.month')}</span></>}
              </div>
              <div style={sx('display:flex;flex-direction:column;gap:9px;flex:1')}>
                {p.perks.map((perk) => (
                  <div key={perk} style={sx('display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--tx)')}>
                    <Icon name="check" size={15} color={p.color} strokeWidth={2.4} /> <span style={sx('flex:1')}>{perk}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => choose(p)}
                disabled={on || p.adminOnly}
                style={sx(`margin-top:18px;padding:11px;border-radius:12px;border:none;font-weight:700;font-size:13.5px;cursor:${on || p.adminOnly ? 'default' : 'pointer'};background:${on ? 'var(--soft)' : p.adminOnly ? 'var(--track)' : p.color};color:${on ? p.color : p.adminOnly ? 'var(--sub)' : '#fff'}`)}
              >
                {on ? t('plans.current') : p.adminOnly ? t('plans.adminOnly') : t('plans.choose')}
              </button>
            </div>
          );
        })}
      </div>

      <PurchaseModal
        open={!!buy}
        item={buy && { title: `${buy.name} tarif — 1 ${t('plans.month')}`, price: buy.price, icon: 'trophy', note: buy.tagline, confirmLabel: t('plans.choose') }}
        onConfirm={confirmBuy}
        onClose={() => setBuy(null)}
      />
    </div>
  );
}
