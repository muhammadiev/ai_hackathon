// sx("display:flex;gap:8px") -> { display:'flex', gap:'8px' }
// Lets us port the design-component inline styles almost 1:1 into React.
// CSS custom properties (--x) are preserved verbatim; everything else is camelCased.
export function sx(input) {
  if (input == null) return undefined;
  if (typeof input === 'object') return input;
  const out = {};
  let depth = 0;
  let key = '';
  let val = '';
  let onKey = true;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ':' && onKey && depth === 0) {
      onKey = false;
      continue;
    }
    if (c === ';' && depth === 0) {
      commit();
      continue;
    }
    if (onKey) key += c;
    else val += c;
  }
  commit();
  function commit() {
    const k = key.trim();
    const v = val.trim();
    key = '';
    val = '';
    onKey = true;
    if (!k || v === '') return;
    const prop = k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    out[prop] = v;
  }
  return out;
}
