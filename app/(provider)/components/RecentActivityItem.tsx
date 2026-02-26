import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type RecentActivityItemProps = {
  iconName?: any;
  iconColor?: any;
  title: String;
  subtitle: String;
  amount: String;
};

export default function RecentActivityItem({
  iconName = "wifi-outline",
  iconColor = "#2563EB",
  title,
  subtitle,
  amount,
}: RecentActivityItemProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        marginVertical: 5,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons
          name={iconName}
          size={24}
          color={iconColor}
          style={{ marginRight: 12 }}
        />
        <View>
          <Text style={{ fontWeight: "bold", fontSize: 14 }}>{title}</Text>
          <Text style={{ color: "#6B7280", fontSize: 12 }}>{subtitle}</Text>
        </View>
      </View>
      <Text style={{ fontWeight: "bold", color: "#111827" }}>{amount}</Text>
    </View>
  );
}
