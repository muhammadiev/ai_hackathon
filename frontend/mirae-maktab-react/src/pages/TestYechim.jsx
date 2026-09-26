import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import Icon from '../components/Icon.jsx';
import MobileTopBar from '../components/MobileTopBar.jsx';
import { TOPICS, ytId } from '../data/mock.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const topicName = (id) => TOPICS.find((t) => t.id === id)?.name || 'Savol';

export default function TestYechim() {
  const { state } = useLocation();
  const navigate = useNavigate();
  if (!state?.item) return <Navigate to="/test" replace />;

  const { q, no, selected, correctIndex, isCorrect } = state.item;
  const solutions = Array.isArray(q.solutions) ? q.solutions : [];

  return (
    <div style={sx('min-height:100vh;background:var(--bg)')}>
      <MobileTopBar back title="Yechim" />
      <div style={sx('max-width:760px;margin:0 auto;padding:24px 18px 60px')}>
        <button onClick={() => navigate(-1)} style={sx('display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--sub);background:none;border:none;cursor:pointer;margin-bottom:14px;padding:0')}>
          <Icon name="chevronRight" size={15} color="var(--sub)" style={{ transform: 'rotate(180deg)' }} /> Natijaga qaytish
        </button>

        {/* question */}
        <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:22px 24px;margin-bottom:16px')}>
          <div style={sx('display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap')}>
            <span style={sx('font-weight:800;font-size:15px;color:var(--tx)')}>{no}-savol</span>
            <span style={sx('font-size:11px;font-weight:700;color:#0d9488;background:rgba(13,148,136,.12);padding:4px 10px;border-radius:20px')}>{topicName(q.topicId)}</span>
            <span style={sx(`margin-left:auto;font-size:11.5px;font-weight:700;padding:4px 11px;border-radius:14px;color:${isCorrect ? '#17A673' : '#DB3D6F'};background:${isCorrect ? 'rgba(23,166,115,.14)' : 'rgba(219,61,111,.14)'}`)}>{isCorrect ? "Siz to‘g‘ri yechdingiz" : selected == null ? 'Belgilanmagan' : 'Xato javob'}</span>
          </div>

          <div style={sx('font-size:15.5px;line-height:1.6;color:var(--tx);white-space:pre-wrap')}>
            {q.html ? <span dangerouslySetInnerHTML={{ __html: q.html }} /> : q.text}
          </div>
          {q.latex && <div style={sx('font-family:monospace;font-size:13px;color:var(--sub);margin-top:8px')}>{q.latex}</div>}
          {Array.isArray(q.images) && q.images.map((src, k) => (
            <img key={k} src={src} alt="" style={{ maxWidth: '100%', borderRadius: 10, marginTop: 10, border: '1px solid var(--bd)' }} />
          ))}

          <div style={sx('display:grid;gap:9px;margin-top:16px')}>
            {q.options.map((opt, i) => {
              const right = i === correctIndex;
              const picked = i === selected;
              const bg = right ? 'rgba(23,166,115,.10)' : picked ? 'rgba(219,61,111,.10)' : 'var(--soft)';
              const bd = right ? '#17A673' : picked ? '#DB3D6F' : 'var(--bd)';
              const fg = right ? '#0F8A5F' : picked ? '#C42F5C' : 'var(--tx)';
              return (
                <div key={i} style={sx(`display:flex;align-items:center;gap:12px;padding:12px 15px;border:1.5px solid ${bd};border-radius:11px;background:${bg}`)}>
                  <span style={sx(`width:30px;height:30px;flex:none;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:13.5px;color:${fg};background:${right ? 'rgba(23,166,115,.18)' : picked ? 'rgba(219,61,111,.18)' : 'var(--chip)'}`)}>{LETTERS[i]}</span>
                  <span style={sx(`flex:1;font-size:14.5px;color:${fg};font-weight:${right || picked ? '600' : '400'}`)}>{opt.html ? <span dangerouslySetInnerHTML={{ __html: opt.html }} /> : (opt.text ?? opt)}</span>
                  {right && <Icon name="check" size={16} color="#17A673" strokeWidth={2.6} />}
                  {picked && !right && <span style={sx('font-size:15px;color:#DB3D6F;font-weight:800')}>×</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* solutions */}
        <div style={sx('display:flex;align-items:center;gap:9px;margin:6px 4px 12px')}>
          <Icon name="bolt" size={16} color="#3D7DF6" />
          <div style={sx('font-weight:800;font-size:16px;color:var(--tx)')}>To‘liq yechim</div>
        </div>

        {solutions.length === 0 ? (
          <div style={sx('background:var(--card);border:1px dashed var(--bd);border-radius:14px;padding:26px;text-align:center;color:var(--sub);font-size:13.5px')}>
            Bu savol uchun yechim hali qo‘shilmagan.
          </div>
        ) : (
          <div style={sx('display:flex;flex-direction:column;gap:14px')}>
            {solutions.map((s, k) => <SolutionBlock key={k} s={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SolutionBlock({ s }) {
  const vid = s.type === 'video' ? ytId(s.url) : '';
  return (
    <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px 18px')}>
      <div style={sx('display:flex;align-items:center;gap:9px;margin-bottom:12px')}>
        <span style={sx(`width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:none;background:${s.type === 'video' ? 'rgba(61,125,246,.14)' : s.type === 'image' ? 'rgba(23,166,115,.14)' : 'rgba(122,90,248,.14)'}`)}>
          <Icon name={s.type === 'video' ? 'play' : s.type === 'image' ? 'chart' : 'book'} size={16} color={s.type === 'video' ? '#3D7DF6' : s.type === 'image' ? '#17A673' : '#7A5AF8'} />
        </span>
        <div style={sx('font-weight:700;font-size:14px;color:var(--tx)')}>{s.caption || (s.type === 'video' ? 'Video yechim' : s.type === 'image' ? 'Yechim sxemasi' : 'Matnli izoh')}</div>
      </div>

      {s.type === 'video' && (
        vid ? (
          <div style={sx('position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000')}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${vid}`}
              title={s.caption || 'Video yechim'} loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          </div>
        ) : (
          <a href={s.url} target="_blank" rel="noreferrer" style={sx('display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:#3D7DF6')}>
            <Icon name="external" size={15} color="#3D7DF6" /> Videoni ochish
          </a>
        )
      )}

      {s.type === 'image' && <img src={s.url} alt={s.caption || ''} style={{ maxWidth: '100%', borderRadius: 10 }} />}

      {s.type === 'text' && (s.html
        ? <div style={sx('font-size:14px;color:var(--tx);line-height:1.7')} dangerouslySetInnerHTML={{ __html: s.html }} />
        : <div style={sx('font-size:14px;color:var(--tx);line-height:1.7')}>{s.text}</div>)}
    </div>
  );
}
