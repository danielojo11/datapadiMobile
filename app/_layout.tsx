import { Stack } from "expo-router";
import { AuthProvider } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import { StatusBar } from "expo-status-bar";
import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useContext, useEffect, useRef, useState } from "react";
import * as Updates from "expo-updates";
import { registerForPushNotificationsAsync } from "./utils/notifications";
import { AuthContext } from "./context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetworkBanner from "./components/NetworkBanner";
import firebase from "@react-native-firebase/app";

// Notification handler is configured in app/utils/notifications.js

import { handleForegroundNotification, handleNotificationResponse } from "./utils/notificationHandler";

export default function RootLayout() {
  const [expoPushToken, setExpoPushToken] = useState("");

  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    try {
      console.log("Firebase App Name:", firebase.app().name);
    } catch (error) {
      console.warn("Firebase initialization error:", error);
    }
  }, []);

  useEffect(() => {
    async function register() {
      if (isAuthenticated) {
        try {
          let authToken = await AsyncStorage.getItem("accessToken");

          if (!authToken) {
            const loginObjStr = await AsyncStorage.getItem("login_obj");
            if (loginObjStr) {
              const parsed = JSON.parse(loginObjStr);
              authToken = parsed.data?.accessToken || parsed.accessToken;
            }
          }

          if (authToken) {
            const token = await registerForPushNotificationsAsync(authToken);
            setExpoPushToken(token ?? "");
          } else {
            console.log("No auth token resolved, skipping push registration in layout.");
          }
        } catch (error) {
          console.log("Push token error:", error);
        }
      }
    }

    register();
  }, [isAuthenticated]);

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      handleForegroundNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log(`Error fetching latest Expo update: ${error}`);
      }
    }

    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Fetch the latest version from the backend
        const response = await fetch("https://api.muftipay.com/api/v1/settings/version");
        const data = await response.json();

        // Use the version from the backend or a default if not found
        const latestVersion = data.latestVersion || data.version;
        const currentVersion = Constants.expoConfig?.version;

        // If versions don't match, prompt the user (you can also use semver comparison)
        if (latestVersion && currentVersion && latestVersion !== currentVersion) {
          Alert.alert(
            "Update Available",
            `A new version (${latestVersion}) of MUFTI PAY is available. Please update to the latest version for the best experience.`,
            [
              { text: "Later", style: "cancel" },
              {
                text: "Update Now",
                onPress: () => {
                  const url = Platform.OS === 'android'
                    ? 'https://play.google.com/store/apps/details?id=com.daniel_ojo.datapadi'
                    : 'https://play.google.com/store/apps/details?id=com.daniel_ojo.datapadi'; // Replace with actual iOS link if needed
                  Linking.openURL(url);
                }
              }
            ]
          );
        }
      } catch (error) {
        console.log("Error checking for native updates:", error);
      }
    };

    if (!__DEV__) {
      checkVersion();
    }
  }, []);

  return (
    <>
      <AuthProvider>
        <SocketProvider>
          <StatusBar style="dark" />
          <NetworkBanner />
          <Stack>
            <Stack.Screen name="(provider)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="forgot" options={{ headerShown: false }} />
          </Stack>
        </SocketProvider>
      </AuthProvider>
    </>
  );
}
