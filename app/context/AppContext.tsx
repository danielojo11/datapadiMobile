import { SplashScreen, useRouter } from "expo-router";
import React, {
  createContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "../utils/auth/login";
import { refreshUser } from "../utils/auth/refresh";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { registerPushToken } from "../utils/user";

SplashScreen.preventAutoHideAsync();

type AuthState = {
  isAuthenticated: boolean;
  isReady: boolean;
  userCredentials: { email: string; password: string } | null;
  login: (credentials?: any) => Promise<any>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isReady: false,
  userCredentials: null,
  login: async () => { return { success: false } },
  logout: async () => { },
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCredentials, setUserCredentials] = useState<{ email: string; password: string } | null>(null);

  const router = useRouter();

  /**
   * Store auth boolean only
   */
  const storeAuthState = async (authState: boolean) => {
    try {
      await AsyncStorage.setItem("isAuthenticated", JSON.stringify(authState));
    } catch (error) {
      console.log("Error storing auth state:", error);
    }
  };

  /**
   * LOGIN
   * Pulls credentials from AsyncStorage
   * Assumes credentials were previously stored under key "credentials"
   */
  const login = async (credentials?: any) => {
    try {
      let emailArg = credentials?.email;
      let passwordArg = credentials?.password;

      // Fallback to async storage if no credentials passed strictly (legacy support)
      if (!emailArg || !passwordArg) {
        const storedCredentials = await AsyncStorage.getItem("credentials");
        if (storedCredentials) {
          const { email, password } = JSON.parse(storedCredentials);
          emailArg = email;
          passwordArg = password;
        } else {
          return { success: false, error: "No credentials provided" };
        }
      }

      const response = await loginUser({
        email: emailArg,
        password: passwordArg,
      });
      console.log("Login response:", response);

      if (response && response.success) {
        // Store login response
        await AsyncStorage.setItem("login_obj", JSON.stringify(response.data));

        // Persist auth state
        await storeAuthState(true);

        setIsAuthenticated(true);
        setUserCredentials({ email: emailArg, password: passwordArg });
        await AsyncStorage.removeItem("credentials");

        router.replace("/(provider)" as any);
        return response;
      }

      return response;

    } catch (error: any) {
      console.log("Login failed:", error);
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  /**
   * LOGOUT
   */
  const logout = async () => {
    try {
      let pushToken = undefined;
      const notifEnabled = await AsyncStorage.getItem("notifications_enabled");
      if (notifEnabled === "true") {
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;
          const pushTokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
          pushToken = pushTokenData?.data;
        } catch (e) {
          console.log("Failed to fetch push token for logout cleanup", e);
        }
      }

      try {
        const { default: api } = await import("../utils/api");
        await api.post("/auth/logout", { pushToken });
      } catch (e) {
        console.log("Backend logout failed:", e);
      }

      await AsyncStorage.removeItem("login_obj");
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("credentials");
      
      // Clear push notification state on logout to prevent state leakage to next user
      await AsyncStorage.removeItem("notifications_enabled");
      await AsyncStorage.removeItem("hasPromptedForPush");
      
      await storeAuthState(false);
      setIsAuthenticated(false);
      setUserCredentials(null);
      router.replace("/login"); // adjust if your login route differs
    } catch (error) {
      console.log("Logout failed:", error);
    }
  };

  /**
   * Clear auth on launch (Logged out when app closes/restarts)
   */
  useEffect(() => {
    const clearAuthOnLaunch = async () => {
      try {
        // Remove stored auth state and tokens
        await AsyncStorage.removeItem("isAuthenticated");
        await AsyncStorage.removeItem("login_obj");
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");

        // Ensure state is unauthenticated
        setIsAuthenticated(false);
      } catch (error) {
        console.log("Error clearing auth state on launch:", error);
      } finally {
        setIsReady(true);
      }
    };

    clearAuthOnLaunch();
  }, []);

  /**
   * Hide splash screen when ready
   */
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isReady,
        userCredentials,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
