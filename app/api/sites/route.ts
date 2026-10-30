import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getUserFromRequest, UUID_RE } from '@/app/utils/auth';

const MAX_CONTENT_BYTES = 1_000_000;
const MAX_SITES_PER_USER = 20;

// יצירה או עדכון של אתר של המשתמש המחובר. סטטוס ה-Pro נקבע כאן, בשרת, לפי pro_users.
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'יש להתחבר כדי לשמור את האתר' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, content } = body ?? {};

    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return NextResponse.json({ error: 'תוכן האתר חסר או לא תקין' }, { status: 400 });
    }
    if (JSON.stringify(content).length > MAX_CONTENT_BYTES) {
      return NextResponse.json({ error: 'האתר גדול מדי' }, { status: 413 });
    }
    if (id !== undefined && id !== null && (typeof id !== 'string' || !UUID_RE.test(id))) {
      return NextResponse.json({ error: 'מזהה אתר לא תקין' }, { status: 400 });
    }

    const siteName =
      (typeof name === 'string' && name.trim().slice(0, 120)) ||
      (typeof content.businessName === 'string' && content.businessName.trim().slice(0, 120)) ||
      'האתר שלי';

    const supabase = getSupabaseAdmin();

    const { data: proRow } = await supabase
      .from('pro_users')
      .select('is_active')
      .eq('user_id', user.id)
      .maybeSingle();
    const isPro = proRow?.is_active === true;

    if (id) {
      const { data, error } = await supabase
        .from('sites')
        .update({ name: siteName, content, is_pro: isPro })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'האתר לא נמצא' }, { status: 404 });
      }
      return NextResponse.json({ id: data[0].id });
    }

    const { count } = await supabase
      .from('sites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count ?? 0) >= MAX_SITES_PER_USER) {
      return NextResponse.json({ error: 'הגעת למספר האתרים המקסימלי' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('sites')
      .insert({ user_id: user.id, name: siteName, content, is_pro: isPro })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('Save site error:', err);
    return NextResponse.json({ error: 'שגיאה בשמירת האתר' }, { status: 500 });
  }
}
