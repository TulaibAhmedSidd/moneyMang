"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatMoney } from "@/shared";

import { usePortalData } from "@/context/PortalDataContext";

type TimeFilter = "all" | "day" | "week" | "month" | "year";

export default function TransactionsHistory() {
  const {
    transactions,
    accounts,
    categories,
    user,
    isLoading,
    updateTransaction,
    deleteTransaction,
  } = usePortalData();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

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
      const amountVal = parseFloat(editAmount);
      const minorAmount = Math.round(amountVal * 100);

      await updateTransaction(editTxId, {
        title: editTitle,
        amount: minorAmount,
        accountId: editAccount,
        categoryId: editCategory,
        description: editDescription,
        date: new Date(editDate + "T12:00:00.000Z").toISOString(),
        type: editType,
      });

      setIsEditModalOpen(false);
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
      await deleteTransaction(editTxId);
      setIsEditModalOpen(false);
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
        if (isNaN(date.getTime())) return false;

        if (timeFilter === "day") {
          return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()
          );
        } else if (timeFilter === "week") {
          const diffTime = now.getTime() - date.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return diffDays >= -1 && diffDays <= 7;
        } else if (timeFilter === "month") {
          return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()
          );
        } else if (timeFilter === "year") {
          return date.getFullYear() === now.getFullYear();
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="w-full sm:max-w-xs relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
            placeholder="Search transaction..."
          />
        </div>

        {/* Filter Buttons - Large, comfortable touch targets */}
        <div className="grid grid-cols-5 gap-1.5 bg-zinc-950 border border-zinc-850 p-1.5 rounded-2xl w-full sm:w-auto">
          {(["all", "day", "week", "month", "year"] as TimeFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeFilter(tab)}
              className={`rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition active:scale-95 text-center ${
                timeFilter === tab ? "bg-blue-600 text-white shadow-md font-extrabold" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-4 sm:p-6 shadow-sm">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-zinc-800/60">
          <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
            Showing {Math.min(filteredTransactions.length, (currentPage - 1) * pageSize + 1)} -{" "}
            {Math.min(filteredTransactions.length, currentPage * pageSize)} of {filteredTransactions.length} logs
          </span>
          {filteredTransactions.length > pageSize && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold bg-zinc-850 hover:bg-zinc-800 active:scale-95 disabled:opacity-40 text-slate-200 transition"
              >
                ◀ Prev
              </button>
              <span className="text-xs sm:text-sm font-semibold text-slate-400">
                {currentPage} / {Math.ceil(filteredTransactions.length / pageSize)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(Math.ceil(filteredTransactions.length / pageSize), p + 1)
                  )
                }
                disabled={currentPage >= Math.ceil(filteredTransactions.length / pageSize)}
                className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold bg-zinc-850 hover:bg-zinc-800 active:scale-95 disabled:opacity-40 text-slate-200 transition"
              >
                Next ▶
              </button>
            </div>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <span className="text-5xl text-slate-800">📭</span>
            <h3 className="text-white font-bold text-base">No results found</h3>
            <p className="text-sm text-slate-500">Try modifying your query or filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((tx) => {
                const isIncome = tx.type === "income";
                const catIcon = resolveCategoryIcon(tx.categoryId);
                const catColor = resolveCategoryColor(tx.categoryId);

                return (
                  <div
                    key={tx._id}
                    onClick={() => openEditModal(tx)}
                    className="flex justify-between items-center hover:bg-zinc-900/40 active:scale-[0.99] border border-zinc-850/80 bg-zinc-950/30 rounded-2xl p-4 sm:p-5 transition cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition duration-200 shadow-sm"
                        style={{ backgroundColor: catColor + "20", border: `1.5px solid ${catColor}40` }}
                      >
                        {catIcon}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{tx.title}</h4>
                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                          {tx.categoryId?.name || "Uncategorized"} •{" "}
                          {new Date(tx.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-slate-500 italic mt-1 max-w-sm truncate">{tx.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-base font-bold ${isIncome ? "text-emerald-400" : "text-slate-200"}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Edit Log Detail
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-zinc-800/60 active:scale-95 text-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditTransaction} className="mt-4 space-y-4">
              <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-850">
                <button
                  type="button"
                  onClick={() => setEditType("expense")}
                  className={`flex-1 text-center py-3 text-sm font-bold uppercase rounded-xl transition active:scale-95 ${
                    editType === "expense" ? "bg-zinc-800 text-white shadow-md border border-zinc-700" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setEditType("income")}
                  className={`flex-1 text-center py-3 text-sm font-bold uppercase rounded-xl transition active:scale-95 ${
                    editType === "income" ? "bg-zinc-800 text-white shadow-md border border-zinc-700" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Title / Payee</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                  placeholder="e.g. KFC, Salary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3.5 text-base text-white outline-none focus:border-blue-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wallet Account</label>
                  <select
                    value={editAccount}
                    onChange={(e) => setEditAccount(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3.5 text-base text-white outline-none focus:border-blue-500 transition shadow-inner"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3.5 text-base text-white outline-none focus:border-blue-500 transition shadow-inner"
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                  placeholder="Memo detail..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3.5 mt-5">
                <button
                  type="button"
                  onClick={handleDeleteTransaction}
                  disabled={isSubmitting}
                  className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm sm:text-base font-bold text-rose-400 transition hover:bg-rose-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-blue-600 py-4 text-sm sm:text-base font-bold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xl shadow-blue-600/30"
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
