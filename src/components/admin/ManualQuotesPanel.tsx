"use client";

import { formatPrice, marketGroups, marketInstruments } from "@/lib/market-instruments";
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

function calculationLabel(value: string) {
  const labels: Record<string, string> = {
    forex: "forex",
    cfd: "cfd",
    crypto: "crypto",
    stocks: "stocks",
    indices: "indices",
  };

  return labels[value] || value;
}

function buildForm(symbol: string, quote?: ManualQuote): SymbolForm {
  const instrument = marketInstruments.find((item) => item.symbol === symbol) || marketInstruments[0];
  const group = instrument.group === "Forex" ? "Валюты" : groupLabel(instrument.group);

  return {
    symbol,
    description: quote?.description || defaultDescription(symbol),
    price: String(quote?.price ?? instrument.defaultPrice),
    quotesFeed: quote?.quotesFeed || "Основной поток котировок",
    symbolGroup: quote?.symbolGroup || group,
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
    marginCurrency: quote?.marginCurrency || "EUR",
    profitCurrency: quote?.profitCurrency || "EUR",
    digits: String(quote?.digits ?? instrument.digits),
    delay: String(quote?.delay ?? 0),
    commission: String(quote?.commission ?? 0),
    manualPrice: false,
    tradeForbidden: quote?.tradeForbidden ?? false,
    aBookEnabled: quote?.aBookEnabled ?? false,
    ddeEnabled: quote?.ddeEnabled ?? false,
    quoteSource: quote?.quoteSource || "TwelveData",
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
      .filter((row) =>
        `${row.instrument.symbol} ${row.description} ${row.group} ${row.feed}`
          .toLowerCase()
          .includes(query)
      );
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
      marginCurrency: nextForm.marginCurrency,
      profitCurrency: nextForm.profitCurrency,
      digits: Number(nextForm.digits),
      delay: Number(nextForm.delay),
      commission: Number(nextForm.commission),
      swapLong: Number(nextForm.swapLong),
      swapShort: Number(nextForm.swapShort),
      aBookEnabled: nextForm.aBookEnabled,
      ddeEnabled: nextForm.ddeEnabled,
      quoteSource: nextForm.quoteSource,
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
    setMessage("Сохранение настроек инструмента...");

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
    <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white text-slate-900 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100 bg-[#07130d] px-4 py-3 text-white">
        <div className="mr-2 rounded-xl bg-emerald-400 px-4 py-2 text-lg font-black text-slate-950">
          Astero CRM
        </div>
      </div>

      <div className="border-b border-emerald-100 bg-emerald-50/60 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Управление символами
            </p>
            <h2 className="mt-1 text-2xl font-black">Котировки и параметры торговых инструментов</h2>
            <p className="mt-1 text-sm text-slate-600">
              Настройки сохраняются в CRM и используются в терминале: ручная цена, запрет торговли, часы торговли, spread ask, свопы и комиссия.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openEditor(selectedSymbol)} className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-500">
              Изменить символ
            </button>
            <button onClick={loadQuotes} className="h-10 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-700 hover:bg-emerald-50">
              Обновить
            </button>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-56 rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Поиск символа"
            />
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[1280px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
              {[
                "Символ",
                "Описание",
                "Тип расчета",
                "Группа",
                "Источник",
                "Bid spread",
                "Ask spread",
                "Stop level",
                "Gap level",
                "Swap long",
                "Swap short",
                "Статус",
                "Действие",
              ].map((head) => (
                <th key={head} className="border-b border-emerald-100 px-3 py-3 font-black">
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
                  className={`${isSelected ? "bg-emerald-50" : index % 2 ? "bg-white" : "bg-slate-50/60"} cursor-default hover:bg-emerald-50`}
                >
                  <td className="border-b border-emerald-50 px-3 py-2 font-black">{row.instrument.symbol}</td>
                  <td className="border-b border-emerald-50 px-3 py-2">{row.description}</td>
                  <td className="border-b border-emerald-50 px-3 py-2">{calculationLabel(row.calculation)}</td>
                  <td className="border-b border-emerald-50 px-3 py-2">{row.group}</td>
                  <td className="border-b border-emerald-50 px-3 py-2">{quote?.quoteSource || row.feed}</td>
                  <td className="border-b border-emerald-50 px-3 py-2 text-right">{quote?.spreadBid ?? 0}</td>
                  <td className="border-b border-emerald-50 px-3 py-2 text-right">{quote?.spreadAsk ?? quote?.spread ?? 14}</td>
                  <td className="border-b border-emerald-50 px-3 py-2 text-right">{quote?.stopLevel ?? 50}</td>
                  <td className="border-b border-emerald-50 px-3 py-2 text-right">{quote?.gapLevel ?? 100}</td>
                  <td className="border-b border-emerald-50 px-3 py-2 text-right">{quote?.swapLong ?? 0}</td>
                  <td className="border-b border-emerald-50 px-3 py-2 text-right">{quote?.swapShort ?? 0}</td>
                  <td className="border-b border-emerald-50 px-3 py-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${row.enabled ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {row.enabled ? "Включен" : "Торговля запрещена"}
                    </span>
                  </td>
                  <td className="border-b border-emerald-50 px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditor(row.instrument.symbol);
                        }}
                        className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          quickToggleTrade(row.instrument.symbol);
                        }}
                        className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700"
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

      <div className="flex h-10 items-center border-t border-emerald-100 bg-slate-50 px-4 text-xs text-slate-500">
        <span>Всего символов: {rows.length}</span>
        <span className="ml-auto">Выбран: {selectedSymbol}</span>
      </div>

      {message && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
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
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-emerald-200 bg-white text-sm text-slate-900 shadow-2xl">
        <div className="flex h-14 items-center border-b border-emerald-100 bg-[#07130d] px-5 text-white">
          <span className="mr-3 rounded-lg bg-emerald-400 px-2 py-1 text-xs font-black text-slate-950">CRM</span>
          <span className="font-black">Изменить символ</span>
          <button onClick={onClose} className="ml-auto rounded-lg px-3 py-1 text-xl leading-none hover:bg-white/10">×</button>
        </div>

        <div className="max-h-[calc(92vh-124px)] overflow-y-auto p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Поток котировок" value={form.quotesFeed} onChange={(value) => onChange("quotesFeed", value)} />
            <SelectField label="Группа символов" value={form.symbolGroup} options={["Валюты", "Металлы", "Криптовалюты", "Индексы", "Акции", "Энергия"]} onChange={(value) => onChange("symbolGroup", value)} />
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
            <SelectField label="Источник" value={form.quoteSource} options={["Manual", "TwelveData", "Binance", "Bitfinex", "HitBTC", "MT4 DDE"]} onChange={(value) => onChange("quoteSource", value)} />
            <SelectField label="Риск-режим" value={form.riskMode} options={["B-Book", "A-Book", "Hybrid"]} onChange={(value) => onChange("riskMode", value)} />
            <Field label="Плечо" value={form.leverage} onChange={(value) => onChange("leverage", value)} />
            <Field label="Маржа" value={form.margin} onChange={(value) => onChange("margin", value)} />
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

        <div className="flex justify-end gap-2 border-t border-emerald-100 bg-slate-50 p-4">
          <button onClick={onSave} disabled={saving} className="h-11 min-w-32 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-60">
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button onClick={onClose} className="h-11 min-w-28 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50">
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
      <span className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 sm:text-right">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100"
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
      <span className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 sm:text-right">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
    <label className="flex min-h-11 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-sm font-bold text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-emerald-600" />
      <span>{label}</span>
    </label>
  );
}
