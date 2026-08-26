"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { errorContent } from "@/content";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="bg-ink-950 grid min-h-screen place-items-center px-5 py-32 text-white">
      <section className="glass-dark max-w-2xl p-8 text-center sm:p-12" aria-labelledby="error-title">
        <p className="text-gold-300 text-xs font-bold tracking-[.16em] uppercase">{errorContent.eyebrow}</p>
        <h1 id="error-title" className="section-title mt-5 text-4xl sm:text-6xl">
          {errorContent.title}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-white/65">{errorContent.description}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="from-gold-300 to-gold-600 text-ink-950 inline-flex min-h-13 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br px-6 text-sm font-bold"
          >
            <RotateCcw aria-hidden="true" size={17} />
            {errorContent.retry}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-13 items-center justify-center rounded-[14px] border border-white/15 px-6 text-sm font-bold hover:bg-white/[.08]"
          >
            {errorContent.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
