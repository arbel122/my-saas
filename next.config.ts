import type { NextConfig } from "next";

// כותרות אבטחה לכל הדפים: מניעת הטמעת האתר בתוך אתר אחר (clickjacking), מניעת ניחוש סוג קבצים,
// והגבלת המידע שנשלח לאתרים אחרים. מדיניות CSP מלאה לא נוספה כדי לא לשבור את PayPal ותמונות חיצוניות.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
