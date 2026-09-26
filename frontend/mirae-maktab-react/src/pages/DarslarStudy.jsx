import { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import { KPI_KIT } from '../components/StatCard.jsx';
import Icon from '../components/Icon.jsx';
import { COURSES, ytId } from '../data/mock.js';

export default function DarslarStudy() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = COURSES.find((c) => c.id === courseId);

  // flatten topics with their bob label + index for prev/next
  const flat = useMemo(() => {
    if (!course) return [];
    const out = [];
    course.paragraphs.forEach((p) => p.topics.forEach((t) => out.push({ ...t, bob: p.title })));
    return out;
  }, [course]);

  const [activeId, setActiveId] = useState(flat[0]?.id);
  const [navOpen, setNavOpen] = useState(false);

  if (!course) return <Navigate to="/darslar" replace />;

  const kit = KPI_KIT[course.kit];
  const pos = Math.max(0, flat.findIndex((t) => t.id === activeId));
  const topic = flat[pos];
  const vid = topic?.video?.source === 'youtube' ? ytId(topic.video.url) : '';

  const startTopicTest = () =>
    navigate('/test/jarayon', {
      state: { preset: { size: 6, price: 0, mix: [{ topicId: course.topicId, count: 6 }] }, from: `${course.title} — ${topic.title}` },
    });

  const TopicList = (
    <div style={sx('display:flex;flex-direction:column;gap:14px')}>
      {course.paragraphs.map((p) => (
        <div key={p.id}>
          <div style={sx('font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--sub);margin:2px 4px 8px')}>{p.title}</div>
          <div style={sx('display:flex;flex-direction:column;gap:4px')}>
            {p.topics.map((t) => {
              const on = t.id === activeId;
              return (
                <button key={t.id} onClick={() => { setActiveId(t.id); setNavOpen(false); }} style={sx(`display:flex;align-items:center;gap:10px;text-align:left;width:100%;padding:10px 12px;border-radius:10px;border:none;cursor:pointer;font-size:13.5px;background:${on ? 'var(--chip)' : 'transparent'};color:${on ? '#3D7DF6' : 'var(--tx)'};font-weight:${on ? '700' : '500'}`)}>
                  <span style={sx(`width:26px;height:26px;flex:none;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${on ? '#3D7DF6' : 'var(--soft)'}`)}>
                    <Icon name={t.hasTest ? 'cap' : 'video'} size={13} color={on ? '#fff' : 'var(--sub)'} />
                  </span>
                  <span style={sx('flex:1;min-width:0')}>{t.title}</span>
                  {t.hasTest && <span style={sx('width:6px;height:6px;border-radius:50%;background:#17A673;flex:none')} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={sx('padding:22px 26px 40px')}>
      {/* header */}
      <div style={sx('display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap')}>
        <button onClick={() => navigate('/darslar')} style={sx('width:38px;height:38px;border-radius:11px;border:1px solid var(--bd);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--tx);flex:none')}>
          <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div style={sx(`width:44px;height:44px;border-radius:13px;background:${kit.bg};display:flex;align-items:center;justify-content:center;flex:none`)}>
          <Icon name={course.icon} size={20} color={kit.fg} />
        </div>
        <div style={sx('min-width:0')}>
          <div style={sx('font-weight:800;font-size:20px;color:var(--tx)')}>{course.title}</div>
          <div style={sx('font-size:12.5px;color:var(--sub)')}>{course.teacher} &middot; {flat.length} mavzu</div>
        </div>
        <button className="study-nav-toggle" onClick={() => setNavOpen((v) => !v)} style={sx('display:none;margin-left:auto;padding:9px 14px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--tx);font-size:13px;font-weight:700;cursor:pointer')}>
          Mavzular
        </button>
      </div>

      <div className="study-grid" style={sx('display:grid;grid-template-columns:270px minmax(0,1fr);gap:20px;align-items:start')}>
        {/* topic navbar */}
        <aside className="study-side" data-open={navOpen ? '1' : '0'} style={sx('background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;position:sticky;top:14px;max-height:calc(100vh - 30px);overflow:auto')}>
          <div style={sx('font-size:12px;font-weight:800;color:var(--tx);margin-bottom:12px')}>Mavzular</div>
          {TopicList}
        </aside>

        {/* content */}
        <div style={sx('min-width:0;display:flex;flex-direction:column;gap:16px')}>
          <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:22px 24px')}>
            <div style={sx('font-size:11.5px;font-weight:700;color:#3D7DF6;background:rgba(61,125,246,.1);display:inline-block;padding:4px 11px;border-radius:99px;margin-bottom:10px')}>{topic.bob}</div>
            <div style={sx('font-weight:800;font-size:21px;color:var(--tx);margin-bottom:10px')}>{topic.title}</div>
            <div style={sx('font-size:14.5px;color:var(--sub);line-height:1.7')}>{topic.statement}</div>
          </div>

          {/* video */}
          {topic.video && (
            <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px;overflow:hidden')}>
              <div style={sx('display:flex;align-items:center;gap:9px;margin-bottom:13px')}>
                <Icon name="video" size={16} color="#3D7DF6" />
                <div style={sx('font-weight:700;font-size:14.5px;color:var(--tx)')}>Video dars</div>
              </div>
              {vid ? (
                <div style={sx('position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000')}>
                  <iframe src={`https://www.youtube-nocookie.com/embed/${vid}`} title={topic.title} loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                </div>
              ) : (
                <div style={sx('width:100%;aspect-ratio:16/9;border-radius:12px;background:linear-gradient(135deg,#2E6BE6,#4C7DF0);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:8px')}>
                  <span style={sx('width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center')}><Icon name="play" size={22} color="#fff" /></span>
                  <span style={sx('font-size:12.5px;color:rgba(255,255,255,.85)')}>Yuklangan video dars</span>
                </div>
              )}
            </div>
          )}

          {/* test CTA */}
          {topic.hasTest && (
            <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap')}>
              <div style={sx('width:44px;height:44px;border-radius:13px;background:rgba(23,166,115,.14);display:flex;align-items:center;justify-content:center;flex:none')}>
                <Icon name="cap" size={20} color="#17A673" />
              </div>
              <div style={sx('flex:1;min-width:160px')}>
                <div style={sx('font-weight:700;font-size:14.5px;color:var(--tx)')}>Mavzu testi</div>
                <div style={sx('font-size:12.5px;color:var(--sub);margin-top:2px')}>Ushbu mavzu bo‘yicha bilimingizni sinab ko‘ring.</div>
              </div>
              <button onClick={startTopicTest} style={sx('display:flex;align-items:center;gap:7px;padding:11px 18px;border-radius:11px;border:none;background:#17A673;color:#fff;font-weight:700;font-size:13px;cursor:pointer')}>
                <Icon name="play" size={14} color="#fff" /> Testni boshlash
              </button>
            </div>
          )}

          {/* prev / next */}
          <div style={sx('display:flex;gap:10px;align-items:center')}>
            <button disabled={pos === 0} onClick={() => setActiveId(flat[pos - 1].id)} style={sx(`padding:11px 16px;border-radius:11px;border:1.5px solid var(--bd);background:var(--card);color:var(--tx);font-weight:600;font-size:13px;cursor:${pos === 0 ? 'not-allowed' : 'pointer'};opacity:${pos === 0 ? .5 : 1}`)}>← Oldingi mavzu</button>
            <div style={sx('flex:1;text-align:center;font-size:12px;color:var(--sub)')}>{pos + 1} / {flat.length}</div>
            <button disabled={pos === flat.length - 1} onClick={() => setActiveId(flat[pos + 1].id)} style={sx(`padding:11px 16px;border-radius:11px;border:none;background:#3D7DF6;color:#fff;font-weight:700;font-size:13px;cursor:${pos === flat.length - 1 ? 'not-allowed' : 'pointer'};opacity:${pos === flat.length - 1 ? .5 : 1}`)}>Keyingi mavzu →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
