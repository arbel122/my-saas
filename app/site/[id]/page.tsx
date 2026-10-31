import type { Metadata } from 'next';
import SiteClient from './SiteClient';
import SiteJsonLd from '@/app/components/SiteJsonLd';
import { getPublishedSite } from '@/app/utils/public-site';
import { siteMetadata } from '@/app/utils/site-seo';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const site = await getPublishedSite(id);
  return site ? siteMetadata(id, site) : { title: 'Opnyx', robots: { index: false } };
}

export default async function PublicSitePage({ params }: Props) {
  const { id } = await params;
  const site = await getPublishedSite(id);

  return (
    <>
      {site && <SiteJsonLd id={id} site={site} />}
      <SiteClient siteId={id} initialContent={site ?? undefined} />
    </>
  );
}
