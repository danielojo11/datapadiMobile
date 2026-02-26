import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "@/app/context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function LogoutVersion() {
  const router = useRouter();
  const handledLogout = async () => {
    try {
      await AsyncStorage.removeItem("login_obj");
      await AsyncStorage.setItem("isAuthenticated", JSON.stringify(false));
      router.replace("/login");
    } catch (error) {
      console.log(error);
    }
  };
  const authState = useContext(AuthContext);
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: authState.logout,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: "center",
  },

  logoutButton: {
    width: "100%",
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },

  version: {
    marginTop: 20,
    fontSize: 13,
    color: "#9CA3AF",
  },
});
