// כתובת קריאה לאתר: /b/קצביית-דוד-ירושלים. אותיות עבריות ולטיניות ומספרים, מופרדים במקף.
export function slugify(text: string) {
  return text
    .normalize('NFC')
    .replace(/[֑-ׇ]/g, '') // ניקוד וטעמים
    .toLowerCase()
    .replace(/[^a-z0-9א-ת]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

// "רחוב הרצל 5, ירושלים" -> "ירושלים"; "תל אביב והמרכז" -> "תל אביב והמרכז"
export function shortCity(location: unknown) {
  const parts = String(location ?? '')
    .split(/[,\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? '').slice(0, 25);
}

export function slugBase(content: Record<string, unknown>) {
  const parts = [content.businessName, content.industry, shortCity(content.location)]
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map((p) => p.trim());
  return slugify(parts.join(' ')) || 'site';
}
