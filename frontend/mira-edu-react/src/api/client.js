/**
 * Mirae Teacher/Admin API client
 * Base: VITE_API_URL + /api/v1
 * Auth: Bearer access; 401 → refresh once → retry; still 401 → session-expired
 */

const RAW_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
export const API_BASE = RAW_BASE.replace(/\/$/, "");
export const API_V1 = API_BASE ? `${API_BASE}/api/v1` : "";

const TOKEN_KEY = "miraedu_access";
const REFRESH_KEY = "miraedu_refresh";

export function isApiConfigured() {
  return Boolean(API_V1);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error("No refresh token");

    const res = await fetch(`${API_V1}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      clearTokens();
      throw new Error("Refresh failed");
    }

    const data = await res.json();
    setTokens({ access: data.access, refresh: data.refresh || refresh });
    return data.access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/** Normalized API error for UI mapping. */
export class ApiError extends Error {
  constructor(status, message, body = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.code = body?.code || body?.error || null;
  }
}

function messageFromBody(status, body) {
  if (!body) return `Xato (${status})`;
  if (typeof body === "string") return body;
  if (body.detail) {
    return typeof body.detail === "string"
      ? body.detail
      : JSON.stringify(body.detail);
  }
  if (body.error && typeof body.error === "string") return body.error;
  if (body.message) return body.message;
  if (body.non_field_errors?.length) return body.non_field_errors.join(", ");
  const fields = Object.entries(body)
    .filter(([k, v]) => k !== "code" && Array.isArray(v))
    .map(([k, v]) => `${k}: ${v.join(", ")}`);
  if (fields.length) return fields.join("; ");
  return `Xato (${status})`;
}

/**
 * Core request helper.
 * path is relative to /api/v1 (e.g. "/me/" or "/classes/").
 */
export async function apiFetch(
  path,
  { method = "GET", body, isFormData = false, _retried = false, signal } = {},
) {
  if (!API_V1) {
    throw new ApiError(0, "API manzili sozlanmagan (VITE_API_URL).", null);
  }

  const access = getAccessToken();
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const url = path.startsWith("http")
    ? path
    : `${API_V1}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers,
    body:
      body == null ? undefined : isFormData ? body : JSON.stringify(body),
    signal,
  });

  if (res.status === 401 && !_retried) {
    try {
      await refreshAccessToken();
      return apiFetch(path, { method, body, isFormData, _retried: true, signal });
    } catch {
      clearTokens();
      window.dispatchEvent(new CustomEvent("miraedu:session-expired"));
      throw new ApiError(401, "Sessiya tugagan. Qaytadan kiring.", null);
    }
  }

  if (res.status === 401 && _retried) {
    clearTokens();
    window.dispatchEvent(new CustomEvent("miraedu:session-expired"));
    throw new ApiError(401, "Sessiya tugagan. Qaytadan kiring.", null);
  }

  if (!res.ok) {
    let parsed = null;
    try {
      parsed = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, messageFromBody(res.status, parsed), parsed);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** DRF paginated envelope → array */
export function toArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}
