import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getUserFromRequest, UUID_RE } from '@/app/utils/auth';
import { slugBase } from '@/app/utils/slug';

const MAX_CONTENT_BYTES = 1_000_000;
const MAX_SITES_PER_USER = 20;

// כתובת קריאה ייחודית לאתר (/b/קצביית-דוד-ירושלים). נקבעת פעם אחת, ולא משתנה כשעורכים.
async function uniqueSlug(supabase: ReturnType<typeof getSupabaseAdmin>, content: Record<string, unknown>, excludeId?: string) {
  const base = slugBase(content);
  for (let i = 1; i <= 30; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    let query = supabase.from('sites').select('id').eq('content->>slug', candidate).limit(1);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// יצירה או עדכון של אתר של המשתמש המחובר. סטטוס ה-Pro נקבע כאן, בשרת, לפי pro_users.
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'יש להתחבר כדי לשמור את האתר' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
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

    // תמונות מוצרים: רק מהאחסון שלנו (אחרת מסירים), כדי שאי אפשר יהיה לטעון תמונה מכתובת חיצונית שרירותית
    const imagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/`;
    if (Array.isArray(content.catalog)) {
      for (const category of content.catalog) {
        for (const item of Array.isArray(category?.items) ? category.items : []) {
          if (item && typeof item.image === 'string' && !item.image.startsWith(imagePrefix)) delete item.image;
        }
      }
    }

    const siteName =
      (typeof name === 'string' && name.trim().slice(0, 120)) ||
      (typeof content.businessName === 'string' && content.businessName.trim().slice(0, 120)) ||
      'האתר שלי';

    const supabase = getSupabaseAdmin();

    const { data: proRow } = await supabase
      .from('pro_users')
      .select('is_active, ends_at')
      .eq('user_id', user.id)
      .maybeSingle();
    // מנוי שבוטל נשאר פעיל עד תאריך הסיום, גם אם המשימה היומית עוד לא הורידה אותו
    const isPro = proRow?.is_active === true && (!proRow.ends_at || new Date(proRow.ends_at).getTime() > Date.now());

    if (id) {
      // רשימת הביקורות המוסתרות מנוהלת רק בשרת. שמירה מהעורך לא דורסת אותה.
      const { data: existing } = await supabase
        .from('sites')
        .select('content')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      content.hiddenReviewIds = Array.isArray(existing?.content?.hiddenReviewIds) ? existing.content.hiddenReviewIds : [];
      // הכתובת הקריאה מנוהלת רק בשרת ולא משתנה בעריכה
      content.slug = typeof existing?.content?.slug === 'string' && existing.content.slug ? existing.content.slug : await uniqueSlug(supabase, content, id);

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

    content.hiddenReviewIds = [];

    const { count } = await supabase
      .from('sites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count ?? 0) >= MAX_SITES_PER_USER) {
      return NextResponse.json({ error: 'הגעת למספר האתרים המקסימלי' }, { status: 403 });
    }

    content.slug = await uniqueSlug(supabase, content);

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
