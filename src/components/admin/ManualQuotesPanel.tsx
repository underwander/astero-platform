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
  const [message, setMessage] = useState("");

  const instrument = useMemo(
    () => marketInstruments.find((item) => item.symbol === symbol) || marketInstruments[0],
    [symbol]
  );

  async function loadQuotes() {
    const res = await fetch("/api/admin/quotes", { cache: "no-store" });
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

  useEffect(() => {
    setPrice(String(instrument.defaultPrice));
  }, [instrument]);

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border border-emerald-400/15 bg-[#07130d] p-5 text-white shadow-xl shadow-emerald-950/20 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              Quotes control
            </span>
            <h2 className="mt-3 text-2xl font-black">Manual market prices</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/65">
              Admin can override any quote. Terminal, open positions and client P/L will use the manual price while enabled.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 lg:min-w-[760px]">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-12 rounded-2xl border border-emerald-400/15 bg-white/10 px-4 text-sm font-semibold text-white outline-none focus:border-emerald-400">
              {marketGroups.map((group) => (
                <optgroup key={group} label={group} className="text-slate-950">
                  {marketInstruments
                    .filter((item) => group === "All" || item.group === group)
                    .map((item) => (
                      <option key={`${group}-${item.symbol}`} value={item.symbol}>{item.symbol}</option>
                    ))}
                </optgroup>
              ))}
            </select>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step={instrument.pointSize} className="h-12 rounded-2xl border border-emerald-400/15 bg-white/10 px-4 text-sm font-semibold text-white outline-none focus:border-emerald-400" placeholder="Manual price" />
            <label className="flex h-12 items-center gap-2 rounded-2xl border border-emerald-400/15 bg-white/10 px-4 text-sm font-semibold">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enabled
            </label>
            <button onClick={saveQuote} className="h-12 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400">Save</button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs md:grid-cols-6">
          <Spec label="Group" value={instrument.group} />
          <Spec label="Digits" value={String(instrument.digits)} />
          <Spec label="Point" value={String(instrument.pointSize)} />
          <Spec label="Point value" value={`$${instrument.tickValue}`} />
          <Spec label="Contract" value={String(instrument.contractSize)} />
          <Spec label="Lot step" value={String(instrument.lotStep)} />
        </div>

        {message && <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</div>}
      </div>

      <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 text-slate-950 shadow-sm">
        <h3 className="text-lg font-black">Configured overrides</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-emerald-100 text-left text-slate-500">
                <th className="p-3">Symbol</th>
                <th className="p-3">Manual price</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-emerald-50">
                  <td className="p-3 font-black">{quote.symbol}</td>
                  <td className="p-3">{formatPrice(quote.symbol, quote.price)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${quote.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {quote.enabled ? "manual" : "live"}
                    </span>
                  </td>
                  <td className="p-3">{new Date(quote.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>No manual quotes yet.</td>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-50/45">{label}</p>
      <p className="mt-1 font-black text-emerald-100">{value}</p>
    </div>
  );
}
