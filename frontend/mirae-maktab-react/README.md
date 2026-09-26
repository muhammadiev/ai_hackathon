# MiraEdu — Student Web App (React SPA)

MiraEdu o'quvchilar platformasining frontend qismi. **Vite + React (JavaScript)**, `react-router-dom` routing, inline-style + CSS-variable theme tizimi (light/dark). Barcha ma'lumotlar hozircha **mock** (demo) — backend talab qilinmaydi.

> Ro'yxatdan o'tish (register) yo'q — hisoblar o'qituvchi/admin tomonidan **Django Unfold** admin panelida ochiladi. Bu loyiha faqat o'quvchi (student) interfeysi.

## Ishga tushirish

```bash
cd mira-edu-react
npm install
npm run dev
```

Brauzerda `http://localhost:5173` ochiladi. Login sahifasi: `/kirish` (har qanday login/parol bilan "Kirish" bosing — demo).

## Build (Django'ga ulash uchun)

```bash
npm run build      # -> dist/
npm run preview    # build'ni mahalliy tekshirish
```

`vite.config.js` da `base: './'` qo'yilgan — `dist/` papkasini Django `staticfiles` ichiga ko'chirib, istalgan sub-path'dan xizmat qilsa bo'ladi. SPA bo'lgani uchun barcha noma'lum yo'llarni `index.html` ga yo'naltiring (Django `re_path(r'^.*$', ...)` yoki nginx `try_files`).

## Sahifalar (routes)

| Route | Sahifa |
|---|---|
| `/kirish` | Login (split-screen, parol show/hide, til, dark mode) |
| `/` | Dashboard (Bosh sahifa) |
| `/darslar` | Darslar → fan → mavzular |
| `/dars/:id` | Dars ko'rish (SunCamp study layout: bayon, video, slayd, test, mashg'ulot) |
| `/vazifalar` | Vazifalar (tablar: barchasi / bajarilgan / yangi) |
| `/vazifa/:id` | Vazifa topshirish (rasm/PDF yuklash) |
| `/imtihonlar` | Imtihonlar (yaqin + natijalar) |
| `/imtihon/test` | Test ishlash (timer, savol paneli) |
| `/imtihon/natija` | Test natijasi (ball, bo'limlar, review) |
| `/reyting` | Reyting (podium + ro'yxat) |
| `/yutuqlar` | Yutuqlar (nishonlar + reyting) |
| `/bildirishnomalar` | Bildirishnomalar (filtr, o'qilgan holati) |
| `/profil` | Profil va sozlamalar |
| `/tolovlar` | To'lovlar (keyingi to'lov, tarix) |
| `/sozlamalar` | Sozlamalar (profil/ko'rinish/bildirishnoma/til/xavfsizlik) |

## Loyiha tuzilmasi

```
src/
├── main.jsx              # entry — BrowserRouter + ThemeProvider
├── App.jsx               # barcha route'lar
├── index.css            # reset + hover/focus/keyframe (inline qilib bo'lmaydigan qism)
├── theme.js             # design token'lar (light/dark) + CSS-variable map
├── ThemeContext.jsx     # useTheme() — dark mode, localStorage'da saqlanadi
├── utils/sx.js          # "display:flex;gap:8px" -> React style obyekti
├── components/
│   ├── Layout.jsx       # sidebar + <Outlet/> (sidebar sahifalar uchun)
│   ├── Sidebar.jsx      # chap navigatsiya
│   ├── PageHeader.jsx   # sarlavha + theme toggle
│   └── ThemeToggle.jsx
├── data/mock.js         # NAV, USER, COURSES, mock ma'lumotlar
└── pages/               # 15 ta sahifa (yuqoridagi jadval)
```

## Backendga ulashda (keyingi qadam)

1. `src/data/mock.js` dagi statik massivlarni API chaqiruvlari bilan almashtiring (masalan `src/api/` da axios klient).
2. `/kirish` dagi `submit` ichida demo `setTimeout` o'rniga real auth (token oling, saqlang).
3. Himoyalangan route'lar uchun `App.jsx` da guard qo'shing (token yo'q bo'lsa `/kirish` ga redirect).

## Texnologiyalar

- React 18 · Vite 5 · react-router-dom 6
- Shrift: Syne (sarlavha), Inter (matn), JetBrains Mono (raqam) — Google Fonts orqali
- Brend rangi: `#8458B3` (binafsha)

## Responsiv (mobil) ko'rinish

Loyiha mobil ekranlarga moslashtirilgan (breakpoint `820px`):
- Chap sidebar o'rniga pastki **navigatsiya paneli** (MobileNav) chiqadi.
- Ko'p ustunli grid'lar bitta ustunga yig'iladi, sahifa paddinglari kichrayadi.
- Login sahifasida brend paneli yashirinadi, forma butun ekranni egallaydi.
- Dars ko'rish / Test / Vazifa kabi ikki panelli sahifalar vertikal ustunga joylashadi.
- Jadval (Imtihonlar, To'lovlar, Reyting) yon tomonga skroll qilinadi.

Tekshirish: brauzer DevTools'da qurilma (responsive) rejimini yoqing yoki oynani toraytiring.
