import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { UUID_RE } from '@/app/utils/auth';
import { getClientIp, isRateLimited } from '@/app/utils/rate-limit';
import { getActiveStaff, getStaffCatalogs } from '@/app/utils/staff';

// המטפלים של אתר מפורסם והשירותים שכל אחד עושה, לבחירה בעת קביעת תור. רק שם ושירותים, בלי פרטים אישיים.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ staff: [] });
  if (isRateLimited(`staff-list:${getClientIp(req)}`, 200, 60 * 60 * 1000)) {
    return NextResponse.json({ staff: [] }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();
  const { data: site } = await supabase.from('sites').select('is_pro').eq('id', id).maybeSingle();
  if (!site || site.is_pro !== true) return NextResponse.json({ staff: [] });

  const staff = await getActiveStaff(supabase, id);
  const catalogs = await getStaffCatalogs(supabase, id);
  return NextResponse.json({
    staff: staff.map((s) => ({ id: s.id, name: s.name, services: s.services, catalog: catalogs.find((c) => c.id === s.id)?.catalog ?? [] })),
  });
}
