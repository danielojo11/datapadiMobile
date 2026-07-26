import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useContext, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert } from "react-native";
import "../global.css";
import NetworkBanner from "./components/NetworkBanner";
import { AuthContext, AuthProvider } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import { UpdateProvider, UpdateContext } from "./context/UpdateContext";

import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import PushNotificationModal from "./(provider)/components/drawers/PushNotificationModal";
import UpdatePromptModal from "./components/UpdatePromptModal";
import UpdateAvailableModal from "./components/UpdateAvailableModal";
import { usePushNotifications } from "./hooks/usePushNotifications";

cssInterop(SafeAreaView, { className: "style" });
cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.Text, { className: "style" });

const queryClient = new QueryClient();

// This component handles the OTA update lifecycle safely after providers mount
function OtaUpdateManager() {
  const { checkForUpdates } = useContext(UpdateContext);
  
  useEffect(() => {
    // Wait slightly to ensure navigation and everything is ready
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

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
    // Hide the modal so it doesn't block the OS prompt or look stuck
    setShowPushModal(false);
    await AsyncStorage.setItem("hasPromptedForPush", "true");
    
    // Request permission and register token
    await registerAndSaveToken();
    
    // Check if they actually granted it
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") {
      await AsyncStorage.setItem("notifications_enabled", "true");
    } else {
      Alert.alert("Permission required", "Please enable notifications in your device settings.");
    }
  };

  const handleSkipPush = async () => {
    setShowPushModal(false);
    await AsyncStorage.setItem("hasPromptedForPush", "true");
  };

  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [updateType, setUpdateType] = useState<'STORE' | 'OTA'>('STORE');
  const [latestAppVersion, setLatestAppVersion] = useState<string | undefined>();

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        // 1. Check Store Version (Native Update)
        const response = await fetch("https://api.muftipay.com/api/v1/settings/version");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch version: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();

        const latestVersion = data.latestVersion || data.version;
        const currentVersion = "0.0.1"

        if (latestVersion && currentVersion && latestVersion !== currentVersion) {
          setLatestAppVersion(latestVersion);
          setUpdateType('STORE');
          setIsUpdateModalVisible(true);
          return; // Prioritize store update
        }
      } catch (error) {
        console.log("Error checking for native store updates:", error);
      }
    };

    checkUpdates();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <UpdateProvider>
              <OtaUpdateManager />
              <StatusBar style="dark" />
              <NetworkBanner />
            <PushNotificationModal
              visible={showPushModal}
              onClose={handleSkipPush}
              onAllow={handleAllowPush}
            />
            <UpdatePromptModal
              visible={isUpdateModalVisible}
              onClose={() => setIsUpdateModalVisible(false)}
              type={updateType}
              latestVersion={latestAppVersion}
            />
            <UpdateAvailableModal />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(provider)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="forgot" options={{ headerShown: false }} />
            </Stack>
            </UpdateProvider>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
