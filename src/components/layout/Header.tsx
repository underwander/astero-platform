import { Scale } from "lucide-react";
import Link from "next/link";
import { CtaLink } from "@/components/ui/CtaLink";
import { siteConfig } from "@/config/site";
import { MobileNavigation } from "./MobileNavigation";

export function Header() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="bg-ink-950/82 pointer-events-auto mx-auto flex h-[68px] max-w-[1380px] items-center justify-between rounded-[18px] border border-white/10 px-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,.8)] backdrop-blur-2xl sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="border-gold-500/30 text-gold-300 grid size-10 place-items-center rounded-[13px] border bg-white/[0.055] shadow-inner">
            <Scale aria-hidden="true" size={20} strokeWidth={1.6} />
          </span>
          <span className="font-display text-sm font-semibold tracking-[-.02em] sm:text-base">
            {siteConfig.shortName}
          </span>
        </Link>
        <nav
          className="hidden items-center gap-1 rounded-xl border border-white/[.07] bg-white/[.035] p-1 lg:flex"
          aria-label="Основная навигация"
        >
          {siteConfig.navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white/58 transition hover:bg-white/[.07] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden lg:block">
          <CtaLink {...siteConfig.cta.primary} source="header" className="min-h-0 rounded-xl px-5 py-2.5" />
        </div>
        <MobileNavigation items={siteConfig.navigation} cta={siteConfig.cta.primary} />
      </div>
    </header>
  );
}
