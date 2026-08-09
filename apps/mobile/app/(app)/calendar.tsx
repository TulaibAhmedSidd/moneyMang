import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../_layout";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/lib/api";
import { formatMoney } from "@money/shared";
import { Ionicons } from "@expo/vector-icons";

export default function FinancialCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const timezone = user?.timezone || "UTC";
  const preferredCurrency = user?.preferredCurrency || "USD";

  // Calculate start/end date for the selected month in local timezone bounds
  const { startDateStr, endDateStr, displayTitle, daysInMonth, startWeekday } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const firstDay = new Date(year, month, 1);
    
    return {
      startDateStr: start.toISOString(),
      endDateStr: end.toISOString(),
      displayTitle: currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      startWeekday: firstDay.getDay(), // 0 = Sunday, 1 = Monday, etc.
    };
  }, [currentDate]);

  // Fetch transactions for the entire month
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["transactions", { scope: "calendar", startDateStr, endDateStr }],
    queryFn: async () => {
      const res = await api.getTransactions(`startDate=${startDateStr}&endDate=${endDateStr}&limit=100`);
      if (!res.success) throw new Error(res.message || "Failed to load transactions");
      return res.data?.transactions || [];
    },
  });

  const transactions = responseData || [];

  // Group transactions by day of the month
  const { dailySummaries, dailyTransactions } = useMemo(() => {
    const summaries: Record<number, { income: number; expense: number; net: number }> = {};
    const lists: Record<number, any[]> = {};

    // Initialize all days
    for (let d = 1; d <= daysInMonth; d++) {
      summaries[d] = { income: 0, expense: 0, net: 0 };
      lists[d] = [];
    }

    transactions.forEach((tx: any) => {
      const txDate = new Date(tx.date);
      // Determine day number in target month
      const dayNum = txDate.getDate();

      if (dayNum >= 1 && dayNum <= daysInMonth) {
        lists[dayNum].push(tx);
        const amount = tx.amount;
        if (tx.type === "income") {
          summaries[dayNum].income += amount;
          summaries[dayNum].net += amount;
        } else {
          summaries[dayNum].expense += amount;
          summaries[dayNum].net -= amount;
        }
      }
    });

    return {
      dailySummaries: summaries,
      dailyTransactions: lists,
    };
  }, [transactions, daysInMonth]);

  // Navigate Months
  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
    setSelectedDay(1); // default to first day
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
    setSelectedDay(1); // default to first day
  };

  // Build calendar grid array
  const gridCells = useMemo(() => {
    const cells = [];
    
    // Empty cells for starting weekday padding
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ day: null, empty: true });
    }

    // Days in the month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        empty: false,
        summary: dailySummaries[d],
      });
    }

    return cells;
  }, [startWeekday, daysInMonth, dailySummaries]);

  const selectedDayTransactions = selectedDay ? dailyTransactions[selectedDay] || [] : [];
  const selectedDaySummary = selectedDay ? dailySummaries[selectedDay] : null;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatSummaryBadge = (amount: number) => {
    if (amount === 0) return "";
    const major = amount / 100; // rough representation
    const sign = amount > 0 ? "+" : "";
    
    // return small abbreviated string e.g. +50 or -12
    if (Math.abs(major) >= 1000) {
      return `${sign}${(major / 1000).toFixed(0)}k`;
    }
    return `${sign}${major.toFixed(0)}`;
  };

  return (
    <View style={styles.container}>
      {/* Month Navigator Banner */}
      <View style={styles.navBanner}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={20} color="#495057" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{displayTitle}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
          <Ionicons name="chevron-forward" size={20} color="#495057" />
        </TouchableOpacity>
      </View>

      {/* Weekdays Labels */}
      <View style={styles.weekdaysRow}>
        {weekdays.map((wd) => (
          <Text key={wd} style={styles.weekdayText}>
            {wd}
          </Text>
        ))}
      </View>

      {/* Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {gridCells.map((cell, idx) => {
              if (cell.empty) {
                return <View key={`empty-${idx}`} style={styles.cellEmpty} />;
              }

              const isSelected = selectedDay === cell.day;
              const hasNet = (cell.summary?.net ?? 0) !== 0;
              const isPositive = (cell.summary?.net ?? 0) > 0;

              return (
                <TouchableOpacity
                  key={`day-${cell.day}`}
                  style={[styles.cell, isSelected && styles.cellSelected]}
                  onPress={() => setSelectedDay(cell.day)}
                >
                  <Text style={[styles.cellDayText, isSelected && styles.textWhite]}>
                    {cell.day}
                  </Text>
                  {hasNet && (
                    <Text
                      style={[
                        styles.cellAmountText,
                        isSelected ? styles.textWhite : { color: isPositive ? "#28A745" : "#DC3545" },
                      ]}
                      numberOfLines={1}
                    >
                      {formatSummaryBadge(cell.summary?.net ?? 0)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Selected Day Transactions Drawer */}
      <View style={styles.detailsDrawer}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>
            Day {selectedDay} Transactions
          </Text>
          {selectedDaySummary && selectedDaySummary.net !== 0 && (
            <Text
              style={[
                styles.drawerSummaryNet,
                { color: selectedDaySummary.net > 0 ? "#28A745" : "#DC3545" },
              ]}
            >
              Net: {selectedDaySummary.net > 0 ? "+" : ""}
              {formatMoney(selectedDaySummary.net, preferredCurrency)}
            </Text>
          )}
        </View>

        {selectedDayTransactions.length === 0 ? (
          <View style={styles.emptyDrawer}>
            <Ionicons name="sparkles-outline" size={24} color="#CED4DA" />
            <Text style={styles.emptyDrawerText}>No transactions recorded on this day.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.drawerScroll}>
            {selectedDayTransactions.map((tx: any) => {
              const isIncome = tx.type === "income";
              return (
                <View key={tx._id} style={styles.drawerItem}>
                  <View style={styles.drawerItemLeft}>
                    <Text style={styles.drawerItemTitle}>{tx.title}</Text>
                    <Text style={styles.drawerItemCategory}>
                      {tx.categoryId?.name} • {tx.accountId?.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.drawerItemAmount,
                      { color: isIncome ? "#28A745" : "#212529" },
                    ]}
                  >
                    {isIncome ? "+" : "-"} {formatMoney(tx.amount, tx.currency)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  navBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  navArrow: {
    padding: 6,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },
  weekdaysRow: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
  },
  loadingContainer: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContainer: {
    backgroundColor: "white",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cellEmpty: {
    width: "14.28%",
    height: 48,
  },
  cell: {
    width: "14.28%",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#F1F3F5",
  },
  cellSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
    borderRadius: 8,
  },
  cellDayText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#495057",
  },
  cellAmountText: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: "500",
  },
  textWhite: {
    color: "white",
  },
  detailsDrawer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#495057",
  },
  drawerSummaryNet: {
    fontSize: 13,
    fontWeight: "bold",
  },
  emptyDrawer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyDrawerText: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 8,
  },
  drawerScroll: {
    paddingBottom: 20,
  },
  drawerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  drawerItemLeft: {
    flex: 1,
  },
  drawerItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212529",
  },
  drawerItemCategory: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
  },
  drawerItemAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
});
