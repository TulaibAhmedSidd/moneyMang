"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_CURRENCIES } from "@/shared";

export default function PortalSettings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setCurrency(u.preferredCurrency || "USD");
      setTimezone(u.timezone || "UTC");
    }
  };

  useEffect(() => {
    fetchUserData();
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

      // Update local storage
      const updatedUser = {
        ...user,
        preferredCurrency: currency,
        timezone: timezone,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setMessage("Settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile settings");
    } finally {
      setIsUpdating(false);
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
        <p className="text-sm text-slate-500 mt-1">Configure your portal preferences and session controls.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Form Settings */}
        <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 md:col-span-8">
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

            <button
              type="submit"
              disabled={isUpdating}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:bg-blue-800/50 cursor-pointer"
            >
              {isUpdating ? "Saving..." : "Save Preferences"}
            </button>
          </form>
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
