"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { formatMoney } from "@/shared";

export interface AccountItem {
  _id: string;
  name: string;
  type: string;
  currency: string;
  initialBalance: number;
  balance: number;
  isActive: boolean;
}

export interface CategoryItem {
  _id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  isSystem: boolean;
  isArchived: boolean;
}

export interface TransactionItem {
  _id: string;
  amount: number; // minor units
  type: "income" | "expense";
  title: string;
  accountId: any;
  categoryId: any;
  description?: string;
  date: string;
  currency: string;
  isPendingSync?: boolean;
}

interface PortalDataContextType {
  user: any;
  setUser: (user: any) => void;
  accounts: AccountItem[];
  categories: CategoryItem[];
  transactions: TransactionItem[];
  themeColor: string;
  setThemeColor: (color: string) => void;
  syncStatus: string | null;
  isSyncing: boolean;
  isLoading: boolean;
  
  // Data actions (Optimistic local-first + silent cloud sync)
  addTransaction: (txData: {
    amount: number;
    type: "income" | "expense";
    title: string;
    accountId: string;
    categoryId: string;
    description?: string;
    date: string;
    currency: string;
  }) => Promise<void>;

  updateTransaction: (
    id: string,
    updates: {
      amount: number;
      type: "income" | "expense";
      title: string;
      accountId: string;
      categoryId: string;
      description?: string;
      date: string;
      currency?: string;
    }
  ) => Promise<void>;

  deleteTransaction: (id: string) => Promise<void>;

  addCategory: (catData: {
    name: string;
    type: "income" | "expense";
    icon: string;
  }) => Promise<CategoryItem>;

  addAccount: (accData: {
    name: string;
    type: string;
    currency: string;
    initialBalance: number;
  }) => Promise<void>;

  // Data fetching & prefetching
  refreshAllData: (force?: boolean) => Promise<void>;
  prefetchTab: (tab: "dashboard" | "transactions" | "analytics" | "calendar" | "settings") => void;
  
  // Analytics cached data
  analyticsData: any;
  fetchAnalyticsData: (startDate?: string, endDate?: string) => Promise<any>;
}

const PortalDataContext = createContext<PortalDataContextType | null>(null);

