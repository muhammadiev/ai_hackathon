import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import MobileNav from './MobileNav.jsx';

function unlockScroll() {
  const html = document.documentElement;
  const body = document.body;
  [html, body].forEach((el) => {
    el.style.setProperty('overflow', 'auto', 'important');
    el.style.setProperty('overflow-x', 'hidden', 'important');
    el.style.setProperty('overflow-y', 'auto', 'important');
    el.style.setProperty('height', 'auto', 'important');
    el.style.setProperty('max-height', 'none', 'important');
    el.style.setProperty('position', 'static', 'important');
    el.style.setProperty('touch-action', 'pan-y pinch-zoom', 'important');
  });
  const root = document.getElementById('root');
  if (root) {
    root.style.setProperty('height', 'auto', 'important');
    root.style.setProperty('overflow', 'visible', 'important');
  }
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('miraemaktab-sidebar') === '1'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('miraemaktab-sidebar', collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => {
    unlockScroll();
    const id = setInterval(unlockScroll, 500);
    const t = setTimeout(() => clearInterval(id), 3000);
    window.addEventListener('resize', unlockScroll);
    return () => {
      clearInterval(id);
      clearTimeout(t);
      window.removeEventListener('resize', unlockScroll);
    };
  }, []);

  return (
    <div className="app-shell">
      <div className="app-bg" aria-hidden />
      <Sidebar collapsed={collapsed} />
      <div className="app-main">
        <TopBar onToggleSidebar={() => setCollapsed((v) => !v)} collapsed={collapsed} />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
