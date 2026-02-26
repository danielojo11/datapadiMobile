import { Stack } from "expo-router";
import { AuthProvider } from "./context/AppContext";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen name="(provider)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </>
  );
}
