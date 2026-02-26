import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  serialNumber: string;
  pin: string;
  network: string;
  amount: string;
  onCopy: (pin: string) => void;
};

const VoucherCard: React.FC<Props> = ({
  serialNumber,
  pin,
  network,
  amount,
  onCopy,
}) => {
  const formatPin = (value: string) => {
    return value.replace(/(.{4})/g, "$1 ").trim();
  };

  return (
    <View style={styles.card}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <Text style={styles.voucherLabel}>DATAPADI VOUCHER</Text>

        <View style={styles.snBadge}>
          <Text style={styles.snText}>SN: {serialNumber}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.dashedDivider} />

      {/* Recharge Pin */}
      <Text style={styles.rechargeLabel}>RECHARGE PIN</Text>

      <View style={styles.pinRow}>
        <Text style={styles.pinText}>{formatPin(pin)}</Text>

        <TouchableOpacity
          style={styles.copyBtn}
          onPress={() => onCopy(pin)}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomRow}>
        <Text style={styles.loadText}>
          To Load: <Text style={styles.bold}>*555*PIN#</Text>
        </Text>

        <Text style={styles.networkText}>
          {network} • {amount}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  voucherLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  snBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  snText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },

  dashedDivider: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 14,
  },

  rechargeLabel: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
  },

  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  pinText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#111827",
  },

  copyBtn: {
    marginLeft: 10,
  },

  bottomRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  loadText: {
    fontSize: 12,
    color: "#6B7280",
  },

  networkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  bold: {
    fontWeight: "700",
  },
});

export default VoucherCard;
