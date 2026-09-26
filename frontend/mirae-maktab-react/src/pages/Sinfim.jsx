import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { CLASS_INFO, CLASSMATES, TIMETABLE, WEEKDAYS, BELL, SUBJECT_BY_ID, fmt } from '../data/mock.js';

export default function Sinfim() {
  const maxLessons = Math.max(...TIMETABLE.map((d) => d.filter(Boolean).length), 1);

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader
        title="Sinfim"
        subtitle={`${CLASS_INFO.name} · sinf rahbari: ${CLASS_INFO.rahbar} · ${CLASS_INFO.year}`}
      />

      {/* summary KPIs — responsive */}
      <div
        className="sinf-kpi"
        style={sx('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.85rem;margin-bottom:1.1rem')}
      >
        {[
          ['Sinf', CLASS_INFO.name, 'users', '#2F6FED'],
          ['O‘quvchilar', CLASS_INFO.students, 'user', '#17A673'],
          ['Mening o‘rnim', `#4 / ${CLASS_INFO.students}`, 'trophy', '#F5A524'],
        ].map(([l, v, ic, c]) => (
          <div
            key={l}
            style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1rem;padding:1rem;display:flex;align-items:center;gap:0.85rem;min-width:0')}
          >
            <div style={sx(`width:2.75rem;height:2.75rem;border-radius:0.8rem;background:${c}22;display:flex;align-items:center;justify-content:center;flex:none`)}>
              <Icon name={ic} size={20} color={c} />
            </div>
            <div style={sx('min-width:0')}>
              <div className="statnum" style={sx('font-size:1.15rem;font-weight:800;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{v}</div>
              <div style={sx('font-size:0.75rem;color:var(--sub)')}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* main: timetable + ranking — stacks on mobile */}
      <div className="sinf-grid" style={sx('display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:1rem;align-items:start')}>
        {/* Dars jadvali */}
        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.1rem;padding:1.1rem;min-width:0')}>
          <div style={sx('font-weight:800;font-size:0.95rem;color:var(--tx);margin-bottom:0.85rem')}>Dars jadvali</div>

          {/* Desktop / wide: table */}
          <div className="sinf-tt-table" style={sx('overflow-x:auto;-webkit-overflow-scrolling:touch')}>
            <table style={sx('width:100%;border-collapse:collapse;font-size:0.75rem;min-width:32rem')}>
              <thead>
                <tr>
                  <th style={sx('padding:0.5rem;text-align:left;color:var(--sub);font-weight:700;width:4.5rem')}>Dars</th>
                  {WEEKDAYS.map((d) => (
                    <th key={d} style={sx('padding:0.5rem;text-align:center;color:var(--sub);font-weight:700')}>{d.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxLessons }).map((_, li) => (
                  <tr key={li} style={sx('border-top:1px solid var(--bd)')}>
                    <td style={sx('padding:0.5rem;color:var(--sub);font-weight:700;white-space:nowrap')}>
                      {li + 1}
                      <div style={sx('font-size:0.65rem;font-weight:600')}>{BELL[li] || ''}</div>
                    </td>
                    {TIMETABLE.map((day, di) => {
                      const cell = day[li];
                      const sub = cell ? SUBJECT_BY_ID[cell.subjectId] : null;
                      return (
                        <td key={di} style={sx('padding:0.4rem;text-align:center;vertical-align:middle')}>
                          {sub ? (
                            <span
                              style={sx(`display:inline-block;max-width:100%;padding:0.35rem 0.45rem;border-radius:0.5rem;font-size:0.68rem;font-weight:800;color:${sub.color};background:${sub.color}18;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}
                              title={sub.name}
                            >
                              {sub.name.slice(0, 8)}
                            </span>
                          ) : (
                            <span style={sx('color:var(--sub);opacity:.35')}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: day cards */}
          <div className="sinf-tt-days" style={sx('display:none;flex-direction:column;gap:0.75rem')}>
            {WEEKDAYS.map((dayName, di) => {
              const lessons = (TIMETABLE[di] || []).filter(Boolean);
              return (
                <div key={dayName} style={sx('border:1px solid var(--bd);border-radius:0.9rem;overflow:hidden;background:var(--soft)')}>
                  <div style={sx('padding:0.65rem 0.85rem;font-weight:800;font-size:0.85rem;color:var(--tx);border-bottom:1px solid var(--bd);background:var(--card)')}>
                    {dayName}
                  </div>
                  {lessons.length === 0 ? (
                    <div style={sx('padding:0.75rem 0.85rem;font-size:0.8rem;color:var(--sub)')}>Dars yo‘q</div>
                  ) : (
                    lessons.map((cell, i) => {
                      const sub = SUBJECT_BY_ID[cell.subjectId];
                      if (!sub) return null;
                      return (
                        <div
                          key={i}
                          style={sx('display:flex;align-items:center;gap:0.75rem;padding:0.7rem 0.85rem;border-top:1px solid var(--bd);background:var(--card)')}
                        >
                          <span style={sx('font-size:0.7rem;font-weight:800;color:var(--sub);width:3.2rem;flex:none')}>{BELL[i] || `${i + 1}`}</span>
                          <span style={sx(`width:0.5rem;height:0.5rem;border-radius:0.15rem;background:${sub.color};flex:none`)} />
                          <span style={sx('font-size:0.85rem;font-weight:700;color:var(--tx);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{sub.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sinf reytingi */}
        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:1.1rem;padding:1.1rem;min-width:0')}>
          <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.85rem;flex-wrap:wrap')}>
            <div style={sx('font-weight:800;font-size:0.95rem;color:var(--tx)')}>Sinf reytingi</div>
            <span style={sx('font-size:0.75rem;font-weight:700;color:#3D7DF6')}>XP bo‘yicha</span>
          </div>
          <div style={sx('display:flex;flex-direction:column;gap:0.45rem')}>
            {CLASSMATES.map((c, i) => {
              const rank = c.rank || i + 1;
              const medal = rank === 1 ? '#F5A524' : rank === 2 ? '#94a3b8' : rank === 3 ? '#c2410c' : null;
              return (
                <div
                  key={c.name}
                  style={sx(`display:flex;align-items:center;gap:0.65rem;padding:0.65rem 0.7rem;border-radius:0.75rem;background:${c.me ? 'rgba(61,125,246,.1)' : 'var(--soft)'};border:1px solid ${c.me ? 'rgba(61,125,246,.25)' : 'transparent'};min-width:0`)}
                >
                  <span
                    style={sx(`width:1.65rem;height:1.65rem;border-radius:0.5rem;display:grid;place-items:center;font-size:0.7rem;font-weight:800;flex:none;color:${medal ? '#fff' : 'var(--sub)'};background:${medal || 'var(--chip)'}`)}
                  >
                    {rank}
                  </span>
                  <div style={sx(`flex:1;min-width:0;font-size:0.85rem;font-weight:${c.me ? '800' : '600'};color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap`)}>
                    {c.name}{c.me ? ' (siz)' : ''}
                  </div>
                  <div style={sx('font-size:0.75rem;font-weight:800;color:#3D7DF6;flex:none')}>{fmt(c.xp)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
