"use client";

import { marketSymbols } from "@/components/broker/MarketWatch";
import { useEffect, useState } from "react";

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
  const [message, setMessage] = useState("");

  async function loadQuotes() {
    const res = await fetch("/api/admin/quotes");
    const data = await res.json();
    setQuotes(Array.isArray(data) ? data : []);
  }

  async function saveQuote() {
    setMessage("Saving quote...");

    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, price: Number(price), enabled }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Quote update error");
      return;
    }

    setMessage(`${data.symbol} saved as ${data.enabled ? "manual" : "live"} quote`);
    await loadQuotes();
  }

  useEffect(() => {
    loadQuotes();
  }, []);

  return (
    <div className="rounded-[2rem] border border-emerald-400/15 bg-[#07130d] p-5 text-white shadow-xl shadow-emerald-950/20 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Manual quotes
          </span>
          <h2 className="mt-3 text-2xl font-black">Market price control</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/65">
            Override any market quote manually. When enabled, the terminal and positions use the manual value instead of external data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 lg:min-w-[720px]">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-12 rounded-2xl border border-emerald-400/15 bg-white/10 px-4 text-sm font-semibold text-white outline-none focus:border-emerald-400">
            {marketSymbols.map((item) => <option key={item.symbol} value={item.symbol} className="text-slate-950">{item.symbol}</option>)}
          </select>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.0001" className="h-12 rounded-2xl border border-emerald-400/15 bg-white/10 px-4 text-sm font-semibold text-white outline-none focus:border-emerald-400" placeholder="Manual price" />
          <label className="flex h-12 items-center gap-2 rounded-2xl border border-emerald-400/15 bg-white/10 px-4 text-sm font-semibold">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Enabled
          </label>
          <button onClick={saveQuote} className="h-12 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400">Save</button>
        </div>
      </div>

      {message && <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</div>}

      {quotes.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {quotes.slice(0, 12).map((quote) => (
            <div key={quote.id} className="min-w-[150px] rounded-2xl border border-white/10 bg-white/[0.06] p-3">
              <p className="text-sm font-black">{quote.symbol}</p>
              <p className="mt-1 text-lg font-black text-emerald-300">{quote.price}</p>
              <p className="mt-1 text-xs text-emerald-50/55">{quote.enabled ? "manual" : "live"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
