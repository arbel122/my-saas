import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteClient from '@/app/site/[id]/SiteClient';
import SiteJsonLd from '@/app/components/SiteJsonLd';
import { getPublishedSiteBySlug } from '@/app/utils/public-site';
import { getSupabaseAdmin } from '@/app/utils/supabase-admin';
import { getStaffCatalogs } from '@/app/utils/staff';
import { siteMetadata } from '@/app/utils/site-seo';

type Props = { params: Promise<{ slug: string }> };

// הכתובת הקריאה של האתר: /b/קצביית-דוד-ירושלים. אותו אתר בדיוק כמו /site/[id].
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublishedSiteBySlug(slug);
  return site ? siteMetadata(site.id, site.content) : { title: 'Opnyx', robots: { index: false } };
}

export default async function PublicSiteBySlugPage({ params }: Props) {
  const { slug } = await params;
  const site = await getPublishedSiteBySlug(slug);
  if (!site) notFound();
  const staffCatalogs = await getStaffCatalogs(getSupabaseAdmin(), site.id);

  return (
    <>
      <SiteJsonLd id={site.id} site={site.content} />
      <SiteClient siteId={site.id} initialContent={site.content} staffCatalogs={staffCatalogs} />
    </>
  );
}
