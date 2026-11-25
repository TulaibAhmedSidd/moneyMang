"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatMoney, formatAbbreviated, formatRomanUrdu } from "@/shared";

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

// Helper to get local date string YYYY-MM-DD
const getLocalYMD = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Helper to construct ISO Date string incorporating active local time
const getISODateWithLocalTime = (ymdString: string) => {
  try {
    const [year, month, day] = ymdString.split("-").map(Number);
    const now = new Date();
    const localDate = new Date(
      year,
      month - 1,
      day,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );
    return localDate.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

// Helper to determine if transaction date matches active timeframe
const isTxInPeriod = (
  txDateRaw: string | Date,
  timeframe: Timeframe,
  filterDate: Date,
  dateBounds: { start: Date; end: Date }
) => {
  if (!txDateRaw) return false;
  const d = new Date(txDateRaw);
  if (isNaN(d.getTime())) return false;

  if (timeframe === "day") {
    if (typeof txDateRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(txDateRaw.trim())) {
      const [y, m, day] = txDateRaw.trim().split("-").map(Number);
      return (
        y === filterDate.getFullYear() &&
        m - 1 === filterDate.getMonth() &&
        day === filterDate.getDate()
      );
    }
    return (
      d.getFullYear() === filterDate.getFullYear() &&
      d.getMonth() === filterDate.getMonth() &&
      d.getDate() === filterDate.getDate()
    );
  }

  if (timeframe === "week") {
    const txMs = d.getTime();
    return txMs >= dateBounds.start.getTime() && txMs <= dateBounds.end.getTime();
  }

  if (timeframe === "month") {
    if (typeof txDateRaw === "string" && /^\d{4}-\d{2}-\d{2}/.test(txDateRaw.trim())) {
      const [y, m] = txDateRaw.trim().split("-").map(Number);
      return y === filterDate.getFullYear() && m - 1 === filterDate.getMonth();
    }
    return (
      d.getFullYear() === filterDate.getFullYear() &&
      d.getMonth() === filterDate.getMonth()
    );
  }

  if (timeframe === "year") {
    if (typeof txDateRaw === "string" && /^\d{4}/.test(txDateRaw.trim())) {
      const y = parseInt(txDateRaw.trim().slice(0, 4), 10);
      return y === filterDate.getFullYear();
    }
    return d.getFullYear() === filterDate.getFullYear();
  }

  return true;
};

import { usePortalData } from "@/context/PortalDataContext";

export default function PortalDashboard() {
  const {
    user,
    accounts,
    categories,
    transactions,
    themeColor,
    syncStatus,
    isSyncing,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    addAccount,
    refreshAllData,
  } = usePortalData();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Category Picker State
  const [isCatPickerOpen, setIsCatPickerOpen] = useState(false);
  const [catPickerTarget, setCatPickerTarget] = useState<"add" | "edit">("add");
  const [catSearchQuery, setCatSearchQuery] = useState("");

  // Layout settings (Expenses/Income segment & Timeframe filters)
  const [activeType, setActiveType] = useState<"expense" | "income">("expense");
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txAccount, setTxAccount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(getLocalYMD());

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
      const end = new Date(y, m, filterDate.getDate() + distanceToMonday + 6, 23, 59, 59, 999);
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

  useEffect(() => {
    if (accounts.length > 0 && !txAccount) {
      setTxAccount(accounts[0]._id);
    }
  }, [accounts, txAccount]);

  // Aggregate total accounts balances
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum: number, acc: any) => sum + (acc.balance ?? 0), 0);
  }, [accounts]);

  // Resolve Category icon details
  const resolveCategory = (category: any) => {
    if (!category) return { icon: "💸", color: "#64748b" };
    
    const iconStr = (category.icon || "💸").trim();
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
      "phone-android": { icon: "📱", color: "#3b82f6" },
      phone_android: { icon: "📱", color: "#3b82f6" },
      checkroom: { icon: "👗", color: "#ec4899" },
      wifi: { icon: "📶", color: "#06b6d4" },
      "medical-services": { icon: "🏥", color: "#ef4444" },
      medical_services: { icon: "🏥", color: "#ef4444" },
      flight: { icon: "✈️", color: "#06b6d4" },
      book: { icon: "📚", color: "#8b5cf6" },
      people: { icon: "👥", color: "#ec4899" },
      chair: { icon: "🪑", color: "#4f46e5" },
      fitness_center: { icon: "🏋️", color: "#10b981" },
      "fitness-center": { icon: "🏋️", color: "#10b981" },
      card_giftcard: { icon: "🎁", color: "#ec4899" },
      "card-giftcard": { icon: "🎁", color: "#ec4899" },
      subscriptions: { icon: "💳", color: "#6366f1" },
      school: { icon: "📖", color: "#8b5cf6" },
      vpn_key: { icon: "🔑", color: "#f59e0b" },
      "vpn-key": { icon: "🔑", color: "#f59e0b" },
      water_drop: { icon: "💧", color: "#0284c7" },
      "water-drop": { icon: "💧", color: "#0284c7" },
      more_horiz: { icon: "⋯", color: "#64748b" },
      "more-horiz": { icon: "⋯", color: "#64748b" },
      event: { icon: "📅", color: "#8b5cf6" },
    };

    if (systemMappings[iconStr]) {
      return systemMappings[iconStr];
    }

    // Safety fallback: if iconStr looks like a text name (e.g. "phone-android" or "clothing"), do not render raw text
    if (/^[a-zA-Z0-9_-]{2,}$/.test(iconStr)) {
      return { icon: "🏷️", color: "#64748b" };
    }

    return { icon: iconStr, color: "#64748b" };
  };

  // Group and calculate transaction segments
  const activeTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type !== activeType) return false;
      return isTxInPeriod(tx.date, timeframe, filterDate, dateBounds);
    });
  }, [transactions, activeType, timeframe, filterDate, dateBounds]);

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
    setTxDate(getLocalYMD(filterDate));
    if (accounts.length > 0) setTxAccount(accounts[0]._id);
    const filteredCats = categories.filter((c) => c.type === type);
    if (filteredCats.length > 0) setTxCategory(filteredCats[0]._id);
    setIsModalOpen(true);
  };

  const openTxModalWithCategory = (catId: string) => {
    openTxModal(activeType);
    setTxCategory(catId);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txTitle || !txAccount || !txCategory) {
      alert("Please fill in all required fields.");
      return;
    }

    const amountVal = parseFloat(txAmount);
    const minorAmount = Math.round(amountVal * 100);

    // Call context optimistic mutation (0ms latency, local state first, silent cloud sync)
    await addTransaction({
      amount: minorAmount,
      type: activeType,
      title: txTitle,
      accountId: txAccount,
      categoryId: txCategory,
      description: txDescription,
      date: getISODateWithLocalTime(txDate),
      currency: user?.preferredCurrency || "USD",
    });

    setIsModalOpen(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert("Please enter a category name");
      return;
    }

    const formattedIcon = `${catSelectedEmoji}|${catSelectedColor}`;
    const createdCat = await addCategory({
      name: catName.trim(),
      type: catType,
      icon: formattedIcon,
    });

    setTxCategory(createdCat._id);
    setIsCatModalOpen(false);
    setCatName("");
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accInitBalance) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const balanceVal = parseFloat(accInitBalance);
      const minorBalance = Math.round(balanceVal * 100);

      await addAccount({
        name: accName,
        type: accType,
        currency: user?.preferredCurrency || "USD",
        initialBalance: minorBalance,
      });

      setIsAccModalOpen(false);
      setAccName("");
      setAccInitBalance("0");
    } catch (err: any) {
      alert(err.message || "Failed to create account");
    } finally {
      setIsSubmitLoading(false);
    }
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

    const amountVal = parseFloat(editAmount);
    const minorAmount = Math.round(amountVal * 100);

    await updateTransaction(editTxId, {
      amount: minorAmount,
      type: editType,
      title: editTitle,
      accountId: editAccount,
      categoryId: editCategory,
      description: editDescription,
      date: getISODateWithLocalTime(editDate),
    });

    setIsEditModalOpen(false);
  };

  const handleDeleteTransaction = async () => {
    if (!confirm("Are you sure you want to delete this log?")) return;

    await deleteTransaction(editTxId);
    setIsEditModalOpen(false);
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
      
      {syncStatus && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 px-4 py-3 shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
          <div className={`h-2.5 w-2.5 rounded-full ${
            syncStatus === "Synced" 
              ? "bg-emerald-500 shadow-lg shadow-emerald-500/55" 
              : syncStatus === "Offline" || syncStatus === "Sync incomplete"
                ? "bg-rose-500 shadow-lg shadow-rose-500/55"
                : "bg-blue-500 animate-ping"
          }`} />
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-350">
            {syncStatus === "Synced" ? "Synced with Cloud" : syncStatus === "Syncing..." ? "Syncing to Cloud" : syncStatus === "Saving..." ? "Saving Locally..." : syncStatus}
          </span>
        </div>
      )}

      {/* 1. Balance section at top */}
      <div className="text-center py-4 flex flex-col items-center relative">
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">BALANCE</span>
        <h2 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
          {formatMoney(totalBalance, user?.preferredCurrency || "USD")}
        </h2>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1.5">
          <span>{formatAbbreviated(totalBalance, user?.preferredCurrency || "USD")} {user?.preferredCurrency || "USD"}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-450 font-semibold lowercase italic">{formatRomanUrdu(totalBalance, user?.preferredCurrency || "USD")}</span>
        </p>
        
        {/* Buttons to initialize wallets */}
        {accounts.length === 0 && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsAccModalOpen(true)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-zinc-800"
            >
              + Create Wallet
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 2. Mode Toggle (Expenses / Income) */}
      <div className="flex bg-zinc-900/60 p-2 rounded-2xl border border-zinc-800/80 shadow-inner">
        <button
          onClick={() => setActiveType("expense")}
          className={`flex-1 text-center py-3.5 sm:py-3 text-sm sm:text-base font-bold uppercase tracking-wider rounded-xl transition active:scale-[0.98] ${
            activeType === "expense"
              ? "bg-zinc-800 text-white shadow-lg shadow-black/40 border border-zinc-750"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveType("income")}
          className={`flex-1 text-center py-3.5 sm:py-3 text-sm sm:text-base font-bold uppercase tracking-wider rounded-xl transition active:scale-[0.98] ${
            activeType === "income"
              ? "bg-zinc-800 text-white shadow-lg shadow-black/40 border border-zinc-750"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Income
        </button>
      </div>

      {/* 3. Timeframe slider filter */}
      <div className="space-y-3.5">
        {/* Day, Week, Month, Year tabs - Large, easy to tap buttons */}
        <div className="grid grid-cols-4 gap-1.5 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-850">
          {(["day", "week", "month", "year"] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`rounded-xl py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition active:scale-95 ${
                timeframe === t 
                  ? "text-white shadow-md shadow-black/30 font-extrabold" 
                  : "text-slate-400 hover:text-white hover:bg-zinc-800/40"
              }`}
              style={timeframe === t ? { backgroundColor: themeColor } : {}}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Date Selector Row with large, tactile touch buttons */}
        <div className="flex justify-between items-center bg-zinc-900/40 border border-zinc-800/80 px-3 py-2.5 rounded-2xl shadow-sm">
          <button
            onClick={() => adjustDate("prev")}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 active:scale-95 text-slate-300 hover:text-white text-base font-bold transition shadow-sm"
            title="Previous Period"
          >
            ◀
          </button>
          <span className="text-sm sm:text-base font-bold text-white tracking-wide uppercase px-2 text-center truncate">
            {dateLabel}
          </span>
          <button
            onClick={() => adjustDate("next")}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 active:scale-95 text-slate-300 hover:text-white text-base font-bold transition shadow-sm"
            title="Next Period"
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
          <div className="absolute flex flex-col items-center justify-center text-center px-4 max-w-[110px]">
            <span className="text-xs sm:text-sm font-bold text-slate-200 tracking-tight">
              {formatMoney(totalPeriodAmount, user?.preferredCurrency || "USD")}
            </span>
          </div>

          {/* Floating yellow '+' add button at the bottom-right corner of the donut circle */}
          <button
            onClick={() => openTxModal(activeType)}
            className="absolute -bottom-1 -right-1 h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center rounded-full bg-amber-500 text-zinc-950 font-extrabold hover:bg-amber-400 active:scale-90 shadow-xl shadow-amber-500/35 text-3xl transition cursor-pointer border-2 border-zinc-900"
            title={`Add ${activeType}`}
          >
            +
          </button>
        </div>
      </div>

      {/* 5. Category list breakdown below */}
      <div className="space-y-3.5">
        <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Breakdown share</h3>
        {categoryBreakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-900/5">
            <span className="text-3xl">📝</span>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">No {activeType} transactions recorded in this period.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {categoryBreakdown.map((item) => {
              const isExpanded = expandedCategory === item.id;
              const catTransactions = activeTransactions.filter(
                (tx) => (tx.categoryId?._id || "unassigned") === item.id
              );

              return (
                <div key={item.id} className="rounded-2xl border border-zinc-900/80 bg-zinc-900/30 overflow-hidden transition shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isExpanded ? null : item.id)}
                    className="w-full flex justify-between items-center py-3.5 px-4 hover:bg-zinc-900/50 active:bg-zinc-900/60 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
                        style={{ backgroundColor: item.color + "20", border: `1.5px solid ${item.color}40` }}
                      >
                        <span>{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-bold text-white">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {catTransactions.length} {catTransactions.length === 1 ? "log" : "logs"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-xs sm:text-sm font-bold text-slate-400">{item.percentage}%</span>
                      <span className="text-sm sm:text-base font-bold text-white">
                        {formatMoney(item.amount, user?.preferredCurrency || "USD")}
                      </span>
                      <span className={`text-xs text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Expanded Transactions for this Category */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800/60 bg-black/30 p-2.5 space-y-2">
                      {catTransactions.map((tx) => (
                        <div
                          key={tx._id}
                          onClick={() => openEditModal(tx)}
                          className="flex justify-between items-center py-3 px-3.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/70 active:bg-zinc-800 transition cursor-pointer text-sm"
                        >
                          <div className="flex flex-col truncate max-w-[200px]">
                            <span className="font-semibold text-slate-100 truncate">{tx.title}</span>
                            <span className="text-xs text-slate-400 mt-0.5">
                              {new Date(tx.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-white">
                              {formatMoney(tx.amount, tx.currency)}
                            </span>
                            <span className="text-xs text-blue-400 font-semibold px-2 py-0.5 rounded-lg bg-blue-500/10">Edit ✎</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logs List for Current Timeframe */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
            {timeframe === "month"
              ? "Monthly Logs"
              : timeframe === "week"
              ? "Weekly Logs"
              : timeframe === "day"
              ? "Daily Logs"
              : "Yearly Logs"}{" "}
            ({activeTransactions.length})
          </h3>
          <span className="text-xs text-slate-500">Tap to edit</span>
        </div>

        {activeTransactions.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-zinc-900 rounded-2xl bg-zinc-900/5 text-xs sm:text-sm text-slate-400">
            No transaction logs recorded in this period.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeTransactions.map((tx) => {
              const cat = resolveCategory(tx.categoryId);
              const isIncome = tx.type === "income";
              return (
                <div
                  key={tx._id}
                  onClick={() => openEditModal(tx)}
                  className="flex justify-between items-center py-3.5 px-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl hover:bg-zinc-900/60 active:scale-[0.99] transition cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
                      style={{ backgroundColor: cat.color + "20", border: `1.5px solid ${cat.color}40` }}
                    >
                      <span>{cat.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-white truncate max-w-[180px]">{tx.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(tx.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm sm:text-base font-bold ${isIncome ? "text-emerald-400" : "text-slate-200"}`}>
                    {isIncome ? "+" : "-"} {formatMoney(tx.amount, tx.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Add {activeType === "income" ? "Income" : "Expense"} Log
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-zinc-800/60 active:scale-95 text-lg transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Title / Payee</label>
                <input
                  type="text"
                  required
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                  placeholder="e.g. Groceries, Dinner, Salary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3.5 text-base text-white outline-none focus:border-blue-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Wallet</label>
                  <select
                    value={txAccount}
                    onChange={(e) => setTxAccount(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3.5 text-base text-white outline-none focus:border-blue-500 transition shadow-inner"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCatPickerTarget("add");
                      setCatSearchQuery("");
                      setIsCatPickerOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-sm font-semibold text-white outline-none hover:border-zinc-750 active:bg-zinc-900 transition cursor-pointer shadow-inner"
                  >
                    {(() => {
                      const currentCat = categories.find((c) => c._id === txCategory);
                      const { icon } = resolveCategory(currentCat);
                      return (
                        <span className="flex items-center gap-2.5 text-left truncate">
                          <span className="text-2xl">{icon}</span>
                          <span className="font-bold text-slate-200 truncate">{currentCat ? currentCat.name : "Select"}</span>
                        </span>
                      );
                    })()}
                    <span className="text-slate-400 text-xs">▼</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                <textarea
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                  placeholder="Memo detail..."
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                style={{ backgroundColor: themeColor }}
                className="w-full rounded-2xl py-4 text-base font-bold text-white transition opacity-95 hover:opacity-100 active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-5 shadow-xl shadow-black/40"
              >
                {isSubmitLoading ? "Saving Transaction..." : "Save Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Create New Category</h3>
              <button 
                onClick={() => setIsCatModalOpen(false)} 
                className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-zinc-800/60 active:scale-95 text-lg transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddCategory} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                  placeholder="e.g. Shopping, Utilities, Dining"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 cursor-pointer p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex-1 justify-center">
                    <input
                      type="radio"
                      name="catType"
                      checked={catType === "expense"}
                      onChange={() => setCatType("expense")}
                      className="accent-blue-500 h-4 w-4"
                    />
                    Expense
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 cursor-pointer p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex-1 justify-center">
                    <input
                      type="radio"
                      name="catType"
                      checked={catType === "income"}
                      onChange={() => setCatType("income")}
                      className="accent-blue-500 h-4 w-4"
                    />
                    Income
                  </label>
                </div>
              </div>

              {/* Grid of Emojis - Large and thumb-friendly */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Icon</label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 bg-zinc-950 p-3.5 rounded-2xl max-h-44 overflow-y-auto border border-zinc-850">
                  {CATEGORY_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCatSelectedEmoji(emoji)}
                      className={`h-11 w-11 flex items-center justify-center rounded-xl text-2xl transition active:scale-95 ${
                        catSelectedEmoji === emoji 
                          ? "bg-zinc-800 border-2 border-blue-500 shadow-md scale-105" 
                          : "hover:bg-zinc-900 border border-transparent"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Colors */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Color</label>
                <div className="flex gap-3 flex-wrap bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850 justify-around">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCatSelectedColor(color)}
                      className={`h-9 w-9 rounded-full border-2 transition active:scale-95 ${
                        catSelectedColor === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full rounded-2xl bg-blue-600 py-4 text-base font-bold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:bg-blue-800/50 cursor-pointer mt-5 shadow-xl shadow-blue-600/30"
              >
                {isSubmitLoading ? "Saving Category..." : "Add Category"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Account Creation Modal */}
      {isAccModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Create Wallet / Account</h3>
              <button 
                onClick={() => setIsAccModalOpen(false)} 
                className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-zinc-800/60 active:scale-95 text-lg transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddAccount} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                  placeholder="e.g. Standard Chartered, HBL, Cash"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3.5 text-base text-white outline-none focus:border-blue-500 transition shadow-inner"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="cash">Cash Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={accInitBalance}
                    onChange={(e) => setAccInitBalance(e.target.value)}
                    className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 transition shadow-inner"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:bg-indigo-800/50 cursor-pointer mt-5 shadow-xl shadow-indigo-600/30"
              >
                {isSubmitLoading ? "Creating Wallet..." : "Save Account"}
              </button>
            </form>
          </div>
        </div>
      )}

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
                  <button
                    type="button"
                    onClick={() => {
                      setCatPickerTarget("edit");
                      setCatSearchQuery("");
                      setIsCatPickerOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-sm font-semibold text-white outline-none hover:border-zinc-750 active:bg-zinc-900 transition cursor-pointer shadow-inner"
                  >
                    {(() => {
                      const currentCat = categories.find((c) => c._id === editCategory);
                      const { icon } = resolveCategory(currentCat);
                      return (
                        <span className="flex items-center gap-2.5 text-left truncate">
                          <span className="text-2xl">{icon}</span>
                          <span className="font-bold text-slate-200 truncate">{currentCat ? currentCat.name : "Select"}</span>
                        </span>
                      );
                    })()}
                    <span className="text-slate-400 text-xs">▼</span>
                  </button>
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
                  className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm sm:text-base font-bold text-rose-400 transition hover:bg-rose-500/20 active:scale-95 cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor }}
                  className="flex-1 rounded-2xl py-4 text-sm sm:text-base font-bold text-white transition opacity-95 hover:opacity-100 active:scale-[0.98] cursor-pointer shadow-xl shadow-black/40"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Selection Modal - Large, finger-friendly picker */}
      {isCatPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 px-5 py-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3.5 border-b border-zinc-800">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Select Category
              </h3>
              <button
                type="button"
                onClick={() => setIsCatPickerOpen(false)}
                className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-zinc-800/60 active:scale-95 text-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-3.5">
              <input
                type="text"
                value={catSearchQuery}
                onChange={(e) => setCatSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-white placeholder-slate-600 outline-none focus:border-blue-500 shadow-inner"
                placeholder="Search categories..."
              />
            </div>

            {/* Scrollable Categories List */}
            <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {(() => {
                const currentType = catPickerTarget === "add" ? activeType : editType;
                const filtered = categories
                  .filter((c) => c.type === currentType)
                  .filter((c) => c.name.toLowerCase().includes(catSearchQuery.toLowerCase()));

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-sm text-slate-500">
                      No categories found.
                    </div>
                  );
                }

                return filtered.map((c) => {
                  const { icon, color } = resolveCategory(c);
                  const isSelected = catPickerTarget === "add" ? txCategory === c._id : editCategory === c._id;
                  
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        if (catPickerTarget === "add") {
                          setTxCategory(c._id);
                        } else {
                          setEditCategory(c._id);
                        }
                        setIsCatPickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition active:scale-[0.98] cursor-pointer text-left min-h-[58px] ${
                        isSelected 
                          ? "bg-zinc-800 border-2 border-blue-500 shadow-md" 
                          : "hover:bg-zinc-800/60 active:bg-zinc-800/80 border border-zinc-850/80 bg-zinc-950/40"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-sm"
                          style={{ backgroundColor: color + "20", border: `1.5px solid ${color}40` }}
                        >
                          <span>{icon}</span>
                        </div>
                        <span className="text-sm sm:text-base font-bold text-white">{c.name}</span>
                      </div>
                      {isSelected && (
                        <span style={{ color: themeColor }} className="text-base font-extrabold pr-1">✓</span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Add Category Trigger Button */}
            <div className="mt-4 pt-3.5 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  const currentType = catPickerTarget === "add" ? activeType : editType;
                  setCatType(currentType);
                  setIsCatPickerOpen(false);
                  setIsCatModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 py-3.5 text-sm font-bold text-slate-200 hover:text-white hover:bg-zinc-850 active:scale-[0.98] transition cursor-pointer shadow-sm"
              >
                <span className="text-base">➕</span>
                <span>Create New Category</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
