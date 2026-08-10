"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatMoney } from "@/shared";

export default function PortalDashboard() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("expense");
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txAccount, setTxAccount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  // Account Initialization State
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("checking");
  const [accInitBalance, setAccInitBalance] = useState("0");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch user profile
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      // Fetch Accounts
      const accRes = await fetch("/api/v1/accounts", { headers });
      const accJson = await accRes.json();
      const accountsList = accJson.data || [];
      setAccounts(accountsList);

      // Fetch Recent Transactions
      const txRes = await fetch("/api/v1/transactions?limit=10", { headers });
      const txJson = await txRes.json();
      setTransactions(txJson.data?.transactions || []);

      // Fetch Categories
      const catRes = await fetch("/api/v1/categories", { headers });
      const catJson = await catRes.json();
      setCategories(catJson.data || []);
      
      // Auto select first account if available
      if (accountsList.length > 0) {
        setTxAccount(accountsList[0]._id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load portal metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum: number, acc: any) => sum + (acc.balance ?? 0), 0);
  }, [accounts]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach((tx) => {
      if (tx.type === "income") inc += tx.amount;
      else exp += tx.amount;
    });
    return { totalIncome: inc, totalExpense: exp };
  }, [transactions]);

  const openTxModal = (type: "income" | "expense") => {
    setModalType(type);
    setTxTitle("");
    setTxAmount("");
    setTxDescription("");
    setTxDate(new Date().toISOString().split("T")[0]);
    if (accounts.length > 0) setTxAccount(accounts[0]._id);
    const filteredCats = categories.filter((c) => c.type === type);
    if (filteredCats.length > 0) setTxCategory(filteredCats[0]._id);
    setIsModalOpen(true);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txTitle || !txAccount || !txCategory) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      // We need to send minor units to the backend! E.g. $10.50 -> 1050 cents.
      // Minor unit factor is based on selected currency, default to 100 for cents.
      const amountVal = parseFloat(txAmount);
      const isPkr = user?.preferredCurrency === "PKR";
      const minorFactor = isPkr ? 100 : 100; // standard minor unit is 100 for cents/paise
      const minorAmount = Math.round(amountVal * minorFactor);

      const response = await fetch("/api/v1/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: minorAmount,
          type: modalType,
          title: txTitle,
          accountId: txAccount,
          categoryId: txCategory,
          description: txDescription,
          date: new Date(txDate).toISOString(),
          currency: user?.preferredCurrency || "USD",
        }),
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.message || "Failed to create transaction");
        return;
      }

      setIsModalOpen(false);
      fetchData(); // Reload stats
    } catch (err: any) {
      alert(err.message || "Failed to submit transaction");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accInitBalance) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const balanceVal = parseFloat(accInitBalance);
      const minorBalance = Math.round(balanceVal * 100);

      const response = await fetch("/api/v1/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: accName,
          type: accType,
          currency: user?.preferredCurrency || "USD",
          initialBalance: minorBalance,
        }),
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.message || "Failed to create account");
        return;
      }

      setIsAccModalOpen(false);
      setAccName("");
      setAccInitBalance("0");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to create account");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const mapping: Record<string, string> = {
      restaurant: "🍔",
      fastfood: "🍕",
      "local-dining": "🍜",
      "local-cafe": "☕",
      "local-grocery-store": "🛒",
      "directions-car": "🚗",
      "local-gas-station": "⛽",
      build: "🔧",
      receipt: "📄",
      work: "💼",
      laptop: "💻",
      store: "🏪",
      trending_up: "📈",
      home: "🏠",
    };
    return mapping[iconName] || "💸";
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-semibold tracking-wide uppercase text-slate-500">Consumer Console</h1>
          <h2 className="text-2xl font-bold text-white mt-1">Hello, {user?.name}!</h2>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <button
              onClick={() => setIsAccModalOpen(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              + Create Wallet
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Available Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-xl shadow-blue-500/10 text-white">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <p className="text-sm font-semibold text-blue-100 uppercase tracking-wider">Available Balance</p>
        <p className="mt-3 text-4xl font-extrabold tracking-tight">
          {formatMoney(totalBalance, user?.preferredCurrency || "USD")}
        </p>

        <div className="mt-8 border-t border-white/10 pt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-200">
              <span className="text-lg">⬇️</span>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">Income Logged</span>
            </div>
            <p className="mt-1.5 text-xl font-bold text-white">
              {formatMoney(totalIncome, user?.preferredCurrency || "USD")}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-rose-200">
              <span className="text-lg">⬆️</span>
              <span className="text-xs uppercase font-bold tracking-wider text-rose-100">Expense Logged</span>
            </div>
            <p className="mt-1.5 text-xl font-bold text-white">
              {formatMoney(totalExpense, user?.preferredCurrency || "USD")}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => openTxModal("income")}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 hover:bg-zinc-800/40 transition text-center sm:text-left cursor-pointer"
        >
          <span className="text-2xl text-emerald-500">💰</span>
          <div>
            <p className="font-bold text-white text-sm">Add Income</p>
            <p className="text-xs text-slate-500 hidden sm:block">Record cash inflows</p>
          </div>
        </button>
        <button
          onClick={() => openTxModal("expense")}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 hover:bg-zinc-800/40 transition text-center sm:text-left cursor-pointer"
        >
          <span className="text-2xl text-rose-500">💸</span>
          <div>
            <p className="font-bold text-white text-sm">Add Expense</p>
            <p className="text-xs text-slate-500 hidden sm:block">Record cash outflows</p>
          </div>
        </button>
      </div>

      {/* Recent Activity List */}
      <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-zinc-800 rounded-2xl">
            <span className="text-4xl text-slate-700">📭</span>
            <p className="text-sm font-medium text-slate-500">No logs found. Register your first transaction above!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {transactions.slice(0, 5).map((tx) => {
              const isIncome = tx.type === "income";
              return (
                <div key={tx._id} className="flex justify-between items-center py-3.5 hover:bg-zinc-900/10 rounded-xl px-2 transition">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/60 text-lg">
                      {getCategoryIcon(tx.categoryId?.icon)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{tx.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tx.categoryId?.name} • {new Date(tx.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                    {isIncome ? "+" : "-"} {formatMoney(tx.amount, tx.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">
                Add {modalType === "income" ? "Income" : "Expense"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
                  placeholder="Grocery, Salary, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</label>
                  <select
                    value={txAccount}
                    onChange={(e) => setTxAccount(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                  >
                    {categories.filter((c) => c.type === modalType).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
                  placeholder="Optional detail..."
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:bg-blue-800/50 cursor-pointer mt-4"
              >
                {isSubmitLoading ? "Submitting..." : "Save Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Account Creation Modal */}
      {isAccModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Create Wallet / Account</h3>
              <button onClick={() => setIsAccModalOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handleAddAccount} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Name</label>
                <input
                  type="text"
                  required
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
                  placeholder="e.g. Standard Chartered, cash, HBL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="cash">Cash Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={accInitBalance}
                    onChange={(e) => setAccInitBalance(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:bg-indigo-800/50 cursor-pointer mt-4"
              >
                {isSubmitLoading ? "Creating..." : "Save Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
