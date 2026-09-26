import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DICT } from './i18n.js';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('miraemaktab-lang') || 'uz'; } catch { return 'uz'; }
  });
  useEffect(() => { try { localStorage.setItem('miraemaktab-lang', lang); } catch { /* ignore */ } }, [lang]);

  const t = useMemo(() => {
    const table = DICT[lang] || DICT.uz;
    return (key) => table[key] || DICT.uz[key] || key;
  }, [lang]);

  return <I18nContext.Provider value={{ lang, setLang: setLangState, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return { lang: 'uz', setLang: () => {}, t: (k) => (DICT.uz[k] || k) };
  return ctx;
}
