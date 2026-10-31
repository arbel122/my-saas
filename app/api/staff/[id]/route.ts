import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE, getUserFromRequest } from '@/app/utils/auth';
import { cleanCatalog, cleanStaffName, cleanStaffServices } from '@/app/utils/staff';

type Ctx = { params: Promise<{ id: string }> };

// מטפל יכול לערוך את עצמו, ובעל האתר יכול לערוך כל מטפל באתר שלו.
async function loadWithAccess(req: Request, id: string) {
  const user = await getUserFromRequest(req);
  if (!user) return { error: NextResponse.json({ error: 'יש להתחבר.' }, { status: 401 }) };
  if (!UUID_RE.test(id)) return { error: NextResponse.json({ error: 'המטפל לא נמצא' }, { status: 404 }) };

  const supabase = getSupabaseAdmin();
  const { data: staff } = await supabase.from('site_staff').select('id, site_id, user_id, name, services').eq('id', id).maybeSingle();
  if (!staff) return { error: NextResponse.json({ error: 'המטפל לא נמצא' }, { status: 404 }) };

  const { data: site } = await supabase.from('sites').select('id, user_id, content').eq('id', staff.site_id).maybeSingle();
  const isOwner = !!site && site.user_id === user.id;
  const isSelf = staff.user_id === user.id;
  if (!isOwner && !isSelf) return { error: NextResponse.json({ error: 'המטפל לא נמצא' }, { status: 404 }) };

  return { supabase, staff, site, isOwner, isSelf };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const access = await loadWithAccess(req, id);
  if ('error' in access) return access.error;

  const body = await req.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if (body?.services !== undefined) {
    update.services = cleanStaffServices(body.services, access.site?.content);
  }
  // מוצרים של המטפל (המטפל עצמו או בעל העסק)
  if (body?.catalog !== undefined) {
    update.catalog = cleanCatalog(body.catalog);
  }
  // שם: רק בעל העסק משנה
  if (body?.name !== undefined && access.isOwner) {
    const name = cleanStaffName(body.name);
    if (name.length < 2) return NextResponse.json({ error: 'נא לכתוב שם.' }, { status: 400 });
    update.name = name;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'אין מה לעדכן' }, { status: 400 });
  }

  const { error } = await access.supabase.from('site_staff').update(update).eq('id', id);
  if (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ error: 'שגיאה בעדכון' }, { status: 500 });
  }
  return NextResponse.json({ success: true, ...update });
}

// הסרת מטפל (בעל האתר) או עזיבה (המטפל עצמו). תורים שכבר נקבעו נשארים ביומן של בעל העסק.
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const access = await loadWithAccess(req, id);
  if ('error' in access) return access.error;

  const { error } = await access.supabase.from('site_staff').delete().eq('id', id);
  if (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ error: 'שגיאה במחיקה' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
