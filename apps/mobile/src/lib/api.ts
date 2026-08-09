import { ApiClient } from "@money/api-client";
import Constants from "expo-constants";

// 1. Prefer explicit env variable (set in .env or EAS secrets)
// 2. Fall back to app.json extra.apiUrl (for EAS cloud builds)
// 3. Fall back to local dev IP derived from Expo host (for physical device dev)
// 4. Final fallback: Android emulator localhost alias
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const extraApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraApiUrl) {
    return extraApiUrl;
  }

  const host = Constants.expoConfig?.hostUri;
  if (host) {
    const ip = host.split(":")[0];
    return `http://${ip}:3000`;
  }

  return "http://10.0.2.2:3000";
};

const BASE_URL = getBaseUrl();

console.log("Configuring ApiClient with base URL:", BASE_URL);

export const api = new ApiClient(BASE_URL);
export default api;
