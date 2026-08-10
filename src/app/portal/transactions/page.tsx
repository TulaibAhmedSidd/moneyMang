"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatMoney } from "@/shared";

type TimeFilter = "all" | "day" | "week" | "month" | "year";

export default function TransactionsHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/v1/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.message || "Failed to delete transaction");
        setIsDeleting(null);
        return;
      }

      // Refresh list
      setTransactions(transactions.filter((tx) => tx._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete transaction");
    } finally {
      setIsDeleting(null);
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
              return (
                <div
                  key={tx._id}
                  className={`flex justify-between items-center hover:bg-zinc-900/10 rounded-xl px-2 transition ${
                    isFirst ? "pb-3.5" : "py-3.5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/60 text-lg">
                      {getCategoryIcon(tx.categoryId?.icon)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{tx.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tx.categoryId?.name} • {new Date(tx.date).toLocaleDateString(undefined, {
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
                    <span className={`text-sm font-bold ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                      {isIncome ? "+" : "-"} {formatMoney(tx.amount, tx.currency)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx._id)}
                      disabled={isDeleting === tx._id}
                      className="text-xs font-semibold text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg p-2 transition disabled:opacity-40"
                    >
                      {isDeleting === tx._id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
