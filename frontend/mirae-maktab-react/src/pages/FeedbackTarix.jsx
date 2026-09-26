import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import { scoreColor } from '../data/mock.js';

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('mirae-feedback-history') || '[]');
  } catch {
    return [];
  }
}

export default function FeedbackTarix() {
  const navigate = useNavigate();
  const [items] = useState(() => loadHistory());
  const list = useMemo(() => items, [items]);

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title="Feedback tarixi" subtitle="Test va amaliy mashg‘ulotlardan keyingi qisqa tahlillar." />
      {list.length === 0 ? (
        <div style={sx('padding:2rem;text-align:center;color:var(--sub);background:var(--card);border:1px solid var(--bd);border-radius:1rem')}>
          Hali yozuv yo‘q. Test yoki amaliy topshirgach shu yerda ko‘rinadi.
        </div>
      ) : (
        <div style={sx('display:flex;flex-direction:column;gap:0.65rem')}>
          {list.map((e) => (
            <div key={e.id} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1rem;padding:1rem 1.1rem;display:flex;align-items:center;gap:1rem')}>
              <div style={sx(`width:3.2rem;height:3.2rem;border-radius:0.85rem;background:var(--soft);display:grid;place-items:center;font-weight:800;font-size:0.95rem;color:${scoreColor(e.pct || 0)};flex:none`)}>
                {e.pct != null ? `${e.pct}%` : '—'}
              </div>
              <div style={sx('flex:1;min-width:0')}>
                <div style={sx('font-weight:800;color:var(--tx);font-size:0.95rem')}>{e.title}</div>
                <div style={sx('font-size:0.8rem;color:var(--sub);margin-top:0.2rem')}>
                  {e.type === 'amaliy' ? 'Amaliy' : 'Test'}
                  {e.correct != null && e.total != null ? ` · ${e.correct}/${e.total}` : ''}
                  {' · '}
                  {e.at ? new Date(e.at).toLocaleString('uz-UZ') : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => navigate(-1)} style={sx('margin-top:1.25rem;padding:0.7rem 1.1rem;border-radius:0.75rem;border:1px solid var(--bd);background:var(--soft);font-weight:700;cursor:pointer;color:var(--tx)')}>
        Orqaga
      </button>
    </div>
  );
}
