import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useAuth, useTheme } from "../_layout";
import api from "../../src/lib/api";
import { SUPPORTED_CURRENCIES } from "../../src/shared";
import { Ionicons } from "@expo/vector-icons";

export default function Settings() {
  const { user, updateUser, signOut } = useAuth();
  const { colors } = useTheme();
  
  const [currency, setCurrency] = useState(user?.preferredCurrency || "USD");
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [themePref, setThemePref] = useState(user?.theme || "system");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const timezones = [
    "UTC",
    "Asia/Karachi",
    "America/New_York",
    "Europe/London",
    "Asia/Dubai",
    "Asia/Tokyo",
  ];

  const handleSave = async () => {
    setIsUpdating(true);
    setMessage(null);

    try {
      const response = await api.updateMe({
        preferredCurrency: currency,
        timezone,
        theme: themePref,
      });

      if (response.success && response.data) {
        updateUser(response.data);
        setMessage("Settings updated successfully");
        Alert.alert("Success", "Settings updated successfully");
      } else {
        Alert.alert("Error", response.message || "Failed to save settings");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.profileSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="person-circle-sharp" size={72} color={colors.textSecondary} />
        <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.subtleBg }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role || "USER"}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Preferences</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Base Currency</Text>
        <View style={styles.grid}>
          {Object.keys(SUPPORTED_CURRENCIES).map((code) => {
            const isSelected = currency === code;
            return (
              <TouchableOpacity
                key={code}
                style={[
                  styles.gridItem,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setCurrency(code)}
              >
                <Text style={[styles.gridText, { color: colors.text }, isSelected && styles.textWhite]}>
                  {code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Timezone</Text>
        <View style={styles.list}>
          {timezones.map((tz) => {
            const isSelected = timezone === tz;
            return (
              <TouchableOpacity
                key={tz}
                style={[
                  styles.listItem,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setTimezone(tz)}
              >
                <Text style={[styles.listText, { color: colors.text }, isSelected && styles.listTextActive]}>
                  {tz}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Display Theme</Text>
        <View style={styles.list}>
          {["light", "dark", "system"].map((mode) => {
            const isSelected = themePref === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.listItem,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setThemePref(mode)}
              >
                <Text style={[styles.listText, { color: colors.text }, isSelected && styles.listTextActive]}>
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {message && <Text style={styles.successText}>{message}</Text>}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }, isUpdating && styles.btnDisabled]}
          onPress={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveBtnText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
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
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "#E6F4FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#007AFF",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C757D",
    marginBottom: 8,
    marginTop: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  gridItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  gridItemActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  gridText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#495057",
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  listItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8F9FA",
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
    fontSize: 12,
  },
  listTextActive: {
    color: "white",
  },
  textWhite: {
    color: "white",
  },
  successText: {
    color: "#28A745",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  saveBtn: {
    height: 48,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  logoutBtn: {
    height: 48,
    backgroundColor: "#DC3545",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  logoutBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
