import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type QuickActionButtonProps = {
  iconName: any;
  iconColor: any;
  label: String;
  onPress: () => void;
};

export default function QuickActionButton({
  iconName,
  iconColor,
  label,
  onPress,
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        margin: 5,
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        width: 150,
        height: 100,
      }}
    >
      <View style={{ marginBottom: 10 }}>
        <Ionicons name={iconName} size={28} color={iconColor} />
      </View>
      <Text style={{ fontWeight: "bold" }}>{label}</Text>
    </TouchableOpacity>
  );
}
