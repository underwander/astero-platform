import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { JsonLd } from "@/components/legal/JsonLd";
import { siteConfig } from "@/config/site";
import type { LegalDocument } from "@/content";
import { legalPageSchema } from "@/lib/seo";

export function LegalPage({ document, path }: { document: LegalDocument; path: string }) {
  const schema = legalPageSchema(document, path);

  return (
    <main id="main-content" className="bg-paper-50 min-h-screen px-5 pt-32 pb-20 sm:px-8 lg:px-12 lg:pt-40">
      {schema ? <JsonLd data={schema} /> : null}
      <article className="mx-auto max-w-[1180px]">
        <nav aria-label="Хлебные крошки" className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-ink-950">
            Главная
          </Link>
          <ChevronRight aria-hidden="true" size={15} />
          <span aria-current="page">{document.title}</span>
        </nav>
        <header className="mt-10 max-w-4xl border-b border-slate-200 pb-10">
          <p className="eyebrow">Правовые документы</p>
          <h1 className="section-title text-ink-950 mt-4 text-4xl leading-tight sm:text-6xl">{document.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{document.description}</p>
          <p className="mt-4 text-sm text-slate-500">
            Оператор: {siteConfig.operatorName || "будет указан до открытия сайта для приёма обращений"}
          </p>
          {siteConfig.legal.contactEmail ? (
            <p className="mt-2 text-sm text-slate-500">Контакт по правовым вопросам: {siteConfig.legal.contactEmail}</p>
          ) : null}
        </header>
        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <aside className="surface-card hidden p-5 lg:sticky lg:top-24 lg:block" aria-label="Содержание документа">
            <p className="text-gold-700 text-xs font-bold tracking-[0.14em] uppercase">Содержание</p>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              {document.sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#section-${index + 1}`} className="hover:text-ink-950">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
          <div className="space-y-10">
            {document.sections.map((section, index) => (
              <section key={section.title} id={`section-${index + 1}`} className="surface-card p-6 sm:p-8">
                <h2 className="section-title text-ink-950 text-2xl">{section.title}</h2>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
