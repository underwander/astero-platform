"use client";

import { FileSearch, LockKeyhole, Scale, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formContent } from "@/content";
import { LeadForm } from "./LeadForm";
import { OPEN_LEAD_FORM_EVENT } from "./events";

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function LeadModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(pathname === "/");
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const handleOpen = () => {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener(OPEN_LEAD_FORM_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_LEAD_FORM_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (pathname === "/") return;
    const frame = window.requestAnimationFrame(() => setOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  return (
    <>
      {open ? (
        <div
          className="lead-modal-backdrop fixed inset-0 z-[120] overflow-y-auto bg-[#01060d]/92 p-3 backdrop-blur-lg sm:p-6 lg:p-8"
          onMouseDown={(event) => {
            if (!dialogRef.current?.contains(event.target as Node)) close();
          }}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              className="lead-modal-dialog lead-modal-glass relative grid w-full max-w-[1200px] overflow-hidden outline-none lg:grid-cols-[.7fr_1.3fr]"
            >
              <h2 id={titleId} className="sr-only">
                {formContent.dialogTitle}
              </h2>
              <p id={descriptionId} className="sr-only">
                {formContent.description}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть форму"
                className="absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:rotate-3 hover:bg-white/16"
              >
                <X aria-hidden="true" size={20} />
              </button>

              <div className="relative hidden overflow-hidden border-r border-white/10 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                <div
                  aria-hidden="true"
                  className="bg-gold-500/18 absolute -top-24 -left-24 size-72 rounded-full blur-[90px]"
                />
                <div className="relative">
                  <span className="border-gold-500/35 text-gold-300 grid size-12 place-items-center rounded-2xl border bg-white/[0.06]">
                    <Scale aria-hidden="true" size={23} strokeWidth={1.6} />
                  </span>
                  <p className="text-gold-300 mt-8 text-xs font-bold tracking-[.14em] uppercase">
                    {formContent.eyebrow}
                  </p>
                  <p aria-hidden="true" className="section-title mt-4 text-4xl leading-tight">
                    {formContent.title}
                  </p>
                  <p className="mt-5 text-sm leading-7 text-white/62">{formContent.description}</p>
                </div>
                <ul className="relative mt-10 space-y-4 text-sm leading-6 text-white/70">
                  <li className="flex gap-3">
                    <FileSearch aria-hidden="true" className="text-gold-300 mt-0.5 shrink-0" size={19} />
                    {formContent.securityItems[0]}
                  </li>
                  <li className="flex gap-3">
                    <LockKeyhole aria-hidden="true" className="text-gold-300 mt-0.5 shrink-0" size={19} />
                    {formContent.securityItems[1]}
                  </li>
                </ul>
              </div>

              <div className="bg-ink-950/24 p-3 pt-16 sm:p-6 sm:pt-16 lg:p-8">
                <div className="mb-5 px-2 text-white lg:hidden">
                  <p className="text-gold-300 text-xs font-bold tracking-[.13em] uppercase">{formContent.eyebrow}</p>
                  <p aria-hidden="true" className="section-title mt-2 text-2xl">
                    {formContent.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/60">{formContent.mobileDescription}</p>
                </div>
                <LeadForm />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
