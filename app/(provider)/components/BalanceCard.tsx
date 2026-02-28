import { View, Text, StyleSheet } from "react-native";
import React from "react";

const BalanceCard = ({
  user_name,
  tier,
}: {
  user_name: string;
  tier: string;
}) => {
  const firstName = user_name ? user_name.split(" ")[0] : "User";
  const initial = firstName ? firstName.charAt(0).toUpperCase() : "U";

  const formattedTier = tier ? tier.replace(/_/g, " ").toUpperCase() : "USER";

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.greetingText}>Hi, {firstName} 👋</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{formattedTier}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "600",
  },
  infoContainer: {
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  tierBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  tierText: {
    color: "#1D4ED8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});

export default BalanceCard;
