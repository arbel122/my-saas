import type { MetadataRoute } from 'next';
import { getSupabaseAdmin } from './utils/supabase-admin';
import { siteOrigin } from './utils/public-site';
import { sitePath } from './utils/site-seo';

// רשימת כל האתרים המפורסמים, כדי שגוגל ימצא אותם. נוצרת בכל בקשה, לא בזמן הבנייה.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const pages: MetadataRoute.Sitemap = ['', '/pricing', '/terms', '/privacy', '/accessibility', '/demo/salon', '/demo/lawyer', '/demo/home-services'].map((p) => ({
    url: `${origin}${p}`,
  }));

  try {
    const { data } = await getSupabaseAdmin().from('sites').select('id, slug:content->>slug').eq('is_pro', true).limit(5000);
    for (const s of data ?? []) {
      pages.push({ url: `${origin}${sitePath(s.id, { slug: s.slug })}` });
    }
  } catch {
    // בלי רשימת האתרים עדיין מחזירים את הדפים הכלליים
  }
  return pages;
}
