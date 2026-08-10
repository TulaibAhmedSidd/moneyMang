"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_CURRENCIES } from "@/shared";

const ACCENT_COLORS = [
  { name: "Blue", hex: "#3b82f6" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Rose", hex: "#ec4899" },
  { name: "Amber", hex: "#f59e0b" },
];

export default function PortalSettings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");
  const [accent, setAccent] = useState("#3b82f6");
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Excel Export States
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const fetchUserData = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setCurrency(u.preferredCurrency || "USD");
      setTimezone(u.timezone || "UTC");
    }
    const savedAccent = localStorage.getItem("theme_accent");
    if (savedAccent) {
      setAccent(savedAccent);
    }
  };

  useEffect(() => {
    fetchUserData();

    // Default export range to current month
    const now = new Date();
    const startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setExportStart(startStr);
    setExportEnd(endStr);
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const response = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferredCurrency: currency,
          timezone: timezone,
        }),
      });

      const res = await response.json();
      if (!res.success) {
        setError(res.message || "Failed to update profile settings");
        return;
      }

      // Save accent color to local storage
      localStorage.setItem("theme_accent", accent);

      // Update local storage user config
      const updatedUser = {
        ...user,
        preferredCurrency: currency,
        timezone: timezone,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Trigger custom event to notify layout/other parts that theme changed
      window.dispatchEvent(new Event("theme-changed"));
      
      setMessage("Settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportStart || !exportEnd) {
      alert("Please select both start and end dates");
      return;
    }

    setIsExporting(true);
    setExportMsg(null);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      // Calculate UTC ISO strings for filter
      const startISO = new Date(exportStart + "T00:00:00").toISOString();
      const endISO = new Date(exportEnd + "T23:59:59").toISOString();

      const response = await fetch(`/api/v1/transactions?limit=1000&startDate=${startISO}&endDate=${endISO}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Failed to fetch transactions for export");
        return;
      }

      const txs = result.data?.transactions || [];
      if (txs.length === 0) {
        setExportMsg("No transactions found in this date range.");
        setIsExporting(false);
        return;
      }

      // Format CSV headers
      const headers = ["Date", "Title", "Type", "Category", "Wallet Account", "Amount", "Currency", "Description"];
      
      // Escape CSV strings
      const escapeCsv = (str: string) => {
        if (!str) return '""';
        return `"${str.replace(/"/g, '""')}"`;
      };

      const rows = txs.map((tx: any) => {
        const txDateStr = new Date(tx.date).toLocaleDateString();
        const catName = tx.categoryId?.name || "Uncategorized";
        const accName = tx.accountId?.name || "Default Wallet";
        const amountVal = (tx.amount / 100).toFixed(2);
        
        return [
          escapeCsv(txDateStr),
          escapeCsv(tx.title),
          escapeCsv(tx.type),
          escapeCsv(catName),
          escapeCsv(accName),
          amountVal,
          escapeCsv(tx.currency),
          escapeCsv(tx.description || ""),
        ].join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(",")].concat(rows).join("\n"); // prepended BOM for Excel unicode support
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Trigger Browser download
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `MoneyManage_Export_${exportStart}_to_${exportEnd}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMsg(`✅ Successfully exported ${txs.length} transactions to Excel!`);
    } catch (err: any) {
      alert(err.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    router.replace("/portal/login");
  };

  const timezones = [
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Karachi",
    "Asia/Dubai",
    "Asia/Riyadh",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Asia/Shanghai",
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your portal preferences, theme customization, and data export.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Form Settings */}
        <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 md:col-span-8 space-y-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <h3 className="text-lg font-bold text-white pb-3 border-b border-zinc-850">Portal Preferences</h3>

            {message && (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Preferred Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accent Theme Customizer */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">Accent Theme Color</label>
              <div className="flex gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-900 justify-start">
                {ACCENT_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setAccent(col.hex)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        accent === col.hex ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col.hex, boxShadow: accent === col.hex ? `0 0 12px ${col.hex}60` : "none" }}
                    />
                    <span className="text-[10px] text-slate-500 font-semibold group-hover:text-slate-300">{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:bg-blue-800/50 cursor-pointer"
            >
              {isUpdating ? "Saving..." : "Save Preferences"}
            </button>
          </form>

          {/* Export to Excel (CSV) Form */}
          <div className="pt-6 border-t border-zinc-850 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Data Export</h3>
              <p className="text-xs text-slate-500 mt-1">Export transaction audits directly to a CSV file (compatible with Excel/Sheets).</p>
            </div>

            <form onSubmit={handleExport} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    required
                    value={exportStart}
                    onChange={(e) => setExportStart(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    required
                    value={exportEnd}
                    onChange={(e) => setExportEnd(e.target.value)}
                    className="mt-1.5 block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {exportMsg && (
                <div className="rounded-xl bg-zinc-950 p-3 text-xs text-slate-300 border border-zinc-900">
                  {exportMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-xs font-bold text-slate-300 transition hover:border-zinc-700 hover:text-white cursor-pointer disabled:opacity-50"
              >
                {isExporting ? "Exporting..." : "📥 Export to Excel (CSV)"}
              </button>
            </form>
          </div>
        </div>

        {/* Profile Session controls */}
        <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 md:col-span-4 flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white">Active Session</h3>
            <p className="text-xs text-slate-500 mt-1">Logged in as {user?.name}</p>
          </div>

          <div className="space-y-4">
            <div className="text-xs text-slate-400 bg-zinc-950 p-4 border border-zinc-850 rounded-2xl leading-relaxed">
              If you log out, you will have to enter your email and password again to authorize portal actions.
            </div>
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl bg-rose-500/10 border border-rose-500/20 py-3 text-sm font-bold text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
            >
              Log Out Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
