"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  destination?: string | null;
  details?: string | null;
  adminComment?: string | null;
  status: string;
  createdAt: string;
};

type Method = "CARD" | "CRYPTO" | "BANK";

const inputClass =
  "h-12 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white";

const methodConfig: Record<
  Method,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  CARD: {
    title: "Карта",
    description: "Visa, Mastercard или банковская карта клиента",
    icon: <CardIcon />,
  },
  CRYPTO: {
    title: "Крипто",
    description: "USDT, BTC, ETH и другие криптокошельки",
    icon: <WalletIcon />,
  },
  BANK: {
    title: "Банк",
    description: "IBAN, SWIFT или банковский счет",
    icon: <BankIcon />,
  },
};

function getMethodConfig(isRu: boolean): typeof methodConfig {
  return {
    CARD: {
      title: isRu ? "Карта" : "Card",
      description: isRu ? "Visa, Mastercard или банковская карта клиента" : "Visa, Mastercard or bank card",
      icon: <CardIcon />,
    },
    CRYPTO: {
      title: isRu ? "Крипто" : "Crypto",
      description: isRu ? "USDT, BTC, ETH и другие криптокошельки" : "USDT, BTC, ETH and crypto wallets",
      icon: <WalletIcon />,
    },
    BANK: {
      title: isRu ? "Банк" : "Bank",
      description: isRu ? "IBAN, SWIFT или банковский счет" : "IBAN, SWIFT or bank account",
      icon: <BankIcon />,
    },
  };
}

