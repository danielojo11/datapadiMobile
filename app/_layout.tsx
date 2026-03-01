import { Stack } from "expo-router";
import { AuthProvider } from "./context/AppContext";
import { SocketProvider } from "./context/SocketContext";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <SocketProvider>
          <StatusBar style="dark" />
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
