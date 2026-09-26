/**
 * Mirae student API client
 * - Base: VITE_API_BASE_URL (e.g. https://api.example.com/api/v1)
 * - Auth: Authorization: Bearer <access>
 * - On 401: one refresh via /auth/token/refresh/, then retry
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
// Ensure paths are under /api/v1 if caller only set origin
export const BASE_URL = RAW_BASE
  ? /\/api\/v1$/i.test(RAW_BASE)
    ? RAW_BASE
    : `${RAW_BASE}/api/v1`
  : '/api/v1';

const TOKEN_KEY = 'miraedu_access';
const REFRESH_KEY = 'miraedu_refresh';

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

export function isMockMode() {
  return String(import.meta.env.VITE_USE_MOCK || '').toLowerCase() === 'true';
}

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error('No refresh token');
    const candidates = [
      `${BASE_URL}/auth/token/refresh/`,
      `${BASE_URL}/token/refresh/`,
    ];
    let lastErr;
    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) {
          lastErr = new Error(`Refresh ${res.status}`);
          continue;
        }
        const data = await res.json();
        setTokens({ access: data.access, refresh: data.refresh || refresh });
        return data.access;
      } catch (e) {
        lastErr = e;
      }
    }
    clearTokens();
    throw lastErr || new Error('Refresh failed');
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function normalizeError(res, data) {
  const err = new Error(
    data?.detail ||
      data?.message ||
      (typeof data === 'string' ? data : null) ||
      `Request failed (${res.status})`
  );
  err.status = res.status;
  err.data = data;
  return err;
}

/**
 * @param {string} path - starts with / (relative to BASE_URL)
 */
export async function apiFetch(path, { method = 'GET', body, isFormData = false, _retried = false, skipAuth = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (!skipAuth) {
    const access = getAccessToken();
    if (access) headers['Authorization'] = `Bearer ${access}`;
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body == null ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (res.status === 401 && !_retried && !skipAuth) {
    try {
      await refreshAccessToken();
      return apiFetch(path, { method, body, isFormData, _retried: true, skipAuth });
    } catch {
      clearTokens();
      window.dispatchEvent(new CustomEvent('miraedu:session-expired'));
      throw new Error('Sessiya tugadi. Qayta kiring.');
    }
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) throw normalizeError(res, data);
  return data;
}

/** DRF pagination helper */
export function toArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.items)) return data.items;
  return [];
}
