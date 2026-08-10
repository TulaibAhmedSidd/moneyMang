import React, { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { useAuth, useTheme } from "../_layout";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/lib/api";
import { formatMoney } from "../../src/shared";
import { Ionicons } from "@expo/vector-icons";
import DonutChart from "../../src/components/DonutChart";
import TrendBarChart from "../../src/components/TrendBarChart";

const CATEGORY_COLORS = [
  "#FF9500", // Orange
  "#FFCC00", // Yellow
  "#4CD964", // Green
  "#5AC8FA", // Teal
  "#007AFF", // Blue
  "#5856D6", // Purple
  "#FF2D55", // Red/Pink
  "#AF52DE", // Lavender
  "#FF3B30", // Red
  "#8E8E93", // Gray
];

export default function Analytics() {
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const preferredCurrency = user?.preferredCurrency || "USD";

  // Fetch Spending Analytics
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ["analytics", { scope: "dashboard" }],
    queryFn: async () => {
      const res = await api.getSpendingAnalytics();
      if (!res.success) throw new Error(res.message || "Failed to load analytics");
      return res.data;
    },
  });

  const categories = analyticsRes?.categories || [];
  const trends = analyticsRes?.trends || [];
  const comparison = analyticsRes?.comparison || { currentPeriodTotal: 0, previousPeriodTotal: 0, percentageChange: 0 };

  // Assign colors to categories
  const coloredCategories = useMemo(() => {
    return categories.map((cat: any, idx: number) => ({
      ...cat,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
  }, [categories]);

  const hasExpenses = comparison.currentPeriodTotal > 0;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      {/* Overview comparison card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>Total Expenses This Month</Text>
        <Text style={[styles.summaryAmount, { color: colors.error }]}>
          {formatMoney(comparison.currentPeriodTotal, preferredCurrency)}
        </Text>

        <View style={styles.comparisonRow}>
          {comparison.percentageChange !== 0 ? (
            <>
              <View style={[styles.trendBadge, { backgroundColor: comparison.percentageChange < 0 ? "#EBFBEE" : "#FFF5F5" }]}>
                <Ionicons
                  name={comparison.percentageChange < 0 ? "arrow-down" : "arrow-up"}
                  size={14}
                  color={comparison.percentageChange < 0 ? colors.success : colors.error}
                />
                <Text
                  style={[
                    styles.trendPercentText,
                    { color: comparison.percentageChange < 0 ? colors.success : colors.error },
                  ]}
                >
                  {Math.abs(comparison.percentageChange)}%
                </Text>
              </View>
              <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>
                vs previous month ({formatMoney(comparison.previousPeriodTotal, preferredCurrency)})
              </Text>
            </>
          ) : (
            <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>
              No previous period data to compare.
            </Text>
          )}
        </View>
      </View>

      {/* SVG Category Donut Chart section */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Breakdown</Text>
        
        {!hasExpenses ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expense transactions recorded yet.</Text>
          </View>
        ) : (
          <View style={styles.rowLayout}>
            {/* SVG Chart */}
            <DonutChart
              data={coloredCategories}
              total={comparison.currentPeriodTotal}
              currencySymbol={preferredCurrency === "PKR" ? "Rs." : "$"}
            />

            {/* Legends */}
            <View style={styles.legendContainer}>
              {coloredCategories.slice(0, 5).map((item: any) => (
                <View key={item._id} style={styles.legendItem}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                    {((item.amount / comparison.currentPeriodTotal) * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* SVG Weekly/Daily Trend Chart section */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending & Income Trends</Text>

        {trends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No daily records to plot trend graph.</Text>
          </View>
        ) : (
          <View style={styles.trendWrapper}>
            <TrendBarChart data={trends.slice(-7)} />
            <View style={styles.trendLegendRow}>
              <View style={styles.trendLegendItem}>
                <View style={[styles.colorDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.trendLegendText, { color: colors.text }]}>Income</Text>
              </View>
              <View style={styles.trendLegendItem}>
                <View style={[styles.colorDot, { backgroundColor: colors.error }]} />
                <Text style={[styles.trendLegendText, { color: colors.text }]}>Expense</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  trendPercentText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 3,
  },
  comparisonLabel: {
    fontSize: 12,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  rowLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legendContainer: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    flex: 1,
    fontWeight: "500",
  },
  legendValue: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 12,
  },
  trendWrapper: {
    alignItems: "center",
  },
  trendLegendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  trendLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  trendLegendText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
