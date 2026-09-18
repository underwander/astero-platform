"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type LongTextPreviewProps = {
  text: string;
  className?: string;
  lines?: number;
  emptyText?: string;
  ariaLabel?: string;
};

type Position = { left: number; top: number; width: number };

const VIEWPORT_GAP = 12;
const POPOVER_GAP = 8;

export default function LongTextPreview({
  text,
  className = "",
  lines = 2,
  emptyText = "-",
  ariaLabel = "Показать полный текст",
}: LongTextPreviewProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [position, setPosition] = useState<Position>({ left: VIEWPORT_GAP, top: VIEWPORT_GAP, width: 320 });
  const popoverId = useId();
  const value = text || emptyText;

  const measureTruncation = useCallback(() => {
    const element = triggerRef.current;
    if (!element) return;
    setTruncated(element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1);
  }, []);

  const placePopover = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const anchor = trigger.getBoundingClientRect();
    const width = Math.min(520, Math.max(280, window.innerWidth - VIEWPORT_GAP * 2));
    const measuredHeight = Math.min(popover.scrollHeight, Math.max(160, window.innerHeight - VIEWPORT_GAP * 2));
    const spaceBelow = window.innerHeight - anchor.bottom - POPOVER_GAP - VIEWPORT_GAP;
    const spaceAbove = anchor.top - POPOVER_GAP - VIEWPORT_GAP;
    const showAbove = spaceBelow < Math.min(measuredHeight, 240) && spaceAbove > spaceBelow;
    const top = showAbove
      ? Math.max(VIEWPORT_GAP, anchor.top - POPOVER_GAP - measuredHeight)
      : Math.min(window.innerHeight - VIEWPORT_GAP - measuredHeight, anchor.bottom + POPOVER_GAP);
    const left = Math.min(
      window.innerWidth - VIEWPORT_GAP - width,
      Math.max(VIEWPORT_GAP, anchor.left + anchor.width / 2 - width / 2),
    );

    setPosition({ left, top: Math.max(VIEWPORT_GAP, top), width });
  }, []);

  useEffect(() => {
    measureTruncation();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureTruncation);
    if (triggerRef.current) observer?.observe(triggerRef.current);
    window.addEventListener("resize", measureTruncation);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measureTruncation);
    };
  }, [measureTruncation, value, lines]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(placePopover);
    const reposition = () => placePopover();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, placePopover]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  function cancelClose() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }

  function scheduleClose() {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), 140);
  }

  function show() {
    cancelClose();
    if (truncated) setOpen(true);
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={`${truncated ? "cursor-help" : ""} ${className}`}
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: lines,
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
        tabIndex={truncated ? 0 : undefined}
        role={truncated ? "button" : undefined}
        aria-label={truncated ? ariaLabel : undefined}
        aria-expanded={truncated ? open : undefined}
        aria-controls={truncated && open ? popoverId : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
        onFocus={show}
        onBlur={(event) => {
          if (!popoverRef.current?.contains(event.relatedTarget as Node | null)) scheduleClose();
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "touch" && truncated) {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
        onKeyDown={(event) => {
          if (truncated && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
      >
        {value}
      </span>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          role="tooltip"
          tabIndex={-1}
          className="fixed z-[9999] max-h-[min(60vh,520px)] overflow-y-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-2xl shadow-slate-950/20 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          style={{ left: position.left, top: position.top, width: position.width, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          onFocus={cancelClose}
          onBlur={scheduleClose}
        >
          {value}
        </div>,
        document.body,
      )}
    </>
  );
}
