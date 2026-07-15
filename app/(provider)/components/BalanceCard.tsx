import { View, Text } from "react-native";
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
    <View className="flex-row items-center mb-6 mt-2 px-2">
      <View className="w-14 h-14 rounded-full bg-slate-900 justify-center items-center mr-4 shadow-xl shadow-black/20 border border-slate-800">
        <Text className="text-white text-xl font-black">{initial}</Text>
      </View>

      <View className="justify-center">
        <Text className="text-2xl font-black text-text tracking-tighter mb-1">Hi, {firstName} 👋</Text>
        <View className="bg-primary/10 px-2.5 py-1 rounded-md self-start border border-primary/20">
          <Text className="text-primary text-[10px] font-black tracking-widest uppercase">{formattedTier}</Text>
        </View>
      </View>
    </View>
  );
};

export default BalanceCard;
