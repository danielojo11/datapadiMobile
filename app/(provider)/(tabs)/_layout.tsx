import { View, Text } from "react-native";
import React from "react";
import { Stack, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const iconName =
            route.name === "index"
              ? "home-outline"
              : route.name === "flight"
                ? "airplane-outline"
                : route.name === "print"
                  ? "print-outline"
                  : route.name === "history"
                    ? "time-outline"
                    : route.name === "profile"
                      ? "person-outline"
                      : "alert-outline";

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              {/* Background Pill */}
              {isFocused && <View style={styles.activePill} />}

              <View style={styles.contentContainer}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? "#2563eb" : "#64748b"}
                  style={[route.name === "flight" && { transform: [{ rotate: "-45deg" }] }]}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? "#2563eb" : "#64748b" },
                  ]}
                >
                  {label as string}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const _layout = () => {
  return (
    <SafeAreaProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="flight" options={{ title: "Flight" }} />
        <Tabs.Screen name="print" options={{ title: "Print" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 32 : 24,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 32,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    position: "relative",
  },
  activePill: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 4,
    right: 4,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4,
  },
});

export default _layout;
