"use client";

import React, { useEffect, useState } from "react";
import { formatMoney } from "@money/shared";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalTransactions: number;
  globalVolume: number;
  latestTransactions: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch("/api/v1/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        } else {
          setError(json.message || "Failed to load admin stats");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  const activePercent = stats
    ? ((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(0)
    : "0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of user metrics and transaction distributions across the platform.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Total Users</div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-gray-900">{stats?.totalUsers}</div>
            <div className="text-xs text-gray-400">All registered users</div>
          </div>
        </div>

        {/* Active Users */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Active Users</div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-gray-900">{stats?.activeUsers}</div>
            <div className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
              {activePercent}%
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Total Transactions</div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-gray-900">{stats?.totalTransactions}</div>
            <div className="text-xs text-gray-400">Created transactions</div>
          </div>
        </div>

        {/* Global Volume */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Global Volume</div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-gray-900 truncate">
              {formatMoney(stats?.globalVolume || 0, "USD")}
            </div>
            <div className="text-xs text-gray-400">Normalized equivalent</div>
          </div>
        </div>
      </div>

      {/* Latest Transactions Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Recent System Activities</h3>
          <p className="mt-1 text-xs text-gray-500">List of latest transactions submitted by users.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {stats?.latestTransactions.map((tx: any) => {
                const isIncome = tx.type === "income";
                return (
                  <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{tx.userId?.name || "Deleted User"}</div>
                      <div className="text-xs text-gray-500">{tx.userId?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{tx.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{tx.categoryId?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isIncome ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {isIncome ? "+" : "-"} {formatMoney(tx.amount, tx.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(tx.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
              {(!stats?.latestTransactions || stats.latestTransactions.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    No transactions recorded in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