export default function WithdrawalsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isRu = language === "ru";

  const [userId, setUserId] = useState("");
  const [method, setMethod] = useState<Method>("CARD");
  const [amount, setAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [card, setCard] = useState({
    number: "",
    holder: "",
    expiry: "",
  });

  const [crypto, setCrypto] = useState({
    currency: "USDT TRC20",
    wallet: "",
  });

  const [bank, setBank] = useState({
    beneficiary: "",
    bankName: "",
    accountNumber: "",
    swift: "",
  });

  async function loadWithdrawals(currentUserId: string) {
    setLoading(true);

    const res = await fetch(`/api/withdrawals?userId=${currentUserId}`);
    const data = await res.json();

    setWithdrawals(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const destination = useMemo(() => {
    if (method === "CARD") {
      return `${card.holder} - ${maskCard(card.number)} - ${card.expiry}`;
    }

    if (method === "CRYPTO") {
      return `${crypto.currency} - ${shorten(crypto.wallet)}`;
    }

    return `${bank.beneficiary} - ${bank.bankName} - ${bank.accountNumber} - ${bank.swift}`;
  }, [method, card, crypto, bank]);

  function validateForm() {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return isRu ? "Введите корректную сумму вывода" : "Enter a valid withdrawal amount";
    }

    if (method === "CARD" && (!card.number || !card.holder || !card.expiry)) {
      return isRu ? "Заполните номер карты, имя владельца и срок действия" : "Enter card number, cardholder name and expiry date";
    }

    if (method === "CRYPTO" && (!crypto.currency || !crypto.wallet)) {
      return isRu ? "Выберите криптовалюту и введите адрес кошелька" : "Select cryptocurrency and enter wallet address";
    }

    if (method === "BANK" && (!bank.beneficiary || !bank.bankName || !bank.accountNumber || !bank.swift)) {
      return isRu ? "Заполните получателя, банк, счет/IBAN и SWIFT" : "Enter beneficiary, bank, account/IBAN and SWIFT";
    }

    return "";
  }

  async function createWithdrawal() {
    if (!userId) {
      router.push("/login");
      return;
    }

    const error = validateForm();

    if (error) {
      setMessage(error);
      return;
    }

    const details =
      method === "CARD"
        ? {
            type: "CARD",
            cardNumber: card.number,
            cardHolder: card.holder,
            expiry: card.expiry,
          }
        : method === "CRYPTO"
          ? {
              type: "CRYPTO",
              currency: crypto.currency,
              wallet: crypto.wallet,
            }
          : {
              type: "BANK",
              beneficiary: bank.beneficiary,
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              swift: bank.swift,
            };

    setMessage(isRu ? "Создаем заявку..." : "Creating request...");

    const res = await fetch("/api/withdrawals/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        amount: Number(amount),
        method,
        destination,
        details,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || (isRu ? "Не удалось создать заявку на вывод" : "Could not create withdrawal request"));
      return;
    }

    setMessage(`${isRu ? "Заявка создана" : "Request created"}: €${Number(data.amount).toFixed(2)}`);

    setAmount("");
    setCard({ number: "", holder: "", expiry: "" });
    setCrypto({ currency: "USDT TRC20", wallet: "" });
    setBank({ beneficiary: "", bankName: "", accountNumber: "", swift: "" });

    await loadWithdrawals(userId);
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    setUserId(storedUserId);
    loadWithdrawals(storedUserId);
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-88px)] space-y-4 text-slate-950 dark:text-white">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[430px_0.5fr]">
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-base font-black text-slate-900 dark:text-white">{isRu ? "Новая заявка" : "New request"}</h2>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(Object.keys(methodConfig) as Method[]).map((item) => (
                <MethodButton key={item} active={method === item} onClick={() => setMethod(item)} config={getMethodConfig(isRu)[item]} />
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <Field label={isRu ? "Сумма вывода" : "Withdrawal amount"}>
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
                    EUR
                  </span>
                </div>
              </Field>

              {method === "CARD" && (
                <>
                  <Field label={isRu ? "Номер карты" : "Card number"}>
                    <input
                      value={card.number}
                      onChange={(event) => setCard({ ...card, number: formatCard(event.target.value) })}
                      className={inputClass}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                  </Field>

                  <Field label={isRu ? "Имя владельца" : "Cardholder name"}>
                    <input
                      value={card.holder}
                      onChange={(event) => setCard({ ...card, holder: event.target.value.toUpperCase() })}
                      className={inputClass}
                      placeholder={isRu ? "Имя и фамилия на карте" : "Name and surname on card"}
                    />
                  </Field>

                  <Field label={isRu ? "Срок действия" : "Expiry date"}>
                    <input
                      value={card.expiry}
                      onChange={(event) => setCard({ ...card, expiry: formatExpiry(event.target.value) })}
                      className={inputClass}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </Field>
                </>
              )}

              {method === "CRYPTO" && (
                <>
                  <Field label={isRu ? "Сеть и валюта" : "Network and currency"}>
                    <select
                      value={crypto.currency}
                      onChange={(event) => setCrypto({ ...crypto, currency: event.target.value })}
                      className={inputClass}
                    >
                      <option value="USDT TRC20">USDT TRC20</option>
                      <option value="USDT ERC20">USDT ERC20</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </Field>

                  <Field label={isRu ? "Адрес кошелька" : "Wallet address"}>
                    <input
                      value={crypto.wallet}
                      onChange={(event) => setCrypto({ ...crypto, wallet: event.target.value })}
                      className={inputClass}
                      placeholder={isRu ? "Введите адрес кошелька" : "Enter wallet address"}
                    />
                  </Field>
                </>
              )}

              {method === "BANK" && (
                <>
                  <Field label={isRu ? "Получатель" : "Beneficiary"}>
                    <input
                      value={bank.beneficiary}
                      onChange={(event) => setBank({ ...bank, beneficiary: event.target.value })}
                      className={inputClass}
                      placeholder={isRu ? "Имя получателя" : "Beneficiary name"}
                    />
                  </Field>

                  <Field label={isRu ? "Банк" : "Bank"}>
                    <input
                      value={bank.bankName}
                      onChange={(event) => setBank({ ...bank, bankName: event.target.value })}
                      className={inputClass}
                      placeholder={isRu ? "Название банка" : "Bank name"}
                    />
                  </Field>

                  <Field label={isRu ? "IBAN / номер счета" : "IBAN / account number"}>
                    <input
                      value={bank.accountNumber}
                      onChange={(event) => setBank({ ...bank, accountNumber: event.target.value })}
                      className={inputClass}
                      placeholder={isRu ? "IBAN или номер счета" : "IBAN or account number"}
                    />
                  </Field>

                  <Field label="SWIFT / BIC">
                    <input
                      value={bank.swift}
                      onChange={(event) => setBank({ ...bank, swift: event.target.value.toUpperCase() })}
                      className={inputClass}
                      placeholder="SWIFT / BIC"
                    />
                  </Field>
                </>
              )}

              <button
                onClick={createWithdrawal}
                className="h-12 w-full rounded-xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {isRu ? "Отправить заявку" : "Send request"}
              </button>

              {message && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-400/10 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {message}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">{isRu ? "История заявок" : "Request history"}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{isRu ? "Все заявки на вывод средств по вашему счету" : "All withdrawal requests for your account"}</p>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {loading ? (isRu ? "Загрузка" : "Loading") : `${withdrawals.length} ${isRu ? "заявок" : "requests"}`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[620px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-4 py-3">{isRu ? "Сумма" : "Amount"}</th>
                  <th className="px-4 py-3">{isRu ? "Способ" : "Method"}</th>
                  <th className="px-4 py-3">{isRu ? "Реквизиты" : "Details"}</th>
                  <th className="px-4 py-3">{isRu ? "Статус" : "Status"}</th>
                  <th className="px-4 py-3">{isRu ? "Дата" : "Date"}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      {isRu ? "Загрузка..." : "Loading..."}
                    </td>
                  </tr>
                )}

                {!loading && withdrawals.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                      {isRu ? "Заявок на вывод пока нет" : "No withdrawal requests yet"}
                    </td>
                  </tr>
                )}

                {!loading &&
                  withdrawals.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-white/10">
                      <td className="px-4 py-4 font-black text-slate-950 dark:text-white">
                        €{Number(item.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            {methodSmallIcon(item.method)}
                          </span>
                          {methodLabel(item.method, isRu)}
                        </div>
                      </td>
                      <td className="max-w-[360px] px-4 py-4">
                        <p className="truncate font-semibold text-slate-700 dark:text-slate-300">{formatDestination(item)}</p>
                        {item.adminComment && (
                          <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                            {isRu ? "Комментарий" : "Comment"}: {item.adminComment}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={item.status} isRu={isRu} />
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(item.createdAt).toLocaleString(isRu ? "ru-RU" : "en-US")}
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
    <div>
      <label className="mb-2 block text-sm font-black text-slate-900 dark:text-white">{label}</label>
      {children}
    </div>
  );
}

function MethodButton({
  active,
  onClick,
  config,
}: {
  active: boolean;
  onClick: () => void;
  config: {
    title: string;
    description: string;
    icon: React.ReactNode;
  };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-24 rounded-xl border p-3 text-left transition ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06]"
      }`}
    >
      <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300">
        {config.icon}
      </span>
      <span className="block text-sm font-black">{config.title}</span>
      <span className="mt-1 hidden text-[11px] leading-4 opacity-70 sm:block">{config.description}</span>
    </button>
  );
}

function StatusBadge({ status, isRu }: { status: string; isRu: boolean }) {
  const className =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20"
      : status === "REJECTED"
        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-400/20"
        : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-400/20";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${className}`}>{statusLabel(status, isRu)}</span>;
}

