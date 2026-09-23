"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatMoney } from "@/shared";

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#84cc16", // Lime
];

import { usePortalData } from "@/context/PortalDataContext";

export default function AnalyticsDashboard() {
  const { analyticsData, fetchAnalyticsData, user: contextUser } = usePortalData();
  const [data, setData] = useState<any>(analyticsData || null);
  const [user, setUser] = useState<any>(contextUser || null);
  const [isLoading, setIsLoading] = useState(!analyticsData);
  const [error, setError] = useState<string | null>(null);

  // Timeframe selector states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAnalytics = async (start = "", end = "") => {
    if (!data) setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAnalyticsData(start, end);
      if (res) {
        setData(res);
      } else {
        setError("Failed to load analytics data");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (analyticsData) {
      setData(analyticsData);
    }
    if (contextUser) {
      setUser(contextUser);
    }
  }, [analyticsData, contextUser]);

  useEffect(() => {
    // Default: current month bounds
    const now = new Date();
    const startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setStartDate(startStr);
    setEndDate(endStr);
    fetchAnalytics(startStr, endStr);
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(startDate, endDate);
  };

  // Donut SVG Calculations
  const donutData = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.map((cat: any, index: number) => ({
      name: cat.name,
      amount: cat.amount,
      color: COLORS[index % COLORS.length],
      count: cat.count,
    }));
  }, [data]);

  const totalExpense = useMemo(() => {
    return donutData.reduce((sum: number, item: any) => sum + item.amount, 0);
  }, [donutData]);

  // Donut chart SVG values
  const radius = 60;
  const strokeWidth = 14;
  const size = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  // Trend Chart Calculations
  const trendMax = useMemo(() => {
    if (!data?.trends || data.trends.length === 0) return 1000;
    return Math.max(
      ...data.trends.map((t: any) => Math.max(t.income, t.expense)),
      1000
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Visual Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Review breakdown charts and performance statistics.</p>
        </div>

        {/* Date Filter */}
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-2 items-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-2 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white outline-none"
          />
          <span className="text-slate-600 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white outline-none"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer">
            Filter
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Grid of Donut Breakdowns and Comparison */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Category Share (Donut Card) */}
        <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 md:col-span-7 flex flex-col sm:flex-row items-center justify-around gap-6">
          <div className="relative flex justify-center items-center h-44 w-44">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
              {/* Background Track Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#1e293b"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Segments */}
              {donutData.map((item: any, index: number) => {
                const percentage = totalExpense > 0 ? item.amount / totalExpense : 0;
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
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Cost</span>
              <span className="text-xl font-extrabold text-white mt-1">
                {formatMoney(totalExpense, user?.preferredCurrency || "USD")}
              </span>
            </div>
          </div>

          {/* List Legends */}
          <div className="flex-1 space-y-3 w-full sm:w-auto">
            <h4 className="text-sm font-bold text-white pb-2 border-b border-zinc-850">Categories Breakdown</h4>
            {donutData.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No data logged.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {donutData.map((item: any) => {
                  const percent = totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(0) : "0";
                  return (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 font-semibold">{item.name}</span>
                      </div>
                      <span className="text-slate-400">
                        {percent}% • <strong className="text-white">{formatMoney(item.amount, user?.preferredCurrency || "USD")}</strong>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Period comparison Card */}
        <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 md:col-span-5 flex flex-col justify-between gap-6">
          <div>
            <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-500">Period Comparison</h4>
            <h3 className="text-xl font-bold text-white mt-1">Expense Performance</h3>
            <p className="text-xs text-slate-400 mt-2">Comparison with the equivalent preceding timeframe.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b border-zinc-900 pb-2">
              <span className="text-slate-400">Current Period</span>
              <span className="font-bold text-white">{formatMoney(data?.comparison?.currentPeriodTotal || 0, user?.preferredCurrency || "USD")}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-zinc-900 pb-2">
              <span className="text-slate-400">Previous Period</span>
              <span className="font-semibold text-slate-300">{formatMoney(data?.comparison?.previousPeriodTotal || 0, user?.preferredCurrency || "USD")}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Percentage Shift</span>
              <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ${
                (data?.comparison?.percentageChange || 0) <= 0 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "bg-rose-500/10 text-rose-400"
              }`}>
                {(data?.comparison?.percentageChange || 0) <= 0 ? "⬇️" : "⬆️"} {Math.abs(data?.comparison?.percentageChange || 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly/Daily Trend bar chart */}
      <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white">Daily Spending & Income Trends</h3>
          <p className="text-xs text-slate-500 mt-1">Visual bars showing daily cash flow distribution in the selected period.</p>
        </div>

        {!data?.trends || data.trends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
            <span>📈</span>
            <p className="text-xs italic mt-2">No trend logs recorded.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SVG Bars container */}
            <div className="h-44 w-full flex items-end gap-2 border-b border-zinc-800 pb-2">
              {data.trends.map((item: any, idx: number) => {
                const incomePercent = `${(item.income / trendMax) * 100}%`;
                const expensePercent = `${(item.expense / trendMax) * 100}%`;
                
                const labelDate = new Date(item.date).toLocaleDateString(undefined, { day: "numeric" });

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center bg-zinc-900 border border-zinc-850 p-2 rounded-xl text-[10px] text-white z-10 w-24">
                      <p className="text-emerald-400 font-bold">In: {formatMoney(item.income, user?.preferredCurrency || "USD")}</p>
                      <p className="text-rose-400 font-bold mt-0.5">Out: {formatMoney(item.expense, user?.preferredCurrency || "USD")}</p>
                    </div>

                    {/* Bars stacked/side-by-side */}
                    <div className="flex gap-0.5 items-end w-full h-full max-w-[20px]">
                      {/* Income Bar */}
                      <div
                        className="flex-1 bg-emerald-500 rounded-t"
                        style={{ height: incomePercent }}
                        title={`Income: ${item.income}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="flex-1 bg-rose-500 rounded-t"
                        style={{ height: expensePercent }}
                        title={`Expense: ${item.expense}`}
                      />
                    </div>
                    {/* X Axis Label */}
                    <span className="text-[10px] text-slate-500 mt-2">{labelDate}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Legend indicators */}
            <div className="flex gap-4 justify-center text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-md bg-emerald-500" />
                <span className="text-slate-400">Income Inflow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-md bg-rose-500" />
                <span className="text-slate-400">Expense Outflow</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
