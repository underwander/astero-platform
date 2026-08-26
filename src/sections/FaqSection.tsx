import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqContent } from "@/content";

export function FaqSection() {
  return (
    <section id="faq" className="bg-[#f6f7f8] px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto grid max-w-[1380px] gap-14 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
        <Reveal direction="left" className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading {...faqContent} />
          <p className="border-gold-500/35 mt-10 max-w-md border-l pl-5 text-sm leading-7 text-slate-600">
            {faqContent.note}
          </p>
        </Reveal>
        <Reveal direction="right" className="space-y-3">
          {faqContent.items.map((item, index) => (
            <details key={item.question} className="faq-card group overflow-hidden">
              <summary
                data-event="faq_open"
                className="text-ink-950 flex min-h-20 list-none items-center justify-between gap-5 px-6 py-5 font-semibold marker:hidden sm:px-7"
              >
                <span className="flex items-center gap-4">
                  <span className="text-gold-700 font-display text-xs font-bold">0{index + 1}</span>
                  {item.question}
                </span>
                <span className="border-ink-950/8 grid size-9 shrink-0 place-items-center rounded-full border bg-white">
                  <ChevronDown
                    aria-hidden="true"
                    className="text-gold-700 transition-transform group-open:rotate-180"
                    size={18}
                  />
                </span>
              </summary>
              <p className="border-ink-950/7 ml-14 border-t px-6 py-6 text-sm leading-7 text-slate-600 sm:ml-16 sm:px-7">
                {item.answer}
              </p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
