# Teacher frontend → backend wiring

## What changed in this patch

| File | Change |
|------|--------|
| `src/api/client.js` | Bearer token, refresh on 401, `ApiError`, `VITE_API_URL` + `/api/v1` |
| `src/api/auth.js` | `login`, `logout`, `fetchMe` |
| `src/api/teacher.js` | Classes, questions, assignments, paper, telegram, understanding, effectiveness, mastery, parent tips, creator, packs, AI, dashboard |
| `src/AuthContext.jsx` | Server `/me` identity; demo fallback when API URL empty |
| `src/school/StaffLogin.jsx` | Calls `useAuth().login`; demo credentials only offline |
| `src/App.jsx` Guard | Uses `isAuthenticated` + `user.global_role` (not sessionStorage) |
| `src/school/Navigation.jsx` | Demo role switch **hidden** when API configured |
| `src/school/StaffSettings.jsx` | Logout via `useAuth().logout` |
| `src/main.jsx` | Wraps `AuthProvider` |
| `.env.example` | `VITE_API_URL`, `VITE_GAME_PORTAL_URL` |

## Env

```bash
cp .env.example .env
# VITE_API_URL=http://127.0.0.1:8000
# VITE_GAME_PORTAL_URL=   # empty disables portal UI
```

- **Empty `VITE_API_URL`** → offline demo (teacher/admin + mirae123).
- **Set URL** → real login; client role ignored; identity from `GET /api/v1/me/`.

## Auth flow

1. `POST /api/v1/auth/login/` (or `/auth/token/`) → `{ access, refresh }`
2. Store tokens → `GET /api/v1/me/` → `global_role`
3. Every request: `Authorization: Bearer <access>`
4. On 401: `POST /api/v1/auth/token/refresh/` → retry once
5. Still 401 → clear tokens → redirect `/login`

## Practical integration order

1. Login + `/me` + classes/students (`src/api/teacher.js`)
2. Questions + assignments publish + results by **studentId**
3. Paper batches + Telegram inbox
4. Understanding flags + mastery + effectiveness
5. Courses / exams / support as backend exposes them

## Stop trusting

- Client `role` / localStorage admin toggles
- `studentName` as identity → always `studentId`
- Client-side final grades → server finish/confirm only
- Publish without `POST .../publish/`
- Game portal open without `GET /game/status/`

## Using APIs in a page

```js
import { fetchClasses, fetchAssignmentResults } from "../api/teacher.js";
import { ApiError } from "../api/client.js";

// in effect / handler
try {
  const rows = await fetchAssignmentResults(assignmentId);
  // rows[].studentId, score, status — never key by name
} catch (e) {
  if (e instanceof ApiError && e.status === 403) notify("Ruxsat yo‘q");
  else notify(e.message);
}
```

## Superadmin vs React teacher

- Heavy config / users / ads → Django Unfold `/admin/`
- Daily teacher work → this React app → `/api/v1/...`
'''
# also write to artifacts root for easy find
import shutil
from pathlib import Path
src = Path('/home/workdir/artifacts/mirae_v6/mira-edu-react/docs/TEACHER_FE_BACKEND_WIRING.md')
# docs dir may not exist
src.parent.mkdir(parents=True, exist_ok=True)
src.write_text(open('/dev/stdin').read() if False else src.read_text() if src.exists() else '')
print('guide path check', src.exists())
