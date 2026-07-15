import { View, Text } from "react-native";
import React, { useContext } from "react";
import { Redirect, Stack } from "expo-router";
import { AuthContext } from "../context/AppContext";

const ProviderLayout = () => {
  const authState = useContext(AuthContext);
  if (!authState.isReady) {
    return null;
  }
  if (!authState.isAuthenticated) {
    return <Redirect href={"/login"} />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: "simple_push",
        }}
      />
      <Stack.Screen
        name="flight-history"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="flight-details"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="help-support"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="referrals"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="beneficiaries"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="buy-airtime"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="buy-data"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="cable-tv"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="electricity"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="education"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
};

export default ProviderLayout;
