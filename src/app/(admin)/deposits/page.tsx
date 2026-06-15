"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Deposit = {
  id: string;
  amount: number;
  method: string;
  sourceDetails: string | null;
  status: string;
  createdAt: string;
};

type DepositMethod = "Bank Card" | "Crypto Wallet" | "Bank Account";

const inputClass =
  "h-12 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white";

const methods: Array<{
  value: DepositMethod;
  label: string;
  hint: string;
  icon: React.ReactNode;
}> = [
  { value: "Bank Card", label: "Карта", hint: "Visa / Mastercard", icon: <CardIcon /> },
  { value: "Crypto Wallet", label: "Крипто", hint: "USDT / BTC / ETH", icon: <WalletIcon /> },
  { value: "Bank Account", label: "Банк", hint: "Перевод на счет", icon: <BankIcon /> },
];

export default function DepositsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("500");
  const [method, setMethod] = useState<DepositMethod>("Bank Card");
  const [sourceDetails, setSourceDetails] = useState("");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDeposits(currentUserId: string) {
    setLoading(true);
    const res = await fetch(`/api/deposits?userId=${currentUserId}`);
    const data = await res.json();
    setDeposits(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function createDeposit() {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setMessage("Введите корректную сумму");
      return;
    }

    if (!sourceDetails.trim()) {
      setMessage("Укажите реквизиты или комментарий к платежу");
      return;
    }

    setMessage("Создаем заявку...");

    const res = await fetch("/api/deposits/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: Number(amount), method, sourceDetails }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Не удалось создать заявку");
      return;
    }

    setMessage(`Заявка создана: $${Number(data.amount).toFixed(2)}`);
    setSourceDetails("");
    await loadDeposits(userId);
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    setUserId(storedUserId);
    loadDeposits(storedUserId);
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-88px)] text-slate-950 dark:text-white">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[430px_0.5fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h1 className="text-base font-black text-slate-900 dark:text-white">Пополнение счета</h1>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {methods.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMethod(item.value)}
                className={`min-h-24 rounded-xl border p-3 text-left transition ${
                  method === item.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                }`}
              >
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300">
                  {item.icon}
                </span>
                <span className="block text-sm font-black">{item.label}</span>
                <span className="mt-1 hidden text-[11px] leading-4 opacity-70 sm:block">{item.hint}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Сумма">
              <div className="relative">
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="0.00"
                  type="number"
                  min="1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500 dark:text-slate-300">
                  USD
                </span>
              </div>
            </Field>

            <Field label={detailsLabel(method)}>
              <textarea
                value={sourceDetails}
                onChange={(event) => setSourceDetails(event.target.value)}
                className="min-h-28 w-full resize-none rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white"
                placeholder={detailsPlaceholder(method)}
              />
            </Field>

            <button
              onClick={createDeposit}
              className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-500"
            >
              Отправить заявку
            </button>

            {message && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-400/10 dark:bg-emerald-500/10 dark:text-emerald-200">
                {message}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-white/10">
            <h2 className="text-base font-black text-slate-900 dark:text-white">История пополнений</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {loading ? "Загрузка" : `${deposits.length} заявок`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[620px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-4 py-3">Сумма</th>
                  <th className="px-4 py-3">Способ</th>
                  <th className="px-4 py-3">Реквизиты</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Дата</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      Загрузка...
                    </td>
                  </tr>
                )}

                {!loading && deposits.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                      Заявок пока нет
                    </td>
                  </tr>
                )}

                {!loading &&
                  deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-slate-100 last:border-0 dark:border-white/10">
                      <td className="px-4 py-4 font-black text-emerald-700 dark:text-emerald-300">
                        ${Number(deposit.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            {methodIcon(deposit.method)}
                          </span>
                          {methodLabel(deposit.method)}
                        </div>
                      </td>
                      <td className="max-w-[360px] px-4 py-4">
                        <p className="truncate font-semibold text-slate-700 dark:text-slate-300">{deposit.sourceDetails || "-"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={deposit.status} />
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(deposit.createdAt).toLocaleString("ru-RU")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-slate-900 dark:text-white">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300"
      : status === "REJECTED"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300"
        : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-400/20 dark:bg-yellow-500/10 dark:text-yellow-300";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${className}`}>{statusLabel(status)}</span>;
}

function statusLabel(value: string) {
  if (value === "APPROVED") return "Одобрено";
  if (value === "REJECTED") return "Отклонено";
  if (value === "PENDING") return "На проверке";
  return value;
}

function detailsLabel(method: DepositMethod) {
  if (method === "Bank Card") return "Данные платежа";
  if (method === "Crypto Wallet") return "Адрес или hash транзакции";
  return "Банковские реквизиты";
}

function detailsPlaceholder(method: DepositMethod) {
  if (method === "Bank Card") return "Последние 4 цифры карты или номер операции";
  if (method === "Crypto Wallet") return "Адрес кошелька, сеть или hash транзакции";
  return "Название банка, IBAN или номер платежа";
}

function methodLabel(value: string) {
  if (value === "Bank Card") return "Карта";
  if (value === "Crypto Wallet") return "Криптовалюта";
  if (value === "Bank Account") return "Банк";
  return value;
}

function methodIcon(value: string) {
  if (value === "Bank Card") return <CardIcon />;
  if (value === "Crypto Wallet") return <WalletIcon />;
  if (value === "Bank Account") return <BankIcon />;
  return <DotIcon />;
}

function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 8.5H21M6.5 16H10.5M5 5H19C20.1 5 21 5.9 21 7V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7C3 5.9 3.9 5 5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 7V6C19 4.9 18.1 4 17 4H5C3.9 4 3 4.9 3 6V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V10C21 8.9 20.1 8 19 8H15C13.9 8 13 8.9 13 10V12C13 13.1 13.9 14 15 14H21M17 11H17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10H20M6 10V18M10 10V18M14 10V18M18 10V18M3 20H21M12 4L21 8H3L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 13C12.55 13 13 12.55 13 12C13 11.45 12.55 11 12 11C11.45 11 11 11.45 11 12C11 12.55 11.45 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
