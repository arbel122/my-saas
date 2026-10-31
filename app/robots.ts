import type { MetadataRoute } from 'next';
import { siteOrigin } from './utils/public-site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/create', '/checkout', '/login', '/my-appointments', '/review/'] }],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
