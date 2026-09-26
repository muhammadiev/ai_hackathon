# Mirae Maktab Backend

```bash
pipenv install
pipenv run python manage.py migrate
pipenv run python manage.py seed_demo
pipenv run python manage.py runserver
```

# Mirae Maktab — Backend

Django + DRF + JWT + **Django Unfold**. Hardened paper channel + digital submissions.

## Run

```bash
pip install -r requirements.txt
export SQLITE_PATH=/tmp/mirae_db.sqlite3   # optional
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000
python manage.py test questions   # scoring regressions
```

- Health: `GET /api/v1/health/`
- Admin: `/admin/` → `superadmin` / `mirae123`
- API: `/api/v1/`

## Hardening applied

- Object-level teacher/class/assignment scope (`accounts/scoping.py`)
- Paper confirm: `select_for_update`, roster checks, audit log
- Batch code allocation under lock
- Shared scoring (`questions/scoring.py`) — empty numeric alias cannot score 0 (B09)
- Login throttle `10/min`; anon/user rate limits
- Student assignment detail strips answer keys
- Single publish transition validator for assignments
- Unique published result constraint + API 409 on duplicate
- Unfold sidebar grouped navigation (users, school, content, paper, system)
- `SECRET_KEY` / DB / CORS from environment for production

## This stage also

- **Question bank**: create, version (immutable), publish, archive, restore→draft (must re-publish)
- **Files**: multipart upload + ACL detail (`kind`: question_image, scan, practical, …)

## API (current)

| Area | Endpoints |
|------|-----------|
| Auth | token, refresh, logout, me, password, telegram link |
| Schools | classes, students, subjects, teacher-assignments |
| Assignments | list/create, detail, publish |
| Submissions | list, start digital, finish, assignment results |
| Paper | batches, print, scans, patch, confirm, roster-codes |
| Questions | list/create, detail/patch, publish, archive, restore |
| Files | `POST /files/`, `GET /files/{id}/` |
| Telegram | webhook, inbox, assign, ai-grade, confirm-grade, settings |
| Ads / Reklama | admin prompts+generate+status; student `/ads/active/` + impression |
| Wallet (demo) | `/wallet/`, topup by **code** or **phone** — no payment provider |
| Game portal | `/game/status/`, sessions, callback — disabled if env empty |
| Notifications | list, read-all, toggle |
| Health | `/api/v1/health/` |

## Demo users

`superadmin`, `admin`, `teacher`, `student1`–`student3` — password `mirae123`.


## Telegram

- `POST /api/v1/telegram/webhook/` — secret header `X-Telegram-Bot-Api-Secret-Token`
- Student: `POST /api/v1/accounts/me/telegram/link/` → code → send `/link CODE` to bot
- Teacher: inbox → assign → optional demo AI → confirm → **same Submission table** (`source=telegram`)
- Env: `TELEGRAM_WEBHOOK_SECRET` (default dev secret)


## Ads (Reklama)

- Superadmin/admin: `POST /api/v1/admin/ads/prompts/` with full brief → demo AI variants
- `POST /api/v1/admin/ads/{id}/status/` → `live`
- Student: `GET /api/v1/ads/active/` — every item has `is_advertisement: true`, `label: "Reklama"`
- Unfold: Reklama section (prompts, creatives, impressions)


## Wallet (demo only)

No Click, Payme, or bank integration. Balance is for UI/demo:

- `GET /api/v1/wallet/`
- `POST /api/v1/wallet/topup/code/` — body `{ "code": "DEMO5000" }`
- `POST /api/v1/wallet/topup/phone/` — body `{ "phone": "+99890...", "amount": 5000 }` (simulated)
- `GET /api/v1/wallet/ledger/` — append-only history
- Seed codes: `DEMO5000` (5000), `MIRAEDU` (10000)
- Responses always include `"demo": true`


## Game portal

Env (backend):

```bash
export GAME_PORTAL_URL=http://127.0.0.1:9000/launch   # local Django portal OK
export GAME_PORTAL_CALLBACK_SECRET=your-shared-secret
# leave empty → API reports enabled=false ("Game portal is not working")
```

- `GET /api/v1/game/status/` — `{ enabled, message, message_uz, portal_url }`
- `POST /api/v1/game/sessions/` — `{ intent: simple|homework|create, assignment_id? }` → launch POST form payload
- `GET /api/v1/game/sessions/{token}/` — portal reads session
- `POST /api/v1/game/callback/` — header `X-Game-Portal-Secret`; records `Submission` `source=game`
- Student homework launch **never** includes answer keys
- Health: `game_portal.enabled` field

Frontend: if `enabled=false`, show the “portal is not working” page; if URL points to your local portal, POST `payload` works the same as production.


## Security hardening (audit fixes)

1. **Telegram webhook** — `TELEGRAM_WEBHOOK_SECRET` defaults to empty; requests rejected with 503 until set. Optional `TELEGRAM_WEBHOOK_ALLOW_INSECURE_DEBUG=1` only when `DEBUG=1`.
2. **Login** — `POST /api/v1/auth/token/` accepts `username` **or** `phone` + `password`.
3. **Password change** — uses Django `validate_password()` (not length-only).
4. **Paper batch codes** — `IntegrityError` retry on first-batch race.


## Insights (6 differentiators)

| Feature | Endpoints |
|---------|-----------|
| Understanding Check | `GET /understanding/pending/`, `POST /understanding/{id}/answer/`, `GET /understanding/flags/` |
| Topic mastery | `GET /mastery/me/`, `GET /mastery/class/{id}/` |
| Effectiveness | `POST /effectiveness/baselines/`, `before-after/`, `ab/`, `GET reports/` |
| Parent 5-min tip | `POST /parents/links/`, `tips/generate/`, `GET tips/` |
| Offline sync | `POST /offline/sync/` `{client_batch_id, items:[{assignment_id, answers}]}` |
| Creator teacher | `GET /creator/me/` |

UC auto-triggers when score ≥ 95% (digital/paper/telegram/game). Demo micro-question; teacher sees `flag_teacher` on fail/timeout.


## Kelajak / Digital Twin

- Ranges only (`probability_range`, never a single guaranteed %)
- `GET /api/v1/kelajak/twin/`
- `GET /api/v1/kelajak/acceleration-packs/proposed/`
- `POST /api/v1/kelajak/acceleration-packs/{id}/purchase/` — **demo wallet** (no Click)
- Teacher share: `GET /api/v1/staff/twin-earnings/`
- Parent-limited: `GET /api/v1/parents/children/{id}/twin/`
- Disclaimer always present; no pack if improvement negligible


## Environment / providers

Copy `.env.example` → `.env`. Empty values = safe defaults (demo/stub).

| Variable | Empty default | When set |
|----------|---------------|----------|
| `AI_PROVIDER` + `AI_API_KEY` | Stub questions | Live LLM |
| `PAYMENT_PROVIDER` + Click/Payme keys | Demo wallet | Live pay (wire webhook) |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET` | Webhook 503 | Real bot |
| `GAME_PORTAL_URL` + secret | Portal disabled | Handoff works |
| `OMR_PROVIDER` + URL | Manual confirm | External OMR |

Status: `GET /api/v1/providers/status/` (staff)
