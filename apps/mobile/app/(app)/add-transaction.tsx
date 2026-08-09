import React, { useState, useMemo, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useAuth } from "../_layout";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../src/lib/api";
import { toMinorUnits } from "@money/shared";
import { Ionicons } from "@expo/vector-icons";

export default function AddTransaction() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Route params default type
  const initialType = (searchParams.type as "income" | "expense") || "expense";

  // Form states
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [amountStr, setAmountStr] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // YYYY-MM-DD
  const [idempotencyKey] = useState(`idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.getAccounts();
      return res.data || [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.getCategories();
      return res.data || [];
    },
  });

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    return categories.filter((cat: any) => cat.type === type);
  }, [categories, type]);

  // Set default selectors on data load
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0]._id);
    }
  }, [accounts]);

  useEffect(() => {
    if (filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0]._id);
    } else {
      setCategoryId("");
    }
  }, [filteredCategories]);

  // Mutation to Add Transaction
  const addMutation = useMutation({
    mutationFn: async () => {
      const amountVal = parseFloat(amountStr);
      if (isNaN(amountVal) || amountVal <= 0) {
        throw new Error("Amount must be a positive number");
      }

      if (!title.trim()) {
        throw new Error("Title is required");
      }

      if (!accountId) {
        throw new Error("Account is required");
      }

      if (!categoryId) {
        throw new Error("Category is required");
      }

      // Find the currency of the selected account
      const selectedAccount = accounts.find((acc: any) => acc._id === accountId);
      const currency = selectedAccount?.currency || user?.preferredCurrency || "USD";

      // Convert float to minor-unit integers
      const amountMinor = toMinorUnits(amountVal, currency);

      const payload = {
        amount: amountMinor,
        type,
        accountId,
        categoryId,
        currency,
        title: title.trim(),
        description: description.trim(),
        date: new Date(date).toISOString(),
      };

      const res = await api.createTransaction(payload, idempotencyKey);
      if (!res.success) {
        throw new Error(res.message || "Failed to create transaction");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      Alert.alert("Success", "Transaction added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert("Validation Failed", err.message || "Something went wrong");
    },
  });

  const handleSubmit = () => {
    addMutation.mutate();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Transaction Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "expense" && styles.typeBtnExpenseActive]}
          onPress={() => setType("expense")}
        >
          <Text style={[styles.typeText, type === "expense" && styles.textWhite]}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "income" && styles.typeBtnIncomeActive]}
          onPress={() => setType("income")}
        >
          <Text style={[styles.typeText, type === "income" && styles.textWhite]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Box */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount</Text>
        <TextInput
          style={[
            styles.amountInput,
            { color: type === "expense" ? "#DC3545" : "#28A745" },
          ]}
          placeholder="0.00"
          placeholderTextColor="#ADB5BD"
          keyboardType="numeric"
          value={amountStr}
          onChangeText={setAmountStr}
          autoFocus
        />
      </View>

      <View style={styles.formCard}>
        {/* Title Input */}
        <Text style={styles.label}>Title / Payee</Text>
        <TextInput
          style={styles.input}
          placeholder="Dinner, Grocery, Salary, etc."
          value={title}
          onChangeText={setTitle}
        />

        {/* Date Input */}
        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        {/* Account Selector */}
        <Text style={styles.label}>Select Wallet / Account</Text>
        <View style={styles.selectorGrid}>
          {accounts.map((acc: any) => {
            const isSelected = accountId === acc._id;
            return (
              <TouchableOpacity
                key={acc._id}
                style={[styles.selectorItem, isSelected && styles.selectorItemActive]}
                onPress={() => setAccountId(acc._id)}
              >
                <Ionicons
                  name={acc.type === "bank" ? "card-outline" : "cash-outline"}
                  size={16}
                  color={isSelected ? "white" : "#495057"}
                />
                <Text style={[styles.selectorText, isSelected && styles.textWhite]}>
                  {acc.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Selector */}
        <Text style={styles.label}>Select Category</Text>
        {filteredCategories.length === 0 ? (
          <Text style={styles.infoText}>No categories defined for this type.</Text>
        ) : (
          <View style={styles.selectorGrid}>
            {filteredCategories.map((cat: any) => {
              const isSelected = categoryId === cat._id;
              return (
                <TouchableOpacity
                  key={cat._id}
                  style={[styles.selectorItem, isSelected && styles.selectorItemActive]}
                  onPress={() => setCategoryId(cat._id)}
                >
                  <Text style={[styles.selectorText, isSelected && styles.textWhite]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Description Input */}
        <Text style={styles.label}>Notes / Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add memo or transaction note..."
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitBtn, addMutation.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={addMutation.isPending}
        >
          {addMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitBtnText}>Save Transaction</Text>
          )}
        </TouchableOpacity>
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
  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#E9ECEF",
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  typeBtnExpenseActive: {
    backgroundColor: "#DC3545",
  },
  typeBtnIncomeActive: {
    backgroundColor: "#28A745",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#495057",
  },
  textWhite: {
    color: "white",
  },
  amountContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  amountLabel: {
    fontSize: 12,
    color: "#6C757D",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
    width: "100%",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginTop: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#F8F9FA",
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  selectorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F1F3F5",
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  selectorItemActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  selectorText: {
    fontSize: 12,
    color: "#495057",
    fontWeight: "500",
    marginLeft: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#6C757D",
    fontStyle: "italic",
  },
  submitBtn: {
    height: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 30,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
