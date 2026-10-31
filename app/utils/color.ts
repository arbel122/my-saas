// צבע ערכת הנושא שבחר בעל העסק משמש כרקע לכפתורים עם טקסט לבן. אם הצבע בהיר מדי והטקסט
// לא קריא (ניגודיות פחות מ-4.5, תקן נגישות AA), מחשיכים אותו מעט עד שהוא קריא.
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]) {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function accessibleColor(hex: string | undefined, fallback = '#2563eb'): string {
  let rgb = parseHex(hex || '') ?? parseHex(fallback)!;
  // יחס ניגודיות מול לבן: 1.05 / (L + 0.05)
  while (1.05 / (luminance(rgb) + 0.05) < 4.5) {
    rgb = [Math.round(rgb[0] * 0.92), Math.round(rgb[1] * 0.92), Math.round(rgb[2] * 0.92)];
  }
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
}
