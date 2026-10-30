// הגבלת בקשות בזיכרון. הגנה בסיסית נגד ניצול לרעה, לא חסימה מלאה:
// בסביבת serverless כל מופע שרת סופר בנפרד.
const buckets = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    return true;
  }

  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > 5000) {
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return false;
}

export function getClientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}
