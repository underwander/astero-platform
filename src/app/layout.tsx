import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Analytics } from "@/features/analytics/Analytics";
import { LeadModal } from "@/features/lead-form/LeadModal";
import { isLaunchReady, siteConfig } from "@/config/site";
import "./globals.css";

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  applicationName: siteConfig.shortName,
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  category: "legal services",
  creator: siteConfig.operatorName || undefined,
  publisher: siteConfig.operatorName || undefined,
  alternates: { canonical: "/" },
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: isLaunchReady,
    follow: isLaunchReady,
    googleBot: {
      index: isLaunchReady,
      follow: isLaunchReady,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: siteConfig.shortName,
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.seo.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07111f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={siteConfig.locale}>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="text-ink-950 fixed top-3 left-3 z-[100] -translate-y-24 rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-xl transition-transform focus:translate-y-0"
        >
          Перейти к содержанию
        </a>
        <Header />
        {children}
        <Footer />
        <LeadModal />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
