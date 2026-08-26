"use client";

import { useEffect, useId, useState } from "react";

export const consentKey = "financial-disputes-consent-v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setVisible(!window.localStorage.getItem(consentKey));
      } catch {
        setVisible(true);
      }
    });
    const open = () => setVisible(true);
    window.addEventListener("open-cookie-settings", open);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("open-cookie-settings", open);
    };
  }, []);

  const choose = (value: "essential" | "analytics") => {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch {
      // Consent still applies for the current page when storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent("consent-change", { detail: value }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="bg-ink-950/97 fixed right-3 bottom-3 left-3 z-[90] max-w-md rounded-[18px] border border-white/15 p-4 text-white shadow-2xl backdrop-blur-xl sm:right-5 sm:bottom-5 sm:left-auto sm:p-5"
    >
      <h2 id={titleId} className="font-display text-lg font-semibold">
        Настройки конфиденциальности
      </h2>
      <p id={descriptionId} className="mt-2 text-sm leading-6 text-white/65">
        Необходимые технологии обеспечивают работу сайта. Аналитика подключается только с согласия. Подробнее — в{" "}
        <a href="/cookies" className="text-gold-300 underline underline-offset-4">
          политике cookies
        </a>
        .
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => choose("essential")}
          className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold hover:bg-white/[0.08]"
        >
          Только необходимые
        </button>
        <button
          type="button"
          onClick={() => choose("analytics")}
          className="from-gold-300 to-gold-600 text-ink-950 rounded-xl bg-gradient-to-br px-4 py-2.5 text-sm font-bold"
        >
          Разрешить аналитику
        </button>
      </div>
    </aside>
  );
}
