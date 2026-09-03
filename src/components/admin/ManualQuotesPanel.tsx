"use client";

import { marketInstruments } from "@/lib/market-instruments";
import { useEffect, useMemo, useState } from "react";

type ManualQuote = {
  id: string;
  symbol: string;
  price: number;
  enabled: boolean;
  aBookEnabled: boolean;
  aBookAccountIds?: string | null;
  ddeEnabled: boolean;
  mt4DdeServer?: string | null;
  symbolEnabled: boolean;
  tradingHours: string;
  quoteSource: string;
  binanceEnabled: boolean;
  bitfinexEnabled: boolean;
  hitbtcEnabled: boolean;
  margin: number;
  leverage: number;
  swapLong: number;
  swapShort: number;
  spread: number;
  commission: number;
  riskMode: string;
  description?: string | null;
  calculationType: string;
  symbolGroup: string;
  quotesFeed: string;
  spreadBid: number;
  spreadAsk: number;
  stopLevel: number;
  gapLevel: number;
  percentage: number;
  contractSize: number;
  tickValue?: number | null;
  demoMinPrice?: number | null;
  demoMaxPrice?: number | null;
  demoVolatility: number;
  demoSpeed: number;
  marginCurrency: string;
  profitCurrency: string;
  digits: number;
  delay: number;
  tradeForbidden: boolean;
  updatedAt: string;
};

type SymbolForm = {
  symbol: string;
  description: string;
  price: string;
  quotesFeed: string;
  symbolGroup: string;
  calculationType: string;
  swapShort: string;
  swapLong: string;
  spreadBid: string;
  spreadAsk: string;
  stopLevel: string;
  gapLevel: string;
  percentage: string;
  contractSize: string;
  tickValue: string;
  demoMinPrice: string;
  demoMaxPrice: string;
  demoVolatility: string;
  demoSpeed: string;
  marginCurrency: string;
  profitCurrency: string;
  digits: string;
  delay: string;
  commission: string;
  manualPrice: boolean;
  tradeForbidden: boolean;
  aBookEnabled: boolean;
  ddeEnabled: boolean;
  quoteSource: string;
  leverage: string;
  margin: string;
  riskMode: string;
  aBookAccountIds: string;
  mt4DdeServer: string;
  binanceEnabled: boolean;
  bitfinexEnabled: boolean;
  hitbtcEnabled: boolean;
  tradingHours: string;
};

const groupOptions = ["Валюты", "Металлы", "Криптовалюты", "Индексы", "Акции", "Энергия"];
const quoteSources = ["TradingView", "Demo Provider", "Manual", "TwelveData", "Binance", "Bitfinex", "HitBTC", "MT4 DDE"];

function defaultDescription(symbol: string) {
  const map: Record<string, string> = {
    "EUR/USD": "Евро / Доллар США",
    "GBP/USD": "Британский фунт / Доллар США",
    "USD/JPY": "Доллар США / Японская иена",
    "AUD/USD": "Австралийский доллар / Доллар США",
    "USD/CAD": "Доллар США / Канадский доллар",
    "USD/CHF": "Доллар США / Швейцарский франк",
    "XAU/USD": "Золото / Доллар США",
    "XAG/USD": "Серебро / Доллар США",
    "BTC/USD": "Bitcoin / Доллар США",
    "ETH/USD": "Ethereum / Доллар США",
  };

  return map[symbol] || symbol.replace("/", " / ");
}

function groupLabel(group: string) {
  const labels: Record<string, string> = {
    Forex: "Валюты",
    Currencies: "Валюты",
    Metals: "Металлы",
    Crypto: "Криптовалюты",
    Indices: "Индексы",
    Stocks: "Акции",
    Energy: "Энергия",
  };

  return labels[group] || group;
}

