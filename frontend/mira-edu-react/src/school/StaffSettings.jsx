import { useState } from "react";
import { useNavigate } from "react-router-dom";
// auth logout
import { useAuth } from "../AuthContext.jsx";
import { useSchool } from "./SchoolContext.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { useI18n } from "../I18nContext.jsx";
import {
  Page,
  Card,
  Button,
  Badge,
  Field,
  Select,
  Note,
  Modal,
} from "./ui.jsx";
import { download } from "./model.js";
import Icon from "../components/Icon.jsx";
export const profileDefaults = (role) => ({
  name: role === "admin" ? "Maktab administratori" : "Nodira Umarova",
  email: "",
  phone: "",
  bio: "",
  showEmail: false,
  showPhone: false,
});
export default function StaffSettings() {
  const { state } = useSchool();
  return <SettingsForm key={state.role} role={state.role} />;
}
function SettingsForm({ role }) {
  const { logout } = useAuth();
  const { state, update, notify } = useSchool(),
    theme = useTheme(),
    { lang, setLang } = useI18n(),
    navigate = useNavigate();
  const saved = { ...profileDefaults(role), ...state.profiles?.[role] };
  const [portal, setPortal] = useState(state.settings.gamePortalUrl || ""),
    [profile, setProfile] = useState(saved),
    [tab, setTab] = useState("profile"),
    [exit, setExit] = useState(false);
  const dirty = JSON.stringify(saved) !== JSON.stringify(profile);
  const set = (key, value) => setProfile((p) => ({ ...p, [key]: value }));
  const save = (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      notify("Ism va familiyani kiriting.");
      return;
    }
    update((s) => ({
      ...s,
      profiles: {
        ...s.profiles,
        [role]: { ...profile, name: profile.name.trim() },
      },
    }));
    notify("Profil sozlamalari saqlandi.");
  };
  return (
    <Page
      title="Sozlamalar"
      subtitle="Shaxsiy ma’lumotlar, maxfiylik va sizga mos ko‘rinish."
    >
      <div className="settings-layout">
        <aside className="settings-nav">
          {[
            ["profile", "user", "Mening profilim"],
            ["privacy", "shield", "Maxfiylik"],
            ["appearance", "palette", "Ko‘rinish va til"],
            ["account", "lock", "Hisob va kirish"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon name={icon} />
              {label}
            </button>
          ))}
          <div className="settings-role">
            <Badge>{role === "admin" ? "Administrator" : "O‘qituvchi"}</Badge>
            <p>Rol va ruxsatlarni maktab administratori boshqaradi.</p>
          </div>
        </aside>
        <div className="school-stack">
          {(tab === "profile" || tab === "privacy") && (
            <form onSubmit={save} className="school-stack">
              {tab === "profile" ? (
                <>
                  <Card>
                    <div className="profile-hero">
                      <span className="profile-avatar">
                        {profile.name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((x) => x[0])
                          .join("")}
                      </span>
                      <div>
                        <h2>{profile.name || "Mening profilim"}</h2>
                        <p>
                          {role === "admin"
                            ? "Maktab administratori"
                            : "O‘qituvchi"}{" "}
                          · Mirae Maktab
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card title="Shaxsiy ma’lumotlar">
                    <div className="staff-filters">
                      <Field
                        label="Ism va familiya"
                        required
                        maxLength={80}
                        value={profile.name}
                        onChange={(e) => set("name", e.target.value)}
                      />
                      <Field
                        label="Elektron pochta"
                        type="email"
                        maxLength={120}
                        value={profile.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="name@example.com"
                      />
                      <Field
                        label="Telefon raqami"
                        type="tel"
                        maxLength={30}
                        value={profile.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="+998"
                      />
                      <Field
                        label="Hisob roli"
                        value={
                          role === "admin" ? "Administrator" : "O‘qituvchi"
                        }
                        readOnly
                      />
                    </div>
                    <Field label="O‘zingiz haqingizda">
                      <textarea
                        maxLength={400}
                        value={profile.bio}
                        onChange={(e) => set("bio", e.target.value)}
                        placeholder="Tajriba va qiziqishlaringiz haqida qisqacha…"
                      />
                    </Field>
                  </Card>
                </>
              ) : (
                <>
                  <Card title="Profilning ko‘rinishi">
                    <p>
                      Kontaktlaringiz profil oldindan ko‘rinishida qanday aks
                      etishini tanlang.
                    </p>
                    {[
                      [
                        "showEmail",
                        "Elektron pochtani ko‘rsatish",
                        "Profil kartasida elektron pochta manzilingiz ko‘rinadi.",
                      ],
                      [
                        "showPhone",
                        "Telefon raqamini ko‘rsatish",
                        "Profil kartasida telefon raqamingiz ko‘rinadi.",
                      ],
                    ].map(([key, title, desc]) => (
                      <label className="settings-switch" key={key}>
                        <span>
                          <b>{title}</b>
                          <small>{desc}</small>
                        </span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={profile[key]}
                          onChange={(e) => set(key, e.target.checked)}
                        />
                      </label>
                    ))}
                    <Note>
                      Demo sozlamalari shu brauzerda saqlanadi. Serverdagi
                      ruxsatlar va ma’lumotlarni himoyalash backend bilan
                      ulanadi.
                    </Note>
                  </Card>
                  <Card title="Profil oldindan ko‘rinishi">
                    <h3>{profile.name}</h3>
                    <p>{profile.bio || "Qisqacha ma’lumot kiritilmagan."}</p>
                    <p>
                      {profile.showEmail && profile.email
                        ? profile.email
                        : "Elektron pochta yashirilgan"}
                    </p>
                    <p>
                      {profile.showPhone && profile.phone
                        ? profile.phone
                        : "Telefon raqami yashirilgan"}
                    </p>
                  </Card>
                </>
              )}
              <div className="settings-save">
                <span className="school-muted" role="status">
                  {dirty
                    ? "Saqlanmagan o‘zgarishlar"
                    : "Barcha o‘zgarishlar saqlangan"}
                </span>
                <div className="school-row">
                  <Button
                    variant="secondary"
                    disabled={!dirty}
                    onClick={() => setProfile(saved)}
                  >
                    Bekor qilish
                  </Button>
                  <button
                    type="submit"
                    className="school-button"
                    disabled={!dirty}
                  >
                    O‘zgarishlarni saqlash
                  </button>
                </div>
              </div>
            </form>
          )}
          {tab === "appearance" && (
            <>
              <Card title="Ko‘rinish">
                <p>
                  Yorug‘, tungi yoki qurilmangizga mos avtomatik rejimni
                  tanlang.
                </p>
                <div className="theme-choices">
                  {[
                    ["light", "sun", "Kunduzgi"],
                    ["dark", "moon", "Tungi"],
                    ["system", "monitor", "Tizimga mos"],
                  ].map(([id, icon, label]) => (
                    <button
                      className={theme.mode === id ? "active" : ""}
                      key={id}
                      aria-pressed={theme.mode === id}
                      onClick={() => theme.setMode(id)}
                    >
                      <div className={"theme-sample " + id}>
                        <i />
                        <i />
                        <i />
                      </div>
                      <span>
                        <Icon name={icon} />
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
                <Note>
                  Tizimga mos rejim qurilmangizdagi rang sozlamasi o‘zgarsa
                  avtomatik yangilanadi.
                </Note>
              </Card>
              <Card title="Interfeys tili">
                <Select
                  label="Til"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  options={[
                    { value: "uz", label: "O‘zbekcha" },
                    { value: "ru", label: "Русский" },
                    { value: "en", label: "English" },
                  ]}
                />
                <Note>
                  Navigatsiya uch tilda. Sahifa matnlarining to‘liq tarjimasi
                  hali yakunlanmagan.
                </Note>
              </Card>
            </>
          )}
          {tab === "account" && (
            <>
              {role === "admin" && (
                <Card title="Game portal integratsiyasi">
                  <Field
                    label="Portalning POST qabul qilish manzili"
                    type="url"
                    value={portal}
                    onChange={(e) => setPortal(e.target.value)}
                    placeholder="https://game.example.com/launch"
                  />
                  <Note>
                    Portal payload nomli maydonda JSON qabul qiladi. Haqiqiy
                    portal manzilini jamoangizdan oling. Sozlama keyingi
                    o‘qituvchi kirishida ham saqlanadi.
                  </Note>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      let valid = !portal;
                      try {
                        const u = new URL(portal);
                        valid =
                          !u.username &&
                          !u.password &&
                          (u.protocol === "https:" ||
                            (u.protocol === "http:" &&
                              ["localhost", "127.0.0.1"].includes(u.hostname)));
                      } catch {}
                      if (!valid) {
                        notify("HTTPS yoki localhost manzilini kiriting.");
                        return;
                      }
                      update((s) => ({
                        ...s,
                        settings: { ...s.settings, gamePortalUrl: portal },
                      }));
                      notify("Portal manzili saqlandi.");
                    }}
                  >
                    Manzilni saqlash
                  </Button>
                </Card>
              )}
              {role === "teacher" && (
                <Card title="Avtomatik tayyorlash">
                  <label className="settings-switch">
                    <span>
                      <b>Darsdan oldin AI yordamida tayyorlash</b>
                      <small>
                        Tanlov saqlanadi. Avtomatik rejalashtirish backend
                        ulanganda ishlaydi.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={state.settings.autoAI}
                      onChange={(e) =>
                        update((s) => ({
                          ...s,
                          settings: { ...s.settings, autoAI: e.target.checked },
                        }))
                      }
                    />
                  </label>
                </Card>
              )}
              <Card title="Kirish ma’lumotlari">
                <div className="settings-switch">
                  <span>
                    <b>Hisob loginı</b>
                    <small>{role}</small>
                  </span>
                  <Badge>Demo hisob</Badge>
                </div>
                <p>
                  Hisoblar administrator tomonidan ochiladi. Login sahifasida
                  ro‘yxatdan o‘tish yo‘q.
                </p>
                <Note>
                  Parolni tiklash yoki o‘zgartirish uchun administratorga
                  murojaat qiling. Ushbu demoda haqiqiy parol va sessiyalarni
                  boshqarish ulanmagan.
                </Note>
              </Card>
              <Card title="Shaxsiy ma’lumotlar">
                <p>Saqlangan profilingizni JSON fayl sifatida yuklab oling.</p>
                <Button
                  variant="secondary"
                  onClick={() =>
                    download(
                      "mirae-profile.json",
                      JSON.stringify(saved, null, 2),
                      "application/json",
                    )
                  }
                >
                  Profilni yuklab olish
                </Button>
              </Card>
              <Card title="Joriy demo sessiyasi">
                <p>
                  Chiqishdan keyin login sahifasiga qaytasiz. Saqlangan
                  ishlaringiz brauzerda qoladi.
                </p>
                <Button variant="danger" onClick={() => setExit(true)}>
                  Hisobdan chiqish
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
      {exit && (
        <Modal title="Hisobdan chiqasizmi?" onClose={() => setExit(false)}>
          {dirty && <p>Profilning saqlanmagan o‘zgarishlari bekor qilinadi.</p>}
          <div className="school-row">
            <Button variant="secondary" onClick={() => setExit(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => {
                logout();
              }}
            >
              Chiqish
            </Button>
          </div>
        </Modal>
      )}
    </Page>
  );
}