// Broadcast channel for instantaneous cross-tab synchronization
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    syncChannel = new BroadcastChannel("moneymanage_portal_sync");
  } catch (e) {
    console.warn("BroadcastChannel not supported", e);
  }
}

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  const [themeColor, setThemeColor] = useState("#3b82f6");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSyncingRef = useRef(false);
  const prefetchedTabs = useRef<Set<string>>(new Set());

  // 1. Initial Instant Cache Hydration (0ms load time)
  const hydrateFromCache = useCallback(() => {
    try {
      const cachedUser = localStorage.getItem("user");
      const cachedAcc = localStorage.getItem("cached_accounts");
      const cachedCat = localStorage.getItem("cached_categories");
      const cachedTx = localStorage.getItem("cached_transactions");
      const cachedAnalytics = localStorage.getItem("cached_analytics");
      const savedAccent = localStorage.getItem("theme_accent");

      if (savedAccent) setThemeColor(savedAccent);
      if (cachedUser) setUser(JSON.parse(cachedUser));
      if (cachedAcc) setAccounts(JSON.parse(cachedAcc));
      if (cachedCat) setCategories(JSON.parse(cachedCat));
      if (cachedTx) setTransactions(JSON.parse(cachedTx));
      if (cachedAnalytics) setAnalyticsData(JSON.parse(cachedAnalytics));

      if (cachedAcc || cachedTx) {
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Hydration from cache failed", e);
    }
  }, []);

  // 2. Fetch fresh data in background (Stale-While-Revalidate)
  const refreshAllData = useCallback(async (force = false) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Parallel background revalidation
      const [accRes, catRes, txRes] = await Promise.all([
        fetch("/api/v1/accounts", { headers }).catch(() => null),
        fetch("/api/v1/categories", { headers }).catch(() => null),
        fetch("/api/v1/transactions?limit=100", { headers }).catch(() => null),
      ]);

      if (accRes && accRes.ok) {
        const accJson = await accRes.json();
        if (accJson.success && Array.isArray(accJson.data)) {
          setAccounts(accJson.data);
          localStorage.setItem("cached_accounts", JSON.stringify(accJson.data));
        }
      }

      if (catRes && catRes.ok) {
        const catJson = await catRes.json();
        if (catJson.success && Array.isArray(catJson.data)) {
          setCategories(catJson.data);
          localStorage.setItem("cached_categories", JSON.stringify(catJson.data));
        }
      }

      if (txRes && txRes.ok) {
        const txJson = await txRes.json();
        if (txJson.success && Array.isArray(txJson.data?.transactions)) {
          setTransactions(txJson.data.transactions);
          localStorage.setItem("cached_transactions", JSON.stringify(txJson.data.transactions));
        }
      }
    } catch (err) {
      console.warn("Background revalidation failed (offline mode):", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Tab Prefetching Engine (Primes cache before user clicks)
  const prefetchTab = useCallback((tab: "dashboard" | "transactions" | "analytics" | "calendar" | "settings") => {
    if (prefetchedTabs.current.has(tab)) return;
    prefetchedTabs.current.add(tab);

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (tab === "analytics") {
      fetch("/api/v1/analytics/spending", { headers })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setAnalyticsData(json.data);
            localStorage.setItem("cached_analytics", JSON.stringify(json.data));
          }
        })
        .catch(() => {});
    } else if (tab === "transactions") {
      fetch("/api/v1/transactions?limit=50&offset=0", { headers })
        .then((res) => res.json())
        .catch(() => {});
    }
  }, []);

  // 4. Offline Queue & Background Sync
  const processSyncQueue = useCallback(async (silent = true) => {
    if (isSyncingRef.current) return;
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const pendingCatsStr = localStorage.getItem("pending_sync_categories");
    const pendingTxsStr = localStorage.getItem("pending_sync_transactions");
    const pendingEditsStr = localStorage.getItem("pending_edit_transactions");
    const pendingDeletesStr = localStorage.getItem("pending_delete_transactions");

    const pendingCats = pendingCatsStr ? JSON.parse(pendingCatsStr) : [];
    const pendingTxs = pendingTxsStr ? JSON.parse(pendingTxsStr) : [];
    const pendingEdits = pendingEditsStr ? JSON.parse(pendingEditsStr) : [];
    const pendingDeletes = pendingDeletesStr ? JSON.parse(pendingDeletesStr) : [];

    if (
      pendingCats.length === 0 &&
      pendingTxs.length === 0 &&
      pendingEdits.length === 0 &&
      pendingDeletes.length === 0
    ) {
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    if (!silent) setSyncStatus("Syncing...");

    try {
      const catIdMap: Record<string, string> = {};
      const remainingCats: any[] = [];

      // A. Sync Categories
      for (const cat of pendingCats) {
        try {
          const res = await fetch("/api/v1/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: cat.name, type: cat.type, icon: cat.icon }),
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
      if (remainingCats.length === 0) localStorage.removeItem("pending_sync_categories");
      else localStorage.setItem("pending_sync_categories", JSON.stringify(remainingCats));

      // B. Sync New Transactions
      const remainingTxs: any[] = [];
      for (const tx of pendingTxs) {
        let catId = tx.categoryId;
        if (typeof catId === "string" && catId.startsWith("temp_cat_") && catIdMap[catId]) {
          catId = catIdMap[catId];
        }
        try {
          const res = await fetch("/api/v1/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...tx, categoryId: catId }),
          });
          const json = await res.json();
          if (!json.success) remainingTxs.push(tx);
        } catch {
          remainingTxs.push(tx);
        }
      }
      if (remainingTxs.length === 0) localStorage.removeItem("pending_sync_transactions");
      else localStorage.setItem("pending_sync_transactions", JSON.stringify(remainingTxs));

      // C. Sync Edits
      const remainingEdits: any[] = [];
      for (const edit of pendingEdits) {
        if (edit._id.startsWith("temp_")) continue;
        try {
          const res = await fetch(`/api/v1/transactions/${edit._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(edit),
          });
          const json = await res.json();
          if (!json.success) remainingEdits.push(edit);
        } catch {
          remainingEdits.push(edit);
        }
      }
      if (remainingEdits.length === 0) localStorage.removeItem("pending_edit_transactions");
      else localStorage.setItem("pending_edit_transactions", JSON.stringify(remainingEdits));

      // D. Sync Deletes
      const remainingDeletes: any[] = [];
      for (const id of pendingDeletes) {
        if (id.startsWith("temp_")) continue;
        try {
          const res = await fetch(`/api/v1/transactions/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (!json.success) remainingDeletes.push(id);
        } catch {
          remainingDeletes.push(id);
        }
      }
      if (remainingDeletes.length === 0) localStorage.removeItem("pending_delete_transactions");
      else localStorage.setItem("pending_delete_transactions", JSON.stringify(remainingDeletes));

      const totalLeft = remainingCats.length + remainingTxs.length + remainingEdits.length + remainingDeletes.length;
      if (totalLeft === 0) {
        if (!silent) {
          setSyncStatus("Synced");
          setTimeout(() => setSyncStatus(null), 2500);
        } else {
          setSyncStatus(null);
        }
      }

      // Revalidate in background to align with cloud DB state
      refreshAllData(false);
    } catch (e) {
      console.error("Queue sync error:", e);
      setSyncStatus("Offline");
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshAllData]);

  // Broadcast change across tabs
  const broadcastSync = useCallback((action: string, payload?: any) => {
    if (syncChannel) {
      try {
        syncChannel.postMessage({ action, payload, timestamp: Date.now() });
      } catch (e) {
        console.warn("Broadcast postMessage error:", e);
      }
    }
  }, []);

  // 5. Optimistic Local-First Mutations
  const addTransaction = useCallback(
    async (txData: {
      amount: number;
      type: "income" | "expense";
      title: string;
      accountId: string;
      categoryId: string;
      description?: string;
      date: string;
      currency: string;
    }) => {
      const selectedAcc = accounts.find((a) => a._id === txData.accountId);
      const selectedCat = categories.find((c) => c._id === txData.categoryId);

      const tempTx: TransactionItem = {
        _id: "temp_" + Date.now(),
        amount: txData.amount,
        type: txData.type,
        title: txData.title,
        accountId: selectedAcc ? { _id: selectedAcc._id, name: selectedAcc.name } : txData.accountId,
        categoryId: selectedCat
          ? { _id: selectedCat._id, name: selectedCat.name, icon: selectedCat.icon }
          : txData.categoryId,
        description: txData.description,
        date: txData.date,
        currency: txData.currency,
        isPendingSync: true,
      };

      // 0ms Optimistic Update: Update transaction list & recalculate balance immediately
      setTransactions((prev) => {
        const next = [tempTx, ...prev];
        localStorage.setItem("cached_transactions", JSON.stringify(next));
        return next;
      });

      setAccounts((prev) => {
        const diff = txData.type === "income" ? txData.amount : -txData.amount;
        const next = prev.map((acc) =>
          acc._id === txData.accountId ? { ...acc, balance: (acc.balance ?? 0) + diff } : acc
        );
        localStorage.setItem("cached_accounts", JSON.stringify(next));
        return next;
      });

      // Queue for background sync
      try {
        const queue = JSON.parse(localStorage.getItem("pending_sync_transactions") || "[]");
        queue.push({
          amount: txData.amount,
          type: txData.type,
          title: txData.title,
          accountId: txData.accountId,
          categoryId: txData.categoryId,
          description: txData.description,
          date: txData.date,
          currency: txData.currency,
        });
        localStorage.setItem("pending_sync_transactions", JSON.stringify(queue));
      } catch (err) {
        console.error("Local queue failed", err);
      }

      broadcastSync("transaction_added", tempTx);
      // Trigger silent background sync immediately
      processSyncQueue(true);
    },
    [accounts, categories, broadcastSync, processSyncQueue]
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      updates: {
        amount: number;
        type: "income" | "expense";
        title: string;
        accountId: string;
        categoryId: string;
        description?: string;
        date: string;
        currency?: string;
      }
    ) => {
      const oldTx = transactions.find((t) => t._id === id);
      if (!oldTx) return;

      const selectedAcc = accounts.find((a) => a._id === updates.accountId);
      const selectedCat = categories.find((c) => c._id === updates.categoryId);

      const updatedTx: TransactionItem = {
        ...oldTx,
        title: updates.title,
        amount: updates.amount,
        accountId: selectedAcc ? { _id: selectedAcc._id, name: selectedAcc.name } : updates.accountId,
        categoryId: selectedCat
          ? { _id: selectedCat._id, name: selectedCat.name, icon: selectedCat.icon }
          : updates.categoryId,
        description: updates.description,
        date: updates.date,
        type: updates.type,
      };

      // Recalculate balances optimistically
      const oldMinor = oldTx.amount;
      const oldType = oldTx.type;
      const oldAccId = typeof oldTx.accountId === "object" ? oldTx.accountId?._id : oldTx.accountId;

      setAccounts((prev) => {
        const next = prev.map((acc) => {
          let bal = acc.balance ?? 0;
          if (acc._id === oldAccId) {
            const oldDiff = oldType === "income" ? -oldMinor : oldMinor;
            bal += oldDiff;
          }
          if (acc._id === updates.accountId) {
            const newDiff = updates.type === "income" ? updates.amount : -updates.amount;
            bal += newDiff;
          }
          return { ...acc, balance: bal };
        });
        localStorage.setItem("cached_accounts", JSON.stringify(next));
        return next;
      });

      setTransactions((prev) => {
        const next = prev.map((t) => (t._id === id ? updatedTx : t));
        localStorage.setItem("cached_transactions", JSON.stringify(next));
        return next;
      });

      // Queue for background edit
      try {
        const pendingEdits = JSON.parse(localStorage.getItem("pending_edit_transactions") || "[]");
        pendingEdits.push({
          _id: id,
          amount: updates.amount,
          type: updates.type,
          title: updates.title,
          accountId: updates.accountId,
          categoryId: updates.categoryId,
          description: updates.description,
          date: updates.date,
          currency: updates.currency || oldTx.currency,
        });
        localStorage.setItem("pending_edit_transactions", JSON.stringify(pendingEdits));
      } catch (err) {
        console.error("Local edit queue failed", err);
      }

      broadcastSync("transaction_updated", updatedTx);
      processSyncQueue(true);
    },
    [transactions, accounts, categories, broadcastSync, processSyncQueue]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const oldTx = transactions.find((t) => t._id === id);
      if (!oldTx) return;

      const minorAmount = oldTx.amount;
      const oldAccId = typeof oldTx.accountId === "object" ? oldTx.accountId?._id : oldTx.accountId;
      const oldType = oldTx.type;

      // Optimistically restore account balance
      setAccounts((prev) => {
        const next = prev.map((acc) => {
          if (acc._id === oldAccId) {
            const diff = oldType === "income" ? -minorAmount : minorAmount;
            return { ...acc, balance: (acc.balance ?? 0) + diff };
          }
          return acc;
        });
        localStorage.setItem("cached_accounts", JSON.stringify(next));
        return next;
      });

      // Optimistically remove from list
      setTransactions((prev) => {
        const next = prev.filter((t) => t._id !== id);
        localStorage.setItem("cached_transactions", JSON.stringify(next));
        return next;
      });

      // Queue for delete
      try {
        const pendingDeletes = JSON.parse(localStorage.getItem("pending_delete_transactions") || "[]");
        pendingDeletes.push(id);
        localStorage.setItem("pending_delete_transactions", JSON.stringify(pendingDeletes));
      } catch (err) {
        console.error("Local delete queue failed", err);
      }

      broadcastSync("transaction_deleted", id);
      processSyncQueue(true);
    },
    [transactions, broadcastSync, processSyncQueue]
  );

  const addCategory = useCallback(
    async (catData: { name: string; type: "income" | "expense"; icon: string }) => {
      const tempId = "temp_cat_" + Date.now();
      const newCat: CategoryItem = {
        _id: tempId,
        name: catData.name.trim(),
        type: catData.type,
        icon: catData.icon,
        isSystem: false,
        isArchived: false,
      };

      setCategories((prev) => {
        const next = [...prev, newCat];
        localStorage.setItem("cached_categories", JSON.stringify(next));
        return next;
      });

      try {
        const queue = JSON.parse(localStorage.getItem("pending_sync_categories") || "[]");
        queue.push({
          tempId,
          name: catData.name.trim(),
          type: catData.type,
          icon: catData.icon,
        });
        localStorage.setItem("pending_sync_categories", JSON.stringify(queue));
      } catch (e) {
        console.error("Category cache failed", e);
      }

      broadcastSync("category_added", newCat);
      processSyncQueue(true);
      return newCat;
    },
    [broadcastSync, processSyncQueue]
  );

  const addAccount = useCallback(
    async (accData: { name: string; type: string; currency: string; initialBalance: number }) => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch("/api/v1/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(accData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to create account");

      const created = json.data;
      setAccounts((prev) => {
        const next = [created, ...prev];
        localStorage.setItem("cached_accounts", JSON.stringify(next));
        return next;
      });
      broadcastSync("account_added", created);
    },
    [broadcastSync]
  );

  const fetchAnalyticsData = useCallback(async (startDate?: string, endDate?: string) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return null;

    let url = "/api/v1/analytics/spending";
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += `?${params.join("&")}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) {
      setAnalyticsData(json.data);
      localStorage.setItem("cached_analytics", JSON.stringify(json.data));
      return json.data;
    }
    return null;
  }, []);

  // 6. Cross-Tab Communication Listeners
  useEffect(() => {
    hydrateFromCache();
    refreshAllData(false);

    // Broadcast channel listener
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        const { action } = event.data;
        if (action.startsWith("transaction_") || action.startsWith("category_") || action.startsWith("account_")) {
          // Re-hydrate local caches from storage updated by the other tab
          hydrateFromCache();
        }
      };
    }

    // Storage event listener for fallback cross-window sync
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === "cached_transactions" ||
        e.key === "cached_accounts" ||
        e.key === "cached_categories" ||
        e.key === "theme_accent"
      ) {
        hydrateFromCache();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Online event listener to trigger sync queue
    const handleOnline = () => {
      setSyncStatus("Online, syncing...");
      processSyncQueue(false);
    };
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("online", handleOnline);
    };
  }, [hydrateFromCache, refreshAllData, processSyncQueue]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      accounts,
      categories,
      transactions,
      themeColor,
      setThemeColor,
      syncStatus,
      isSyncing,
      isLoading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      addAccount,
      refreshAllData,
      prefetchTab,
      analyticsData,
      fetchAnalyticsData,
    }),
    [
      user,
      accounts,
      categories,
      transactions,
      themeColor,
      syncStatus,
      isSyncing,
      isLoading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      addAccount,
      refreshAllData,
      prefetchTab,
      analyticsData,
      fetchAnalyticsData,
    ]
  );

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) {
    throw new Error("usePortalData must be used within a PortalDataProvider");
  }
  return context;
}
