import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="w-1/4 mb-5 items-center justify-start"
    >
      <View
        className="w-[52px] h-[52px] rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <Text
        className="font-extrabold text-[10px] text-textMuted text-center uppercase tracking-wider"
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
