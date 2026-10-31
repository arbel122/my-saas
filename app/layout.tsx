import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AccessibilityAndCookies from "./components/AccessibilityAndCookies";

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

export const metadata: Metadata = {
  title: "Opnyx",
  description: "AI-powered landing page generator",
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
      className={`${inter.variable} ${logoFont.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
        <AccessibilityAndCookies />
      </body>
    </html>
  );
}