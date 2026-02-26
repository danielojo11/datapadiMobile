import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const IdentityVerification = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [bvn, setBvn] = useState("");

  const formatBVN = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const spaced = cleaned.split("").join(" ");
    return spaced.slice(0, 22); // 11 digits spaced
  };

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <ScrollView>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.handle} />

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#555" />
            </TouchableOpacity>

            {/* Shield Icon */}
            <View style={styles.iconWrapper}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
              </View>
              <View style={styles.alertBadge}>
                <Ionicons name="alert" size={14} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>Identity Verification</Text>

            <Text style={styles.subtitle}>
              Please provide your details exactly as they appear on your{" "}
              <Text style={styles.link}>BVN record</Text> to unlock your
              dedicated bank account.
            </Text>

            {/* Error Banner */}
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color="#E53935"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.errorText}>
                Failed to create dedicated account. Please check your BVN.
              </Text>
            </View>

            {/* Name Fields */}
            <View style={styles.row}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#888" />
                  <TextInput style={styles.input} placeholder="First name" />
                </View>
              </View>

              <View style={styles.inputHalf}>
                <Text style={styles.label}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#888" />
                  <TextInput style={styles.input} placeholder="Last name" />
                </View>
              </View>
            </View>

            {/* BVN */}
            <Text style={styles.label}>BVN</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#888" />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={22}
                value={formatBVN(bvn)}
                onChangeText={(text) =>
                  setBvn(text.replace(/\s/g, "").slice(0, 11))
                }
                placeholder="1 2 3 4 5 6 7 8 9 0 1"
              />
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#2F6BFF"
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>CBN Regulation Compliance</Text>
                <Text style={styles.infoText}>
                  Your BVN is encrypted before storage. We use it only to
                  generate your permanent bank account.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.primaryButton,
                bvn.replace(/\s/g, "").length !== 11 &&
                  styles.primaryButtonDisabled,
              ]}
              disabled={bvn.replace(/\s/g, "").length !== 11}
            >
              <Text style={styles.primaryButtonText}>Verify Identity Now</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.laterWrapper}>
              <Text style={styles.laterText}>I’ll do this later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

export default IdentityVerification;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 45,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginVertical: 12,
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    top: 12,
    backgroundColor: "#F2F2F2",
    padding: 8,
    borderRadius: 20,
  },
  iconWrapper: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2F6BFF",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBadge: {
    position: "absolute",
    bottom: 5,
    right: 120,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1C",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  link: {
    color: "#2F6BFF",
    fontWeight: "600",
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FDECEC",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#E53935",
    fontSize: 13,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  inputHalf: {
    width: "48%",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#EEF4FF",
    padding: 15,
    borderRadius: 14,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 3,
  },
  infoText: {
    fontSize: 12,
    color: "#3B82F6",
    lineHeight: 16,
  },
  primaryButton: {
    width: "100%",
    height: 58,
    backgroundColor: "#0F0F0F",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 10,
  },

  primaryButtonDisabled: {
    backgroundColor: "#1E1E1E",
    opacity: 0.6,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  laterWrapper: {
    marginTop: 18,
    alignItems: "center",
  },

  laterText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
