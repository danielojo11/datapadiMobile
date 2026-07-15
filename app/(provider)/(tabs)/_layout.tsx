import { View, TouchableOpacity, Platform } from "react-native";
import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from "react-native-reanimated";

const TabBarItem = ({ route, options, isFocused, onPress, onLongPress, isProfile }: any) => {
  const scale = useSharedValue(isFocused ? 1 : 1);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.15 : 1, { damping: 12, stiffness: 150 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = route.name === "index" ? "home"
      : route.name === "flight" ? "airplane"
      : route.name === "print" ? "print"
      : route.name === "history" ? "time"
      : route.name === "profile" ? "person"
      : "alert";
      
  const outlineIconName = route.name === "index" ? "home-outline"
      : route.name === "flight" ? "airplane-outline"
      : route.name === "print" ? "print-outline"
      : route.name === "history" ? "time-outline"
      : route.name === "profile" ? "person-outline"
      : "alert-outline";

  // Determine icon color based on its location and state
  let iconColor = "#94A3B8"; // Inactive
  if (isProfile) {
    iconColor = "#2563EB"; // Always blue in the profile circle
  } else if (isFocused) {
    iconColor = "#FFFFFF"; // White when active inside the dark pill
  }

  return (
    <TouchableOpacity
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      className={`items-center justify-center ${isProfile ? 'flex-1' : 'flex-1 h-[56px]'}`}
    >
      <Animated.View style={animatedIconStyle} className="items-center justify-center">
        <Ionicons
          name={isFocused ? iconName : outlineIconName}
          size={isProfile ? 24 : 20}
          color={iconColor}
          style={[route.name === "flight" && { transform: [{ rotate: "-45deg" }] }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const mainRoutes = state.routes.slice(0, 4);
  const profileRoute = state.routes[4];

  const renderTab = (route: any, index: number, isProfile: boolean) => {
    const { options } = descriptors[route.key];
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

    return (
      <TabBarItem 
        key={route.key}
        route={route} 
        options={options} 
        isFocused={isFocused} 
        onPress={onPress} 
        onLongPress={onLongPress} 
        isProfile={isProfile}
      />
    );
  };

  return (
    <View className={`absolute left-5 right-5 z-50 flex-row justify-between items-center ${Platform.OS === 'ios' ? 'bottom-8' : 'bottom-6'}`}>
      {/* Main Routes Pill */}
      <View className="flex-1 rounded-full mr-3 h-[56px] overflow-hidden shadow-2xl shadow-black/30 border border-white/20" style={{ elevation: 15 }}>
        <BlurView tint="dark" intensity={80} style={{ position: 'absolute', width: '100%', height: '100%' }} />
        <View className="flex-1 flex-row items-center justify-around px-1 w-full h-full">
          {mainRoutes.map((route, index) => renderTab(route, index, false))}
        </View>
      </View>

      {/* Profile Circle */}
      <View className="w-[56px] h-[56px] rounded-full bg-white dark:bg-card items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.2)] border border-slate-100 dark:border-slate-800" style={{ elevation: 15 }}>
        {profileRoute && renderTab(profileRoute, 4, true)}
      </View>
    </View>
  );
};

export default function TabsLayout() {
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
}
