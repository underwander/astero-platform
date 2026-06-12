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

export default function DepositsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("500");
  const [method, setMethod] = useState("Bank Card");
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

    if (!amount || !sourceDetails) {
      setMessage("Enter amount and source details");
      return;
    }

    setMessage("Creating deposit request...");

    const res = await fetch("/api/deposits/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: Number(amount), method, sourceDetails }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Deposit request error");
      return;
    }

    setMessage(`Deposit request created: $${Number(data.amount).toFixed(2)}`);
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
    <div className="space-y-6">
      <div className="border-b border-emerald-100 pb-4 dark:border-emerald-400/10">
        <h1 className="text-xl font-black text-slate-900 dark:text-white">Пополнение</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">New Deposit</h2>

          <div className="space-y-4">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder="Amount" type="number" min="1" />

            <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-12 w-full rounded-2xl border border-emerald-100 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white">
              <option value="Bank Card">Bank Card</option>
              <option value="Crypto Wallet">Crypto Wallet</option>
              <option value="Bank Account">Bank Account</option>
            </select>

            <textarea value={sourceDetails} onChange={(e) => setSourceDetails(e.target.value)} className="min-h-28 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder="Card last 4 digits, wallet address or bank account number" />

            <button onClick={createDeposit} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500">
              Create Deposit Request
            </button>

            {message && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-emerald-50/80">{message}</div>}
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-100 dark:border-emerald-400/10">
                  <th className="px-6 py-4 text-left text-slate-500">Amount</th>
                  <th className="px-6 py-4 text-left text-slate-500">Method</th>
                  <th className="px-6 py-4 text-left text-slate-500">Details</th>
                  <th className="px-6 py-4 text-left text-slate-500">Status</th>
                  <th className="px-6 py-4 text-left text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td className="px-6 py-6 text-slate-500" colSpan={5}>Loading...</td></tr>}
                {!loading && deposits.length === 0 && <tr><td className="px-6 py-6 text-slate-500" colSpan={5}>No deposit requests yet</td></tr>}
                {!loading && deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b border-emerald-50 dark:border-emerald-400/10">
                    <td className="px-6 py-4 font-bold text-emerald-600">${Number(deposit.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-emerald-50/80">{deposit.method}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-emerald-50/80">{deposit.sourceDetails || "-"}</td>
                    <td className="px-6 py-4"><span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">{deposit.status}</span></td>
                    <td className="px-6 py-4 text-slate-700 dark:text-emerald-50/80">{new Date(deposit.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
