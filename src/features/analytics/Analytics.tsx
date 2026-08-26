"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useCallback, useEffect, useState } from "react";
import { consentKey } from "@/components/layout/CookieConsent";
import { siteConfig } from "@/config/site";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

function push(name: string, parameters: Record<string, unknown> = {}) {
  window.dataLayer ||= [];
  window.dataLayer.push({ event: name, ...parameters });

  const { gtmId, gaId, googleAdsId, googleAdsLabel } = siteConfig.analytics;
  if (!gtmId && gaId && window.gtag) window.gtag("event", name, parameters);
  if (name === "form_submit" && googleAdsId && googleAdsLabel && window.gtag) {
    window.gtag("event", "conversion", { send_to: `${googleAdsId}/${googleAdsLabel}` });
  }
  if (window.fbq) {
    if (name === "form_submit") window.fbq("track", "Lead", parameters);
    else window.fbq("trackCustom", name, parameters);
  }
}

export function Analytics() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  const reportWebVital = useCallback(
    (metric: { id: string; name: string; value: number; delta: number; rating: string; navigationType: string }) => {
      if (!allowed) return;
      push("web_vital", {
        metric_id: metric.id,
        metric_name: metric.name,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
        navigation_type: metric.navigationType,
      });
    },
    [allowed],
  );

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setAllowed(window.localStorage.getItem(consentKey) === "analytics");
      } catch {
        setAllowed(false);
      }
    });
    const consent = (event: Event) => setAllowed((event as CustomEvent<string>).detail === "analytics");
    window.addEventListener("consent-change", consent);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("consent-change", consent);
    };
  }, []);

  useEffect(() => {
    if (!allowed) return;
    push("page_view", { page_path: pathname, page_title: document.title });
  }, [allowed, pathname]);

  useEffect(() => {
    if (!allowed) return;
    const thresholds = [25, 50, 75, 100];
    const sent = new Set<number>();
    const scroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const progress = available > 0 ? Math.round((window.scrollY / available) * 100) : 100;
      thresholds.forEach((threshold) => {
        if (progress >= threshold && !sent.has(threshold)) {
          sent.add(threshold);
          push(`scroll_${threshold}`, { percent_scrolled: threshold });
        }
      });
    };
    const click = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-event]");
      if (!target) return;
      if (target.dataset.event === "faq_open" && target.closest("details")?.open) return;
      push(target.dataset.event || "interaction", {
        element_text: target.textContent?.trim().slice(0, 120),
        ...(target.dataset.source ? { source: target.dataset.source } : {}),
      });
    };
    const custom = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail;
      if (typeof detail?.name === "string") push(detail.name, detail);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("click", click);
    window.addEventListener("analytics-event", custom);
    scroll();
    return () => {
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("click", click);
      window.removeEventListener("analytics-event", custom);
    };
  }, [allowed]);

  if (!allowed) return null;
  const { gtmId, gaId, googleAdsId, metaPixelId } = siteConfig.analytics;
  const googleTagId = gaId || googleAdsId;

  return (
    <>
      {gtmId ? (
        <Script
          id="gtm-loader"
          strategy="afterInteractive"
        >{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</Script>
      ) : null}
      {!gtmId && googleTagId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga-config"
            strategy="afterInteractive"
          >{`window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());${gaId ? `gtag('config','${gaId}',{send_page_view:false});` : ""}${googleAdsId ? `gtag('config','${googleAdsId}');` : ""}`}</Script>
        </>
      ) : null}
      {metaPixelId ? (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
        >{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}</Script>
      ) : null}
    </>
  );
}
