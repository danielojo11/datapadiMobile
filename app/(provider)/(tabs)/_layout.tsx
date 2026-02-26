import { View, Text } from "react-native";
import React from "react";
import { Stack, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

const _layout = () => {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="home" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="print"
          options={{
            title: "Print",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="print-outline" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="time-outline" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="person-outline" color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
};

export default _layout;
