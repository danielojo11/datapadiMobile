import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const api = axios.create({
  baseURL: "https://dataappback.onrender.com/api/v1/",
});

api.interceptors.request.use(async (config) => {
  const login_obj = await AsyncStorage.getItem("login_obj");

  if (login_obj) {
    const parsed = JSON.parse(login_obj);
    console.log(parsed);
    const accessToken = parsed.data?.accessToken || parsed.accessToken;
    const refreshToken = parsed.data?.refreshToken || parsed.refreshToken;

    if (accessToken) {
      console.log("token sent", accessToken);
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      const res = await axios.post(
        "https://dataappback.onrender.com/api/v1/auth/refresh/",
        { refresh: refreshToken },
      );

      const newAccessToken = res.data.access;
      config.headers.Authorization = `Bearer ${newAccessToken}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const login_obj = await AsyncStorage.getItem("login_obj");

        if (!login_obj) {
          return Promise.reject(error);
        }

        const parsed = JSON.parse(login_obj);
        const refreshToken = parsed.data?.refreshToken;

        if (!refreshToken) {
          return Promise.reject(error);
        }

        const res = await axios.post(
          "https://dataappback.onrender.com/api/v1/auth/refresh/",
          { refresh: refreshToken },
        );

        const newAccessToken = res.data.access;

        // preserve full object
        await AsyncStorage.setItem(
          "login_obj",
          JSON.stringify({
            data: {
              accessToken: newAccessToken,
              refreshToken: refreshToken,
              user: parsed.data.user,
            },
          }),
        );

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.removeItem("login_obj");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
