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

export default function PortalDashboard() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Offline & Synchronization states
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [themeColor, setThemeColor] = useState("#3b82f6");

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

  // Load Cached Data instantly for smooth PWA usability
  const loadCachedData = () => {
    try {
      const cachedAcc = localStorage.getItem("cached_accounts");
      const cachedCat = localStorage.getItem("cached_categories");
      const cachedTx = localStorage.getItem("cached_transactions");
      const cachedUser = localStorage.getItem("user");
      const savedAccent = localStorage.getItem("theme_accent");

      if (savedAccent) setThemeColor(savedAccent);
      if (cachedUser) setUser(JSON.parse(cachedUser));
      if (cachedAcc) setAccounts(JSON.parse(cachedAcc));
      if (cachedCat) setCategories(JSON.parse(cachedCat));
      if (cachedTx) setTransactions(JSON.parse(cachedTx));
      
      if (cachedAcc || cachedTx) {
        setIsLoading(false); // disable loader instantly
      }
    } catch (e) {
      console.error("Local storage load failed", e);
    }
  };

  // Sync Offline Queue (Categories & Transactions) to Backend
  const syncPendingTransactions = async () => {
    const pendingCatsStr = localStorage.getItem("pending_sync_categories");
    const pendingTxsStr = localStorage.getItem("pending_sync_transactions");

    const pendingCats = pendingCatsStr ? JSON.parse(pendingCatsStr) : [];
    const pendingTxs = pendingTxsStr ? JSON.parse(pendingTxsStr) : [];

    if (pendingCats.length === 0 && pendingTxs.length === 0) return;

    setIsSyncing(true);
    setSyncStatus("Syncing...");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const catIdMap: Record<string, string> = {};
      const remainingCats: any[] = [];

      // 1. Sync Categories
      for (const cat of pendingCats) {
        try {
          const res = await fetch("/api/v1/categories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: cat.name,
              type: cat.type,
              icon: cat.icon,
            }),
          });
          const json = await res.json();
          if (json.success && json.data?._id) {
            catIdMap[cat.tempId] = json.data._id;
          } else {
            remainingCats.push(cat);
          }
        } catch {
          remainingCats.push(cat);
        }
      }

      if (remainingCats.length === 0) {
        localStorage.removeItem("pending_sync_categories");
      } else {
        localStorage.setItem("pending_sync_categories", JSON.stringify(remainingCats));
      }

      // 2. Sync Transactions
      const remainingTxs: any[] = [];
      for (const tx of pendingTxs) {
        let catId = tx.categoryId;
        if (catId.startsWith("temp_cat_") && catIdMap[catId]) {
          catId = catIdMap[catId];
        }

        try {
          const res = await fetch("/api/v1/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...tx,
              categoryId: catId,
            }),
          });
          const json = await res.json();
          if (!json.success) {
            remainingTxs.push(tx);
          }
        } catch {
          remainingTxs.push(tx);
        }
      }

      if (remainingTxs.length === 0) {
        localStorage.removeItem("pending_sync_transactions");
      } else {
        localStorage.setItem("pending_sync_transactions", JSON.stringify(remainingTxs));
      }

      const totalRemaining = remainingCats.length + remainingTxs.length;
      if (totalRemaining === 0) {
        setSyncStatus("Synced");
        setTimeout(() => setSyncStatus(null), 2500);
      } else {
        setSyncStatus("Sync incomplete");
        setTimeout(() => setSyncStatus(null), 4000);
      }

      fetchData(false);
    } catch (e) {
      console.error("Sync failed", e);
      setSyncStatus("Offline");
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchData = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
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
      localStorage.setItem("cached_accounts", JSON.stringify(accountsList));

      // Fetch Categories
      const catRes = await fetch("/api/v1/categories", { headers });
      const catJson = await catRes.json();
      const categoriesList = catJson.data || [];
      setCategories(categoriesList);
      localStorage.setItem("cached_categories", JSON.stringify(categoriesList));

      // Fetch Transactions with Date filter
      const startStr = dateBounds.start.toISOString();
      const endStr = dateBounds.end.toISOString();
      const txRes = await fetch(`/api/v1/transactions?limit=100&startDate=${startStr}&endDate=${endStr}`, { headers });
      const txJson = await txRes.json();
      const transactionsList = txJson.data?.transactions || [];
      setTransactions(transactionsList);
      localStorage.setItem("cached_transactions", JSON.stringify(transactionsList));
      
      if (accountsList.length > 0) {
        setTxAccount(accountsList[0]._id);
      }
    } catch (err: any) {
      if (!navigator.onLine) {
        console.log("Running offline mode.");
      } else {
        setError(err?.message || "Failed to load portal metrics");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCachedData();
    fetchData(false);

    const updateTheme = () => {
      const savedAccent = localStorage.getItem("theme_accent");
      if (savedAccent) setThemeColor(savedAccent);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", syncPendingTransactions);
      window.addEventListener("theme-changed", updateTheme);
      
      if (navigator.onLine) {
        syncPendingTransactions();
      }
      
      return () => {
        window.removeEventListener("online", syncPendingTransactions);
        window.removeEventListener("theme-changed", updateTheme);
      };
    }
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
    setTxDate(getLocalYMD());
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

    const amountVal = parseFloat(txAmount);
    const minorAmount = Math.round(amountVal * 100);

    const selectedCat = categories.find((c) => c._id === txCategory);
    const selectedAcc = accounts.find((a) => a._id === txAccount);

    const tempTx = {
      _id: "temp_" + Date.now(),
      amount: minorAmount,
      type: activeType,
      title: txTitle,
      accountId: selectedAcc ? { _id: selectedAcc._id, name: selectedAcc.name } : txAccount,
      categoryId: selectedCat ? { _id: selectedCat._id, name: selectedCat.name, icon: selectedCat.icon } : txCategory,
      description: txDescription,
      date: getISODateWithLocalTime(txDate),
      currency: user?.preferredCurrency || "USD",
      isPendingSync: true,
    };

    // Optimistic UI updates instantly!
    setTransactions((prev) => [tempTx, ...prev]);
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc._id === txAccount) {
          const diff = activeType === "income" ? minorAmount : -minorAmount;
          return { ...acc, balance: (acc.balance ?? 0) + diff };
        }
        return acc;
      })
    );
    setIsModalOpen(false);

    // Save transaction to offline queue for background sync
    try {
      const pendingQueue = JSON.parse(localStorage.getItem("pending_sync_transactions") || "[]");
      pendingQueue.push({
        amount: minorAmount,
        type: activeType,
        title: txTitle,
        accountId: txAccount,
        categoryId: txCategory,
        description: txDescription,
        date: getISODateWithLocalTime(txDate),
        currency: user?.preferredCurrency || "USD",
      });
      localStorage.setItem("pending_sync_transactions", JSON.stringify(pendingQueue));
      
      setSyncStatus("Saving...");
      syncPendingTransactions(); // Trigger background sync immediately!
    } catch (err) {
      console.error("Local caching failed", err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert("Please enter a category name");
      return;
    }

    const tempId = "temp_cat_" + Date.now();
    const formattedIcon = `${catSelectedEmoji}|${catSelectedColor}`;

    const tempCat = {
      _id: tempId,
      name: catName.trim(),
      type: catType,
      icon: formattedIcon,
      isSystem: false,
      isArchived: false,
    };

    // Optimistically update categories and select it instantly!
    setCategories((prev) => [...prev, tempCat]);
    setTxCategory(tempId);
    setIsCatModalOpen(false);
    setCatName("");

    // Save category to offline queue for background sync
    try {
      const pendingQueue = JSON.parse(localStorage.getItem("pending_sync_categories") || "[]");
      pendingQueue.push({
        tempId,
        name: catName.trim(),
        type: catType,
        icon: formattedIcon,
      });
      localStorage.setItem("pending_sync_categories", JSON.stringify(pendingQueue));

      setSyncStatus("Saving...");
      syncPendingTransactions(); // Trigger background sync immediately!
    } catch (err) {
      console.error("Local category caching failed", err);
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
                timeframe === t ? "text-white" : "text-slate-500 hover:text-white"
              }`}
              style={timeframe === t ? { backgroundColor: themeColor } : {}}
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
                    {categories.filter((c) => c.type === activeType).map((c) => {
                      const { icon } = resolveCategory(c);
                      return (
                        <option key={c._id} value={c._id}>
                          {icon} {c.name}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setCatType(activeType);
                      setIsCatModalOpen(true);
                    }}
                    style={{ color: themeColor }}
                    className="mt-1.5 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:opacity-80"
                  >
                    ➕ Create Category
                  </button>
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
                style={{ backgroundColor: themeColor }}
                className="w-full rounded-xl py-3 text-xs font-bold text-white transition opacity-90 hover:opacity-100 disabled:opacity-50 cursor-pointer mt-4"
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