function formatCard(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const clean = value.replace(/\D/g, "").slice(0, 4);

  if (clean.length <= 2) {
    return clean;
  }

  return `${clean.slice(0, 2)}/${clean.slice(2)}`;
}

function maskCard(value: string) {
  const clean = value.replace(/\D/g, "");

  if (clean.length < 4) {
    return "****";
  }

  return `**** ${clean.slice(-4)}`;
}

function shorten(value: string) {
  if (!value) {
    return "-";
  }

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function methodLabel(value: string, isRu: boolean) {
  if (value === "CARD" || value === "Bank Card") return isRu ? "Карта" : "Card";
  if (value === "CRYPTO" || value === "Crypto Wallet") return isRu ? "Криптовалюта" : "Crypto";
  if (value === "BANK" || value === "Bank Account") return isRu ? "Банк" : "Bank";
  return value;
}

function methodSmallIcon(value: string) {
  if (value === "CARD" || value === "Bank Card") return <CardIcon />;
  if (value === "CRYPTO" || value === "Crypto Wallet") return <WalletIcon />;
  if (value === "BANK" || value === "Bank Account") return <BankIcon />;
  return <DotIcon />;
}

function statusLabel(value: string, isRu: boolean) {
  if (value === "APPROVED") return isRu ? "Одобрено" : "Approved";
  if (value === "REJECTED") return isRu ? "Отклонено" : "Rejected";
  if (value === "PENDING") return isRu ? "На проверке" : "Pending";
  return value;
}

function formatDestination(item: Withdrawal) {
  if (item.destination) {
    return item.destination;
  }

  if (!item.details) {
    return "-";
  }

  try {
    const details = JSON.parse(item.details);

    if (details.type === "CARD") {
      return `${details.cardHolder || "-"} - ${maskCard(details.cardNumber || "")}`;
    }

    if (details.type === "CRYPTO") {
      return `${details.currency || "-"} - ${shorten(details.wallet || "")}`;
    }

    if (details.type === "BANK") {
      return `${details.beneficiary || "-"} - ${details.bankName || "-"} - ${details.accountNumber || "-"}`;
    }

    return "-";
  } catch {
    return item.details;
  }
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
