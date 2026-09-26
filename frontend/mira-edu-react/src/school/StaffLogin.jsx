import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Icon from "../components/Icon.jsx";
import { Field } from "./ui.jsx";

export default function StaffLogin() {
  const { login: doLogin, apiConfigured } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await doLogin(username, password);
      const role = user.global_role || user.role || "teacher";
      navigate(role === "admin" ? "/a" : "/t", { replace: true });
    } catch (err) {
      setError(err.message || "Kirish muvaffaqiyatsiz");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="login-brand-row">
          <span className="login-logo">M</span>
          <ThemeToggle />
        </div>
        <div className="login-form">
          <span className="school-badge purple">MIRAE MAKTAB</span>
          <h1>Xush kelibsiz</h1>
          <p className="school-muted">Davom etish uchun hisobingizga kiring.</p>
          <form onSubmit={submit} className="school-stack">
            <Field
              label="Login"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="Loginni kiriting"
            />
            <div className="login-password">
              <Field
                label="Parol"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolni kiriting"
              />
              <button
                type="button"
                aria-label={
                  visible ? "Parolni yashirish" : "Parolni ko‘rsatish"
                }
                onClick={() => setVisible(!visible)}
              >
                <Icon name="eye" />
              </button>
            </div>
            {error && (
              <p role="alert" className="editor-errors">
                {error}
              </p>
            )}
            <button className="school-button" type="submit" disabled={busy}>
              {busy ? "Kirilmoqda…" : "Kirish"} <span>→</span>
            </button>
          </form>
          <p className="login-help">
            Kirish ma’lumotlari yoki parolni tiklash uchun maktab
            administratoriga murojaat qiling.
          </p>
          {!apiConfigured && (
            <div className="login-demo">
              <b>Frontend demo (API ulanmagan)</b>
              <p>
                Login: <code>teacher</code> yoki <code>admin</code>
                <br />
                Parol: <code>mirae123</code>
              </p>
              <small>
                VITE_API_URL o‘rnatilganda haqiqiy backend ishlatiladi.
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