function buildForm(symbol: string, quote?: ManualQuote): SymbolForm {
  const instrument = marketInstruments.find((item) => item.symbol === symbol) || marketInstruments[0];

  return {
    symbol,
    description: quote?.description || defaultDescription(symbol),
    price: String(quote?.price ?? instrument.defaultPrice),
    quotesFeed: quote?.quotesFeed || "Основной поток котировок",
    symbolGroup: quote?.symbolGroup || groupLabel(instrument.group),
    calculationType: quote?.calculationType || instrument.group.toLowerCase(),
    swapShort: String(quote?.swapShort ?? 0),
    swapLong: String(quote?.swapLong ?? 0),
    spreadBid: String(quote?.spreadBid ?? 0),
    spreadAsk: String(quote?.spreadAsk ?? quote?.spread ?? 14),
    stopLevel: String(quote?.stopLevel ?? 50),
    gapLevel: String(quote?.gapLevel ?? 100),
    percentage: String(quote?.percentage ?? 100),
    contractSize: String(quote?.contractSize ?? instrument.contractSize),
    tickValue: String(quote?.tickValue ?? instrument.tickValue),
    demoMinPrice: String(quote?.demoMinPrice ?? Math.round(instrument.defaultPrice * 0.75 * 100) / 100),
    demoMaxPrice: String(quote?.demoMaxPrice ?? Math.round(instrument.defaultPrice * 1.25 * 100) / 100),
    demoVolatility: String(quote?.demoVolatility ?? 1),
    demoSpeed: String(quote?.demoSpeed ?? 3),
    marginCurrency: quote?.marginCurrency || "EUR",
    profitCurrency: quote?.profitCurrency || "EUR",
    digits: String(quote?.digits ?? instrument.digits),
    delay: String(quote?.delay ?? 0),
    commission: String(quote?.commission ?? 0),
    manualPrice: (quote?.enabled ?? false) && quote?.quoteSource === "Manual",
    tradeForbidden: quote?.tradeForbidden ?? false,
    aBookEnabled: quote?.aBookEnabled ?? false,
    ddeEnabled: quote?.ddeEnabled ?? false,
    quoteSource: quote?.quoteSource || "TradingView",
    leverage: String(quote?.leverage ?? 100),
    margin: String(quote?.margin ?? 1),
    riskMode: quote?.riskMode || "B-Book",
    aBookAccountIds: quote?.aBookAccountIds || "",
    mt4DdeServer: quote?.mt4DdeServer || "",
    binanceEnabled: quote?.binanceEnabled ?? false,
    bitfinexEnabled: quote?.bitfinexEnabled ?? false,
    hitbtcEnabled: quote?.hitbtcEnabled ?? false,
    tradingHours: quote?.tradingHours || "24/5",
  };
}

