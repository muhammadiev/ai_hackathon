import { useEffect, useRef, useState } from 'react';
import { sx } from '../utils/sx.js';

// Evaluate a +-×÷ expression WITHOUT eval/Function (shunting-yard -> RPN).
function evaluate(raw) {
  const s = String(raw).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  const tokens = s.match(/(\d+\.?\d*)|[+\-*/]/g);
  if (!tokens) return '';
  const out = [], ops = [];
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
  let prev = null;
  for (let t of tokens) {
    if (/^\d/.test(t)) { out.push(parseFloat(t)); prev = 'num'; }
    else {
      // unary minus -> fold into a leading 0
      if (t === '-' && (prev === null || prev === 'op')) { out.push(0); }
      while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) out.push(ops.pop());
      ops.push(t); prev = 'op';
    }
  }
  while (ops.length) out.push(ops.pop());
  const st = [];
  for (const x of out) {
    if (typeof x === 'number') st.push(x);
    else {
      const b = st.pop(), a = st.pop();
      if (a === undefined || b === undefined) return 'Xato';
      st.push(x === '+' ? a + b : x === '-' ? a - b : x === '*' ? a * b : a / b);
    }
  }
  const r = st.pop();
  if (r === undefined || !Number.isFinite(r)) return 'Xato';
  return String(Math.round(r * 1e8) / 1e8);
}

const KEYS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export default function Calculator({ onClose }) {
  const [expr, setExpr] = useState('');
  const [pos, setPos] = useState({ x: null, y: null });
  const drag = useRef(null);

  const press = (k) => setExpr((e) => {
    if (k === 'C') return '';
    if (k === 'DEL') return e.slice(0, -1);
    if (k === '=') return evaluate(e);
    if (k === '±') { const m = e.match(/(-?\d*\.?\d+)$/); if (!m) return e; const n = m[1]; return e.slice(0, m.index) + (n.startsWith('-') ? n.slice(1) : '-' + n); }
    if (k === '%') { const m = e.match(/(\d*\.?\d+)$/); if (!m) return e; return e.slice(0, m.index) + (parseFloat(m[1]) / 100); }
    if ('+−×÷'.includes(k) && (e === '' || '+−×÷'.includes(e.slice(-1)))) return e ? e.slice(0, -1) + k : e;
    return e + k;
  });

  useEffect(() => {
    const onKey = (e) => {
      const map = { '*': '×', '/': '÷', '-': '−' };
      if (/^[0-9.]$/.test(e.key)) press(e.key);
      else if (['+', '-', '*', '/'].includes(e.key)) press(map[e.key] || e.key);
      else if (e.key === 'Enter' || e.key === '=') press('=');
      else if (e.key === 'Backspace') press('DEL');
      else if (e.key === 'Escape') onClose?.();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // drag by header (desktop)
  const onDown = (e) => { const r = e.currentTarget.parentElement.getBoundingClientRect(); drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top }; };
  useEffect(() => {
    const mv = (e) => { if (!drag.current) return; setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }); };
    const up = () => (drag.current = null);
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
  }, []);

  const posStyle = pos.x == null ? 'top:76px;right:20px' : `top:${pos.y}px;left:${pos.x}px`;

  return (
    <div className="calc-pop" style={sx(`position:fixed;${posStyle};width:250px;z-index:120;background:var(--card);border:1px solid var(--bd);border-radius:14px;box-shadow:var(--shadowLg);overflow:hidden`)}>
      <div onMouseDown={onDown} style={sx('display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--bd);cursor:move;background:var(--soft)')}>
        <span style={sx('font-size:12.5px;font-weight:800;color:var(--tx)')}>Kalkulyator</span>
        <button onClick={onClose} aria-label="Yopish" style={sx('width:26px;height:26px;border-radius:7px;border:none;background:transparent;color:var(--sub);font-weight:800;cursor:pointer')}>✕</button>
      </div>
      <div style={sx('padding:12px')}>
        <div style={sx('background:var(--soft);border:1px solid var(--bd);border-radius:10px;text-align:right;padding:12px;margin-bottom:10px;font-size:20px;font-weight:800;color:var(--tx);overflow-x:auto')} className="statnum">{expr === '' ? '0' : expr}</div>
        <div style={sx('display:grid;grid-template-columns:repeat(4,1fr);gap:7px')}>
          {KEYS.flat().map((k) => {
            const op = '÷×−+'.includes(k);
            const eq = k === '=';
            const zero = k === '0';
            const bg = eq ? '#3D7DF6' : op ? 'rgba(61,125,246,.12)' : 'var(--soft)';
            const fg = eq ? '#fff' : op ? '#3D7DF6' : 'var(--tx)';
            return (
              <button key={k} onClick={() => press(k)} style={sx(`padding:11px 0;border:none;border-radius:9px;font-weight:700;font-size:15px;cursor:pointer;background:${bg};color:${fg};${zero ? 'grid-column:span 2' : ''}`)}>{k}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
