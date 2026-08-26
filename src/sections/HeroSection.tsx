import { ArrowDown, CheckCircle2, FileSearch, Scale, ShieldCheck } from "lucide-react";
import { CaseMap } from "@/components/illustrations/CaseMap";
import { CtaLink } from "@/components/ui/CtaLink";
import { siteConfig } from "@/config/site";
import { heroContent } from "@/content";

const trustIcons = [ShieldCheck, Scale, FileSearch] as const;

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="bg-ink-950 relative isolate min-h-[92svh] overflow-hidden px-5 pt-30 pb-14 text-white sm:px-8 lg:px-12 lg:pt-32 lg:pb-16"
    >
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-45" />
      <div
        aria-hidden="true"
        className="bg-gold-500/14 absolute -top-56 right-[-10%] size-[720px] rounded-full blur-[170px]"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-45%] left-[-18%] size-[680px] rounded-full bg-[#1b4a78]/20 blur-[160px]"
      />

      <div className="relative mx-auto flex min-h-[calc(92svh-9rem)] max-w-[1380px] flex-col justify-between">
        <div className="grid items-center gap-14 lg:grid-cols-[1.06fr_.94fr] xl:gap-20">
          <div className="max-w-[760px]">
            <p className="text-gold-300 inline-flex items-center gap-3 text-[.68rem] font-bold tracking-[0.18em] uppercase">
              <span className="bg-gold-400 size-1.5 rounded-full shadow-[0_0_18px_rgba(220,193,142,.9)]" />
              {heroContent.eyebrow}
            </p>
            <h1
              id="hero-title"
              className="section-title mt-7 text-[2.7rem] leading-[1.01] sm:text-6xl lg:text-[3.8rem] xl:text-[4.6rem]"
            >
              {heroContent.title.primary}
              <span className="mt-1 block bg-gradient-to-r from-white via-[#ead8b5] to-[#aa8245] bg-clip-text text-transparent">
                {heroContent.title.accent}
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/62 sm:text-lg">{heroContent.description}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaLink {...siteConfig.cta.primary} source="hero_primary" />
              <CtaLink {...siteConfig.cta.secondary} source="hero_secondary" variant="ghost" />
            </div>
            <div className="mt-8 flex items-start gap-3 border-l border-white/15 pl-4">
              <CheckCircle2 aria-hidden="true" className="text-gold-400 mt-0.5 shrink-0" size={17} />
              <p className="max-w-xl text-xs leading-5 text-white/60">{heroContent.note}</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px] lg:mr-0">
            <div className="absolute inset-[8%] rounded-full bg-[#c8a467]/8 blur-3xl" aria-hidden="true" />
            <CaseMap />
            <div className="glass-dark absolute right-2 bottom-4 max-w-[260px] p-4 sm:right-8 sm:bottom-8">
              <p className="text-gold-300 text-[.65rem] font-bold tracking-[.14em] uppercase">Основа позиции</p>
              <p className="mt-2 text-xs leading-5 text-white/68">
                Документы, транзакции, юрисдикция и проверяемые факты.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid border-t border-white/10 pt-6 sm:grid-cols-3 lg:mt-8">
          {heroContent.trustItems.map((item, index) => {
            const Icon = trustIcons[index];
            return (
              <div
                key={item}
                className="flex gap-3 border-white/10 py-3 sm:border-l sm:px-5 sm:first:border-l-0 sm:first:pl-0"
              >
                <Icon aria-hidden="true" className="text-gold-400 mt-0.5 shrink-0" size={18} strokeWidth={1.6} />
                <p className="text-xs leading-5 text-white/58">{item}</p>
              </div>
            );
          })}
          <a href="#services" className="sr-only">
            Перейти к направлениям <ArrowDown aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