export default function ManualQuotesPanel() {
  const [quotes, setQuotes] = useState<ManualQuote[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("EUR/USD");
  const [form, setForm] = useState<SymbolForm>(() => buildForm("EUR/USD"));
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const quoteMap = useMemo(() => new Map(quotes.map((quote) => [quote.symbol, quote])), [quotes]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return marketInstruments
      .map((instrument) => {
        const quote = quoteMap.get(instrument.symbol);
        return {
          instrument,
          quote,
          description: quote?.description || defaultDescription(instrument.symbol),
          group: quote?.symbolGroup || groupLabel(instrument.group),
          feed: quote?.quotesFeed || "Основной поток котировок",
          calculation: quote?.calculationType || instrument.group.toLowerCase(),
          price: quote?.price ?? instrument.defaultPrice,
          enabled: !(quote?.tradeForbidden ?? false) && (quote?.symbolEnabled ?? true),
        };
      })
      .filter((row) => `${row.instrument.symbol} ${row.description} ${row.group} ${row.feed}`.toLowerCase().includes(query));
  }, [quoteMap, search]);

  async function loadQuotes() {
    const res = await fetch("/api/admin/quotes", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Не удалось загрузить настройки котировок");
      return;
    }

    setQuotes(Array.isArray(data) ? data : []);
  }

  function openEditor(symbol: string) {
    const quote = quoteMap.get(symbol);
    setSelectedSymbol(symbol);
    setForm(buildForm(symbol, quote));
    setModalOpen(true);
    setMessage("");
  }

  function updateForm<K extends keyof SymbolForm>(field: K, value: SymbolForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildPayload(nextForm = form) {
    return {
      symbol: nextForm.symbol,
      price: Number(nextForm.price),
      enabled: nextForm.manualPrice,
      symbolEnabled: !nextForm.tradeForbidden,
      tradeForbidden: nextForm.tradeForbidden,
      description: nextForm.description,
      calculationType: nextForm.calculationType,
      symbolGroup: nextForm.symbolGroup,
      quotesFeed: nextForm.quotesFeed,
      spreadBid: Number(nextForm.spreadBid),
      spreadAsk: Number(nextForm.spreadAsk),
      spread: Number(nextForm.spreadAsk),
      stopLevel: Number(nextForm.stopLevel),
      gapLevel: Number(nextForm.gapLevel),
      percentage: Number(nextForm.percentage),
      contractSize: Number(nextForm.contractSize),
      tickValue: Number(nextForm.tickValue),
      demoMinPrice: Number(nextForm.demoMinPrice),
      demoMaxPrice: Number(nextForm.demoMaxPrice),
      demoVolatility: Number(nextForm.demoVolatility),
      demoSpeed: Number(nextForm.demoSpeed),
      marginCurrency: nextForm.marginCurrency,
      profitCurrency: nextForm.profitCurrency,
      digits: Number(nextForm.digits),
      delay: Number(nextForm.delay),
      commission: Number(nextForm.commission),
      swapLong: Number(nextForm.swapLong),
      swapShort: Number(nextForm.swapShort),
      aBookEnabled: nextForm.aBookEnabled,
      ddeEnabled: nextForm.ddeEnabled,
      quoteSource: nextForm.manualPrice ? "Manual" : nextForm.quoteSource,
      leverage: Number(nextForm.leverage),
      margin: Number(nextForm.margin),
      riskMode: nextForm.riskMode,
      aBookAccountIds: nextForm.aBookAccountIds,
      mt4DdeServer: nextForm.mt4DdeServer,
      binanceEnabled: nextForm.binanceEnabled,
      bitfinexEnabled: nextForm.bitfinexEnabled,
      hitbtcEnabled: nextForm.hitbtcEnabled,
      tradingHours: nextForm.tradingHours,
    };
  }

  async function saveSymbol() {
    setSaving(true);
    setMessage("Сохраняем настройки инструмента...");

    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Не удалось сохранить настройки");
      return;
    }

    setMessage(`${data.symbol}: настройки сохранены`);
    setModalOpen(false);
    await loadQuotes();
  }

  async function quickToggleTrade(symbol: string) {
    const quote = quoteMap.get(symbol);
    const nextForm = buildForm(symbol, quote);
    nextForm.tradeForbidden = !nextForm.tradeForbidden;

    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(nextForm)),
    });

    const data = await res.json();
    setMessage(res.ok ? `${symbol}: ${nextForm.tradeForbidden ? "торговля запрещена" : "торговля разрешена"}` : data.error || "Ошибка обновления");
    await loadQuotes();
  }

  useEffect(() => {
    loadQuotes();
  }, []);

  return (
    <div className="overflow-hidden rounded-[var(--crm-radius)] border border-[var(--crm-border)] bg-white text-slate-900 shadow-[var(--crm-shadow)]">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Котировки и торговые инструменты</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              Настройки сохраняются в CRM и используются в терминале: источник цены, ручная котировка, запрет торговли, часы торговли, спред, свопы, маржа, плечо, комиссия и стоимость пункта.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openEditor(selectedSymbol)} className="h-9 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800">
              Изменить символ
            </button>
            <button onClick={loadQuotes} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
              Обновить
            </button>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Поиск символа"
              aria-label="Поиск торгового инструмента"
            />
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[1280px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
              {["Символ", "Описание", "Тип расчета", "Группа", "Источник", "Bid spread", "Ask spread", "Stop level", "Gap level", "Swap long", "Swap short", "Статус", "Действие"].map((head) => (
                <th key={head} className="sticky top-0 border-b border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const quote = row.quote;
              const isSelected = row.instrument.symbol === selectedSymbol;
              return (
                <tr
                  key={row.instrument.symbol}
                  onClick={() => setSelectedSymbol(row.instrument.symbol)}
                  onDoubleClick={() => openEditor(row.instrument.symbol)}
                  className={`${isSelected ? "bg-emerald-50/70" : index % 2 ? "bg-white" : "bg-slate-50/60"} cursor-default hover:bg-slate-50`}
                >
                  <td className="border-b border-slate-100 px-3 py-2 font-semibold">{row.instrument.symbol}</td>
                  <td className="max-w-64 truncate border-b border-slate-100 px-3 py-2" title={row.description}>{row.description}</td>
                  <td className="border-b border-slate-100 px-3 py-2">{row.calculation}</td>
                  <td className="border-b border-slate-100 px-3 py-2">{row.group}</td>
                  <td className="max-w-48 truncate border-b border-slate-100 px-3 py-2" title={quote?.quoteSource || row.feed}>{quote?.quoteSource || row.feed}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">{quote?.spreadBid ?? 0}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">{quote?.spreadAsk ?? quote?.spread ?? 14}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">{quote?.stopLevel ?? 50}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">{quote?.gapLevel ?? 100}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">{quote?.swapLong ?? 0}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right tabular-nums">{quote?.swapShort ?? 0}</td>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${row.enabled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {row.enabled ? "Включен" : "Торговля запрещена"}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditor(row.instrument.symbol);
                        }}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          quickToggleTrade(row.instrument.symbol);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {row.enabled ? "Запретить" : "Разрешить"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex h-10 items-center border-t border-slate-200 bg-slate-50 px-4 text-xs text-slate-500">
        <span>Всего символов: {rows.length}</span>
        <span className="ml-auto">Выбран: {selectedSymbol}</span>
      </div>

      {message && (
        <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status" aria-live="polite">
          {message}
        </div>
      )}

      {modalOpen && (
        <ModifySymbolModal
          form={form}
          saving={saving}
          onChange={updateForm}
          onClose={() => setModalOpen(false)}
          onSave={saveSymbol}
        />
      )}
    </div>
  );
}

function ModifySymbolModal({
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  form: SymbolForm;
  saving: boolean;
  onChange: <K extends keyof SymbolForm>(field: K, value: SymbolForm[K]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-lg" role="dialog" aria-modal="true" aria-labelledby="modify-symbol-title">
        <div className="flex h-12 items-center border-b border-slate-200 bg-white px-5">
          <span id="modify-symbol-title" className="font-semibold">Изменить символ · {form.symbol}</span>
          <button onClick={onClose} className="ml-auto flex size-8 items-center justify-center rounded-lg text-xl leading-none text-slate-500 hover:bg-slate-100" aria-label="Закрыть окно">×</button>
        </div>

        <div className="max-h-[calc(92vh-124px)] overflow-y-auto p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Поток котировок" value={form.quotesFeed} onChange={(value) => onChange("quotesFeed", value)} />
            <SelectField label="Группа символов" value={form.symbolGroup} options={groupOptions} onChange={(value) => onChange("symbolGroup", value)} />
            <Field label="Символ" value={form.symbol} onChange={(value) => onChange("symbol", value)} disabled />
            <Field label="Описание" value={form.description} onChange={(value) => onChange("description", value)} />
            <Field label="Swap Short" value={form.swapShort} onChange={(value) => onChange("swapShort", value)} />
            <Field label="Swap Long" value={form.swapLong} onChange={(value) => onChange("swapLong", value)} />
            <Field label="Spread Bid" value={form.spreadBid} onChange={(value) => onChange("spreadBid", value)} />
            <Field label="Spread Ask" value={form.spreadAsk} onChange={(value) => onChange("spreadAsk", value)} />
            <Field label="Stop Level" value={form.stopLevel} onChange={(value) => onChange("stopLevel", value)} />
            <Field label="Gap Level" value={form.gapLevel} onChange={(value) => onChange("gapLevel", value)} />
            <Field label="Процент" value={form.percentage} onChange={(value) => onChange("percentage", value)} />
            <Field label="Размер контракта" value={form.contractSize} onChange={(value) => onChange("contractSize", value)} />
            <Field label="Стоимость пункта" value={form.tickValue} onChange={(value) => onChange("tickValue", value)} />
            <SelectField label="Тип расчета" value={form.calculationType} options={["forex", "cfd", "crypto", "stocks", "indices"]} onChange={(value) => onChange("calculationType", value)} />
            <Field label="Валюта маржи" value={form.marginCurrency} onChange={(value) => onChange("marginCurrency", value)} />
            <Field label="Валюта прибыли" value={form.profitCurrency} onChange={(value) => onChange("profitCurrency", value)} />
            <Field label="Digits" value={form.digits} onChange={(value) => onChange("digits", value)} />
            <Field label="Задержка" value={form.delay} onChange={(value) => onChange("delay", value)} />
            <Field label="Комиссия" value={form.commission} onChange={(value) => onChange("commission", value)} />
            <Field label="Ручная цена" value={form.price} onChange={(value) => onChange("price", value)} />
            <Field label="Часы торговли" value={form.tradingHours} onChange={(value) => onChange("tradingHours", value)} />
            <SelectField label="Источник" value={form.quoteSource} options={quoteSources} onChange={(value) => onChange("quoteSource", value)} />
            <SelectField label="Риск-режим" value={form.riskMode} options={["B-Book", "A-Book", "Hybrid"]} onChange={(value) => onChange("riskMode", value)} />
            <Field label="Плечо" value={form.leverage} onChange={(value) => onChange("leverage", value)} />
            <Field label="Маржа" value={form.margin} onChange={(value) => onChange("margin", value)} />
            <Field label="Demo min" value={form.demoMinPrice} onChange={(value) => onChange("demoMinPrice", value)} />
            <Field label="Demo max" value={form.demoMaxPrice} onChange={(value) => onChange("demoMaxPrice", value)} />
            <Field label="Demo volatility" value={form.demoVolatility} onChange={(value) => onChange("demoVolatility", value)} />
            <Field label="Demo speed" value={form.demoSpeed} onChange={(value) => onChange("demoSpeed", value)} />
            <Field label="A-Book счета" value={form.aBookAccountIds} onChange={(value) => onChange("aBookAccountIds", value)} />
            <Field label="MT4 DDE" value={form.mt4DdeServer} onChange={(value) => onChange("mt4DdeServer", value)} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Checkbox label="Ручная котировка" checked={form.manualPrice} onChange={(value) => onChange("manualPrice", value)} />
            <Checkbox label="Торговля запрещена" checked={form.tradeForbidden} onChange={(value) => onChange("tradeForbidden", value)} />
            <Checkbox label="A-Book" checked={form.aBookEnabled} onChange={(value) => onChange("aBookEnabled", value)} />
            <Checkbox label="DDE" checked={form.ddeEnabled} onChange={(value) => onChange("ddeEnabled", value)} />
            <Checkbox label="Binance" checked={form.binanceEnabled} onChange={(value) => onChange("binanceEnabled", value)} />
            <Checkbox label="Bitfinex" checked={form.bitfinexEnabled} onChange={(value) => onChange("bitfinexEnabled", value)} />
            <Checkbox label="HitBTC" checked={form.hitbtcEnabled} onChange={(value) => onChange("hitbtcEnabled", value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
          <button onClick={onSave} disabled={saving} className="h-9 min-w-32 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button onClick={onClose} className="h-9 min-w-28 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1.5 sm:grid-cols-[150px_1fr] sm:items-center">
      <span className="text-xs font-medium text-slate-500 sm:text-right">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 sm:grid-cols-[150px_1fr] sm:items-center">
      <span className="text-xs font-medium text-slate-500 sm:text-right">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-emerald-600" />
      <span>{label}</span>
    </label>
  );
}
