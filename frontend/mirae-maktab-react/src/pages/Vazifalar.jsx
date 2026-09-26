import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { HOMEWORK, SUBJECT_BY_ID, scoreColor, buildMockQuestions, USER } from '../data/mock.js';
import HwModeModal from '../components/HwModeModal.jsx';
import { launchHomeworkGame } from '../utils/gamePortal.js';

const STATUS = {
  not_started: { label: 'Boshlanmagan', fg: 'var(--sub)', bg: 'var(--chip)' },
  in_progress: { label: 'Jarayonda', fg: '#DB8A17', bg: 'rgba(245,165,36,.16)' },
  submitted: { label: 'Topshirilgan', fg: '#2F6FED', bg: 'rgba(47,111,237,.12)' },
  checked: { label: 'Baholangan', fg: '#17A673', bg: 'rgba(23,166,115,.12)' },
};
const TABS = [
  { id: 'today', label: 'Bugun', match: (h) => h.today },
  { id: 'todo', label: 'Bajarilmagan', match: (h) => h.status !== 'checked' && h.status !== 'submitted' && !h.today || (h.overdue && h.status === 'not_started') },
  { id: 'done', label: 'Bajarilgan', match: (h) => h.status === 'checked' || h.status === 'submitted' },
];

export default function Vazifalar() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('today');
  const [modeHw, setModeHw] = useState(null);
  const counts = useMemo(() => ({
    today: HOMEWORK.filter((h) => h.today).length,
    todo: HOMEWORK.filter((h) => (h.status === 'not_started' || h.status === 'in_progress') && !h.today).length,
    done: HOMEWORK.filter((h) => h.status === 'checked' || h.status === 'submitted').length,
  }), []);
  const list = useMemo(() => HOMEWORK.filter(TABS.find((t) => t.id === tab).match), [tab]);

  const start = (h) => {
    if (h.kind === 'practical') { navigate(`/amaliy/${h.id}`); return; }
    setModeHw(h);
  };
  const goTest = (h) => {
    const subj = SUBJECT_BY_ID[h.subjectId];
    setModeHw(null);
    navigate('/test/jarayon', {
      state: {
        preset: { size: h.questions, price: 0, mix: [{ topicId: h.subjectId, count: h.questions }], homeworkId: h.id },
        from: `${subj?.name} — ${h.topic}`,
        homeworkId: h.id,
      },
    });
  };
  const goGame = (h) => {
    const subj = SUBJECT_BY_ID[h.subjectId];
    const questions = buildMockQuestions([{ topicId: h.subjectId, count: h.questions }]).slice(0, h.questions);
    setModeHw(null);
    // External game portal receives JSON and handles play + scoring
    launchHomeworkGame(USER, {
      homework: h,
      subjectName: subj?.name,
      questions,
    });
  };

  return (
    <div className="page-wide" style={sx('padding:1.5rem 1.75rem 2.5rem')}>
      <PageHeader title="Vazifalar" subtitle="Uy vazifalari — testlar va amaliy topshiriqlar." />

      <div className="seg-tabs" style={sx('display:inline-flex;gap:4px;background:var(--soft);border:1px solid var(--bd);border-radius:14px;padding:4px;margin-bottom:18px;flex-wrap:wrap')}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={sx(`display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:none;font-size:13px;font-weight:700;cursor:pointer;background:${on ? 'var(--card)' : 'transparent'};color:${on ? '#3D7DF6' : 'var(--sub)'};box-shadow:${on ? 'var(--shadow)' : 'none'}`)}>
              {t.label}
              <span style={sx(`font-size:11px;font-weight:800;min-width:20px;height:20px;padding:0 6px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;background:${on ? 'rgba(61,125,246,.14)' : 'var(--chip)'};color:${on ? '#3D7DF6' : 'var(--sub)'}`)}>{counts[t.id]}</span>
            </button>
          );
        })}
      </div>

      <div style={sx('display:flex;flex-direction:column;gap:12px;max-width:860px')}>
        {list.length === 0 && <div style={sx('background:var(--card);border:1px dashed var(--bd);border-radius:16px;padding:40px;text-align:center;color:var(--sub);font-size:13.5px')}>Bu bo‘limda vazifa yo‘q.</div>}
        {list.map((h) => {
          const subj = SUBJECT_BY_ID[h.subjectId];
          const st = STATUS[h.status];
          const done = h.status === 'checked' || h.status === 'submitted';
          return (
            <div key={h.id} style={sx(`display:flex;align-items:center;gap:15px;background:var(--card);border:1px solid var(--bd);border-left:4px solid ${h.overdue ? '#DB3D6F' : subj?.color || 'var(--bd)'};border-radius:16px;padding:15px 18px;flex-wrap:wrap`)}>
              <div style={sx(`width:44px;height:44px;border-radius:13px;background:${(subj?.color || '#3D7DF6')}1f;display:flex;align-items:center;justify-content:center;flex:none`)}>
                <Icon name={h.kind === 'practical' ? 'flask' : 'target'} size={19} color={subj?.color || '#3D7DF6'} />
              </div>
              <div style={sx('flex:1;min-width:180px')}>
                <div style={sx('font-size:14.5px;font-weight:700;color:var(--tx)')}>{subj?.name} · {h.topic}</div>
                <div style={sx('font-size:12.5px;color:var(--sub);margin-top:3px;display:flex;gap:10px;flex-wrap:wrap')}>
                  <span>{h.kind === 'practical' ? 'Amaliy' : `${h.questions} savol`}</span><span>·</span>
                  <span>{h.xp} XP</span><span>·</span>
                  <span style={sx(h.overdue ? 'color:#DB3D6F;font-weight:700' : '')}>{h.overdue ? "Muddati o'tgan" : `Muddat: ${new Date(h.deadline).toLocaleDateString('uz-UZ')}`}</span>
                </div>
              </div>
              <span style={sx(`font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:99px;color:${st.fg};background:${st.bg}`)}>{st.label}</span>
              {done && h.score != null
                ? <div className="statnum-sm" style={sx(`font-size:16px;font-weight:800;color:${scoreColor(h.score)};width:48px;text-align:right`)}>{h.score}%</div>
                : <button onClick={() => start(h)} style={sx('display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:11px;border:none;background:#3D7DF6;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;flex:none')}>
                    <Icon name={h.kind === 'practical' ? 'video' : 'play'} size={13} color="#fff" /> {h.kind === 'practical' ? 'Yuklash' : 'Boshlash'}
                  </button>}
            </div>
          );
        })}
      </div>

      <HwModeModal
        open={!!modeHw}
        homework={modeHw}
        subjectName={modeHw ? SUBJECT_BY_ID[modeHw.subjectId]?.name : ''}
        onClose={() => setModeHw(null)}
        onPickTest={() => goTest(modeHw)}
        onPickGame={() => goGame(modeHw)}
      />
    </div>
  );
}
