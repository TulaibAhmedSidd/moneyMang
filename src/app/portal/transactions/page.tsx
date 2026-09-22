"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatMoney } from "@/shared";

type TimeFilter = "all" | "day" | "week" | "month" | "year";

export default function TransactionsHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Transaction Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTxId, setEditTxId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editAccount, setEditAccount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      const response = await fetch("/api/v1/transactions?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setTransactions(result.data?.transactions || []);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [accRes, catRes] = await Promise.all([
        fetch("/api/v1/accounts", { headers }),
        fetch("/api/v1/categories", { headers })
      ]);

      const accJson = await accRes.json();
      const catJson = await catRes.json();

      setAccounts(accJson.data || []);
      setCategories(catJson.data || []);
    } catch (err) {
      console.error("Failed to load accounts/categories metadata", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchMetadata();
  }, []);

  const getLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const r = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${r}`;
  };

  const openEditModal = (tx: any) => {
    setEditTxId(tx._id);
    setEditTitle(tx.title);
    setEditAmount((tx.amount / 100).toString());
    setEditAccount(tx.accountId?._id || tx.accountId);
    setEditCategory(tx.categoryId?._id || tx.categoryId);
    setEditDescription(tx.description || "");
    setEditDate(getLocalYMD(new Date(tx.date)));
    setEditType(tx.type);
    setIsEditModalOpen(true);
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAmount || !editTitle || !editAccount || !editCategory) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const amountVal = parseFloat(editAmount);
      const minorAmount = Math.round(amountVal * 100);

      const response = await fetch(`/api/v1/transactions/${editTxId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          amount: minorAmount,
          accountId: editAccount,
          categoryId: editCategory,
          description: editDescription,
          date: new Date(editDate + "T12:00:00.000Z"),
          type: editType,
        }),
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.message || "Failed to update transaction");
        return;
      }

      setIsEditModalOpen(false);
      fetchTransactions(); // Refresh the list
    } catch (err: any) {
      alert(err.message || "Failed to update transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/v1/transactions/${editTxId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.message || "Failed to delete transaction");
        return;
      }

      setIsEditModalOpen(false);
      setTransactions(transactions.filter((tx) => tx._id !== editTxId));
    } catch (err: any) {
      alert(err.message || "Failed to delete transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((tx) => tx.title.toLowerCase().includes(query));
    }

    // Timeframe filter
    if (timeFilter !== "all") {
      const now = new Date();
      list = list.filter((tx) => {
        const date = new Date(tx.date);
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (timeFilter === "day") {
          return diffDays <= 1;
        } else if (timeFilter === "week") {
          return diffDays <= 7;
        } else if (timeFilter === "month") {
          return diffDays <= 30;
        } else if (timeFilter === "year") {
          return diffDays <= 365;
        }
        return true;
      });
    }

    return list;
  }, [transactions, searchQuery, timeFilter]);

  const resolveCategoryIcon = (cat: any) => {
    if (!cat || !cat.icon) return "💸";
    const raw = (cat.icon.split("|")[0] || "💸").trim();
    const systemMap: Record<string, string> = {
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
      "phone-android": "📱",
      phone_android: "📱",
      checkroom: "👗",
      wifi: "📶",
      "medical-services": "🏥",
      medical_services: "🏥",
      flight: "✈️",
      book: "📚",
      people: "👥",
      chair: "🪑",
      fitness_center: "🏋️",
      "fitness-center": "🏋️",
      card_giftcard: "🎁",
      "card-giftcard": "🎁",
      subscriptions: "💳",
      school: "📖",
      vpn_key: "🔑",
      "vpn-key": "🔑",
      water_drop: "💧",
      "water-drop": "💧",
      more_horiz: "⋯",
      "more-horiz": "⋯",
      event: "📅",
    };
    if (systemMap[raw]) return systemMap[raw];
    if (/^[a-zA-Z0-9_-]{2,}$/.test(raw)) return "🏷️";
    return raw;
  };

  const resolveCategoryColor = (cat: any) => {
    if (!cat || !cat.icon) return "#3b82f6";
    return cat.icon.split("|")[1] || "#3b82f6";
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Transaction History</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage your financial records.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-4">
        {/* Search */}
        <div className="w-full sm:max-w-xs relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
            placeholder="Search transaction..."
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1 bg-zinc-950 border border-zinc-850 p-1 rounded-xl w-full sm:w-auto justify-around">
          {(["all", "day", "week", "month", "year"] as TimeFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                timeFilter === tab ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <span className="text-5xl text-slate-800">📭</span>
            <h3 className="text-white font-bold">No results found</h3>
            <p className="text-sm text-slate-500">Try modifying your query or filters.</p>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-zinc-800/50">
            {filteredTransactions.map((tx, idx) => {
              const isIncome = tx.type === "income";
              const isFirst = idx === 0;
              const catIcon = resolveCategoryIcon(tx.categoryId);
              const catColor = resolveCategoryColor(tx.categoryId);
              
              return (
                <div
                  key={tx._id}
                  onClick={() => openEditModal(tx)}
                  className={`flex justify-between items-center hover:bg-zinc-900/25 rounded-2xl p-4 transition cursor-pointer ${
                    isFirst ? "" : "mt-2"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-lg transition duration-200"
                      style={{ backgroundColor: catColor + "15", border: `1px solid ${catColor}30` }}
                    >
                      {catIcon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{tx.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 animate-pulse-slow">
                        {tx.categoryId?.name || "Uncategorized"} • {new Date(tx.date).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-slate-400 italic mt-1 max-w-sm truncate">{tx.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold ${isIncome ? "text-emerald-400" : "text-rose-450"}`}>
                      {isIncome ? "+" : "-"} {formatMoney(tx.amount, tx.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Edit Log Detail
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleEditTransaction} className="mt-4 space-y-4">
              <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-850">
                <button
                  type="button"
                  onClick={() => setEditType("expense")}
                  className={`flex-1 text-center py-2 text-xs font-bold uppercase rounded-xl transition ${
                    editType === "expense" ? "bg-zinc-850 text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setEditType("income")}
                  className={`flex-1 text-center py-2 text-xs font-bold uppercase rounded-xl transition ${
                    editType === "income" ? "bg-zinc-850 text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Title / Payee</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
                  placeholder="e.g. KFC, Salary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Wallet Account</label>
                  <select
                    value={editAccount}
                    onChange={(e) => setEditAccount(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {categories.filter((c) => c.type === editType).map((c) => {
                      const iconVal = c.icon ? c.icon.split("|")[0] : "💸";
                      return (
                        <option key={c._id} value={c._id}>
                          {iconVal} {c.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
                  placeholder="Memo detail..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleDeleteTransaction}
                  disabled={isSubmitting}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50 cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
