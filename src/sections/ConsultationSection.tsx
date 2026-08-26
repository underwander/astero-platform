import { FileSearch, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { CtaLink } from "@/components/ui/CtaLink";
import { siteConfig } from "@/config/site";
import { consultationContent } from "@/content";

export function ConsultationSection() {
  return (
    <section id="consultation" className="bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <Reveal className="mx-auto max-w-[1380px]">
        <div className="bg-ink-950 relative isolate overflow-hidden rounded-[28px] px-6 py-12 text-white shadow-[0_45px_120px_-55px_rgba(5,13,24,.75)] sm:px-10 lg:px-16 lg:py-16">
          <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-25" />
          <div
            aria-hidden="true"
            className="bg-gold-500/15 absolute -top-40 right-[-5%] size-[480px] rounded-full blur-[130px]"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-4xl">
              <p className="eyebrow text-gold-400">{consultationContent.eyebrow}</p>
              <h2 className="section-title mt-5 text-4xl leading-[1.06] sm:text-5xl lg:text-[3.7rem]">
                {consultationContent.title}
                <span className="block text-white/55">{consultationContent.accent}</span>
              </h2>
              <div className="mt-8 flex max-w-2xl items-start gap-3 text-sm leading-7 text-white/52">
                <ShieldCheck aria-hidden="true" className="text-gold-300 mt-1 shrink-0" size={19} />
                {consultationContent.note}
              </div>
            </div>
            <div className="glass-dark min-w-[290px] p-5 sm:p-6">
              <FileSearch aria-hidden="true" className="text-gold-300" size={25} strokeWidth={1.6} />
              <p className="mt-4 text-sm leading-6 text-white/60">{consultationContent.card}</p>
              <CtaLink {...siteConfig.cta.primary} source="final_section" className="mt-6 w-full" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
