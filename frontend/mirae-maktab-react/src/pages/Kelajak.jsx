import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { useWallet } from '../WalletContext.jsx';
import { fmt } from '../data/mock.js';
import { fetchTwin, fetchProposedPacks, fetchPackHistory, purchasePack } from '../api/kelajak.js';

const DEMO_TWIN = {
  midpoint: 62,
  low: 54,
  high: 71,
  methodology: 'Ehtimollik diapazoni: o‘tgan testlar, mavzu mastery (p_know) va sinf baselini asosida qayta hisoblanadi. Bu kafolat emas.',
  curve: [
    { label: '3 oy oldin', value: 48 },
    { label: '2 oy', value: 52 },
    { label: '1 oy', value: 58 },
    { label: 'Hozir', value: 62 },
  ],
};

const DEMO_PACKS = [
  {
    id: 'pack-alg',
    title: 'Algebra tezlatish',
    topics: ['Kvadrat tenglamalar', 'Funksiyalar'],
    weeks: 3,
    price: 45000,
    before: { low: 54, mid: 62, high: 71 },
    after: { low: 60, mid: 68, high: 76 },
    lift_negligible: false,
  },
  {
    id: 'pack-geo',
    title: 'Geometriya mustahkamlash',
    topics: ['Uchburchaklar', 'Aylana'],
    weeks: 2,
    price: 35000,
    before: { low: 54, mid: 62, high: 71 },
    after: { low: 56, mid: 64, high: 72 },
    lift_negligible: true,
  },
];

const DISCLAIMER =
  'Natija kafolatlanmaydi. Ko‘rsatilgan diapazon statistik prognoz. To‘lov demo-hamyondan yechiladi; o‘qituvchi ulushi (~20%) alohida hisoblanadi.';

function RangeLine({ low, mid, high }) {
  return (
    <div style={sx('margin-top:0.35rem')}>
      <div style={sx('font-size:1.75rem;font-weight:800;color:var(--tx);letter-spacing:-.03em')}>{mid}%</div>
      <div style={sx('font-size:0.8rem;color:var(--sub);font-weight:600')}>
        Diapazon: {low}% – {high}%
      </div>
    </div>
  );
}

