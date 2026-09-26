import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  getAccessToken,
  clearTokens,
  isApiConfigured,
} from "./api/client.js";
import { fetchMe, login as apiLogin, logout as apiLogout } from "./api/auth.js";

const AuthContext = createContext(null);

/**
 * Server-backed auth.
 * - When VITE_API_URL is set: real tokens + GET /me/
 * - When not set: demo mode (legacy sessionStorage flag) for offline prototype
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiOn = isApiConfigured();

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!apiOn) {
        // Demo mode: session flag only
        const demo = sessionStorage.getItem("mirae-staff-session");
        if (demo) {
          const role = sessionStorage.getItem("mirae-staff-role") || "teacher";
          setUser({
            id: "demo-" + role,
            username: role,
            global_role: role,
            role,
            name: role === "admin" ? "Demo Admin" : "Nodira ustoz",
            demo: true,
          });
        } else {
          setUser(null);
        }
        return;
      }

      if (!getAccessToken()) {
        setUser(null);
        return;
      }

      const me = await fetchMe();
      const role = me.global_role || me.role || me.roles?.[0] || "teacher";
      setUser({ ...me, role, global_role: role });
    } catch (e) {
      clearTokens();
      setUser(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiOn]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("miraedu:session-expired", onExpired);
    return () =>
      window.removeEventListener("miraedu:session-expired", onExpired);
  }, [navigate]);

  const login = useCallback(
    async (username, password) => {
      setError(null);
      if (!apiOn) {
        // Demo credentials only when API is off
        const u = username.trim().toLowerCase();
        if ((u === "teacher" || u === "admin") && password === "mirae123") {
          sessionStorage.setItem("mirae-staff-session", "demo");
          sessionStorage.setItem("mirae-staff-role", u);
          const demoUser = {
            id: "demo-" + u,
            username: u,
            global_role: u,
            role: u,
            name: u === "admin" ? "Demo Admin" : "Nodira ustoz",
            demo: true,
          };
          setUser(demoUser);
          return demoUser;
        }
        throw new Error("Login yoki parol noto‘g‘ri (demo: teacher/admin + mirae123)");
      }

      await apiLogin(username, password);
      const me = await fetchMe();
      const role = me.global_role || me.role || me.roles?.[0] || "teacher";
      const normalized = { ...me, role, global_role: role };
      setUser(normalized);
      // clear any leftover demo flags
      sessionStorage.removeItem("mirae-staff-session");
      sessionStorage.removeItem("mirae-staff-role");
      return normalized;
    },
    [apiOn],
  );

  const logout = useCallback(async () => {
    if (apiOn) await apiLogout();
    else {
      sessionStorage.removeItem("mirae-staff-session");
      sessionStorage.removeItem("mirae-staff-role");
      clearTokens();
    }
    setUser(null);
    navigate("/login", { replace: true });
  }, [apiOn, navigate]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refreshMe: bootstrap,
      isAuthenticated: Boolean(user),
      isDemo: Boolean(user?.demo) || !apiOn,
      apiConfigured: apiOn,
    }),
    [user, loading, error, login, logout, bootstrap, apiOn],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
