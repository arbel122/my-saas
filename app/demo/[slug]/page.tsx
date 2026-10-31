import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteView from '@/app/components/SiteView';
import { DEMO_SITES, getDemoSite } from '@/app/utils/demo-sites';

export function generateStaticParams() {
  return DEMO_SITES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const demo = getDemoSite(slug);
  return { title: demo ? `${demo.content.businessName} (אתר דוגמה) | Site-AI` : 'Site-AI' };
}

export default async function DemoSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = getDemoSite(slug);
  if (!demo) notFound();

  return <SiteView siteData={demo.content} siteId={`demo-${demo.slug}`} demo />;
}
