"use client";

import React, { useState, useMemo, useEffect } from "react";
import { formatMoney } from "@/shared";

export default function FinancialCalendar() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      // Fetch all transactions for the current year/month
      const response = await fetch("/api/v1/transactions?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setTransactions(result.data?.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const preferredCurrency = user?.preferredCurrency || "USD";

  // Month navigation helper
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  // Calendar Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

    // Pad previous month ending days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      days.push({
        day: dayNum,
        isCurrentMonth: false,
        date: new Date(year, month - 1, dayNum),
      });
    }

    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Pad next month starting days to make it a full grid of weeks (multiple of 7)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [year, month, firstDayIndex, totalDays, prevMonthTotalDays]);

  // Group transactions by date string YYYY-MM-DD (local client timezone)
  const transactionsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, "0");
      const dStr = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yStr}-${mStr}-${dStr}`;
      
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(tx);
    });
    return map;
  }, [transactions]);

  // Selected Day Transactions
  const selectedDateStr = useMemo(() => {
    if (selectedDay === null) return "";
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${year}-${pad(month + 1)}-${pad(selectedDay)}`;
  }, [year, month, selectedDay]);

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDateStr) return [];
    return transactionsByDate[selectedDateStr] || [];
  }, [selectedDateStr, transactionsByDate]);

  const getCategoryIcon = (iconName: string) => {
    if (!iconName) return "💸";
    const raw = (iconName.includes("|") ? iconName.split("|")[0] : iconName).trim();
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
    if (mapping[raw]) return mapping[raw];
    if (/^[a-zA-Z0-9_-]{2,}$/.test(raw)) return "🏷️";
    return raw || "💸";
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Financial Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">Audit daily cash transactions and visual date summaries.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Calendar Grid Card */}
        <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 md:col-span-8 space-y-6">
          {/* Header Month controls */}
          <div className="flex justify-between items-center pb-4 border-b border-zinc-850">
            <h3 className="text-lg font-bold text-white">
              {monthNames[month]} {year}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-850 bg-zinc-900 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ◀
              </button>
              <button
                onClick={nextMonth}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-850 bg-zinc-900 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div>
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                const dateStr = cell.date.toISOString().split("T")[0];
                const dayTransactions = transactionsByDate[dateStr] || [];
                
                const hasIncome = dayTransactions.some((tx) => tx.type === "income");
                const hasExpense = dayTransactions.some((tx) => tx.type === "expense");

                const isSelected = cell.isCurrentMonth && selectedDay === cell.day;
                const isToday = cell.date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (cell.isCurrentMonth) setSelectedDay(cell.day);
                    }}
                    disabled={!cell.isCurrentMonth}
                    className={`flex flex-col items-center justify-between min-h-[50px] p-1.5 rounded-xl border transition ${
                      !cell.isCurrentMonth 
                        ? "border-transparent opacity-10 cursor-default" 
                        : isSelected 
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/15" 
                          : isToday 
                            ? "bg-zinc-800/40 border-blue-500/30 text-white" 
                            : "bg-zinc-900/30 border-zinc-850 hover:bg-zinc-800/40 text-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold">{cell.day}</span>
                    
                    {/* Bullet Indicators */}
                    <div className="flex gap-1 mt-1">
                      {hasIncome && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`} />
                      )}
                      {hasExpense && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-rose-400"}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day list details */}
        <div className="border border-zinc-800/80 rounded-3xl bg-zinc-900/10 p-6 md:col-span-4 flex flex-col gap-4">
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-500">Selected Day Logs</h4>
            <h3 className="text-lg font-bold text-white mt-1">
              {selectedDay ? `${monthNames[month]} ${selectedDay}, ${year}` : "Select a day"}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-none space-y-3">
            {selectedDayTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-600 border border-dashed border-zinc-850 rounded-2xl h-full">
                <span>📅</span>
                <p className="text-xs italic mt-2">No logs for this date.</p>
              </div>
            ) : (
              selectedDayTransactions.map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <div key={tx._id} className="flex justify-between items-center bg-zinc-900/30 border border-zinc-850 p-3 rounded-xl transition">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(tx.categoryId?.icon)}</span>
                      <div className="truncate pr-1">
                        <p className="text-xs font-bold text-white truncate">{tx.title}</p>
                        <p className="text-[10px] text-slate-500">{tx.categoryId?.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                      {isIncome ? "+" : "-"} {formatMoney(tx.amount, preferredCurrency)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
