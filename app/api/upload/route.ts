import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getUserFromRequest } from '@/app/utils/auth';
import { isRateLimited } from '@/app/utils/rate-limit';

const MAX_BYTES = 3 * 1024 * 1024;

// סוג הקובץ נקבע לפי התוכן עצמו (לא לפי מה שהדפדפן טוען), כדי שאי אפשר יהיה להעלות HTML או סקריפט.
function detectImage(bytes: Uint8Array): { ext: string; type: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: 'png', type: 'image/png' };
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === 'RIFF' && webp === 'WEBP') return { ext: 'webp', type: 'image/webp' };
  return null;
}

// העלאת תמונה (מוצר, סיפור, תמונה ראשית) של משתמש מחובר. הקובץ נשמר תחת התיקייה של המשתמש.
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'יש להתחבר כדי להעלות תמונה.', needsLogin: true }, { status: 401 });
    }
    if (isRateLimited(`upload:${user.id}`, 40, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'יותר מדי העלאות. נסו שוב מאוחר יותר.' }, { status: 429 });
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'לא נבחר קובץ.' }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'התמונה גדולה מדי (עד 3MB).' }, { status: 413 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const image = detectImage(buffer);
    if (!image) {
      return NextResponse.json({ error: 'אפשר להעלות רק תמונות JPG, PNG או WebP.' }, { status: 415 });
    }

    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${image.ext}`;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from('site-assets').upload(path, buffer, { contentType: image.type, upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'שגיאה בהעלאת התמונה.' }, { status: 500 });
  }
}
