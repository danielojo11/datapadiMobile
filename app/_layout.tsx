import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { AuthProvider } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import { StatusBar } from "expo-status-bar";
import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useContext, useEffect, useRef, useState } from "react";
import * as Updates from "expo-updates";
import { AuthContext } from "./context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetworkBanner from "./components/NetworkBanner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import PushNotificationModal from "./(provider)/components/drawers/PushNotificationModal";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

cssInterop(SafeAreaView, { className: "style" });
cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.Text, { className: "style" });

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuthenticated } = useContext(AuthContext);

  const [showPushModal, setShowPushModal] = useState(false);
  const { registerAndSaveToken } = usePushNotifications();

  useEffect(() => {
    async function checkPermissions() {
      if (isAuthenticated) {
        try {
          const { status } = await Notifications.getPermissionsAsync();
          if (status === "granted") {
            // Already granted, silently register and sync token
            await registerAndSaveToken();
          } else {
            // Not granted, check if we've softly prompted before
            const hasPrompted = await AsyncStorage.getItem("hasPromptedForPush");
            if (hasPrompted !== "true") {
              setShowPushModal(true);
            }
          }
        } catch (error) {
          console.log("Push token error:", error);
        }
      }
    }

    checkPermissions();
  }, [isAuthenticated, registerAndSaveToken]);

  const handleAllowPush = async () => {
    setShowPushModal(false);
    await AsyncStorage.setItem("hasPromptedForPush", "true");
    await registerAndSaveToken();
  };

  const handleSkipPush = async () => {
    setShowPushModal(false);
    await AsyncStorage.setItem("hasPromptedForPush", "true");
  };

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <StatusBar style="dark" />
            <NetworkBanner />
            <PushNotificationModal 
              visible={showPushModal} 
              onClose={handleSkipPush} 
              onAllow={handleAllowPush} 
            />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(provider)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="forgot" options={{ headerShown: false }} />
            </Stack>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
