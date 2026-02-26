import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  networkName: string;
  planName: string;
  cardsGenerated: number;
  totalValue: string;
};

const CardSummaryHeader: React.FC<Props> = ({
  networkName,
  planName,
  cardsGenerated,
  totalValue,
}) => {
  return (
    <View style={styles.container}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>{networkName.charAt(0)}</Text>
        </View>

        <View>
          <Text style={styles.planTitle}>
            {networkName} {planName}
          </Text>
          <Text style={styles.subText}>{cardsGenerated} Cards generated</Text>
        </View>
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        <Text style={styles.totalLabel}>TOTAL VALUE</Text>
        <Text style={styles.totalAmount}>{totalValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FACC15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  planTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  subText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  rightSection: {
    alignItems: "flex-end",
  },

  totalLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 2,
  },

  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D4ED8",
  },
});

export default CardSummaryHeader;
