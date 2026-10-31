import type { SupabaseClient } from '@supabase/supabase-js';

export const MAX_STAFF_PER_SITE = 15;

export type StaffRow = {
  id: string;
  site_id: string;
  user_id: string | null;
  name: string;
  services: string[];
  invite_token: string;
  status: 'invited' | 'active';
};

// שמות השירותים של האתר (רק מחרוזות תקינות)
export function siteServiceNames(content: unknown): string[] {
  const services = (content as { services?: unknown } | null)?.services;
  return (Array.isArray(services) ? services : [])
    .map((s) => (s && typeof (s as { name?: unknown }).name === 'string' ? (s as { name: string }).name : ''))
    .filter(Boolean);
}

// רשימת שירותים שהמטפל עושה: רק שירותים שקיימים באתר. ריק = כל השירותים.
export function cleanStaffServices(input: unknown, content: unknown): string[] {
  const all = siteServiceNames(content);
  const wanted = Array.isArray(input) ? input.filter((s): s is string => typeof s === 'string') : [];
  const picked = all.filter((name) => wanted.includes(name));
  return picked.length > 0 ? picked : all;
}

export function cleanStaffName(input: unknown): string {
  return typeof input === 'string' ? input.trim().replace(/\s+/g, ' ').slice(0, 40) : '';
}

// מטפלים פעילים (שהצטרפו) של אתר. אם הטבלה עוד לא קיימת, מחזיר רשימה ריקה והאתר ממשיך לעבוד בלי צוות.
export async function getActiveStaff(supabase: SupabaseClient, siteId: string): Promise<StaffRow[]> {
  const { data, error } = await supabase
    .from('site_staff')
    .select('id, site_id, user_id, name, services, invite_token, status')
    .eq('site_id', siteId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as StaffRow[];
}

// מטפלים שעושים שירות מסוים
export function staffForService(staff: StaffRow[], service: string): StaffRow[] {
  return staff.filter((s) => Array.isArray(s.services) && s.services.includes(service));
}
