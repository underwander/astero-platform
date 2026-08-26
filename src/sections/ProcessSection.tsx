import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { processContent } from "@/content";

export function ProcessSection() {
  return (
    <section id="process" className="bg-white px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1380px]">
        <Reveal>
          <SectionHeading {...processContent} />
        </Reveal>
        <div className="relative mt-16 grid gap-4 lg:grid-cols-4">
          <div
            aria-hidden="true"
            className="from-gold-500/50 via-gold-500/20 absolute top-[40px] right-[10%] left-[10%] hidden h-px bg-gradient-to-r to-transparent lg:block"
          />
          {processContent.steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.06} className="relative h-full">
              <article className="group border-ink-950/8 h-full rounded-[22px] border bg-white p-7 shadow-[0_30px_90px_-55px_rgba(5,13,24,.45)] transition duration-300 hover:-translate-y-1 hover:border-[#c8a467]/35 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="from-gold-300 to-gold-600 text-ink-950 font-display grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-sm font-bold shadow-[0_15px_35px_-18px_rgba(170,130,69,.9)]">
                    {step.number}
                  </span>
                  {index < processContent.steps.length - 1 ? (
                    <ArrowRight aria-hidden="true" className="text-ink-950/18 hidden lg:block" size={20} />
                  ) : null}
                </div>
                <h3 className="section-title text-ink-950 mt-10 text-xl">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{step.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
