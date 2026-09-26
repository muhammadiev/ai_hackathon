import { apiFetch, setTokens, clearTokens, getAccessToken, isApiConfigured } from "./client.js";

/**
 * Login with username/password.
 * Backend: POST /api/v1/auth/login/  or  POST /api/v1/auth/token/
 * Expects { access, refresh } or { tokens: { access, refresh } }
 */
export async function login(username, password) {
  const body = { username: username.trim().toLowerCase(), password };
  let data;
  try {
    data = await apiFetch("/auth/login/", { method: "POST", body });
  } catch (e) {
    // fallback path some Django JWT setups use
    if (e.status === 404) {
      data = await apiFetch("/auth/token/", {
        method: "POST",
        body: { username: body.username, password },
      });
    } else {
      throw e;
    }
  }
  const access = data.access || data.tokens?.access;
  const refresh = data.refresh || data.tokens?.refresh;
  if (!access) throw new Error("Token olinmadi");
  setTokens({ access, refresh });
  return data;
}

export async function logout() {
  try {
    if (isApiConfigured() && getAccessToken()) {
      await apiFetch("/auth/logout/", { method: "POST", body: {} });
    }
  } catch {
    /* ignore network errors on logout */
  } finally {
    clearTokens();
  }
}

/** Current actor — never trust client role */
export function fetchMe() {
  return apiFetch("/me/");
}
