import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cssVars } from './theme.js';

const ThemeContext = createContext({ dark: false, mode: 'light', setMode: () => {}, toggle: () => {} });

const prefersDark = () => {
  try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  catch { return false; }
};

export function ThemeProvider({ children }) {
  // mode: 'light' | 'dark' | 'system'
  const [mode, setMode] = useState(() => {
    try {
      const m = localStorage.getItem('miraemaktab-theme-mode');
      if (m) return m;
      const legacy = localStorage.getItem('miraemaktab-theme');
      return legacy === 'dark' ? 'dark' : legacy === 'light' ? 'light' : 'system';
    } catch { return 'system'; }
  });
  const [sysDark, setSysDark] = useState(prefersDark);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = (e) => setSysDark(e.matches);
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on));
  }, []);

  const dark = useMemo(() => (mode === 'system' ? sysDark : mode === 'dark'), [mode, sysDark]);

  useEffect(() => {
    const vars = cssVars(dark);
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.documentElement.style.background = vars['--bg'];
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('miraemaktab-theme-mode', mode); } catch { /* ignore */ }
  }, [dark, mode]);

  const toggle = () => setMode(dark ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ dark, mode, setMode, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
