"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { openLeadForm } from "@/features/lead-form/events";

type NavItem = { label: string; href: string };

export function MobileNavigation({ items, cta }: { items: readonly NavItem[]; cta: { label: string } }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeWithKeyboard = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const closeOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", closeWithKeyboard);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      window.removeEventListener("keydown", closeWithKeyboard);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/[0.06] text-white"
      >
        {open ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
      </button>
      {open ? (
        <div
          id="mobile-navigation"
          className="bg-ink-950 absolute inset-x-4 top-[76px] rounded-[18px] border border-white/15 p-4 shadow-2xl"
        >
          <nav aria-label="Мобильная навигация" className="grid gap-1">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-white/78 hover:bg-white/[0.07] hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openLeadForm("mobile_navigation");
              }}
              data-event="cta_click"
              data-source="mobile_navigation"
              className="from-gold-300 to-gold-600 text-ink-950 mt-2 rounded-xl bg-gradient-to-br px-4 py-3 text-center text-sm font-bold"
            >
              {cta.label}
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
