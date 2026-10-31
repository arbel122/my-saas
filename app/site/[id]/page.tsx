import type { Metadata } from 'next';
import SiteClient from './SiteClient';
import { getPublishedSite, siteOrigin } from '@/app/utils/public-site';

type Props = { params: Promise<{ id: string }> };

const clip = (text: unknown, max: number) => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// כותרת, תיאור ותמונה לשיתוף (וואטסאפ, פייסבוק) ולגוגל, לפי תוכן האתר של העסק.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const site = await getPublishedSite(id);
  if (!site) return { title: 'Opnyx', robots: { index: false } };

  const name = clip(site.businessName, 70) || 'אתר עסק';
  const title = site.heroTitle ? `${name} | ${clip(site.heroTitle, 60)}` : name;
  const description = clip(site.heroSubtitle || site.aboutText, 160);
  const image = typeof site.generatedImageUrl === 'string' && /^https?:\/\//.test(site.generatedImageUrl) ? site.generatedImageUrl : undefined;
  const url = `${siteOrigin()}/site/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', locale: 'he_IL', siteName: name, images: image ? [image] : undefined },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : undefined },
  };
}

export default async function PublicSitePage({ params }: Props) {
  const { id } = await params;
  const site = await getPublishedSite(id);

  // נתונים מובנים לגוגל: "עסק מקומי"
  const jsonLd = site
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: clip(site.businessName, 120),
        description: clip(site.heroSubtitle || site.aboutText, 300),
        url: `${siteOrigin()}/site/${id}`,
        ...(site.contactPhone ? { telephone: clip(site.contactPhone, 30) } : {}),
        ...(typeof site.generatedImageUrl === 'string' && /^https?:\/\//.test(site.generatedImageUrl) ? { image: site.generatedImageUrl } : {}),
        ...(site.workingHours ? { openingHours: clip(site.workingHours, 120) } : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // מחליפים < כדי שתוכן העסק לא יוכל לסגור את תגית הסקריפט
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <SiteClient initialContent={site ?? undefined} />
    </>
  );
}
