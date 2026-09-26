// UI session flags only. JWT lives in api/client.js

const K_AUTH = 'miraemaktab-authed';
const K_ONB = 'miraemaktab-onboarded';

const read = (k) => {
  try {
    return localStorage.getItem(k) === '1';
  } catch {
    return false;
  }
};

const write = (k, v) => {
  try {
    localStorage.setItem(k, v ? '1' : '0');
  } catch {
    /* ignore */
  }
};

/** Input mask: +998 90 200 00 09 */
export function formatUzPhone(v) {
  let d = String(v).replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(0, 12);
  else if (d.startsWith('0')) d = '998' + d.slice(1, 10);
  else if (!d.startsWith('998') && d.length) d = '998' + d.slice(0, 9);
  let out = '+998';
  const rest = d.startsWith('998') ? d.slice(3) : d;
  if (rest.length > 0) out += ' ' + rest.slice(0, 2);
  if (rest.length > 2) out += ' ' + rest.slice(2, 5);
  if (rest.length > 5) out += ' ' + rest.slice(5, 7);
  if (rest.length > 7) out += ' ' + rest.slice(7, 9);
  return out;
}

/** API form: +998902000009 */
export function normalizePhone(v) {
  const digits = String(v || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('998')) return `+${digits.slice(0, 12)}`;
  if (digits.length <= 9) return `+998${digits}`;
  return `+${digits}`;
}

export const isAuthed = () => {
  try {
    if (localStorage.getItem('miraedu_access')) return true;
  } catch {
    /* ignore */
  }
  return read(K_AUTH);
};

export const setAuthed = (v) => write(K_AUTH, v);
export const isOnboarded = () => read(K_ONB);
export const setOnboarded = (v) => write(K_ONB, v);
export function logoutSession() {
  setAuthed(false);
  try {
    localStorage.removeItem('miraedu_access');
    localStorage.removeItem('miraedu_refresh');
  } catch {
    /* ignore */
  }
}

/** Used by Drawer.jsx and TopBar.jsx */
export function logout() {
  logoutSession();
}