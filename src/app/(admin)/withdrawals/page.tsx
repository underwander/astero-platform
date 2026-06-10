"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  destination?: string | null;
  details?: string | null;
  status: string;
  createdAt: string;
};

type Method = "CARD" | "CRYPTO" | "BANK";

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

export default function WithdrawalsPage() {
  const router = useRouter();

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
      return `${card.holder} • ${maskCard(card.number)} • ${card.expiry}`;
    }

    if (method === "CRYPTO") {
      return `${crypto.currency} • ${shorten(crypto.wallet)}`;
    }

    return `${bank.beneficiary} • ${bank.bankName} • ${bank.accountNumber} • ${bank.swift}`;
  }, [method, card, crypto, bank]);

  function validateForm() {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return "Введите корректную сумму";
    }

    if (method === "CARD") {
      if (!card.number || !card.holder || !card.expiry) {
        return "Заполните номер карты, имя владельца и срок действия";
      }
    }

    if (method === "CRYPTO") {
      if (!crypto.currency || !crypto.wallet) {
        return "Выберите криптовалюту и введите адрес кошелька";
      }
    }

    if (method === "BANK") {
      if (!bank.beneficiary || !bank.bankName || !bank.accountNumber || !bank.swift) {
        return "Заполните получателя, банк, счёт/IBAN и SWIFT";
      }
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

    setMessage("Создание заявки...");

    const res = await fetch("/api/withdrawals/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      setMessage(data.error || "Ошибка вывода средств");
      return;
    }

    setMessage(`Заявка создана: $${Number(data.amount).toFixed(2)}`);

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
    <div className="space-y-6 bg-slate-50 p-2 text-slate-950 sm:p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight">
          Вывод средств
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Создайте заявку на вывод на карту, криптокошелёк или банковский счёт.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-xl font-black">Новая заявка</h2>

          <div className="mb-5 grid grid-cols-3 gap-2">
            <MethodButton active={method === "CARD"} onClick={() => setMethod("CARD")}>
              💳 Карта
            </MethodButton>

            <MethodButton active={method === "CRYPTO"} onClick={() => setMethod("CRYPTO")}>
              ₿ Крипто
            </MethodButton>

            <MethodButton active={method === "BANK"} onClick={() => setMethod("BANK")}>
              🏦 Банк
            </MethodButton>
          </div>

          <div className="space-y-4">
            <Field label="Сумма">
              <div className="relative">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="Введите сумму"
                  type="number"
                  min="1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black">
                  $
                </span>
              </div>
            </Field>

            {method === "CARD" && (
              <>
                <Field label="Номер карты">
                  <input
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                    className={inputClass}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                </Field>

                <Field label="Имя владельца">
                  <input
                    value={card.holder}
                    onChange={(e) => setCard({ ...card, holder: e.target.value.toUpperCase() })}
                    className={inputClass}
                    placeholder="Имя и фамилия на карте"
                  />
                </Field>

                <Field label="Срок действия">
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                    className={inputClass}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </Field>
              </>
            )}

            {method === "CRYPTO" && (
              <>
                <Field label="Криптовалюта">
                  <select
                    value={crypto.currency}
                    onChange={(e) => setCrypto({ ...crypto, currency: e.target.value })}
                    className={inputClass}
                  >
                    <option value="USDT TRC20">USDT TRC20</option>
                    <option value="USDT ERC20">USDT ERC20</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                  </select>
                </Field>

                <Field label="Адрес кошелька">
                  <input
                    value={crypto.wallet}
                    onChange={(e) => setCrypto({ ...crypto, wallet: e.target.value })}
                    className={inputClass}
                    placeholder="Введите адрес кошелька"
                  />
                </Field>
              </>
            )}

            {method === "BANK" && (
              <>
                <Field label="Имя получателя">
                  <input
                    value={bank.beneficiary}
                    onChange={(e) => setBank({ ...bank, beneficiary: e.target.value })}
                    className={inputClass}
                    placeholder="Имя получателя"
                  />
                </Field>

                <Field label="Название банка">
                  <input
                    value={bank.bankName}
                    onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                    className={inputClass}
                    placeholder="Название банка"
                  />
                </Field>

                <Field label="IBAN / номер счёта">
                  <input
                    value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                    className={inputClass}
                    placeholder="IBAN или номер счёта"
                  />
                </Field>

                <Field label="SWIFT / BIC">
                  <input
                    value={bank.swift}
                    onChange={(e) => setBank({ ...bank, swift: e.target.value.toUpperCase() })}
                    className={inputClass}
                    placeholder="SWIFT / BIC"
                  />
                </Field>
              </>
            )}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="font-black text-emerald-700">Безопасность</p>
              <p className="mt-1 text-sm text-slate-600">
                Заявка будет обработана финансовым отделом после проверки.
              </p>
            </div>

            <button
              onClick={createWithdrawal}
              className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500"
            >
              Отправить заявку
            </button>

            {message && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700">
                {message}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-xl font-black">История заявок</h2>

          <div className="space-y-3">
            {loading && (
              <div className="rounded-2xl border border-slate-100 p-5 text-slate-500">
                Загрузка...
              </div>
            )}

            {!loading && withdrawals.length === 0 && (
              <div className="rounded-2xl border border-slate-100 p-5 text-slate-500">
                Заявок пока нет
              </div>
            )}

            {!loading &&
              withdrawals.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 p-4 md:grid-cols-[120px_150px_1fr_130px_150px] md:items-center"
                >
                  <div className="font-black">
                    ${Number(item.amount).toFixed(2)}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span>{methodIcon(item.method)}</span>
                    <span>{methodLabel(item.method)}</span>
                  </div>

                  <div className="min-w-0 text-sm">
                    <p className="truncate font-bold text-slate-900">
                      {formatDestination(item)}
                    </p>
                  </div>

                  <div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="text-sm text-slate-500">
                    {new Date(item.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>
              ))}
          </div>
        </div>
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
      <label className="mb-2 block text-sm font-black text-slate-900">
        {label}
      </label>
      {children}
    </div>
  );
}

function MethodButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-xl border px-3 text-sm font-black transition ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "REJECTED"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-yellow-50 text-yellow-700 border-yellow-200";

  return (
    <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-black ${className}`}>
      {statusLabel(status)}
    </span>
  );
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
    return "••••";
  }

  return `•••• ${clean.slice(-4)}`;
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

function methodLabel(value: string) {
  if (value === "CARD" || value === "Bank Card") return "Карта";
  if (value === "CRYPTO" || value === "Crypto Wallet") return "Криптовалюта";
  if (value === "BANK" || value === "Bank Account") return "Банк";
  return value;
}

function methodIcon(value: string) {
  if (value === "CARD" || value === "Bank Card") return "💳";
  if (value === "CRYPTO" || value === "Crypto Wallet") return "₿";
  if (value === "BANK" || value === "Bank Account") return "🏦";
  return "•";
}

function statusLabel(value: string) {
  if (value === "APPROVED") return "Одобрено";
  if (value === "REJECTED") return "Отклонено";
  if (value === "PENDING") return "На проверке";
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
      return `${details.cardHolder || "-"} • ${maskCard(details.cardNumber || "")}`;
    }

    if (details.type === "CRYPTO") {
      return `${details.currency || "-"} • ${shorten(details.wallet || "")}`;
    }

    if (details.type === "BANK") {
      return `${details.beneficiary || "-"} • ${details.bankName || "-"} • ${
        details.accountNumber || "-"
      }`;
    }

    return "-";
  } catch {
    return item.details;
  }
}