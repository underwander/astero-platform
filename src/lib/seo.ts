import type { Metadata } from "next";
import { faqContent, servicesContent, type LegalDocument } from "@/content";
import { isLaunchReady, siteConfig } from "@/config/site";

const siteUrl = siteConfig.domain.replace(/\/$/, "");
const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;
const homeId = `${siteUrl}/#webpage`;
const serviceId = `${siteUrl}/#legal-service`;
const imageUrl = `${siteUrl}/opengraph-image`;

const indexableRobots: Metadata["robots"] = {
  index: isLaunchReady,
  follow: isLaunchReady,
  googleBot: {
    index: isLaunchReady,
    follow: isLaunchReady,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export function legalMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: indexableRobots,
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      locale: "ru_RU",
      siteName: siteConfig.shortName,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}

export function legalPageSchema(document: LegalDocument, path: string) {
  if (!isLaunchReady || !siteConfig.operatorName) return null;

  const pageUrl = `${siteUrl}${path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}/#webpage`,
        url: pageUrl,
        name: document.title,
        description: document.description,
        inLanguage: siteConfig.language,
        isPartOf: { "@id": websiteId },
        breadcrumb: { "@id": `${pageUrl}/#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}/#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: siteUrl },
          { "@type": "ListItem", position: 2, name: document.title, item: pageUrl },
        ],
      },
    ],
  };
}

export const homeSchema =
  isLaunchReady && siteConfig.operatorName
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": organizationId,
            name: siteConfig.operatorName,
            alternateName: siteConfig.shortName,
            url: siteUrl,
            email: siteConfig.legal.contactEmail,
            contactPoint: {
              "@type": "ContactPoint",
              email: siteConfig.legal.contactEmail,
              contactType: "legal inquiries",
              availableLanguage: ["ru"],
            },
            logo: {
              "@type": "ImageObject",
              url: `${siteUrl}/icon.svg`,
            },
          },
          {
            "@type": "WebSite",
            "@id": websiteId,
            url: siteUrl,
            name: siteConfig.name,
            description: siteConfig.seo.description,
            inLanguage: siteConfig.language,
            publisher: { "@id": organizationId },
          },
          {
            "@type": "WebPage",
            "@id": homeId,
            url: siteUrl,
            name: siteConfig.seo.title,
            description: siteConfig.seo.description,
            inLanguage: siteConfig.language,
            isPartOf: { "@id": websiteId },
            about: { "@id": serviceId },
            primaryImageOfPage: { "@id": `${siteUrl}/#primaryimage` },
            breadcrumb: { "@id": `${siteUrl}/#breadcrumb` },
          },
          {
            "@type": "ImageObject",
            "@id": `${siteUrl}/#primaryimage`,
            url: imageUrl,
            width: 1200,
            height: 630,
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${siteUrl}/#breadcrumb`,
            itemListElement: [{ "@type": "ListItem", position: 1, name: "Главная", item: siteUrl }],
          },
          {
            "@type": "LegalService",
            "@id": serviceId,
            name: siteConfig.name,
            description: siteConfig.seo.description,
            url: siteUrl,
            provider: { "@id": organizationId },
            areaServed: { "@type": "Place", name: "Международная практика" },
            availableLanguage: ["ru"],
            serviceType: servicesContent.items.map((item) => item.title),
          },
          {
            "@type": "FAQPage",
            "@id": `${siteUrl}/#faq`,
            isPartOf: { "@id": homeId },
            inLanguage: siteConfig.language,
            mainEntity: faqContent.items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          },
        ],
      }
    : null;
