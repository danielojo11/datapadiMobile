import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

type WalletProps = {
  balance: number;
  todaySpent: number;
  onFundWallet: () => void;
};

export default function WalletCard({
  balance,
  todaySpent,
  onFundWallet,
}: WalletProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <LinearGradient
      colors={["#1E4ED8", "#1e3a8a", "#0f172a", "#050B14"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Left Side: Balance Info */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity onPress={() => setHidden(!hidden)} hitSlop={10}>
              <Ionicons
                name={hidden ? "eye-off-outline" : "eye-outline"}
                size={16}
                color="rgba(255, 255, 255, 0.7)"
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {hidden ? "****" : `₦${Number(balance).toLocaleString()}`}
          </Text>
        </View>

        {/* Right Side: Today Spent Info */}
        <View style={styles.spentContainer}>
          <Text style={styles.spentLabel}>TODAY SPENT</Text>
          <View style={styles.spentAmountRow}>
            <Ionicons name="trending-up" size={14} color="white" />
            <Text style={styles.spentAmount}>
              ₦{Number(todaySpent || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Fund Wallet Button */}
      <TouchableOpacity onPress={onFundWallet} style={styles.fundButton} activeOpacity={0.8}>
        <Text style={styles.fundButtonText}>+ Fund Wallet</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#1E4ED8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  balanceContainer: {
    flex: 1,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    fontWeight: "500",
  },
  eyeIcon: {
    marginLeft: 8,
  },
  balanceAmount: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: -1.5,
  },
  spentContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "flex-end",
  },
  spentLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  spentAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  spentAmount: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginVertical: 20,
  },
  fundButton: {
    backgroundColor: "white",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
  },
  fundButtonText: {
    color: "#050B14",
    fontSize: 16,
    fontWeight: "700",
  },
});
