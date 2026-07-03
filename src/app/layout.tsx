import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/images/pwa/astero-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/pwa/astero-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/images/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Astero",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f8a4b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-white">
        <ThemeProvider>
          <LanguageProvider><SidebarProvider>{children}</SidebarProvider></LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
