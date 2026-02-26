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
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isReady: false,
  login: async () => {},
  logout: async () => {},
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
  const login = async () => {
    try {
      const storedCredentials = await AsyncStorage.getItem("credentials");

      if (!storedCredentials) {
        throw new Error("No stored credentials found");
      }

      const { email, password } = JSON.parse(storedCredentials);

      const response = await loginUser({
        email,
        password,
      });

      // Store login response
      await AsyncStorage.setItem("login_obj", JSON.stringify(response));

      // Persist auth state
      await storeAuthState(true);

      setIsAuthenticated(true);
      await AsyncStorage.removeItem("credentials");

      router.replace("/");
    } catch (error) {
      console.log("Login failed:", error);
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
