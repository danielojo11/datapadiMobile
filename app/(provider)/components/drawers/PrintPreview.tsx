import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from "react-native";

const PrintPreview = ({ visible, onClose }) => {
  // Dummy data for the preview grid
  const vouchers = [
    {
      id: "1",
      network: "MTN",
      pin: "1234 5678 9012...",
      price: "₦100",
      ussd: "*555*#",
    },
    {
      id: "2",
      network: "MTN",
      pin: "9876 5432 1098...",
      price: "₦100",
      ussd: "*555*#",
    },
    {
      id: "3",
      network: "MTN",
      pin: "4567 8901 2345...",
      price: "₦100",
      ussd: "*555*#",
    },
    {
      id: "4",
      network: "MTN",
      pin: "2345 6789 0123...",
      price: "₦100",
      ussd: "*555*#",
    },
    {
      id: "5",
      network: "MTN",
      pin: "6789 0123 4567...",
      price: "₦100",
      ussd: "*555*#",
    },
    {
      id: "6",
      network: "AIRTEL",
      pin: "1111 2222 3333...",
      price: "₦200",
      ussd: "*126*#",
    },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Inventory Print Preview</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerIconBox}>
                <Text style={styles.bannerIcon}>⊞</Text>
              </View>
              <View>
                <Text style={styles.bannerTitle}>Batch Printing Ready</Text>
                <Text style={styles.bannerSubtitle}>
                  2 Batches • 8 Total Vouchers
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TOTAL PINS</Text>
                <Text style={styles.statValueDark}>8</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TOTAL VALUE</Text>
                <Text style={styles.statValueBlue}>₦1,100</Text>
              </View>
            </View>

            {/* Layout Preview Area */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewHeader}>LIVE A4 LAYOUT PREVIEW</Text>

              <View style={styles.grid}>
                {vouchers.map((v) => (
                  <View key={v.id} style={styles.voucherCard}>
                    <View style={styles.voucherTop}>
                      <Text style={styles.brandText}>DATAPADI</Text>
                      <View
                        style={[
                          styles.networkBadge,
                          v.network === "AIRTEL" && { backgroundColor: "#333" },
                        ]}
                      >
                        <Text style={styles.networkText}>{v.network}</Text>
                      </View>
                    </View>

                    <View style={styles.pinContainer}>
                      <Text style={styles.pinLabel}>VOUCHER PIN</Text>
                      <Text style={styles.pinText}>{v.pin}</Text>
                    </View>

                    <View style={styles.voucherBottom}>
                      <Text style={styles.metaText}>{v.price}</Text>
                      <Text style={styles.metaText}>{v.ussd}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.morePill}>
                <Text style={styles.morePillText}>
                  + 2 more vouchers in this run
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.printButton}>
              <Text style={styles.printButtonText}>
                <Ionicons
                  name="print-outline"
                  size={24}
                  style={{ verticalAlign: "middle" }}
                />{" "}
                Print 8 Vouchers
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%", // Ensures it doesn't cover the entire screen
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    backgroundColor: "#F3F4F6",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  banner: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  bannerIcon: {
    color: "#FFFFFF",
    fontSize: 20,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2, // For Android subtle shadow
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statValueDark: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  statValueBlue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563EB",
  },
  previewContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewHeader: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  voucherCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    marginBottom: 12,
  },
  voucherTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  brandText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#2563EB",
  },
  networkBadge: {
    backgroundColor: "#111827",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  networkText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
  pinContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  pinLabel: {
    fontSize: 8,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 4,
  },
  pinText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 1,
  },
  voucherBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 8,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  morePill: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 4,
  },
  morePillText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    paddingBottom: 30, // Extra padding for safe area at the bottom of devices
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  printButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  printButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PrintPreview;
