import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Heebo, Inter, Plus_Jakarta_Sans, Rubik, Secular_One } from "next/font/google";
import "./globals.css";
import AccessibilityAndCookies from "./components/AccessibilityAndCookies";
import { siteOrigin } from "./utils/public-site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// הגופן של הלוגו
const logoFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-logo",
});

// גופנים בעברית לאתרי העסקים. כל תחום עסק מקבל גופן כותרות אחר (ראו utils/site-theme.ts)
const serifHe = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["500", "700", "900"], variable: "--font-serif-he", preload: false });
const displayHe = Secular_One({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-display-he", preload: false });
const boldHe = Rubik({ subsets: ["hebrew", "latin"], weight: ["500", "700", "800"], variable: "--font-bold-he", preload: false });
const bodyHe = Heebo({ subsets: ["hebrew", "latin"], weight: ["400", "500", "700", "800"], variable: "--font-body-he", preload: false });

const homeTitle = "Opnyx | אתר מקצועי לעסק שלך תוך 10 שניות";
const homeDescription = "מתארים את העסק במשפט, והבינה המלאכותית בונה אתר עם שירותים, קביעת תורים אונליין, ביקורות וקישור לוואטסאפ.";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: homeTitle,
  description: homeDescription,
  openGraph: { title: homeTitle, description: homeDescription, type: "website", locale: "he_IL", siteName: "Opnyx" },
  appleWebApp: {
    capable: true,
    title: "Opnyx",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${inter.variable} ${logoFont.variable} ${serifHe.variable} ${displayHe.variable} ${boldHe.variable} ${bodyHe.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
        <AccessibilityAndCookies />
      </body>
    </html>
  );
}