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

// ---- מוצרים של מטפל ----

export type StaffCatalogItem = { name: string; description?: string; price?: string; image?: string };
export type StaffCatalogCategory = { id: string; name: string; items: StaffCatalogItem[] };
export type StaffCatalog = { id: string; name: string; catalog: StaffCatalogCategory[] };

const clipText = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// ניקוי קטלוג שמגיע מהדפדפן: מגבלות אורך וכמות, ותמונות רק מהאחסון שלנו.
export function cleanCatalog(input: unknown): StaffCatalogCategory[] {
  const imagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/`;
  return (Array.isArray(input) ? input : [])
    .slice(0, 10)
    .map((category, index) => {
      const c = (category ?? {}) as { id?: unknown; name?: unknown; items?: unknown };
      const items = (Array.isArray(c.items) ? c.items : [])
        .slice(0, 30)
        .map((raw) => {
          const i = (raw ?? {}) as { name?: unknown; description?: unknown; price?: unknown; image?: unknown };
          const item: StaffCatalogItem = {
            name: clipText(i.name, 80),
            description: clipText(i.description, 200),
            price: clipText(i.price, 30),
          };
          if (typeof i.image === 'string' && i.image.startsWith(imagePrefix) && i.image.length < 500) item.image = i.image;
          return item;
        })
        .filter((i) => i.name);
      return { id: clipText(c.id, 40) || `cat-${index}-${Date.now()}`, name: clipText(c.name, 60), items };
    })
    .filter((c) => c.name && c.items.length > 0);
}

// הקטלוגים של מטפלים פעילים באתר. אם העמודה עוד לא קיימת מחזיר רשימה ריקה והאתר ממשיך לעבוד.
export async function getStaffCatalogs(supabase: SupabaseClient, siteId: string): Promise<StaffCatalog[]> {
  const { data, error } = await supabase
    .from('site_staff')
    .select('id, name, catalog')
    .eq('site_id', siteId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as StaffCatalog[]).filter((s) => Array.isArray(s.catalog) && s.catalog.length > 0);
}
