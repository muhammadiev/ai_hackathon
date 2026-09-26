import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sx } from '../utils/sx.js';
import { useTheme } from '../ThemeContext.jsx';
import Drawer from './Drawer.jsx';

// Sticky mobile app bar for immersive (no-sidebar) pages: back + title +
// theme toggle + hamburger that opens the full menu. Hidden on desktop.
export default function MobileTopBar({ title = 'MiraEdu', back = false }) {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mobile-topbar" style={sx('position:sticky;top:0;z-index:40;align-items:center;justify-content:space-between;gap:10px;background:var(--bg);border-bottom:1px solid var(--bd);padding:11px 14px')}>
        <div style={sx('display:flex;align-items:center;gap:10px;min-width:0')}>
          {back && <div onClick={() => navigate(-1)} style={sx('width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--tx);cursor:pointer;flex:none')}>←</div>}
          <div style={sx('font-family:Inter;font-weight:800;font-size:17px;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{title}</div>
        </div>
        <div style={sx('display:flex;align-items:center;gap:8px;flex:none')}>
          <div onClick={toggle} style={sx('width:34px;height:34px;border-radius:99px;background:var(--soft);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer')}>{dark ? '🌙' : '☀️'}</div>
          <div onClick={() => setOpen(true)} style={sx('width:34px;height:34px;border-radius:10px;background:var(--soft);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--tx);cursor:pointer')}>☰</div>
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
