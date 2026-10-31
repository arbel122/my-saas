import type { Metadata } from 'next';
import { siteOrigin } from './public-site';
import { shortCity } from './slug';

type Site = Record<string, any>;

const clip = (text: unknown, max: number) => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const isHttp = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//.test(v);

// הנתיב הציבורי של האתר: כתובת קריאה אם יש, אחרת לפי המזהה
export function sitePath(id: string, site?: Site | null) {
  const slug = typeof site?.slug === 'string' ? site.slug : '';
  return slug ? `/b/${encodeURIComponent(slug)}` : `/site/${id}`;
}

// "שם העסק | תחום | עיר": מה שאנשים מחפשים בגוגל
function titleOf(site: Site) {
  const city = shortCity(site.location);
  const parts = [clip(site.businessName, 60) || 'אתר עסק', clip(site.industry, 30), city].filter(Boolean);
  return [...new Set(parts)].join(' | ').slice(0, 90);
}

function descriptionOf(site: Site) {
  const lead = [clip(site.industry, 30), shortCity(site.location)].filter(Boolean).join(' ב');
  const body = clip(site.heroSubtitle || site.aboutText, 160);
  return clip(lead && body ? `${lead}. ${body}` : lead || body, 160);
}

export function siteMetadata(id: string, site: Site): Metadata {
  const title = titleOf(site);
  const description = descriptionOf(site);
  const image = isHttp(site.generatedImageUrl) ? site.generatedImageUrl : undefined;
  const url = `${siteOrigin()}${sitePath(id, site)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', locale: 'he_IL', siteName: clip(site.businessName, 70) || 'Opnyx', images: image ? [image] : undefined },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : undefined },
  };
}

// נתונים מובנים לגוגל: עסק מקומי עם כתובת או אזור שירות
export function siteJsonLd(id: string, site: Site) {
  const location = clip(site.location, 120);
  const city = shortCity(site.location);
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: clip(site.businessName, 120),
    description: descriptionOf(site),
    url: `${siteOrigin()}${sitePath(id, site)}`,
    ...(site.contactPhone ? { telephone: clip(site.contactPhone, 30) } : {}),
    ...(isHttp(site.generatedImageUrl) ? { image: site.generatedImageUrl } : {}),
    ...(site.workingHours ? { openingHours: clip(site.workingHours, 120) } : {}),
    ...(location && site.businessType !== 'mobile'
      ? { address: { '@type': 'PostalAddress', streetAddress: location, ...(city ? { addressLocality: city } : {}), addressCountry: 'IL' } }
      : {}),
    ...(city ? { areaServed: city } : {}),
  };
}
