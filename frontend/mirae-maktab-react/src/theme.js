// Design tokens. Returns the CSS-variable map applied to <html> by ThemeProvider.
// Components reference these as var(--bg), var(--tx), etc. (1:1 with the design components).
export const ACCENT = '#3D7DF6';

export function tokens(dark) {
  return dark
    ? {
        bg: '#0B1220', card: '#141C2E', bd: '#243449', tx: '#EAF1FF', sub: '#93A4C0',
        track: '#22304A', sbar: '#0E1626', chip: '#1C2B44', soft: '#131D30', field: '#111A2B',
        shadow: '0 1px 2px rgba(0,0,0,.3),0 12px 30px -18px rgba(0,0,0,.6)',
        shadowLg: '0 24px 60px -24px rgba(0,0,0,.72)',
      }
    : {
        // Clean white + light-blue palette
        bg: '#F3F7FF', card: '#FFFFFF', bd: '#E6EEFB', tx: '#132038', sub: '#5C6B85',
        track: '#EAF1FC', sbar: '#FFFFFF', chip: '#E9F1FF', soft: '#F5F9FF', field: '#F7FAFF',
        shadow: '0 1px 2px rgba(20,40,80,.04),0 10px 30px -20px rgba(20,40,80,.20)',
        shadowLg: '0 22px 55px -26px rgba(20,40,80,.36)',
      };
}

export function cssVars(dark) {
  const t = tokens(dark);
  const out = {};
  Object.entries(t).forEach(([k, v]) => {
    out['--' + k] = v;
  });
  return out;
}
