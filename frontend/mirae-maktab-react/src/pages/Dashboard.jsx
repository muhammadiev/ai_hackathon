import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import PageHeader from '../components/PageHeader.jsx';
import Ring from '../components/Ring.jsx';
import Icon from '../components/Icon.jsx';
import { useSubject } from '../SubjectContext.jsx';
import { Sparkline, Donut, DonutLegend, ProgressRow } from '../components/Charts.jsx';
import {
  USER,
  ANNOUNCEMENTS,
  CLASSMATES,
  todaysLessons,
  subjectReadiness,
  fmt,
  scoreColor,
} from '../data/mock.js';
import HwModeModal from '../components/HwModeModal.jsx';
import { fetchMyMastery } from '../api/mastery.js';
import { fetchDashboard } from '../api/dashboard.js';
import { fetchMyProfile } from '../api/auth.js';
import { launchHomeworkGame, launchSimpleGame } from '../utils/gamePortal.js';

const HW_STATUS = {
  not_started: { label: 'Boshlanmagan', c: 'var(--sub)' },
  in_progress: { label: 'Jarayonda', c: '#DB8A17' },
  submitted: { label: 'Topshirilgan', c: '#2F6FED' },
  checked: { label: 'Baholangan', c: '#17A673' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { active, enrolled, setActive } = useSubject();
  const [openFan, setOpenFan] = useState(false);
  const [modeHw, setModeHw] = useState(null);
  const [mastery, setMastery] = useState(null);
  const [me, setMe] = useState(null);
  const [dash, setDash] = useState(null);
  const [loadErr, setLoadErr] = useState('');

  const lessons = todaysLessons();
  const readiness = active ? subjectReadiness(active) : 0;
  const trend = active?.trend?.length > 1 ? active.trend : [readiness, readiness];
  const topics = active?.topics || [];
  const donutSegs = topics.map((t) => ({ value: t.solved, color: t.color, label: t.name }));
  const weak = [...topics].sort((a, b) => (a.solved / a.total) - (b.solved / b.total)).slice(0, 2);
  const xpPct = Math.min(100, Math.round((USER.xp / USER.levelXp) * 100));

  const displayName =
    me?.profile?.full_name || me?.username || USER.name;
  const classLabel =
    me?.class_info?.class_name ||
    dash?.user?.class_info?.class_name ||
    USER.className;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profile, dashboard, mast] = await Promise.all([
          fetchMyProfile().catch(() => null),
          fetchDashboard().catch(() => null),
          fetchMyMastery().catch(() => null),
        ]);
        if (cancelled) return;
        setMe(profile);
        setDash(dashboard);
        setMastery(mast);
      } catch (e) {
        if (!cancelled) setLoadErr(e?.message || 'Ma’lumot yuklanmadi');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startHw = (l) => {
    if (!l.hw) return;
    if (l.hw.kind === 'practical') {
      navigate(`/amaliy/${l.hw.id}`);
      return;
    }
    setModeHw({ ...l.hw, _subjectName: l.subject.name, subjectId: l.subjectId });
  };

  const goTestHw = (h) => {
    setModeHw(null);
    navigate('/test/jarayon', {
      state: {
        preset: {
          size: h.questions,
          price: 0,
          mix: [{ topicId: h.subjectId, count: h.questions }],
          homeworkId: h.id,
        },
      },
    });
  };

  const goGameHw = async (h) => {
    setModeHw(null);
    try {
      await launchHomeworkGame(h);
    } catch {
      try {
        await launchSimpleGame();
      } catch {
        /* portal off */
      }
    }
  };

  const hwPending = dash?.homework?.pending;
  const hwDone = dash?.homework?.done;

  return (
    <div className="dash-page" style={sx('padding:18px 16px 48px')}>
      <PageHeader
        title={`Assalomu alaykum, ${displayName}!`}
        subtitle={`${classLabel} · ${new Date().toLocaleDateString('uz-UZ', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}`}
      />

      {loadErr ? (
        <p style={sx('color:#c00;font-size:13px;margin:0 0 12px')}>{loadErr}</p>
      ) : null}

      {(hwPending != null || hwDone != null) && (
        <div
          style={sx(
            'display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap'
          )}
        >
          <div
            style={sx(
              'background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:10px 14px;font-size:13px'
            )}
          >
            Vazifa kutmoqda: <b>{hwPending ?? '—'}</b>
          </div>
          <div
            style={sx(
              'background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:10px 14px;font-size:13px'
            )}
          >
            Bajarilgan: <b>{hwDone ?? '—'}</b>
          </div>
          {me?.wallet_balance != null && (
            <div
              style={sx(
                'background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:10px 14px;font-size:13px'
              )}
            >
              Balans: <b>{me.wallet_balance}</b>
            </div>
          )}
        </div>
      )}

      {/* Fan selector + rest of original layout */}
      <div style={sx('display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap')}>
        <button
          type="button"
          onClick={() => setOpenFan((v) => !v)}
          style={sx(
            'height:36px;padding:0 14px;border-radius:10px;border:1px solid var(--bd);background:var(--card);font-weight:700;font-size:13px;cursor:pointer'
          )}
        >
          {active?.name || 'Fan'} ▾
        </button>
        {openFan && (
          <div style={sx('display:flex;gap:6px;flex-wrap:wrap')}>
            {enrolled.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActive(s);
                  setOpenFan(false);
                }}
                style={sx(
                  `height:32px;padding:0 12px;border-radius:9px;border:1px solid var(--bd);font-size:12.5px;cursor:pointer;${
                    s.id === active?.id ? 'background:#3D7DF6;color:#fff;border-color:#3D7DF6' : 'background:var(--card)'
                  }`
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={sx('display:grid;grid-template-columns:1.2fr 0.8fr;gap:14px')}>
        <div style={sx('display:flex;flex-direction:column;gap:14px')}>
          <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px')}>
            <div style={sx('font-weight:700;font-size:15px;margin-bottom:12px')}>Bugungi darslar</div>
            {lessons.length === 0 ? (
              <div style={sx('color:var(--sub);font-size:13px')}>Bugun dars yo‘q (yoki jadval ulanmagan).</div>
            ) : (
              lessons.map((l) => (
                <div
                  key={l.id}
                  style={sx(
                    'display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--bd)'
                  )}
                >
                  <div style={sx('min-width:52px;font-size:12px;color:var(--sub)')}>{l.time}</div>
                  <div style={sx('flex:1;min-width:0')}>
                    <div style={sx('font-weight:700;font-size:13.5px')}>{l.subject?.name}</div>
                    <div style={sx('font-size:12px;color:var(--sub)')}>{l.room || ''}</div>
                  </div>
                  {l.hw ? (
                    <button
                      type="button"
                      onClick={() => startHw(l)}
                      style={sx(
                        'height:32px;padding:0 12px;border:0;border-radius:9px;background:#3D7DF6;color:#fff;font-weight:700;font-size:12px;cursor:pointer'
                      )}
                    >
                      Vazifa
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px')}>
            <div style={sx('font-weight:700;font-size:15px;margin-bottom:10px')}>Tayyorgarlik</div>
            <div style={sx('display:flex;align-items:center;gap:16px')}>
              <Ring value={readiness} size={88} />
              <div style={sx('flex:1')}>
                <Sparkline data={trend} />
                <div style={sx('font-size:12px;color:var(--sub);margin-top:6px')}>
                  Zaif mavzular: {weak.map((w) => w.name).join(', ') || '—'}
                </div>
              </div>
            </div>
            {mastery?.results?.length ? (
              <div style={sx('margin-top:12px;font-size:12px;color:var(--sub)')}>
                Mastery yuklandi: {mastery.results.length} mavzu
              </div>
            ) : null}
          </div>
        </div>

        <div style={sx('display:flex;flex-direction:column;gap:14px')}>
          <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px')}>
            <div style={sx('display:flex;justify-content:space-between;margin-bottom:10px')}>
              <div style={sx('font-weight:700;font-size:15px')}>Sinf reytingi</div>
              <Link to="/sinfim" style={sx('font-size:12.5px;color:#3D7DF6;font-weight:600')}>
                Batafsil
              </Link>
            </div>
            {CLASSMATES.slice(0, 5).map((c) => (
              <div
                key={c.rank}
                style={sx(
                  `display:flex;align-items:center;gap:10px;padding:7px 6px;border-radius:9px;${
                    c.me ? 'background:var(--chip)' : ''
                  }`
                )}
              >
                <div
                  style={sx(
                    `width:22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${
                      c.rank <= 3 ? '#fff' : 'var(--sub)'
                    };background:${
                      c.rank === 1
                        ? '#F5A524'
                        : c.rank === 2
                          ? '#8595A8'
                          : c.rank === 3
                            ? '#B87333'
                            : 'var(--soft)'
                    }`
                  )}
                >
                  {c.rank}
                </div>
                <div
                  style={sx(
                    `flex:1;font-size:12.5px;font-weight:${c.me ? '800' : '600'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap`
                  )}
                >
                  {c.name}
                </div>
                <div style={sx('font-size:12px;font-weight:700;color:#3D7DF6')}>{fmt(c.xp)}</div>
              </div>
            ))}
          </div>

          <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px')}>
            <div style={sx('font-weight:700;font-size:15px;margin-bottom:12px')}>E&apos;lonlar</div>
            {ANNOUNCEMENTS.map((a) => (
              <div
                key={a.id}
                style={sx(
                  'display:flex;gap:11px;padding:12px;border:1px solid var(--bd);border-radius:14px;background:var(--soft);margin-bottom:8px'
                )}
              >
                <div
                  style={sx(
                    'width:34px;height:34px;border-radius:10px;background:rgba(61,125,246,.12);display:flex;align-items:center;justify-content:center'
                  )}
                >
                  <Icon name="bell" size={15} color="#3D7DF6" />
                </div>
                <div>
                  <div style={sx('font-size:13px;font-weight:600')}>{a.title}</div>
                  <div style={sx('font-size:11.5px;color:var(--sub);margin-top:4px')}>
                    {new Date(a.date).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={sx('background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px')}>
            <div style={sx('font-weight:700;margin-bottom:8px')}>XP</div>
            <ProgressRow label={`Level ${USER.level}`} value={xpPct} color="#3D7DF6" />
          </div>
        </div>
      </div>

      <HwModeModal
        open={!!modeHw}
        homework={modeHw}
        subjectName={modeHw?._subjectName || ''}
        onClose={() => setModeHw(null)}
        onPickTest={() => goTestHw(modeHw)}
        onPickGame={() => goGameHw(modeHw)}
      />
    </div>
  );
}