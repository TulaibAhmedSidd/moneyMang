import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "./_layout";
import api from "../src/lib/api";
import { SUPPORTED_CURRENCIES } from "@money/shared";

export default function Onboarding() {
  const { updateUser, signOut } = useAuth();
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezones = [
    "UTC",
    "Asia/Karachi",
    "America/New_York",
    "Europe/London",
    "Asia/Dubai",
    "Asia/Riyadh",
    "Asia/Kolkata",
    "Asia/Tokyo",
  ];

  const handleGetStarted = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.updateMe({
        preferredCurrency: currency,
        timezone,
        onboardingCompleted: true,
      });

      if (response.success && response.data) {
        updateUser(response.data);
      } else {
        setError(response.message || "Failed to save onboarding preferences");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Take control of your money today.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Preferred Currency</Text>
        <View style={styles.grid}>
          {Object.keys(SUPPORTED_CURRENCIES).map((code) => {
            const isSelected = currency === code;
            const meta = SUPPORTED_CURRENCIES[code];
            return (
              <TouchableOpacity
                key={code}
                style={[styles.gridItem, isSelected && styles.gridItemActive]}
                onPress={() => setCurrency(code)}
              >
                <Text style={[styles.currencySymbol, isSelected && styles.textActive]}>
                  {meta.symbol}
                </Text>
                <Text style={[styles.currencyCode, isSelected && styles.textActive]}>
                  {code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Your Timezone</Text>
        <View style={styles.list}>
          {timezones.map((tz) => {
            const isSelected = timezone === tz;
            return (
              <TouchableOpacity
                key={tz}
                style={[styles.listItem, isSelected && styles.listItemActive]}
                onPress={() => setTimezone(tz)}
              >
                <Text style={[styles.listText, isSelected && styles.listTextActive]}>
                  {tz}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleGetStarted}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Get Started</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6C757D",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  gridItem: {
    width: "30%",
    margin: "1.66%",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  gridItemActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  currencyCode: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 4,
  },
  textActive: {
    color: "white",
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  listItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    margin: 4,
  },
  listItemActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  listText: {
    color: "#495057",
    fontSize: 13,
  },
  listTextActive: {
    color: "white",
  },
  errorText: {
    color: "#DC3545",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    height: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    alignItems: "center",
    marginTop: 16,
    padding: 8,
  },
  logoutButtonText: {
    color: "#DC3545",
    fontSize: 14,
  },
});
