import { Stack } from "expo-router";
import { AuthProvider } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useContext, useEffect, useRef, useState } from "react";
import * as Updates from "expo-updates";
import { registerForPushNotificationsAsync } from "./utils/notifications";
import { AuthContext } from "./context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetworkBanner from "./components/NetworkBanner";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

import { handleForegroundNotification, handleNotificationResponse } from "./utils/notificationHandler";

export default function RootLayout() {
  const [expoPushToken, setExpoPushToken] = useState("");

  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    async function register() {
      if (isAuthenticated) {
        try {
          const authToken = await AsyncStorage.getItem("accessToken");
          if (authToken) {
            const token = await registerForPushNotificationsAsync(authToken);
            setExpoPushToken(token ?? "");
          }
        } catch (error) {
          console.log("Push token error:", error);
        }
      }
    }

    register();

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
  }, [isAuthenticated]);

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
