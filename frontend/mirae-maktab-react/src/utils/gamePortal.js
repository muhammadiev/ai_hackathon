import { createGameSession, fetchGameStatus } from '../api/game.js';
import { USER } from '../data/mock.js';

export async function ensureGameEnabled() {
  try {
    const st = await fetchGameStatus();
    if (st && st.enabled === false) {
      return { ok: false, message: st.message || 'O‘yin portali ishlamayapti' };
    }
    return { ok: true, status: st };
  } catch {
    // If status endpoint missing, still allow attempt
    return { ok: true, status: null };
  }
}

function studentFrom(user) {
  const u = user || {};
  return {
    studentId: u.id || u.student_id || u.login || u.username,
    login: u.login || u.username,
    name: u.name || u.first_name,
    surname: u.surname || u.last_name,
    className: u.className || u.class_name || u.fan,
    grade: u.grade,
  };
}

/** Launch simple or homework game via backend session */
export async function launchGameViaApi({ gametype, user, homework, questions, subjectName }) {
  const enabled = await ensureGameEnabled();
  if (!enabled.ok) {
    alert(enabled.message);
    return null;
  }

  const body = {
    gametype, // 'simple' | 'homework'
    student: studentFrom(user),
    returnUrl: `${window.location.origin}/oyin/callback`,
  };

  if (gametype === 'homework' && homework) {
    body.homework_id = homework.id;
    body.homework = {
      id: homework.id,
      subjectId: homework.subjectId || homework.subject_id,
      subjectName: subjectName || '',
      topic: homework.topic,
      kind: homework.kind || 'test',
      questionsCount: homework.questions || homework.questions_count,
      xp: homework.xp,
    };
    if (questions?.length) {
      body.test = {
        size: questions.length,
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: (q.options || []).map((o) => (typeof o === 'string' ? o : o.text)),
          // correct answers should ideally NOT be sent if portal pulls from server;
          // included only if backend requires for offline portal
        })),
      };
    }
  }

  try {
    const session = await createGameSession(body);
    const url = session.launch_url || session.url || session.portal_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return session;
    }
    // Fallback: encode payload if server returned data only
    if (session.payload || session.data) {
      const portal = session.portal_base || import.meta.env.VITE_GAME_PORTAL_URL || 'https://games.mirae.uz';
      const u = new URL(portal);
      const raw = JSON.stringify(session.payload || session.data);
      u.searchParams.set('data', btoa(unescape(encodeURIComponent(raw))));
      window.open(u.toString(), '_blank', 'noopener,noreferrer');
      return session;
    }
    alert('O‘yin sessiyasi yaratildi, lekin launch URL yo‘q.');
    return session;
  } catch (e) {
    alert(e.message || 'O‘yin portaliga ulanib bo‘lmadi');
    return null;
  }
}

export function launchSimpleGame(user) {
  return launchGameViaApi({ gametype: 'simple', user: user || USER });
}

export function launchHomeworkGame(user, { homework, subjectName, questions }) {
  return launchGameViaApi({
    gametype: 'homework',
    user: user || USER,
    homework,
    subjectName,
    questions,
  });
}

export function applyGameResult(result) {
  if (!result?.homeworkId && !result?.homework_id) return result;
  try {
    const key = 'mirae-hw-results';
    const prev = JSON.parse(localStorage.getItem(key) || '{}');
    const hid = result.homeworkId || result.homework_id;
    prev[hid] = {
      passed: !!result.passed,
      xpEarned: result.xpEarned || result.xp_earned || 0,
      correct: result.correct,
      total: result.total,
      pct: result.pct,
      at: result.at || new Date().toISOString(),
      mode: 'game-portal',
    };
    localStorage.setItem(key, JSON.stringify(prev));
  } catch { /* ignore */ }
  return result;
}
