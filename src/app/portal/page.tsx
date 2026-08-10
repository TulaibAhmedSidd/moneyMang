"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatMoney } from "@/shared";

type Timeframe = "day" | "week" | "month" | "year";

// Color options for custom categories
const CATEGORY_COLORS = [
  "#ef4444", // Red
  "#10b981", // Emerald Green
  "#3b82f6", // Blue
  "#f59e0b", // Amber/Gold
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#8b5cf6", // Violet
  "#64748b", // Slate
];

// Emojis for custom category icons
const CATEGORY_EMOJIS = [
  "🍔", "🍕", "🛒", "🏠", "🏢", "🏥", "❓", "🚌",
  "👨‍👩‍👧", "🎁", "✈️", "🐾", "⚡", "🚗", "💄", "💪",
  "💼", "📈", "🍿", "🎮", "👚", "📚", "💈", "🧸"
];

export default function PortalDashboard() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Layout settings (Expenses/Income segment & Timeframe filters)
  const [activeType, setActiveType] = useState<"expense" | "income">("expense");
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [filterDate, setFilterDate] = useState<Date>(new Date());

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Create Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"expense" | "income">("expense");
  const [catSelectedEmoji, setCatSelectedEmoji] = useState("🛒");
  const [catSelectedColor, setCatSelectedColor] = useState("#3b82f6");

  // Helper date calculators
  const dateBounds = useMemo(() => {
    const y = filterDate.getFullYear();
    const m = filterDate.getMonth();
    
    if (timeframe === "day") {
      const start = new Date(y, m, filterDate.getDate(), 0, 0, 0, 0);
      const end = new Date(y, m, filterDate.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    
    if (timeframe === "week") {
      // Find Monday of the week
      const currentDay = filterDate.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const start = new Date(y, m, filterDate.getDate() + distanceToMonday, 0, 0, 0, 0);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { start, end };
    }
    
    if (timeframe === "month") {
      const start = new Date(y, m, 1, 0, 0, 0, 0);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    
    // Year
    const start = new Date(y, 0, 1, 0, 0, 0, 0);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }, [filterDate, timeframe]);

  const dateLabel = useMemo(() => {
    const today = new Date();
    const isToday = filterDate.toDateString() === today.toDateString();
    
    if (timeframe === "day") {
      if (isToday) return "Today, " + filterDate.toLocaleDateString(undefined, { month: "long", day: "numeric" });
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (filterDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday, " + filterDate.toLocaleDateString(undefined, { month: "long", day: "numeric" });
      }
      return filterDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    }
    
    if (timeframe === "week") {
      const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      return `${dateBounds.start.toLocaleDateString(undefined, options)} - ${dateBounds.end.toLocaleDateString(undefined, options)}, ${dateBounds.end.getFullYear()}`;
    }
    
    if (timeframe === "month") {
      return filterDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
    
    return `${filterDate.getFullYear()}`;
  }, [filterDate, timeframe, dateBounds]);

  const adjustDate = (direction: "prev" | "next") => {
    const newDate = new Date(filterDate);
    const factor = direction === "next" ? 1 : -1;
    
    if (timeframe === "day") {
      newDate.setDate(newDate.getDate() + factor);
    } else if (timeframe === "week") {
      newDate.setDate(newDate.getDate() + factor * 7);
    } else if (timeframe === "month") {
      newDate.setMonth(newDate.getMonth() + factor);
    } else if (timeframe === "year") {
      newDate.setFullYear(newDate.getFullYear() + factor);
    }
    
    setFilterDate(newDate);
  };

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

      // Fetch Categories
      const catRes = await fetch("/api/v1/categories", { headers });
      const catJson = await catRes.json();
      setCategories(catJson.data || []);

      // Fetch Transactions with Date filter
      const startStr = dateBounds.start.toISOString();
      const endStr = dateBounds.end.toISOString();
      const txRes = await fetch(`/api/v1/transactions?limit=100&startDate=${startStr}&endDate=${endStr}`, { headers });
      const txJson = await txRes.json();
      setTransactions(txJson.data?.transactions || []);
      
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
  }, [timeframe, filterDate]);

  // Aggregate total accounts balances
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum: number, acc: any) => sum + (acc.balance ?? 0), 0);
  }, [accounts]);

  // Resolve Category icon details
  const resolveCategory = (category: any) => {
    if (!category) return { icon: "💸", color: "#64748b" };
    
    const iconStr = category.icon || "💸";
    if (iconStr.includes("|")) {
      const [icon, color] = iconStr.split("|");
      return { icon: icon || "💸", color: color || "#64748b" };
    }

    const systemMappings: Record<string, { icon: string; color: string }> = {
      restaurant: { icon: "🍔", color: "#f59e0b" },
      fastfood: { icon: "🍕", color: "#f97316" },
      "local-dining": { icon: "🍜", color: "#ef4444" },
      "local-cafe": { icon: "☕", color: "#8b5cf6" },
      "local-grocery-store": { icon: "🛒", color: "#10b981" },
      "directions-car": { icon: "🚗", color: "#3b82f6" },
      "local-gas-station": { icon: "⛽", color: "#06b6d4" },
      build: { icon: "🔧", color: "#64748b" },
      receipt: { icon: "📄", color: "#a1a1aa" },
      work: { icon: "💼", color: "#059669" },
      laptop: { icon: "💻", color: "#2563eb" },
      store: { icon: "🏪", color: "#db2777" },
      trending_up: { icon: "📈", color: "#10b981" },
      home: { icon: "🏠", color: "#4f46e5" },
    };

    return systemMappings[iconStr] || { icon: iconStr, color: "#64748b" };
  };

  // Group and calculate transaction segments
  const activeTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.type === activeType);
  }, [transactions, activeType]);

  const totalPeriodAmount = useMemo(() => {
    return activeTransactions.reduce((sum: number, tx: any) => sum + (tx.amount ?? 0), 0);
  }, [activeTransactions]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { id: string; name: string; icon: string; color: string; amount: number }> = {};
    
    activeTransactions.forEach((tx) => {
      const catId = tx.categoryId?._id || "unassigned";
      const catName = tx.categoryId?.name || "Uncategorized";
      const { icon, color } = resolveCategory(tx.categoryId);
      
      if (!map[catId]) {
        map[catId] = { id: catId, name: catName, icon, color, amount: 0 };
      }
      map[catId].amount += tx.amount;
    });

    const list = Object.values(map);
    list.sort((a, b) => b.amount - a.amount);

    return list.map((item) => {
      const percentVal = totalPeriodAmount > 0 ? (item.amount / totalPeriodAmount) * 100 : 0;
      return {
        ...item,
        percentage: Math.round(percentVal),
      };
    });
  }, [activeTransactions, totalPeriodAmount]);

  // Donut chart SVG settings
  const radius = 60;
  const strokeWidth = 14;
  const size = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const openTxModal = (type: "income" | "expense") => {
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
      
      const amountVal = parseFloat(txAmount);
      const minorAmount = Math.round(amountVal * 100);

      const response = await fetch("/api/v1/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: minorAmount,
          type: activeType,
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert("Please enter a category name");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const response = await fetch("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: catName,
          type: catType,
          icon: `${catSelectedEmoji}|${catSelectedColor}`,
        }),
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.message || "Failed to create category");
        return;
      }

      setIsCatModalOpen(false);
      setCatName("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to create category");
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

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto bg-zinc-950/40 p-4 sm:p-6 rounded-3xl border border-zinc-900/60 shadow-2xl">
      
      {/* 1. Balance section at top */}
      <div className="text-center py-4 flex flex-col items-center relative">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">BALANCE</span>
        <h2 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
          {formatMoney(totalBalance, user?.preferredCurrency || "USD")}
        </h2>
        
        {/* Buttons to initialize wallets or custom categories */}
        <div className="flex gap-2 mt-4">
          {accounts.length === 0 && (
            <button
              onClick={() => setIsAccModalOpen(true)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-zinc-800"
            >
              + Create Wallet
            </button>
          )}
          <button
            onClick={() => {
              setCatType(activeType);
              setIsCatModalOpen(true);
            }}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-350 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
          >
            📁 Own Category
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 2. Mode Toggle (Expenses / Income) */}
      <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-900">
        <button
          onClick={() => setActiveType("expense")}
          className={`flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
            activeType === "expense"
              ? "bg-zinc-800 text-white shadow"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveType("income")}
          className={`flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
            activeType === "income"
              ? "bg-zinc-800 text-white shadow"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Income
        </button>
      </div>

      {/* 3. Timeframe slider filter */}
      <div className="space-y-4">
        {/* Day, Week, Month, Year tabs */}
        <div className="flex bg-zinc-900/30 p-1 rounded-xl justify-around border border-zinc-900/50">
          {(["day", "week", "month", "year"] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition ${
                timeframe === t ? "bg-blue-600 text-white" : "text-slate-500 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Date Selector Row */}
        <div className="flex justify-between items-center bg-zinc-900/20 border border-zinc-900 px-4 py-2.5 rounded-2xl">
          <button
            onClick={() => adjustDate("prev")}
            className="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold transition"
          >
            ◀
          </button>
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            {dateLabel}
          </span>
          <button
            onClick={() => adjustDate("next")}
            className="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold transition"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 4. Donut Chart segment */}
      <div className="flex justify-center items-center py-8">
        <div className="relative flex justify-center items-center h-48 w-48 bg-zinc-900/10 rounded-full border border-zinc-900/40">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {/* Background Track Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#18181b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Segments */}
            {categoryBreakdown.map((item: any, index: number) => {
              const percentage = totalPeriodAmount > 0 ? item.amount / totalPeriodAmount : 0;
              const strokeDashoffset = circumference - circumference * percentage;
              const rotationAngle = accumulatedPercent * 360;
              accumulatedPercent += percentage;

              return (
                <circle
                  key={`${item.name}-${index}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  transform={`rotate(${rotationAngle} ${size / 2} ${size / 2})`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[18px] font-extrabold text-white">
              {formatMoney(totalPeriodAmount, user?.preferredCurrency || "USD")}
            </span>
          </div>

          {/* Floating yellow '+' add button at the bottom-right corner of the donut circle */}
          <button
            onClick={() => openTxModal(activeType)}
            className="absolute bottom-1 right-1 h-12 w-12 flex items-center justify-center rounded-full bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/20 text-2xl transition cursor-pointer"
            title={`Add ${activeType}`}
          >
            +
          </button>
        </div>
      </div>

      {/* 5. Category list breakdown below */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Breakdown share</h3>
        {categoryBreakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-900/5">
            <span className="text-3xl">📝</span>
            <p className="text-xs text-slate-500 mt-2">No {activeType} transactions recorded in this period.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categoryBreakdown.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-3 px-4 bg-zinc-900/30 border border-zinc-900/80 rounded-2xl hover:bg-zinc-900/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-base"
                    style={{ backgroundColor: item.color + "15", border: `1px solid ${item.color}35` }}
                  >
                    <span>{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{item.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <span className="text-[10px] font-bold text-slate-500">{item.percentage}%</span>
                  <span className="text-xs font-bold text-white">
                    {formatMoney(item.amount, user?.preferredCurrency || "USD")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Add {activeType === "income" ? "Income" : "Expense"} Log
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
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
                  placeholder="e.g. Shopping, salary deposit"
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
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
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
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Wallet</label>
                  <select
                    value={txAccount}
                    onChange={(e) => setTxAccount(e.target.value)}
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
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {categories.filter((c) => c.type === activeType).map((c) => (
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
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
                  placeholder="Memo detail..."
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500 disabled:bg-blue-800/50 cursor-pointer mt-4"
              >
                {isSubmitLoading ? "Saving Transaction..." : "Save Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create New Category</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handleAddCategory} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
                  placeholder="e.g. Shopping, Utilities, Dining"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Category Type</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="radio"
                      name="catType"
                      checked={catType === "expense"}
                      onChange={() => setCatType("expense")}
                      className="accent-blue-500"
                    />
                    Expense
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="radio"
                      name="catType"
                      checked={catType === "income"}
                      onChange={() => setCatType("income")}
                      className="accent-blue-500"
                    />
                    Income
                  </label>
                </div>
              </div>

              {/* Grid of Emojis */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Icon</label>
                <div className="grid grid-cols-8 gap-2 bg-zinc-950 p-3 rounded-2xl max-h-36 overflow-y-auto border border-zinc-850">
                  {CATEGORY_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCatSelectedEmoji(emoji)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-lg transition ${
                        catSelectedEmoji === emoji ? "bg-zinc-800 border border-zinc-700" : "hover:bg-zinc-900"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Colors */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Color</label>
                <div className="flex gap-2 flex-wrap bg-zinc-950 p-3 rounded-2xl border border-zinc-850 justify-around">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCatSelectedColor(color)}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        catSelectedColor === color ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500 disabled:bg-blue-800/50 cursor-pointer mt-4"
              >
                {isSubmitLoading ? "Saving Category..." : "Add Category"}
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
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Wallet / Account</h3>
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
                  className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
                  placeholder="e.g. Standard Chartered, HBL, Cash"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
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
                    className="mt-1 block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:bg-indigo-800/50 cursor-pointer mt-4"
              >
                {isSubmitLoading ? "Creating Wallet..." : "Save Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
