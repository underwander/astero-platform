"use client";

import { ArrowUpRight } from "lucide-react";
import { openLeadForm } from "@/features/lead-form/events";

type CtaLinkProps = {
  label: string;
  variant?: "gold" | "dark" | "ghost";
  source?: string;
  className?: string;
  ariaLabel?: string;
};

export function CtaLink({ label, variant = "gold", source = "cta", className = "", ariaLabel }: CtaLinkProps) {
  const styles = {
    gold: "from-gold-300 via-gold-500 to-gold-600 text-ink-950 shadow-gold bg-gradient-to-br hover:brightness-110",
    dark: "bg-ink-950 text-white shadow-[0_18px_45px_-24px_rgba(5,13,24,.8)] hover:bg-ink-800",
    ghost:
      "border border-white/15 bg-white/[0.055] text-white backdrop-blur-xl hover:border-gold-400/30 hover:bg-white/[0.1]",
  }[variant];

  return (
    <button
      type="button"
      onClick={() => openLeadForm(source)}
      aria-label={ariaLabel}
      data-event="cta_click"
      data-source={source}
      className={`group inline-flex min-h-13 items-center justify-center gap-3 rounded-[14px] px-7 py-3.5 text-sm font-bold tracking-[-.01em] transition duration-300 hover:-translate-y-0.5 active:translate-y-0 ${styles} ${className}`}
    >
      {label}
      <ArrowUpRight
        aria-hidden="true"
        size={18}
        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </button>
  );
}
