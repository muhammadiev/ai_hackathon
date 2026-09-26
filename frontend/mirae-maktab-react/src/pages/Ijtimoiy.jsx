import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { SOCIALS, fmt } from '../data/mock.js';

const PLATFORM_META = {
  telegram: { icon: 'telegram', fg: '#2F6FED', bg: 'rgba(47,111,237,.12)', grad: 'linear-gradient(135deg,#2F6FED,#4C7DF0)', label: 'Telegram', cta: "Qo'shilish" },
  instagram: { icon: 'instagram', fg: '#DB3D6F', bg: 'rgba(219,61,111,.12)', grad: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)', label: 'Instagram', cta: 'Obuna bo\u2019lish' },
  youtube: { icon: 'youtube', fg: '#E5484D', bg: 'rgba(229,72,77,.12)', grad: 'linear-gradient(135deg,#FF4E45,#C4302B)', label: 'YouTube', cta: 'Obuna bo\u2019lish' },
};

export default function Ijtimoiy() {
  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title="Ijtimoiy tarmoqlar" subtitle="Telegram kanal/guruhlarimiz va boshqa ijtimoiy tarmoqlarimiz." />
      <div className="ijtimoiy-grid" style={sx('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
        {SOCIALS.map((s) => {
          const meta = PLATFORM_META[s.platform];
          return (
            <div key={s.id} className="card-h" style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:14px;transition:transform .15s,box-shadow .15s')}>
              <div style={sx('display:flex;align-items:center;justify-content:space-between')}>
                <div style={sx(`width:46px;height:46px;border-radius:14px;background:${meta.bg};display:flex;align-items:center;justify-content:center`)}>
                  <Icon name={meta.icon} size={21} color={meta.fg} strokeWidth={2} />
                </div>
                <span style={sx('font-size:11px;font-weight:700;color:var(--sub);background:var(--soft);border:1px solid var(--bd);padding:4px 10px;border-radius:99px')}>{meta.label}</span>
              </div>
              <div>
                <div style={sx('font-size:15px;font-weight:700;color:var(--tx)')}>{s.name}</div>
                <div style={sx('font-size:12.5px;color:var(--sub);margin-top:3px')}>{fmt(s.followers)} obunachi</div>
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" style={sx(`display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;border-radius:12px;font-size:13.5px;font-weight:700;text-decoration:none;background:${meta.grad};color:#fff`)}>
                <Icon name="external" size={15} color="#fff" /> {meta.cta}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
