import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { useAuth, useTheme } from "../_layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../src/lib/api";
import { formatMoney } from "../../src/shared";
import { Ionicons } from "@expo/vector-icons";

type TimeTab = "day" | "week" | "month" | "year";

export default function TransactionsHistory() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // Navigation and active time tab states
  const [activeTab, setActiveTab] = useState<TimeTab>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Search & Filter Panel States
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");

  const timezone = user?.timezone || "UTC";

  // Debouncing search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Fetch Accounts for filter lists
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.getAccounts();
      return res.data || [];
    },
  });

  // Fetch Categories for filter lists
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.getCategories();
      return res.data || [];
    },
  });

  // Calculate start/end date strings based on active tab and currentDate
  const { startDateStr, endDateStr, displayTitle } = useMemo(() => {
    const date = new Date(currentDate);
    let start = new Date();
    let end = new Date();
    let title = "";

    if (activeTab === "day") {
      start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      title = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    } else if (activeTab === "week") {
      const day = date.getDay();
      const diff = date.getDate() - day;
      start = new Date(date.getFullYear(), date.getMonth(), diff, 0, 0, 0, 0);
      end = new Date(date.getFullYear(), date.getMonth(), diff + 6, 23, 59, 59, 999);
      title = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    } else if (activeTab === "month") {
      start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      title = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    } else if (activeTab === "year") {
      start = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
      title = date.getFullYear().toString();
    }

    return {
      startDateStr: start.toISOString(),
      endDateStr: end.toISOString(),
      displayTitle: title,
    };
  }, [activeTab, currentDate]);

  // Build query string dynamically matching all active filters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("startDate", startDateStr);
    params.set("endDate", endDateStr);

    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    if (selectedAccountId) {
      params.set("accountId", selectedAccountId);
    }
    if (selectedCategoryId) {
      params.set("categoryId", selectedCategoryId);
    }
    if (selectedType !== "all") {
      params.set("type", selectedType);
    }

    return params.toString();
  }, [startDateStr, endDateStr, debouncedSearch, selectedAccountId, selectedCategoryId, selectedType]);

  // Query transactions matching all params
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["transactions", { queryParams }],
    queryFn: async () => {
      const res = await api.getTransactions(queryParams);
      if (!res.success) throw new Error(res.message || "Failed to load transactions");
      return res.data || { transactions: [], total: 0 };
    },
  });

  const transactions = responseData?.transactions || [];

  // Delete Transaction Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.deleteTransaction(id);
      if (!res.success) throw new Error(res.message || "Delete failed");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Could not delete transaction");
    },
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to permanently delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  // Navigating dates
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (activeTab === "day") {
      d.setDate(d.getDate() - 1);
    } else if (activeTab === "week") {
      d.setDate(d.getDate() - 7);
    } else if (activeTab === "month") {
      d.setMonth(d.getMonth() - 1);
    } else if (activeTab === "year") {
      d.setFullYear(d.getFullYear() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (activeTab === "day") {
      d.setDate(d.getDate() + 1);
    } else if (activeTab === "week") {
      d.setDate(d.getDate() + 7);
    } else if (activeTab === "month") {
      d.setMonth(d.getMonth() + 1);
    } else if (activeTab === "year") {
      d.setFullYear(d.getFullYear() + 1);
    }
    setCurrentDate(d);
  };

  const getCategoryIcon = (iconName: string) => {
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

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedAccountId("");
    setSelectedCategoryId("");
    setSelectedType("all");
  };

  const hasActiveFilters = selectedAccountId || selectedCategoryId || selectedType !== "all" || searchText;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Time Tabs Header */}
      <View style={[styles.tabHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["day", "week", "month", "year"] as TimeTab[]).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isSelected && { backgroundColor: colors.subtleBg }]}
              onPress={() => {
                setActiveTab(tab);
                setCurrentDate(new Date());
              }}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, isSelected && { color: colors.primary }]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date Navigator Banner */}
      <View style={[styles.navBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handlePrev} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{displayTitle}</Text>
        <TouchableOpacity onPress={handleNext} style={styles.navArrow}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Input Banner */}
      <View style={[styles.searchBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterToggle, { backgroundColor: colors.inputBg, borderColor: colors.border }, showFilters && { borderColor: colors.primary }]}
        >
          <Ionicons name="options-outline" size={20} color={showFilters ? colors.primary : colors.text} />
        </TouchableOpacity>
      </View>

      {/* Slide-down filter selectors */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Transaction Type</Text>
          <View style={styles.filterGroup}>
            {(["all", "income", "expense"] as const).map((typeVal) => {
              const isSelected = selectedType === typeVal;
              return (
                <TouchableOpacity
                  key={typeVal}
                  style={[styles.filterBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSelectedType(typeVal)}
                >
                  <Text style={[styles.filterBadgeText, { color: colors.text }, isSelected && styles.textWhite]}>
                    {typeVal.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Accounts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }, !selectedAccountId && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedAccountId("")}
            >
              <Text style={[styles.filterBadgeText, { color: colors.text }, !selectedAccountId && styles.textWhite]}>ALL ACCOUNTS</Text>
            </TouchableOpacity>
            {accounts.map((acc: any) => {
              const isSelected = selectedAccountId === acc._id;
              return (
                <TouchableOpacity
                  key={acc._id}
                  style={[styles.filterBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSelectedAccountId(acc._id)}
                >
                  <Text style={[styles.filterBadgeText, { color: colors.text }, isSelected && styles.textWhite]}>
                    {acc.name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }, !selectedCategoryId && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedCategoryId("")}
            >
              <Text style={[styles.filterBadgeText, { color: colors.text }, !selectedCategoryId && styles.textWhite]}>ALL CATEGORIES</Text>
            </TouchableOpacity>
            {categories.map((cat: any) => {
              const isSelected = selectedCategoryId === cat._id;
              return (
                <TouchableOpacity
                  key={cat._id}
                  style={[styles.filterBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSelectedCategoryId(cat._id)}
                >
                  <Text style={[styles.filterBadgeText, { color: colors.text }, isSelected && styles.textWhite]}>
                    {cat.name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleClearFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No matching transactions found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {transactions.map((tx: any) => {
            const isIncome = tx.type === "income";
            return (
              <View key={tx._id} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.itemIconBg, { backgroundColor: colors.background }]}>
                  <Ionicons
                    name={getCategoryIcon(tx.categoryId?.icon)}
                    size={22}
                    color={colors.text}
                  />
                </View>
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{tx.title}</Text>
                  <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                    {tx.categoryId?.name} • {tx.accountId?.name}
                  </Text>
                  {tx.description ? (
                    <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                      {tx.description}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.itemRight}>
                  <Text
                    style={[
                      styles.itemAmount,
                      { color: isIncome ? colors.success : colors.text },
                    ]}
                  >
                    {isIncome ? "+" : "-"} {formatMoney(tx.amount, tx.currency)}
                  </Text>
                  <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
                    {new Date(tx.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => handleDelete(tx._id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
  },
  navBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  navArrow: {
    padding: 6,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  searchBanner: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  clearSearch: {
    padding: 4,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  filterPanel: {
    padding: 16,
    borderBottomWidth: 1,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 8,
    textTransform: "uppercase",
  },
  filterGroup: {
    flexDirection: "row",
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: "row",
    marginBottom: 8,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  clearFiltersBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
  },
  textWhite: {
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  itemIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  itemDescription: {
    fontSize: 11,
    marginTop: 4,
  },
  itemRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemTime: {
    fontSize: 10,
    marginTop: 4,
  },
  trashBtn: {
    marginTop: 8,
    padding: 4,
  },
});
