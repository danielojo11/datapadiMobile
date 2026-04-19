import React from "react";
import { TouchableOpacity, Text, View, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type QuickActionButtonProps = {
  iconName: any;
  iconColor: any;
  label: string;
  onPress: () => void;
};

export default function QuickActionButton({
  iconName,
  iconColor,
  label,
  onPress,
}: QuickActionButtonProps) {
  // Simple heuristic for tint background if colors are Hex
  // Just slapping '1A' to a hex string adds ~10% opacity in React Native
  const tintColor = typeof iconColor === 'string' && iconColor.startsWith('#')
    ? `${iconColor}1A`
    : "#F1F5F9";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: "30%",
        marginHorizontal: "1.66%",
        marginBottom: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 20, // Taller rounded rectangle 
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 4,
        shadowColor: "#94a3b8",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#f8fafc",
      }}
    >
      <View style={{
        backgroundColor: tintColor,
        width: 52,
        height: 52,
        borderRadius: 26, // Perfect circle
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12
      }}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <Text
        style={{ fontWeight: "700", fontSize: 12, color: "#1e293b", textAlign: "center" }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
