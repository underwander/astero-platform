"use client";

import { formatPrice, marketGroups, marketInstruments } from "@/lib/market-instruments";
import { useEffect, useMemo, useState } from "react";

type ManualQuote = {
  id: string;
  symbol: string;
  price: number;
  enabled: boolean;
  updatedAt: string;
};

export default function ManualQuotesPanel() {
  const [symbol, setSymbol] = useState("EUR/USD");
  const [price, setPrice] = useState("1.0850");
  const [enabled, setEnabled] = useState(true);
  const [quotes, setQuotes] = useState<ManualQuote[]>([]);
  const [clientPrice, setClientPrice] = useState("");
  const [message, setMessage] = useState("");

  const instrument = useMemo(
    () => marketInstruments.find((item) => item.symbol === symbol) || marketInstruments[0],
    [symbol]
  );

  const selectedQuote = quotes.find((quote) => quote.symbol === symbol);

  async function loadQuotes() {
    const res = await fetch("/api/admin/quotes", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Не удалось загрузить котировки");
      return;
    }

    setQuotes(Array.isArray(data) ? data : []);
  }

  async function checkClientPrice(nextSymbol = symbol) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(nextSymbol)}&t=${Date.now()}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      setClientPrice(data.error || "Ошибка проверки");
      return;
    }

    setClientPrice(`${formatPrice(nextSymbol, Number(data.price))} · ${data.source}`);
  }

  async function saveQuote() {
    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setMessage("Введите корректную цену");
      return;
    }

    setMessage("Сохранение...");

    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, price: numericPrice, enabled }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Ошибка обновления котировки");
      return;
    }

    setMessage(`${data.symbol}: ${data.enabled ? "ручная цена включена" : "ручная цена выключена"}`);
    await loadQuotes();
    await checkClientPrice(data.symbol);
  }

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    const quote = quotes.find((item) => item.symbol === symbol);
    setPrice(String(quote?.price ?? instrument.defaultPrice));
    setEnabled(quote?.enabled ?? true);
    setClientPrice("");
  }, [instrument, quotes, symbol]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-400/15 bg-[#07130d] p-5 text-white shadow-xl shadow-emerald-950/20 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-black">Котировки</h2>
            <p className="mt-1 text-sm text-emerald-50/60">
              Ручная цена сразу применяется в терминале, позициях и расчёте P/L клиента.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_160px_150px_140px_140px]">
            <select
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              className="h-11 rounded-lg border border-emerald-400/15 bg-white/10 px-3 text-sm font-semibold text-white outline-none focus:border-emerald-400"
            >
              {marketGroups.filter((group) => group !== "All").map((group) => (
                <optgroup key={group} label={group} className="text-slate-950">
                  {marketInstruments
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <option key={`${group}-${item.symbol}`} value={item.symbol}>
                        {item.symbol}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>

            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              type="number"
              step={instrument.pointSize}
              className="h-11 rounded-lg border border-emerald-400/15 bg-white/10 px-3 text-sm font-semibold text-white outline-none focus:border-emerald-400"
              placeholder="Цена"
            />

            <label className="flex h-11 items-center gap-2 rounded-lg border border-emerald-400/15 bg-white/10 px-3 text-sm font-semibold">
              <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              Ручной режим
            </label>

            <button onClick={saveQuote} className="h-11 rounded-lg bg-emerald-500 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400">
              Сохранить
            </button>

            <button onClick={() => checkClientPrice()} className="h-11 rounded-lg bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15">
              Проверить
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs md:grid-cols-7">
          <Spec label="Символ" value={symbol} />
          <Spec label="Сейчас в CRM" value={selectedQuote ? formatPrice(symbol, selectedQuote.price) : "не задано"} />
          <Spec label="У клиента" value={clientPrice || "-"} />
          <Spec label="Режим" value={selectedQuote?.enabled ? "ручной" : "рынок"} />
          <Spec label="Пункт" value={String(instrument.pointSize)} />
          <Spec label="Цена пункта" value={`$${instrument.tickValue}`} />
          <Spec label="Шаг лота" value={String(instrument.lotStep)} />
        </div>

        {message && <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</div>}
      </div>

      <div className="rounded-xl border border-emerald-100 bg-white p-5 text-slate-950 shadow-sm">
        <h3 className="text-lg font-black">Настроенные котировки</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-emerald-100 text-left text-slate-500">
                <th className="p-3">Символ</th>
                <th className="p-3">Цена</th>
                <th className="p-3">Режим</th>
                <th className="p-3">Обновлено</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-emerald-50">
                  <td className="p-3 font-black">{quote.symbol}</td>
                  <td className="p-3">{formatPrice(quote.symbol, quote.price)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${quote.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {quote.enabled ? "ручная" : "рынок"}
                    </span>
                  </td>
                  <td className="p-3">{new Date(quote.updatedAt).toLocaleString("ru-RU")}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSymbol(quote.symbol);
                        setPrice(String(quote.price));
                        setEnabled(quote.enabled);
                      }}
                      className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white"
                    >
                      Изменить
                    </button>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>
                    Ручных котировок пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-50/45">{label}</p>
      <p className="mt-1 truncate font-black text-emerald-100">{value}</p>
    </div>
  );
}
