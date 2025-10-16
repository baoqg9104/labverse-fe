import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "https://localhost:7106/api",
  withCredentials: true,
});

// Simple token store
let currentAccessToken: string | null = localStorage.getItem("accessToken");
let onLogoutCallback: (() => void) | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Simple function to get current token
export const getCurrentAccessToken = () => currentAccessToken;

// Simple function to set token
export const setCurrentAccessToken = (token: string | null) => {
  currentAccessToken = token;
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
};

// Setup logout callback
export const setLogoutCallback = (callback: () => void) => {
  onLogoutCallback = callback;
};

// Request interceptor - add token to headers
api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry for login and refresh endpoints
    if (
      originalRequest.url?.includes("/users/authenticate") ||
      originalRequest.url?.includes("/refresh-tokens/refresh")
    ) {
      if (error.response?.status === 401 && originalRequest.url?.includes("/refresh-tokens/refresh")) {
        // Refresh token expired, logout
        setCurrentAccessToken(null);
        onLogoutCallback?.();
      }
      return Promise.reject(error);
    }

    // Handle 401 for other endpoints
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If not already refreshing, start refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axios
          .post("https://localhost:7106/api/refresh-tokens/refresh", {}, { withCredentials: true })
          .then((response) => {
            const newToken = response.data.accessToken;
            setCurrentAccessToken(newToken);
            return newToken;
          })
          .catch(() => {
            setCurrentAccessToken(null);
            onLogoutCallback?.();
            return null;
          })
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      // Wait for refresh to complete
      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
