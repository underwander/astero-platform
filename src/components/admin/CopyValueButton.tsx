"use client";

import { useEffect, useState } from "react";

export default function CopyValueButton({ value, label = "значение" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Копировать ${label}`}
      title={copied ? "Скопировано" : `Копировать ${label}`}
      className={`rounded px-1.5 py-1 font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${copied ? "bg-emerald-100 text-emerald-800" : "text-emerald-700 hover:bg-emerald-100"}`}
    >
      {copied ? "✓" : "⧉"}
      <span className="sr-only" aria-live="polite">{copied ? "Скопировано" : ""}</span>
    </button>
  );
}
