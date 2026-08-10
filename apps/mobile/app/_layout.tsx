import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { ActivityIndicator, View, StyleSheet, useColorScheme } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import api from "../src/lib/api";
import { themeColors } from "../src/shared";

const queryClient = new QueryClient();
const TOKEN_KEY = "money_session_token";

interface AuthContextType {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  signIn: (token: string, user: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface ThemeContextType {
  colors: typeof themeColors.light;
  theme: "light" | "dark";
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const systemScheme = useColorScheme();

  const themeMode: "light" | "dark" = useMemo(() => {
    const pref = user?.theme || "system";
    if (pref === "system") {
      return systemScheme === "dark" ? "dark" : "light";
    }
    return pref;
  }, [user?.theme, systemScheme]);

  const colors = themeColors[themeMode];

  return (
    <ThemeContext.Provider value={{ colors, theme: themeMode, isDark: themeMode === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          api.setToken(storedToken);
          setToken(storedToken);
          
          // Verify token by calling auth/me
          const response = await api.getMe();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token expired or invalid
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            api.setToken(null);
          }
        }
      } catch (error) {
        console.error("Failed to load auth token:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadToken();
  }, []);

  const signIn = async (newToken: string, newUser: any) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      api.setToken(newToken);
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error("Failed to store token on login:", error);
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network failures on logout
    }
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      api.setToken(null);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Failed to delete token on logout:", error);
    }
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function RouteGuard() {
  const { token, user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isOnboarding = segments[0] === "onboarding";

    if (!token) {
      // Redirect to login if not authenticated and not in auth screens
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else if (user) {
      if (!user.onboardingCompleted) {
        // Force onboarding if incomplete
        if (!isOnboarding) {
          router.replace("/onboarding");
        }
      } else {
        if (inAuthGroup || isOnboarding || !segments[0]) {
          router.replace("/(app)");
        }
      }
    }
  }, [token, user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <RouteGuard />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
});
