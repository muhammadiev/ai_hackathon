import { apiFetch, setTokens, clearTokens, BASE_URL } from './client.js';

function normalizePhone(v) {
  const digits = String(v || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('998')) return `+${digits.slice(0, 12)}`;
  if (digits.length <= 9) return `+998${digits}`;
  return `+${digits}`;
}

export async function login(identifier, password) {
  const raw = String(identifier || '').trim();
  const digits = raw.replace(/\D/g, '');
  const isPhone =
    /^\+?\d[\d\s\-()]{7,}$/.test(raw) ||
    (digits.length >= 9 && digits.length <= 12);

  const body = isPhone
    ? { phone: normalizePhone(raw), password }
    : { username: raw, password };

  const paths = ['/auth/login/', '/auth/token/', '/token/'];
  let lastErr;

  for (const path of paths) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        const msg =
          data.detail ||
          data.error ||
          (Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : null) ||
          "Telefon raqam yoki parol xato";
        lastErr = new Error(typeof msg === 'string' ? msg : "Telefon raqam yoki parol xato");
        continue;
      }
      const access = data.access || data.tokens?.access;
      const refresh = data.refresh || data.tokens?.refresh;
      if (!access) {
        lastErr = new Error('Token qaytmadi');
        continue;
      }
      setTokens({ access, refresh });
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Telefon raqam yoki parol xato");
}

export function logout() {
  clearTokens();
}

export function fetchMyProfile() {
  return apiFetch('/me/').catch(() => apiFetch('/accounts/me/'));
}

export function updateMyProfile(payload) {
  const { role, is_staff, is_superuser, ...safe } = payload || {};
  return apiFetch('/me/', { method: 'PATCH', body: safe }).catch(() =>
    apiFetch('/accounts/me/', { method: 'PATCH', body: safe })
  );
}

export function changePassword(oldPassword, newPassword) {
  return apiFetch('/accounts/me/password/', {
    method: 'POST',
    body: { old_password: oldPassword, new_password: newPassword },
  }).catch(() =>
    apiFetch('/accounts/me/change-password/', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword },
    })
  );
}