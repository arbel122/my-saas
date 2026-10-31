import { siteJsonLd } from '../utils/site-seo';

// תגית הנתונים המובנים של אתר עסק (לגוגל)
export default function SiteJsonLd({ id, site }: { id: string; site: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      // מחליפים < כדי שתוכן העסק לא יוכל לסגור את תגית הסקריפט
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(id, site)).replace(/</g, '\\u003c') }}
    />
  );
}
