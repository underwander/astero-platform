import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/ui/CtaLink";
import { siteConfig } from "@/config/site";
import { notFoundContent } from "@/content";

export const metadata: Metadata = {
  title: notFoundContent.title,
  description: notFoundContent.description,
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="bg-ink-950 relative isolate grid min-h-screen place-items-center overflow-hidden px-5 py-32 text-white"
    >
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-40" />
      <div aria-hidden="true" className="bg-gold-500/15 absolute size-[520px] rounded-full blur-[140px]" />
      <section className="glass-dark relative max-w-2xl p-8 text-center sm:p-12" aria-labelledby="not-found-title">
        <p className="text-gold-300 text-xs font-bold tracking-[.16em] uppercase">{notFoundContent.eyebrow}</p>
        <h1 id="not-found-title" className="section-title mt-5 text-4xl sm:text-6xl">
          {notFoundContent.title}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-white/65">{notFoundContent.description}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <CtaLink {...siteConfig.cta.primary} source="not_found" />
          <Link
            href="/"
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-[14px] border border-white/15 px-6 text-sm font-bold text-white hover:bg-white/[.08]"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            {notFoundContent.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