export default function Kelajak() {
  const { balance, purchase } = useWallet();
  const [twin, setTwin] = useState(DEMO_TWIN);
  const [packs, setPacks] = useState(DEMO_PACKS);
  const [history, setHistory] = useState([]);
  const [buyId, setBuyId] = useState(null);
  const [msg, setMsg] = useState('');
  const [miraeOpen, setMiraeOpen] = useState(false);
  const [miraeReady, setMiraeReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await fetchTwin();
      if (t) setTwin({ ...DEMO_TWIN, ...t });
      const p = await fetchProposedPacks();
      if (p?.length) setPacks(p);
      const h = await fetchPackHistory();
      if (h?.length) setHistory(h);
    })();
  }, []);

  const visiblePacks = useMemo(
    () => packs.filter((p) => !p.lift_negligible),
    [packs]
  );

  const doPurchase = async (pack) => {
    setMsg('');
    if (balance < pack.price) {
      setMsg('Balans yetarli emas. Avval To‘lovlar orqali to‘ldiring.');
      return;
    }
    // Demo wallet (matches simple payments rule)
    const res = purchase({ amount: pack.price, title: `Tezlatish: ${pack.title}`, key: `pack:${pack.id}` });
    if (!res.ok) {
      setMsg(res.error || 'Xarid amalga oshmadi');
      return;
    }
    try {
      await purchasePack(pack.id);
    } catch { /* demo ok */ }
    setHistory((prev) => [
      {
        id: `h-${Date.now()}`,
        title: pack.title,
        before: pack.before,
        projected: pack.after,
        actual: null,
        status: 'active',
      },
      ...prev,
    ]);
    setBuyId(null);
    setMsg('Paket faollashtirildi (demo). O‘qituvchi yakunlagach twin qayta hisoblanadi.');
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader
        title="Mirae (Kelajak)"
        subtitle="Living Twin — ehtimollik diapazoni, tezlatish paketlari. Kafolat emas."
      />

      {/* Twin card */}
      <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.25rem;padding:1.35rem 1.25rem;margin-bottom:1.1rem')}>
        <div style={sx('display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap')}>
          <div>
            <div style={sx('font-size:0.75rem;font-weight:800;color:#7A5AF8;letter-spacing:.04em;text-transform:uppercase')}>Student Twin</div>
            <RangeLine low={twin.low} mid={twin.midpoint} high={twin.high} />
          </div>
          <div style={sx('display:flex;gap:0.35rem;align-items:flex-end;height:4.5rem')}>
            {(twin.curve || []).map((c) => (
              <div key={c.label} style={sx('display:flex;flex-direction:column;align-items:center;gap:0.25rem')}>
                <div style={sx(`width:1.6rem;border-radius:0.35rem 0.35rem 0 0;background:linear-gradient(180deg,#7A5AF8,#3D7DF6);height:${Math.max(12, c.value * 0.55)}px`)} />
                <span style={sx('font-size:0.6rem;color:var(--sub);font-weight:600;max-width:3.2rem;text-align:center')}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={sx('margin:1rem 0 0;font-size:0.8rem;color:var(--sub);line-height:1.5')}>
          {twin.methodology}
        </p>
        <p style={sx('margin:0.5rem 0 0;font-size:0.75rem;color:#DB8A17;font-weight:700')}>
          Diapazon — prognoz, yakuniy natija emas.
        </p>
      </div>


      <div style={sx('display:flex;flex-wrap:wrap;gap:0.65rem;margin-bottom:1.25rem')}>
        <button
          type="button"
          onClick={() => setMiraeOpen(true)}
          style={sx('display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.15rem;border-radius:0.85rem;border:none;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);color:#fff;font-weight:800;font-size:0.9rem;cursor:pointer')}
        >
          <Icon name="bolt" size={16} color="#fff" /> Mirae — yangi universitet tahlili
        </button>
      </div>

      {miraeReady && (
        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.15rem;padding:1.15rem;margin-bottom:1.15rem')}>
          <div style={sx('font-weight:800;color:var(--tx);margin-bottom:0.65rem')}>Universitet mosligi (demo)</div>
          {[
            { uni: 'TATU', dir: 'Dasturiy injiniring', grant: '35–50%', note: 'Twin diapazoningizga yaqin' },
            { uni: 'TDIU', dir: 'Iqtisodiyot', grant: '25–40%', note: 'Qo‘shimcha fanlar tavsiya' },
            { uni: 'INHA', dir: 'Computer Science', grant: '15–28%', note: 'Yuqori talab — paket yordamida' },
          ].map((r) => (
            <div key={r.uni} style={sx('padding:0.75rem 0;border-top:1px solid var(--bd);display:flex;justify-content:space-between;gap:0.75rem;flex-wrap:wrap')}>
              <div>
                <div style={sx('font-weight:800;color:var(--tx)')}>{r.uni} · {r.dir}</div>
                <div style={sx('font-size:0.8rem;color:var(--sub)')}>{r.note}</div>
              </div>
              <div style={sx('font-size:0.8rem;font-weight:800;color:#3D7DF6')}>Grant: {r.grant}</div>
            </div>
          ))}
          <p style={sx('margin:0.75rem 0 0;font-size:0.75rem;color:var(--sub)')}>Bu tavsiya — ehtimollik; kafolat emas. Haqiqiy qabul ballariga bog‘liq.</p>
        </div>
      )}

      {/* Acceleration packs */}
      <div style={sx('font-weight:800;font-size:1rem;color:var(--tx);margin-bottom:0.75rem')}>Tezlatish paketlari</div>
      {visiblePacks.length === 0 ? (
        <div style={sx('padding:1.25rem;border-radius:1rem;background:var(--soft);border:1px solid var(--bd);color:var(--sub);font-size:0.9rem;margin-bottom:1.1rem')}>
          Hozircha sezilarli o‘sish kutiladigan paket yo‘q (lift negligible).
        </div>
      ) : (
        <div style={sx('display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0.9rem;margin-bottom:1.25rem')}>
          {visiblePacks.map((p) => (
            <div key={p.id} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.1rem;padding:1.1rem;display:flex;flex-direction:column;gap:0.65rem')}>
              <div style={sx('font-weight:800;font-size:1rem;color:var(--tx)')}>{p.title}</div>
              <div style={sx('display:flex;flex-wrap:wrap;gap:0.35rem')}>
                {(p.topics || []).map((t) => (
                  <span key={t} style={sx('font-size:0.7rem;font-weight:700;padding:0.25rem 0.55rem;border-radius:99px;background:var(--soft);color:var(--sub);border:1px solid var(--bd)')}>{t}</span>
                ))}
              </div>
              <div style={sx('font-size:0.8rem;color:var(--sub)')}>{p.weeks} hafta · {fmt(p.price)} so‘m</div>
              <div style={sx('font-size:0.8rem;color:var(--tx)')}>
                <span style={sx('color:var(--sub)')}>Oldin:</span> {p.before.low}–{p.before.high}% (≈{p.before.mid})
                <br />
                <span style={sx('color:var(--sub)')}>Keyin (prognoz):</span> {p.after.low}–{p.after.high}% (≈{p.after.mid})
              </div>
              <p style={sx('margin:0;font-size:0.72rem;color:var(--sub);line-height:1.4')}>{DISCLAIMER}</p>
              <button
                type="button"
                onClick={() => setBuyId(p.id)}
                style={sx('margin-top:auto;width:100%;padding:0.75rem;border-radius:0.75rem;border:none;background:#3D7DF6;color:#fff;font-weight:800;cursor:pointer;font-size:0.85rem')}
              >
                Sotib olish (demo)
              </button>
            </div>
          ))}
        </div>
      )}

      {msg && (
        <div style={sx(`margin-bottom:1rem;padding:0.85rem 1rem;border-radius:0.85rem;font-size:0.85rem;font-weight:700;background:${msg.includes('yetarli') || msg.includes('oshadi') ? 'rgba(219,61,111,.1)' : 'rgba(23,166,115,.1)'};color:${msg.includes('yetarli') || msg.includes('oshadi') ? '#DB3D6F' : '#17A673'}`)}>
          {msg} {msg.includes('yetarli') && <Link to="/tolovlar" style={{ color: 'inherit', textDecoration: 'underline' }}>To‘lovlar</Link>}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <div style={sx('font-weight:800;font-size:1rem;color:var(--tx);margin-bottom:0.75rem')}>Paket tarixi</div>
          <div style={sx('display:flex;flex-direction:column;gap:0.65rem')}>
            {history.map((h) => (
              <div key={h.id} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1rem;padding:1rem')}>
                <div style={sx('font-weight:800;color:var(--tx)')}>{h.title}</div>
                <div style={sx('font-size:0.8rem;color:var(--sub);margin-top:0.35rem')}>
                  Oldin ≈{h.before?.mid}% · Prognoz ≈{h.projected?.mid}%
                  {h.actual != null ? ` · Haqiqiy ≈${h.actual.mid}%` : ' · Haqiqiy: o‘qituvchi yakunlagach'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Purchase sheet */}
      {buyId && (() => {
        const pack = packs.find((p) => p.id === buyId);
        if (!pack) return null;
        return (
          <div role="dialog" onClick={() => setBuyId(null)} style={sx('position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.5);display:flex;align-items:flex-end;justify-content:center;padding:1rem')}>
            <div onClick={(e) => e.stopPropagation()} style={sx('background:var(--card);border-radius:1.25rem 1.25rem 1rem 1rem;padding:1.35rem;width:min(28rem,100%);box-shadow:0 -1rem 2rem rgba(0,0,0,.2)')}>
              <div style={sx('font-weight:800;font-size:1.1rem;color:var(--tx)')}>{pack.title}</div>
              <div style={sx('font-size:0.9rem;color:var(--sub);margin:0.5rem 0')}>{fmt(pack.price)} so‘m · balans: {fmt(balance)}</div>
              <p style={sx('font-size:0.8rem;color:var(--sub);line-height:1.5;margin:0 0 1rem')}>{DISCLAIMER}</p>
              <div style={sx('display:flex;gap:0.55rem')}>
                <button type="button" onClick={() => setBuyId(null)} style={sx('flex:1;padding:0.75rem;border-radius:0.75rem;border:1px solid var(--bd);background:var(--soft);font-weight:700;cursor:pointer;color:var(--tx)')}>Bekor</button>
                <button type="button" onClick={() => doPurchase(pack)} style={sx('flex:1;padding:0.75rem;border-radius:0.75rem;border:none;background:#3D7DF6;color:#fff;font-weight:800;cursor:pointer')}>Tasdiqlash</button>
              </div>
            </div>
          </div>
        );
      })()}

      {miraeOpen && (
        <div role="dialog" onClick={() => setMiraeOpen(false)} style={sx('position:fixed;inset:0;z-index:85;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:1rem')}>
          <div onClick={(e) => e.stopPropagation()} style={sx('background:var(--card);border-radius:1.2rem;padding:1.4rem 1.25rem;width:min(26rem,100%);box-shadow:0 1.25rem 2.5rem rgba(0,0,0,.25)')}>
            <div style={sx('font-weight:800;font-size:1.15rem;color:var(--tx);margin-bottom:0.5rem')}>Mirae tahlili nima qiladi?</div>
            <ul style={sx('margin:0 0 1rem;padding-left:1.1rem;color:var(--sub);font-size:0.88rem;line-height:1.55')}>
              <li>Twin ball diapazoni va mastery (p_know) olinadi</li>
              <li>Universitet / yo‘nalish grant-kontrakt ehtimollari hisoblanadi</li>
              <li>Sizga 2–4 ta mos yo‘nalish va qisqa izoh chiqadi</li>
              <li>Natija kafolat emas — faqat statistik tavsiya</li>
              <li>Demo rejimda to‘lov yo‘q; keyin wallet bilan bog‘lanishi mumkin</li>
            </ul>
            <div style={sx('display:flex;gap:0.5rem')}>
              <button type="button" onClick={() => setMiraeOpen(false)} style={sx('flex:1;padding:0.75rem;border-radius:0.75rem;border:1px solid var(--bd);background:var(--soft);font-weight:700;cursor:pointer;color:var(--tx)')}>Bekor</button>
              <button type="button" onClick={() => { setMiraeOpen(false); setMiraeReady(true); }} style={sx('flex:1;padding:0.75rem;border-radius:0.75rem;border:none;background:linear-gradient(135deg,#3D7DF6,#7A5AF8);color:#fff;font-weight:800;cursor:pointer')}>Tahlilni olish</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
