# Mirae Maktab

**School learning platform** for Uzbekistan (and similar) schools: students practice subjects, submit homework, track mastery; teachers manage classes and grading; admin runs the school.

| Layer | Folder (typical) | Stack |
|-------|------------------|--------|
| **API** | `backend/` | Django + DRF + JWT |
| **Student app** | `frontend/mirae-maktab-react/` | React + Vite |
| **Teacher app** | `frontend/mira-edu-react/` | React + Vite |

> Student UI is mobile-first with a sticky desktop sidebar. Teacher UI is a separate dashboard. Backend is the source of truth for scores, wallet, and homework status.

---

## Table of contents

1. [Features](#features)
2. [Repository layout](#repository-layout)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [API overview](#api-overview)
6. [Student app guide](#student-app-guide)
7. [Teacher app guide](#teacher-app-guide)
8. [Auth & security](#auth--security)
9. [Game portal integration](#game-portal-integration)
10. [Plans & roles](#plans--roles)
11. [Development notes](#development-notes)
12. [Troubleshooting](#troubleshooting)
13. [Roadmap](#roadmap)

---

## Features

### Student

- Login (username **or** phone + password)
- Subject selector (class subjects)
- **Home** — today’s lessons, homework actions, XP / streak, mastery (“Men bilaman”)
- **Test** — random 30/50 questions from the **active subject only**, results, solutions, feedback history
- **Understanding check** — after ≥95%, 30s short-answer modal
- **Vazifalar** — homework list; **test** → classic test or **game portal**; **amaliy** → files upload
- **Darslar** — courses + **Videodarslar** tab (purchase / watch)
- **Sinfim** — timetable + class ranking (responsive)
- **DTM / Bilet / Kelajak** — exam sim + living **Twin** ranges, acceleration packs (demo wallet)
- **Wallet / To‘lovlar** — balance, history, top-up code (provider later)
- **Sozlamalar** — theme, language (UZ/RU/EN), password, Telegram link (**admin code only**), parent phone link
- **Adminga yozish** — support chat + admin social links
- Offline shell (service worker) + `/offline/sync/` ready

### Teacher (separate frontend)

- Classes, assignments, grading, question bank, content (see teacher README / app)

### Backend

- JWT auth, profiles, classes, assignments, submissions (server-side scoring)
- Wallet, understanding checks, mastery (`p_know`), Kelajak twin & packs
- Game sessions, notifications, optional ads (always labeled **Reklama**)

---

## Repository layout

```text
last/   (or repo root)
├── backend/                    # Django API
│   ├── manage.py
│   ├── Pipfile / requirements
│   └── ...
├── frontend/
│   ├── mirae-maktab-react/     # Student SPA
│   └── mira-edu-react/         # Teacher SPA
├── Mirae Maktab.pdf            # Product / pitch (optional)
└── README.md                   # This file
```

Student API client lives under:

```text
frontend/mirae-maktab-react/src/api/
  client.js          # base URL, Bearer JWT, refresh on 401
  auth.js            # login, me, password, telegram
  assignments.js
  submissions.js     # start / finish tests
  wallet.js
  understanding.js
  mastery.js
  kelajak.js
  game.js
  offline.js
  notifications.js
  ...
```

Connect notes: `frontend/mirae-maktab-react/BACKEND_CONNECT.md`

---

## Quick start

### Requirements

- **Python** 3.11+ and [Pipenv](https://pipenv.pypa.io/) (or pip + venv)
- **Node.js** 18+ and npm
- Git

### 1) Backend

```bash
cd backend
pipenv install
pipenv run python manage.py migrate
pipenv run python manage.py createsuperuser   # optional
pipenv run python manage.py runserver 0.0.0.0:8000
```

Windows (one line):

```bat
cd /d C:\path\to\backend && pipenv install && pipenv run python manage.py migrate && pipenv run python manage.py runserver 0.0.0.0:8000
```

API: `http://127.0.0.1:8000`  
Typical API prefix: `http://127.0.0.1:8000/api/v1`

Enable **CORS** for:

- `http://localhost:5173` (student)
- `http://localhost:5174` (teacher)

### 2) Student frontend

```bash
cd frontend/mirae-maktab-react
cp .env.example .env
# edit VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
npm install
npm run dev
```

Windows:

```bat
cd /d C:\path\to\frontend\mirae-maktab-react && echo VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1> .env && echo VITE_USE_MOCK=true>> .env && npm install && npm run dev
```

Open: **http://localhost:5173**

### 3) Teacher frontend

```bash
cd frontend/mira-edu-react
cp .env.example .env   # if present
npm install
npm run dev -- --port 5174
```

Windows:

```bat
cd /d C:\path\to\frontend\mira-edu-react && npm install && npm run dev -- --port 5174
```

Open: **http://localhost:5174**

### Run order

1. Backend **:8000**  
2. Student **:5173**  
3. Teacher **:5174**

---

## Environment variables

### Student (`frontend/mirae-maktab-react/.env`)

| Variable | Example | Meaning |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api/v1` | API root (client also accepts origin without `/api/v1`) |
| `VITE_USE_MOCK` | `true` / `false` | `true` = UI can fall back to mock data when API is down |
| `VITE_GAME_PORTAL_URL` | `https://games.mirae.uz` | Fallback if game session has no `launch_url` |

### Backend

Typical Django settings (names may vary in your project):

- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `SIMPLE_JWT` access/refresh lifetimes
- DB: SQLite for dev, PostgreSQL for production
- Media storage for amaliy uploads / videos

### Teacher

Point the same `VITE_API_BASE_URL` (or teacher-specific base) at the same API with teacher JWT.

---

## API overview

Auth header on protected routes:

```http
Authorization: Bearer <access_token>
```

| Student need | Backend path (illustrative) |
|--------------|-----------------------------|
| Login | `POST /api/v1/auth/login/` or `/api/v1/auth/token/` (username **or** phone + password) |
| Refresh | `POST /api/v1/auth/token/refresh/` |
| Me / profile | `GET/PATCH /api/v1/me/` or `/api/v1/accounts/me/` |
| Password | `POST /api/v1/accounts/me/password/` |
| Dashboard | `GET /api/v1/dashboard/` |
| My class | `GET /api/v1/classes/me/` |
| Assignments | `GET /api/v1/assignments/`, `GET .../{id}/` (answer keys stripped for students) |
| Start / finish test | `POST /api/v1/submissions/start/`, `POST .../{id}/finish/` |
| My results | `GET /api/v1/submissions/` |
| Wallet | `GET /api/v1/wallet/`, top-up e.g. `.../topup/code/` |
| Understanding | `GET /api/v1/understanding/pending/`, `POST .../{id}/answer/` |
| Mastery | `GET /api/v1/mastery/me/` |
| Kelajak twin | `GET /api/v1/kelajak/twin/` |
| Packs | proposed / purchase / history under acceleration-packs |
| Game | `GET /api/v1/game/status/`, `POST /api/v1/game/sessions/` |
| Offline | `POST /api/v1/offline/sync/` |
| Notifications | `GET /api/v1/notifications/` |
| Ads | `GET /api/v1/ads/active/` (always show as **Reklama**) |
| Telegram link | `POST /api/v1/accounts/me/telegram/link/` |

**Rules**

- Scores and XP are computed **on the server** — never trust the client for final grades.
- Client must **not** send `role` / staff flags.
- Twin UI always shows **range + methodology disclaimer**, not a bare guaranteed %.

---

## Student app guide

### Demo login (when mock / seed data exists)

Often something like:

- Phone: `+998936744370`
- Password: `1234`

Use real accounts from Django admin / seed when API is live.

### Main navigation

| Item | Purpose |
|------|---------|
| Bosh sahifa | Dashboard |
| Test | Random tests + results |
| Vazifalar | Homework |
| Darslar | Courses + videos |
| Sinfim | Class timetable & ranking |
| DTM / Kelajak | Exam sim & future twin |
| To‘lovlar | Wallet |
| Sozlamalar | Profile & prefs |

### Important flows

1. **Random test** — pick subject in top bar → Test → 30 or 50 → confirm → attempt → result → optional understanding check if ≥95%.
2. **Homework test** — modal: *Oddiy test* (in-app) or *O‘yin* (JSON/session → external game portal).
3. **Amaliy** — open assignment → download teacher files → upload answers → wait for teacher grade.
4. **Telegram** — only with **admin-issued** code in Sozlamalar; student can disconnect.
5. **Kelajak** — Twin curve + packs; purchase uses demo/real wallet per backend; “Mirae tahlil” explains university fit (disclaimer).

### Scripts

```bash
npm run dev      # Vite dev server
npm run build    # production build → dist/
npm run preview  # preview production build
```

---

## Teacher app guide

- Run on a **different port** (e.g. 5174) against the same API.
- Use a **teacher** account (created in admin / backend).
- Typical capabilities: classes, create homework (test or practical), grade submissions, question bank, content.
- Do not use the student SPA for teacher workflows.

---

## Auth & security

- JWT access + refresh stored in `localStorage` (student client keys: `miraedu_access`, `miraedu_refresh`).
- On **401**, client tries refresh once; on failure fires `miraedu:session-expired` and clears tokens.
- Students are **created by admin**, not public self-registration.
- File uploads: size limits and auth checks on backend.
- Production: HTTPS, secure cookies optional later, rotate `SECRET_KEY`, restrict CORS.

---

## Game portal integration

1. Student chooses game for homework (or fun games from home).
2. Frontend calls `POST /api/v1/game/sessions/` with `gametype: simple | homework`.
3. Backend returns `launch_url` (preferred) or signed payload.
4. Portal runs the game and returns result via redirect/webhook.
5. Backend marks homework passed/failed and awards XP — **not** the SPA alone.

If `GET /game/status/` returns `enabled: false`, the UI should show that the portal is unavailable.

---

## Plans & roles

| Plan (concept) | Notes |
|----------------|--------|
| Free | Baseline school access |
| Basic / Pro | Feature gates (limits, content) |
| VIP | Paid or relative/owner — flag on backend |

| Role | App |
|------|-----|
| Student | `mirae-maktab-react` |
| Teacher | `mira-edu-react` |
| School admin | Django admin / unfold panel |

---

## Development notes

- Student design system: Inter, accent `#3D7DF6`, CSS variables for light/dark.
- Breakpoint ~**820px**: bottom nav mobile, sidebar desktop.
- Some list UIs still ship with **mock.js** fallbacks until every page is switched to live API modules — prefer `VITE_USE_MOCK=false` when the API is complete.
- Feedback history may use `localStorage` until `GET /feedback/` (or submissions list) is wired end-to-end.

### Suggested git remotes

```bash
git init
git add .
git commit -m "Initial Mirae Maktab monorepo"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Add a `.gitignore` (examples):

```gitignore
# Python
__pycache__/
*.pyc
.env
.venv/
Pipfile.lock   # optional: often committed for apps

# Node
node_modules/
dist/
.env.local

# OS / IDE
.DS_Store
Thumbs.db
.idea/
.vscode/
```

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| `pipenv` not found | `pip install pipenv` or `python -m pipenv` |
| `manage.py` not found | `cd` into the Django project root |
| CORS errors in browser | Allow localhost:5173/5174 on Django |
| Login always fails | Check API URL, trailing `/api/v1`, and seed user |
| Student UI works offline only | `VITE_USE_MOCK=true` or API not running |
| Port already in use | Change Vite port: `npm run dev -- --port 5175` |
| White error “uc is not defined” | Use latest student build (result page fix) |
| Grade object React error | Results must render `grade.label`, not the whole object |

---

## Roadmap

- [ ] Full page-by-page replacement of mock data with API
- [ ] Live Click/Payme top-up (beyond demo wallet / code)
- [ ] Parent full auth (beyond phone link)
- [ ] Real LLM feedback (understanding / pack copy)
- [ ] University/sponsor matching
- [ ] Production deploy (e.g. API on VPS, frontends on static hosting)

---

## License & credits

Project: **Mirae Maktab** — school digital platform (hackathon / product build).

Frontend student app evolved as a React SPA with explicit backend mapping for production integration.

---

## Support

- In-app: **Adminga yozish** (student)
- Repo: open a GitHub Issue with OS, Node/Python version, and the exact error log

**Happy shipping.**
