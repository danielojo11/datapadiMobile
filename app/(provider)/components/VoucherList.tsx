import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import VoucherCard from "./VoucherCard";

type Voucher = {
  id: string;
  serialNumber: string;
  pin: string;
};

type Props = {
  vouchers: Voucher[];
  network: string;
  amount: string;
};

const VoucherList: React.FC<Props> = ({ vouchers, network, amount }) => {
  const handleCopy = async (pin: string) => {
    await Clipboard.setStringAsync(pin);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Voucher Previews</Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color="#1D4ED8"
          />
          <Text style={styles.copyHint}>Click PIN to Copy</Text>
        </View>
      </View>

      {/* Voucher List */}
      <FlatList
        data={vouchers}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Important since parent scrolls
        renderItem={({ item }) => (
          <VoucherCard
            serialNumber={item.serialNumber}
            pin={item.pin}
            network={network}
            amount={amount}
            onCopy={handleCopy}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  copyHint: {
    marginLeft: 4,
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "600",
  },
});

export default VoucherList;
