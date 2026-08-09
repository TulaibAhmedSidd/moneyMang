import { ApiClient } from "@money/api-client";
import Constants from "expo-constants";

// Retrieve local host IP for physical devices / emulators during development
const getLocalIpAddress = () => {
  const host = Constants.expoConfig?.hostUri;
  if (host) {
    const ip = host.split(":")[0];
    return `http://${ip}:3000`;
  }
  // Android emulator fallback
  return "http://10.0.2.2:3000";
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || getLocalIpAddress();

console.log("Configuring ApiClient with base URL:", BASE_URL);

export const api = new ApiClient(BASE_URL);
export default api;
