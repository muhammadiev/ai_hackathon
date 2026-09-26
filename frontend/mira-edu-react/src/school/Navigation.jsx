import { profileDefaults } from "./StaffSettings.jsx";
import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useI18n } from "../I18nContext.jsx";
import { useSchool } from "./SchoolContext.jsx";
import { useAuth } from "../AuthContext.jsx";
import { CLASSES, SUBJECTS } from "./model.js";
import { useWords } from "./ui.jsx";
export const menus = {
  student: [
    ["/", "home", "Bosh", "Главная", "Home"],
    ["/test", "target", "Test", "Тесты", "Tests"],
    ["/vazifalar", "clipboard", "Vazifalar", "Задания", "Homework"],
    ["/amaliy", "edit", "Amaliy mashg‘ulotlar", "Практика", "Practical tasks"],
    ["/darslar", "cap", "Darslar", "Уроки", "Lessons"],
    ["/videodarslar", "video", "Videodarslar", "Видеоуроки", "Videos"],
    ["/bilet", "layers", "Bilet", "Билеты", "Question sets"],
    ["/natijalar", "chart", "Natijalarim", "Результаты", "Results"],
    ["/sinfim", "users", "Sinfim", "Мой класс", "My class"],
    ["/ijtimoiy", "trophy", "Ijtimoiy", "Рейтинг", "Leaderboard"],
    ["/dtm", "target", "DTM", "DTM", "DTM"],
    ["/kelajak", "sparkles", "Mirae (Kelajak)", "Будущее", "My future"],
    ["/tolovlar", "wallet", "To‘lovlar", "Платежи", "Payments"],
    ["/adminga-yozish", "send", "Adminga yozish", "Поддержка", "Support"],
    [
      "/bildirishnomalar",
      "bell",
      "Bildirishnomalar",
      "Уведомления",
      "Notifications",
    ],
    ["/sozlamalar", "settings", "Sozlamalar", "Настройки", "Settings"],
  ],
  teacher: [
    ["/t", "home", "Bugun", "Сегодня", "Today"],
    ["/t/sinflar", "users", "Sinflarim", "Классы", "My classes"],
    ["/t/vazifalar", "clipboard", "Vazifalar", "Задания", "Homework"],
    ["/t/topshirish", "upload", "Topshirish markazi", "Работы", "Submissions"],
    ["/t/ish-reja", "list", "Ish reja", "План работы", "Work plan"],
    [
      "/t/savollar",
      "layers",
      "Savollar bazasi",
      "Банк вопросов",
      "Question bank",
    ],
    [
      "/t/tekshiruv",
      "checkCircle",
      "Tekshiruv navbati",
      "Проверка",
      "Review queue",
    ],
    [
      "/t/materiallar",
      "cap",
      "Dars materiallari",
      "Материалы",
      "Lesson materials",
    ],
    ["/t/jadval", "calendar", "Jadval", "Расписание", "Timetable"],
    [
      "/t/tushunish",
      "sparkles",
      "Ehtimol yordam",
      "Возможная помощь",
      "Understanding flags",
    ],
    [
      "/t/samaradorlik",
      "chart",
      "Samaradorlik",
      "Эффективность",
      "Effectiveness",
    ],
    [
      "/t/mastery",
      "target",
      "Mastery xarita",
      "Карта освоения",
      "Mastery map",
    ],
    [
      "/t/ota-ona",
      "users",
      "Ota-ona 5 daqiqa",
      "Родители 5 мин",
      "Parent tips",
    ],
    [
      "/t/ijodkor",
      "trophy",
      "Ijodkor / daromad",
      "Творец",
      "Creator",
    ],
    ["/t/balans", "wallet", "Balans", "Баланс", "Balance"],
    [
      "/t/bildirishnomalar",
      "bell",
      "Bildirishnomalar",
      "Уведомления",
      "Notifications",
    ],
    ["/t/sozlamalar", "settings", "Sozlamalar", "Настройки", "Settings"],
  ],
  admin: [

    ["/a", "home", "Umumiy ko‘rinish", "Обзор", "Overview"],
    [
      "/a/savollar",
      "layers",
      "Savollar bazasi",
      "Банк вопросов",
      "Question bank",
    ],
    ["/a/users", "users", "Foydalanuvchilar", "Пользователи", "Users"],
    [
      "/a/classes",
      "school",
      "Sinflar va fanlar",
      "Классы и предметы",
      "Classes & subjects",
    ],
    ["/a/timetable", "calendar", "Dars jadvali", "Расписание", "Timetable"],
    [
      "/a/topics",
      "book",
      "Mavzular va darslar",
      "Темы и уроки",
      "Topics & lessons",
    ],
    ["/a/admissions", "cap", "Qabul ma’lumotlari", "Поступление", "Admissions"],
    ["/a/psych", "heart", "Psixologik savollar", "Анкеты", "Questionnaires"],
    [
      "/a/payments",
      "wallet",
      "To‘lov va narxlar",
      "Оплата",
      "Payments & prices",
    ],
    ["/a/ai", "sparkles", "AI sozlamalari", "Настройки AI", "AI settings"],
    [
      "/a/integratsiyalar",
      "telegram",
      "Topshirish kanallari",
      "Интеграции",
      "Submission channels",
    ],
    ["/a/audit", "clipboard", "Audit jurnali", "Аудит", "Audit log"],
    ["/a/sozlamalar", "settings", "Sozlamalar", "Настройки", "Settings"],
  ],
};
function useMenu() {
  const { state } = useSchool();
  const { isDemo, user } = useAuth();
  return menus[state.role].filter(
    (n) =>
      !(
        state.role === "student" &&
        Number(state.classId.split("-")[0]) < 9 &&
        ["/dtm", "/kelajak", "/tolovlar"].includes(n[0])
      ),
  );
}
export function Sidebar({ collapsed = false }) {
  const menu = useMenu(),
    w = useWords();
  const { state } = useSchool();
  return (
    <aside
      className="sidebar-desktop school-sidebar"
      style={{ width: collapsed ? "4.625rem" : "14.5rem" }}
    >
      <Link to={menu[0][0]} className="school-brand">
        <b>M</b>
        {!collapsed && (
          <span>
            Mirae <small>Maktab</small>
          </span>
        )}
      </Link>
      {!collapsed && (
        <p className="school-menu-caption">
          {w("MAKTAB PLATFORMASI", "ШКОЛЬНАЯ ПЛАТФОРМА", "SCHOOL PLATFORM")}
        </p>
      )}
      <div className="school-nav-scroll">
        {menu.map(([to, icon, ...labels]) => (
          <NavLink
            key={to}
            to={to}
            end={["/", "/t", "/a"].includes(to)}
            title={w(...labels)}
            className={({ isActive }) =>
              "school-nav navit " + (isActive ? "active" : "")
            }
          >
            <Icon name={icon} size={19} />
            {!collapsed && w(...labels)}
          </NavLink>
        ))}
      </div>
      {!collapsed && (
        <div className="school-sidebar-foot">
          <BadgeDemo />
          <small>
            {w(
              "Bilim. Rivojlanish. Kelajak.",
              "Знания. Развитие. Будущее.",
              "Learn. Grow. Shape your future.",
            )}
          </small>
        </div>
      )}
    </aside>
  );
}
function BadgeDemo() {
  return <span className="school-badge purple">Frontend demo</span>;
}
export function TopBar({ onToggleSidebar }) {
  const { state, update } = useSchool(),
    { lang, setLang } = useI18n(),
    navigate = useNavigate(),
    w = useWords();
  const allowed = SUBJECTS.filter(
    (s) =>
      state.role !== "student" || state.matrix[state.classId].includes(s.id),
  );
  const root =
    state.role === "student" ? "" : state.role === "teacher" ? "/t" : "/a";
  return (
    <header className="school-topbar">
      <button
        aria-label="Menyuni yig‘ish"
        className="school-collapse"
        onClick={onToggleSidebar}
      >
        <Icon name="menu" size={20} />
      </button>
      <div className="staff-top-identity">
        <span className="school-badge purple">MIRAE MAKTAB</span>
        <b>
          {state.role === "teacher"
            ? "O‘qituvchi kabineti"
            : "Maktab boshqaruvi"}
        </b>
      </div>
      <div className="school-top-spacer" />
      {isDemo && (
      <select
        className="school-role"
        aria-label="Demo rol"
        value={state.role}
        onChange={(e) => {
          update({ role: e.target.value });
          navigate(
            { student: "/", teacher: "/t", admin: "/a" }[e.target.value],
          );
        }}
      >
        <option value="teacher">{w("O‘qituvchi", "Учитель", "Teacher")}</option>
        <option value="admin">Admin</option>
      </select>
      )}
      {state.role === "student" && (
        <select
          aria-label="Demo sinf"
          value={state.classId}
          onChange={(e) => {
            const classId = e.target.value;
            update({ classId, subjectId: state.matrix[classId][0] || "1" });
            navigate("/");
          }}
        >
          {CLASSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      )}
      <select
        aria-label="Til"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {["uz", "ru", "en"].map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
      <ThemeToggle />
      <Link
        className="school-bell"
        aria-label="Bildirishnomalar"
        to={root === "/a" ? "/a/audit" : root + "/bildirishnomalar"}
      >
        <Icon name="bell" size={19} />
        {state.notifications.some((n) => !n.read) && <i />}
      </Link>
      <Link
        to={root + "/sozlamalar"}
        className="school-profile"
        aria-label="Profil sozlamalari"
      >
        {(
          state.profiles?.[state.role]?.name || profileDefaults(state.role).name
        )
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((x) => x[0])
          .join("")}
      </Link>
    </header>
  );
}
export function MobileNav() {
  const menu = useMenu(),
    [open, setOpen] = useState(false),
    w = useWords();
  const { state } = useSchool();
  const primary =
    state.role === "student"
      ? [menu[0], menu[1], menu.find((x) => x[0] === "/darslar"), menu[2]]
      : menu.slice(0, 4);
  return (
    <>
      <nav className="mobilenav school-bottom">
        {primary.map(([to, icon, ...labels]) => (
          <NavLink key={to} to={to} end={["/", "/t", "/a"].includes(to)}>
            <Icon name={icon} size={20} />
            <span>{w(...labels)}</span>
          </NavLink>
        ))}
        <button onClick={() => setOpen(true)}>
          <Icon name="layers" size={20} />
          {w("Yana", "Ещё", "More")}
        </button>
      </nav>
      {open && (
        <div className="school-overlay" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Menyu"
            className="school-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="school-card-head">
              <h3>Mirae Maktab</h3>
              <button
                className="school-close"
                aria-label="Yopish"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            {menu.map(([to, icon, ...labels]) => (
              <NavLink
                key={to}
                className="school-nav"
                to={to}
                onClick={() => setOpen(false)}
              >
                <Icon name={icon} size={18} />
                {w(...labels)}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
