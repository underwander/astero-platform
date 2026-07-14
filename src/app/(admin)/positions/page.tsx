"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateTradeProfit, formatPrice } from "@/lib/market-instruments";

type Trade = {
  id: string;
  symbol: string;
  side: string;
  openPrice: number;
  volume: number;
  closePrice: number | null;
  profit: number | null;
  swap?: number | null;
  createdAt: string;
};

type QuoteMap = Record<string, number>;

export default function OpenPositionsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [positions, setPositions] = useState<Trade[]>([]);
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [loading, setLoading] = useState(true);

  function getCurrentPrice(position: Trade) {
    return quotes[position.symbol] || position.openPrice;
  }

  function calculateFloatingProfit(position: Trade) {
    const price = getCurrentPrice(position);

    if (!price || Number.isNaN(price)) {
      return 0;
    }

    return calculateTradeProfit(
      position.symbol,
      position.side,
      position.openPrice,
      price,
      position.volume,
      position.swap || 0
    );
  }

  async function loadQuote(symbol: string) {
    const res = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      return;
    }

    setQuotes((prev) => ({
      ...prev,
      [symbol]: Number(data.price),
    }));
  }

  async function loadAllQuotes(currentPositions: Trade[]) {
    const symbols = Array.from(
      new Set(currentPositions.map((position) => position.symbol))
    );

    await Promise.all(symbols.map((symbol) => loadQuote(symbol)));
  }

  async function loadPositions(currentUserId: string) {
    setLoading(true);

    const res = await fetch(`/api/trades?userId=${currentUserId}`, { cache: "no-store" });
    const data: Trade[] = await res.json();

    const openPositions = Array.isArray(data) ? data.filter((trade) => trade.closePrice === null) : [];

    setPositions(openPositions);
    await loadAllQuotes(openPositions);

    setLoading(false);
  }

  async function closeTrade(position: Trade) {
    if (!userId) {
      router.push("/login");
      return;
    }

    const currentPrice = getCurrentPrice(position);

    if (!confirm(`Закрыть ${position.symbol} ${position.side} по цене ${formatPrice(position.symbol, currentPrice)}?`)) {
      return;
    }

    const res = await fetch("/api/trade/close", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tradeId: position.id,
        closePrice: Number(currentPrice),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Не удалось закрыть сделку");
      return;
    }

    await loadPositions(userId);
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    setUserId(storedUserId);
    loadPositions(storedUserId);
  }, [router]);

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      loadAllQuotes(positions);
    }, 3000);

    return () => clearInterval(interval);
  }, [positions]);

  const totalFloatingProfit = positions.reduce(
    (sum, position) => sum + calculateFloatingProfit(position),
    0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Открытые позиции
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard title="Котировки" value="Активны" positive />
        <MetricCard title="Открытые позиции" value={loading ? "..." : String(positions.length)} />
        <MetricCard title="Плавающий P/L" value={`€${totalFloatingProfit.toFixed(2)}`} positive={totalFloatingProfit >= 0} negative={totalFloatingProfit < 0} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4 text-left text-gray-500">Символ</th>
                <th className="px-6 py-4 text-left text-gray-500">Тип</th>
                <th className="px-6 py-4 text-left text-gray-500">Объем</th>
                <th className="px-6 py-4 text-left text-gray-500">Цена открытия</th>
                <th className="px-6 py-4 text-left text-gray-500">Текущая цена</th>
                <th className="px-6 py-4 text-left text-gray-500">Прибыль</th>
                <th className="px-6 py-4 text-left text-gray-500">Дата открытия</th>
                <th className="px-6 py-4 text-left text-gray-500">Статус</th>
                <th className="px-6 py-4 text-left text-gray-500">Действие</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={9}>
                    Загрузка...
                  </td>
                </tr>
              )}

              {!loading && positions.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-gray-500" colSpan={9}>
                    Открытых позиций пока нет
                  </td>
                </tr>
              )}

              {!loading &&
                positions.map((position) => {
                  const currentPrice = getCurrentPrice(position);
                  const floatingProfit = calculateFloatingProfit(position);

                  return (
                    <tr
                      key={position.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">
                        {position.symbol}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          position.side === "BUY"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {position.side}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {position.volume}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {formatPrice(position.symbol, position.openPrice)}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white/90">
                        {formatPrice(position.symbol, currentPrice)}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          floatingProfit >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        €{floatingProfit.toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {new Date(position.createdAt).toLocaleString("ru-RU")}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                          Открыта
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => closeTrade(position)}
                          className="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600"
                        >
                          Закрыть
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, positive, negative }: { title: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="text-sm text-gray-500 dark:text-gray-400">{title}</h3>
      <p className={`mt-2 text-3xl font-bold ${positive ? "text-green-500" : negative ? "text-red-500" : "text-gray-800 dark:text-white/90"}`}>
        {value}
      </p>
    </div>
  );
}
