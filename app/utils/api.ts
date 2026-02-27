import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "https://dataappback.onrender.com/api/v1/",
});

// Types for the queue
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

/**
 * Helper to get tokens from storage without repeating logic
 */
const getStoredTokens = async () => {
  const accessToken = await AsyncStorage.getItem("accessToken");
  const refreshToken = await AsyncStorage.getItem("refreshToken");
  const loginObjStr = await AsyncStorage.getItem("login_obj");

  if (accessToken && refreshToken) return { accessToken, refreshToken };

  if (loginObjStr) {
    const parsed = JSON.parse(loginObjStr);
    return {
      accessToken: accessToken || parsed.data?.accessToken || parsed.accessToken,
      refreshToken: refreshToken || parsed.data?.refreshToken || parsed.refreshToken,
    };
  }
  return { accessToken: null, refreshToken: null };
};

// --- Request Interceptor ---
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { accessToken } = await getStoredTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// --- Response Interceptor ---
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = await getStoredTokens();

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Hit the refresh endpoint
        // Note: Sending as { refreshToken } object to match common API patterns
        const res = await axios.post(`${api.defaults.baseURL}auth/refresh/`, {
          refreshToken: refreshToken
        });

        const newAccessToken = res.data.accessToken || res.data.access;
        const newRefreshToken = res.data.refreshToken || res.data.refresh || refreshToken;

        // Update Storage
        const loginObjStr = await AsyncStorage.getItem("login_obj");
        if (loginObjStr) {
          const parsed = JSON.parse(loginObjStr);
          await AsyncStorage.setItem("login_obj", JSON.stringify({
            ...parsed,
            data: { ...parsed.data, accessToken: newAccessToken, refreshToken: newRefreshToken }
          }));
        }

        await AsyncStorage.multiSet([
          ["accessToken", newAccessToken],
          ["refreshToken", newRefreshToken],
          ["isAuthenticated", "true"]
        ]);

        processQueue(null, newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear auth data on failure
        await AsyncStorage.multiRemove(["login_obj", "accessToken", "refreshToken"]);
        await AsyncStorage.setItem("isAuthenticated", "false");

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;