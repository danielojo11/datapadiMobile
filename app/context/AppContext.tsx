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

SplashScreen.preventAutoHideAsync();

type AuthState = {
  isAuthenticated: boolean;
  isReady: boolean;
  login: (credentials?: any) => Promise<any>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isReady: false,
  login: async () => { return { success: false } },
  logout: async () => { },
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

      if (response && response.data.status === "OK") {
        // Store login response
        await AsyncStorage.setItem("login_obj", JSON.stringify(response));

        // Persist auth state
        await storeAuthState(true);

        setIsAuthenticated(true);
        await AsyncStorage.removeItem("credentials");

        router.replace("/");
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
      await AsyncStorage.removeItem("login_obj");
      await storeAuthState(false);
      setIsAuthenticated(false);
      router.replace("/login"); // adjust if your login route differs
    } catch (error) {
      console.log("Logout failed:", error);
    }
  };

  /**
   * Rehydrate auth state on app start
   */
  useEffect(() => {
    const getAuthFromStorage = async () => {
      try {
        const value = await AsyncStorage.getItem("isAuthenticated");

        if (value !== null) {
          const parsed = JSON.parse(value);
          setIsAuthenticated(parsed);
        }
      } catch (error) {
        console.log("Error loading auth state:", error);
      } finally {
        setIsReady(true);
      }
    };

    getAuthFromStorage();
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
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
