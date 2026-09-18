"use client";

import { useMemo } from "react";
import { selectRandomQuotes, wisdomQuotes, type WisdomQuote } from "@/data/wisdomQuotes";
import styles from "./WisdomTicker.module.css";

const DISPLAYED_QUOTES = 24;

function QuoteGroup({ quotes, duplicate = false }: { quotes: WisdomQuote[]; duplicate?: boolean }) {
  return (
    <div className={styles.group} aria-hidden={duplicate || undefined}>
      {quotes.map((quote) => (
        <div className={styles.item} key={`${duplicate ? "copy-" : ""}${quote.id}`} title={`${quote.source} — ${quote.author}`}>
          <span className={styles.separator} aria-hidden="true">◆</span>
          <span className={styles.quote}>«{quote.text}»</span>
          <span className={styles.author}>— {quote.author}</span>
        </div>
      ))}
    </div>
  );
}

export default function WisdomTicker() {
  const quotes = useMemo(() => selectRandomQuotes(wisdomQuotes, DISPLAYED_QUOTES), []);

  return (
    <aside className={styles.root} tabIndex={0} aria-label="Мудрые мысли. Наведите курсор или установите фокус, чтобы остановить движение.">
      <div className={styles.header}><span className={styles.spark} aria-hidden="true">✦</span> Мысль и вдохновение</div>
      <div className={styles.viewport}>
        <div className={styles.track} style={{ "--ticker-duration": "175s" } as React.CSSProperties}>
          <QuoteGroup quotes={quotes} />
          <QuoteGroup quotes={quotes} duplicate />
        </div>
      </div>
    </aside>
  );
}
