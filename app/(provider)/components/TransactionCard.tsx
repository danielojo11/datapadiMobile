import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

type TransactionType = "wifi" | "print" | "wallet" | "airtime" | undefined;

type TransactionCardProps = {
  type: TransactionType;
  title: string;
  date: string;
  amount: string;
  status: string;
};

export default function TransactionCard({
  type,
  title,
  date,
  amount,
  status,
}: TransactionCardProps) {
  const isCredit = amount.startsWith("+");
  const isSuccess = status === "SUCCESS";

  const renderIcon = () => {
    switch (type) {
      case "wifi":
        return <Ionicons name="wifi-outline" size={20} color="#2563EB" />;
      case "print":
        return <MaterialIcons name="print" size={20} color="#2563EB" />;
      case "wallet":
        return <Feather name="arrow-up-right" size={20} color="#16A34A" />;
      case "airtime":
        return <Feather name="smartphone" size={20} color="#2563EB" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>{renderIcon()}</View>

        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: isCredit ? "#16A34A" : "#000" }]}>
          {amount}
        </Text>

        <Text
          style={[styles.status, { color: isSuccess ? "#16A34A" : "#DC2626" }]}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    margin: 4,
    marginTop: 0,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0px 0px 3px 0px #d2d0d0cb",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontWeight: "600",
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontWeight: "700",
    fontSize: 14,
  },
  status: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
});
