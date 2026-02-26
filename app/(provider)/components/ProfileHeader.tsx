import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileHeader({
  name,
  email,
  isKYCVerified,
  onPush,
}: {
  name: string;
  email: string;
  isKYCVerified: boolean;
  onPush: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: "https://i.pravatar.cc/150" }}
          style={styles.avatar}
        />
        <View style={styles.smallIcon}>
          <Ionicons name="person" size={14} color="#fff" />
        </View>
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name}>{name}</Text>
        <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
      </View>

      <Text style={styles.email}>{email}</Text>

      {isKYCVerified ? (
        <View style={styles.kycBadge}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#16A34A" />
          <Text style={styles.kycText}>KYC Verified</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={{
            ...styles.kycBadge,
            backgroundColor: "#F2E3B9",
            borderColor: "#FCFAF2",
          }}
          onPress={onPush}
        >
          <Ionicons name="alert-circle-outline" size={16} color="#D66A2C" />
          <Text
            style={{ ...styles.kycText, color: "#D66A2C", fontWeight: "bold" }}
          >
            Action Required. Verify Identity
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  smallIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563EB",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  email: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  kycBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    gap: 4,
  },
  kycText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "500",
  },
});
