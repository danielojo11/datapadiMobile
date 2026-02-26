import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const api = axios.create({
  baseURL: "https://dataappback.onrender.com/api/v1/",
});

// Flag to indicate if a refresh process is ongoing
let isRefreshing = false;
// Queue to hold pending requests while the token is being refreshed
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(async (config) => {
  const login_obj = await AsyncStorage.getItem("login_obj");
  const accessTokenAlt = await AsyncStorage.getItem("accessToken");

  let accessToken = accessTokenAlt;

  if (!accessToken && login_obj) {
    const parsed = JSON.parse(login_obj);
    accessToken = parsed.data?.accessToken || parsed.accessToken;
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const login_obj = await AsyncStorage.getItem("login_obj");
        let refreshToken = await AsyncStorage.getItem("refreshToken");

        if (!refreshToken && login_obj) {
          const parsed = JSON.parse(login_obj);
          refreshToken = parsed.data?.refreshToken || parsed.refreshToken;
        }

        if (!refreshToken) {
          return Promise.reject(error);
        }

        // We use the same structure defined in auth/refresh.ts
        const res = await axios.post(
          "https://dataappback.onrender.com/api/v1/auth/refresh/",
          JSON.stringify(refreshToken),
          {
            headers: { "Content-Type": "application/json" }
          }
        );

        const newAccessToken = res.data.accessToken || res.data.access;
        const newRefreshToken = res.data.refreshToken || res.data.refresh || refreshToken;

        if (login_obj) {
          const parsed = JSON.parse(login_obj);
          await AsyncStorage.setItem(
            "login_obj",
            JSON.stringify({
              ...parsed,
              data: {
                ...parsed.data,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              },
            }),
          );
        }

        await AsyncStorage.setItem("accessToken", newAccessToken);
        await AsyncStorage.setItem("refreshToken", newRefreshToken);

        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.removeItem("login_obj");
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        // Also remove global authenticated state if available
        await AsyncStorage.setItem("isAuthenticated", JSON.stringify(false));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
