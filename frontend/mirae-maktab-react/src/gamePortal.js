/**
 * External Game Portal integration.
 * We only BUILD the JSON and hand off to the game website.
 * The game portal runs games and POSTs/redirects results back.
 */

// Configure via .env: VITE_GAME_PORTAL_URL=https://games.example.com/launch
export const GAME_PORTAL_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GAME_PORTAL_URL) ||
  'https://game.mirae.uz/launch';

/** Return URL on our app for game portal to send the student back with results */
export function gameResultReturnUrl() {
  if (typeof window === 'undefined') return '/oyin/natija';
  return `${window.location.origin}/oyin/natija`;
}

/**
 * Student identity block shared by all game launches.
 */
export function buildStudentInfo(user, mockUser) {
  const u = user || {};
  const m = mockUser || {};
  return {
    studentId: u.id || u.username || m.login || 'demo-student',
    firstName: u.first_name || m.name || '',
    lastName: u.last_name || m.surname || '',
    fullName: [u.first_name || m.name, u.last_name || m.surname].filter(Boolean).join(' '),
    className: u.class_name || u.className || m.className || '',
    grade: u.grade || m.grade || null,
    username: u.username || m.login || '',
  };
}

/**
 * gametype: "simple" — free play / fun (portal shows available games)
 * gametype: "homework" — homework flow; includes homeworkId + questions if test
 */
export function buildGamePayload({
  gametype = 'simple',
  student,
  homework = null,
  questions = null,
  locale = 'uz',
}) {
  const base = {
    gametype, // "simple" | "homework"
    locale,
    student,
    returnUrl: gameResultReturnUrl(),
    issuedAt: new Date().toISOString(),
  };

  if (gametype === 'homework' && homework) {
    base.homework = {
      id: homework.id,
      subjectId: homework.subjectId,
      subjectName: homework.subjectName || homework._subjectName || '',
      topic: homework.topic,
      kind: homework.kind || 'test',
      questionsCount: homework.questions || questions?.length || 0,
      xp: homework.xp || 0,
      deadline: homework.deadline || null,
    };
    // Test homework: send full question set for the portal to run
    if ((homework.kind || 'test') === 'test' && questions?.length) {
      base.questions = questions.map((q, i) => ({
        id: q.id || `q-${i + 1}`,
        no: i + 1,
        text: q.text,
        options: (q.options || []).map((o) => (typeof o === 'string' ? o : o.text)),
        correct: Array.isArray(q.correct) ? q.correct[0] : q.correct,
      }));
    }
  }

  return base;
}

/**
 * Hand off to external game website.
 * Prefer POST via form (large JSON safe) + also put compact token in query for GET portals.
 */
export function launchGamePortal(payload) {
  const json = JSON.stringify(payload);
  // Keep last launch for debugging / callback correlation
  try {
    sessionStorage.setItem('mirae-game-last-payload', json);
    sessionStorage.setItem('mirae-game-pending-hw', payload.homework?.id || '');
  } catch { /* ignore */ }

  // Demo-friendly: if portal URL is placeholder, open a local handoff page that shows JSON
  // and explains the integration (still not a real game).
  const url = GAME_PORTAL_URL;
  const isPlaceholder =
    !url ||
    url.includes('game.mirae.uz') ||
    url.includes('example.com');

  if (isPlaceholder) {
    // Stay in-app on bridge page so design still works offline
    const bridge = `/oyin/bridge?gametype=${encodeURIComponent(payload.gametype)}`;
    sessionStorage.setItem('mirae-game-bridge-payload', json);
    window.location.assign(bridge);
    return;
  }

  // Real portal: POST JSON as form field "payload"
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.target = '_self';
  form.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'payload';
  input.value = json;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

/**
 * Apply result coming back from game portal.
 * Expected shape (example):
 * {
 *   gametype: "homework",
 *   homeworkId: "hw1",
 *   passed: true|false,
 *   xpEarned: 48,
 *   correct: 12,
 *   total: 20,
 *   pct: 60
 * }
 */
export function applyGameResult(result) {
  if (!result || typeof result !== 'object') return null;
  try {
    if (result.gametype === 'homework' && result.homeworkId) {
      const key = 'mirae-hw-results';
      const prev = JSON.parse(localStorage.getItem(key) || '{}');
      prev[result.homeworkId] = {
        passed: !!result.passed,
        xpEarned: result.xpEarned || 0,
        correct: result.correct,
        total: result.total,
        pct: result.pct,
        at: new Date().toISOString(),
        mode: 'game',
        source: 'game-portal',
      };
      localStorage.setItem(key, JSON.stringify(prev));
    }
    sessionStorage.setItem('mirae-game-last-result', JSON.stringify(result));
  } catch { /* ignore */ }
  return result;
}
