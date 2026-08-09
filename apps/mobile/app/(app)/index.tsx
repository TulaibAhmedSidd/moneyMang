import React, { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../_layout";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/lib/api";
import { formatMoney } from "@money/shared";
import { Ionicons } from "@expo/vector-icons";

export default function HomeDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // 1. Fetch Accounts
  const { data: accountsData, isLoading: isAccountsLoading, error: accountsError } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.getAccounts();
      if (!res.success) throw new Error(res.message || "Failed to load accounts");
      return res.data || [];
    },
  });

  // 2. Fetch Transactions (Recent 10)
  const { data: txData, isLoading: isTxLoading, error: txError } = useQuery({
    queryKey: ["transactions", { limit: 10 }],
    queryFn: async () => {
      const res = await api.getTransactions("limit=10");
      if (!res.success) throw new Error(res.message || "Failed to load transactions");
      return res.data?.transactions || [];
    },
  });

  // Calculate live values
  const preferredCurrency = user?.preferredCurrency || "USD";

  // Sum up account balances
  const totalBalance = useMemo(() => {
    if (!accountsData) return 0;
    return accountsData.reduce((sum: number, acc: any) => sum + (acc.balance ?? 0), 0);
  }, [accountsData]);

  // Sum up incomes/expenses from recent transactions for a simple summary
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    if (!txData) return { monthlyIncome: 0, monthlyExpense: 0 };
    let income = 0;
    let expense = 0;
    txData.forEach((tx: any) => {
      if (tx.type === "income") {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });
    return { monthlyIncome: income, monthlyExpense: expense };
  }, [txData]);

  const recentTransactions = txData || [];

  const handleAddTransaction = (type: "income" | "expense") => {
    router.push({
      pathname: "/(app)/add-transaction",
      params: { type },
    });
  };

  const getCategoryIcon = (iconName: string) => {
    // Basic mapping from database icons to Ionicons
    const mapping: Record<string, string> = {
      restaurant: "restaurant-outline",
      fastfood: "pizza-outline",
      "local-dining": "cafe-outline",
      "local-cafe": "cafe-outline",
      "local-grocery-store": "cart-outline",
      "directions-car": "car-outline",
      "local-gas-station": "funnel-outline",
      build: "construct-outline",
      receipt: "receipt-outline",
      work: "briefcase-outline",
      laptop: "laptop-outline",
      store: "storefront-outline",
      trending_up: "trending-up-outline",
      home: "home-outline",
    };
    return (mapping[iconName] || "card-outline") as any;
  };

  if (isAccountsLoading || isTxLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileAvatar}
          onPress={() => router.push("/(app)/settings")}
        >
          <Ionicons name="person-circle-outline" size={36} color="#495057" />
        </TouchableOpacity>
      </View>

      {/* Available Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatMoney(totalBalance, preferredCurrency)}
        </Text>
        
        <View style={styles.balanceDivider} />
        
        <View style={styles.balanceSummary}>
          <View style={styles.summaryItem}>
            <View style={[styles.arrowBg, { backgroundColor: "#D4EDDA" }]}>
              <Ionicons name="arrow-down-outline" size={16} color="#28A745" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryAmount, { color: "#28A745" }]}>
                {formatMoney(monthlyIncome, preferredCurrency)}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryItem}>
            <View style={[styles.arrowBg, { backgroundColor: "#F8D7DA" }]}>
              <Ionicons name="arrow-up-outline" size={16} color="#DC3545" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryAmount, { color: "#DC3545" }]}>
                {formatMoney(monthlyExpense, preferredCurrency)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#EBFBEE" }]}
          onPress={() => handleAddTransaction("income")}
        >
          <Ionicons name="add-circle-outline" size={24} color="#28A745" />
          <Text style={[styles.actionBtnText, { color: "#28A745" }]}>Add Income</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#FFF5F5" }]}
          onPress={() => handleAddTransaction("expense")}
        >
          <Ionicons name="remove-circle-outline" size={24} color="#DC3545" />
          <Text style={[styles.actionBtnText, { color: "#DC3545" }]}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions List */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push("/(app)/transactions")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={48} color="#CED4DA" />
            <Text style={styles.emptyStateText}>No recent transactions.</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => handleAddTransaction("expense")}
            >
              <Text style={styles.emptyStateButtonText}>Add your first transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentTransactions.slice(0, 5).map((tx: any) => {
            const isIncome = tx.type === "income";
            return (
              <View key={tx._id} style={styles.txItem}>
                <View style={styles.txCategoryIconBg}>
                  <Ionicons
                    name={getCategoryIcon(tx.categoryId?.icon)}
                    size={22}
                    color="#495057"
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txCategory}>{tx.categoryId?.name}</Text>
                </View>
                <View style={styles.txAmountContainer}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isIncome ? "#28A745" : "#212529" },
                    ]}
                  >
                    {isIncome ? "+" : "-"} {formatMoney(tx.amount, tx.currency)}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontSize: 14,
    color: "#6C757D",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
  },
  profileAvatar: {
    padding: 4,
  },
  balanceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 8,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: "#E9ECEF",
    marginVertical: 18,
  },
  balanceSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
  },
  arrowBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6C757D",
    textTransform: "uppercase",
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionBtn: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  actionBtnText: {
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 14,
  },
  transactionsSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },
  seeAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  txCategoryIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F3F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  txCategory: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  txAmountContainer: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  txDate: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyStateText: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
});
