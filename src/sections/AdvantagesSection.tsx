import { Eye, FileCheck2, LockKeyhole, ListChecks } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { advantagesContent } from "@/content";

const icons = [FileCheck2, Eye, ListChecks, LockKeyhole] as const;

export function AdvantagesSection() {
  return (
    <section
      id="advantages"
      className="bg-ink-950 relative isolate overflow-hidden px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-36"
    >
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-25" />
      <div
        aria-hidden="true"
        className="bg-gold-500/10 absolute top-[-25%] left-[30%] size-[600px] rounded-full blur-[160px]"
      />
      <div className="relative mx-auto max-w-[1380px]">
        <Reveal>
          <SectionHeading {...advantagesContent} light />
        </Reveal>
        <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {advantagesContent.items.map((item, index) => {
            const Icon = icons[index];
            return (
              <Reveal key={item.title} delay={index * 0.055} className="h-full bg-[#091727]/88">
                <article className="group h-full min-h-[300px] p-7 transition duration-300 hover:bg-white/[.035] sm:p-8">
                  <span className="border-gold-500/25 text-gold-300 grid size-12 place-items-center rounded-[15px] border bg-white/[.045]">
                    <Icon aria-hidden="true" size={21} strokeWidth={1.6} />
                  </span>
                  <p className="font-display mt-12 text-xs font-bold tracking-[.15em] text-white/24">0{index + 1}</p>
                  <h3 className="section-title mt-4 text-xl">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/53">{item.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
