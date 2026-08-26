import { Bitcoin, Building2, FileSearch, Globe2, Landmark, Scale, Shield, WalletCards } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { CtaLink } from "@/components/ui/CtaLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { servicesContent } from "@/content";

const icons = [Scale, Building2, Bitcoin, Landmark, WalletCards, Globe2, FileSearch, Shield] as const;
const featured = new Set([0, 5]);

export function ServicesSection() {
  return (
    <section id="services" className="bg-[#f6f7f8] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1380px]">
        <Reveal>
          <SectionHeading {...servicesContent} />
        </Reveal>
        <div className="mt-16 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-4">
          {servicesContent.items.map((service, index) => {
            const Icon = icons[index];
            const isFeatured = featured.has(index);
            return (
              <Reveal key={service.id} delay={index * 0.035} className={`${isFeatured ? "lg:col-span-2" : ""} h-full`}>
                <article
                  className={`${isFeatured ? "premium-card-dark text-white" : "premium-card text-ink-950"} group relative flex h-full min-h-[310px] flex-col overflow-hidden p-7 sm:p-8`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`${isFeatured ? "text-gold-300 border-white/12 bg-white/[.06]" : "border-ink-950/8 bg-ink-950 text-gold-300"} grid size-12 place-items-center rounded-[15px] border shadow-lg`}
                    >
                      <Icon aria-hidden="true" size={21} strokeWidth={1.6} />
                    </span>
                    <span
                      className={`${isFeatured ? "text-white/22" : "text-ink-950/18"} font-display text-xs font-bold tracking-[.16em]`}
                    >
                      0{index + 1}
                    </span>
                  </div>
                  <div className="mt-auto pt-12">
                    <h3 className="section-title max-w-md text-xl leading-snug sm:text-2xl">{service.title}</h3>
                    <p className={`${isFeatured ? "text-white/55" : "text-slate-600"} mt-4 max-w-xl text-sm leading-7`}>
                      {service.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        <Reveal className="mt-10 flex justify-start">
          <CtaLink label="Передать финансовый спор на анализ" source="services_end" variant="dark" />
        </Reveal>
      </div>
    </section>
  );
}
