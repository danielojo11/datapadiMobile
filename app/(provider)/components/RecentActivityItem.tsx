import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type RecentActivityItemProps = {
  iconName?: any;
  iconColor?: any;
  title: String;
  subtitle: String;
  amount: String;
  type: string;
};

const getIconConfig = (type: string) => {
  switch (type) {
    case 'DATA': return { icon: "wifi", bg: '#EFF6FF', color: '#2563EB' };
    case 'AIRTIME': return { icon: "phone-portrait-outline", bg: '#ECFDF5', color: '#059669' };
    case 'CABLE_TV': return { icon: "tv-outline", bg: '#FAF5FF', color: '#9333EA' };
    case 'ELECTRICITY': return { icon: "flash-outline", bg: '#FFFBEB', color: '#D97706' };
    case 'WALLET_FUNDING': return { icon: "card-outline", bg: '#FFF7ED', color: '#EA580C' };
    default: return { icon: "receipt-outline", bg: '#F9FAFB', color: '#4B5563' };
  }
};

export default function RecentActivityItem({
  title,
  subtitle,
  amount,
  type
}: RecentActivityItemProps) {
  const config = getIconConfig(type);
  const isFunding = type === "WALLET_FUNDING";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#F9FAFB",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: config.bg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <Ionicons
            name={config.icon as any}
            size={20}
            color={config.color}
          />
        </View>
        <View>
          <Text style={{ fontWeight: "bold", color: "#111827", fontSize: 14 }}>
            {title || (type ? type.replace('_', ' ') : "Transaction")}
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "500", marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{
          fontWeight: "bold",
          fontSize: 14,
          color: isFunding ? "#059669" : "#111827"
        }}>
          {isFunding ? "+" : "-"}{amount?.toString().startsWith("₦") ? '' : '₦'}{amount}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#D1D5DB"
          style={{ marginLeft: 12 }}
        />
      </View>
    </TouchableOpacity>
  );
}
