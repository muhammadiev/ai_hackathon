import { useTheme } from '../ThemeContext.jsx';
import { sx } from '../utils/sx.js';

export default function ThemeToggle({ size = 38 }) {
  const { dark, toggle } = useTheme();
  return (
    <div
      onClick={toggle}
      title="Mavzu"
      style={sx(
        `width:${size}px;height:${size}px;border-radius:99px;background:var(--soft);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;flex:none`
      )}
    >
      {dark ? '🌙' : '☀️'}
    </div>
  );
}
