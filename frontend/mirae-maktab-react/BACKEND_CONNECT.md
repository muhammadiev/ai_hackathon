# Connecting student frontend → backend

## 1. Configure

```bash
cp .env.example .env
# set VITE_API_BASE_URL=https://your-api.example.com/api/v1
```

## 2. Auth

- Header: `Authorization: Bearer <access>`
- Login: username **or** phone + password
- Paths tried: `/auth/login/`, `/auth/token/`, `/token/`
- Refresh: `/auth/token/refresh/` or `/token/refresh/`
- Profile: `/me/` or `/accounts/me/`
- **Never sends `role` from client**

## 3. Mapped modules

| Area | File |
|------|------|
| Client JWT | `src/api/client.js` |
| Auth / Telegram | `src/api/auth.js` |
| Dashboard | `src/api/dashboard.js` |
| Class | `src/api/classes.js` |
| Assignments | `src/api/assignments.js` |
| Submissions (start/finish) | `src/api/submissions.js` |
| Wallet | `src/api/wallet.js` |
| Understanding | `src/api/understanding.js` |
| Mastery | `src/api/mastery.js` |
| Kelajak | `src/api/kelajak.js` |
| Game | `src/api/game.js` + `utils/gamePortal.js` |
| Offline | `src/api/offline.js` |
| Notifications | `src/api/notifications.js` |
| Ads | `src/api/ads.js` |
| Parents | `src/api/parents.js` |

## 4. CORS

Allow your Vite origin and `Authorization` header on the API.

## 5. Demo login without API

`VITE_USE_MOCK=true` keeps mock UI paths where pages still use `mock.js` data.
