import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

type WalletProps = {
  balance: number;
  todaySpent: number;
  onFundWallet: () => void;
};

export default function WalletCard({
  balance,
  todaySpent,
  onFundWallet,
}: WalletProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <LinearGradient
      colors={["#0f172a", "#020617"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 32 }}
      className="p-6 mb-5 shadow-2xl shadow-blue-900/20 border border-slate-800 mt-2"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white/70 text-[13px] font-bold uppercase tracking-widest">Available Balance</Text>
            <TouchableOpacity onPress={() => setHidden(!hidden)} hitSlop={10} className="ml-2 bg-white/10 p-1 rounded-full">
              <Ionicons
                name={hidden ? "eye-off-outline" : "eye-outline"}
                size={14}
                color="rgba(255, 255, 255, 0.7)"
              />
            </TouchableOpacity>
          </View>
          <Text className="text-white text-[38px] font-black mt-2 tracking-tighter">
            {hidden ? "****" : `₦${Number(balance).toLocaleString()}`}
          </Text>
        </View>

        <View className="bg-white/5 rounded-2xl px-3 py-2 border border-white/10 items-end">
          <Text className="text-white/60 text-[9px] font-black tracking-widest uppercase">Today Spent</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="trending-up" size={12} color="#10B981" />
            <Text className="text-white font-extrabold text-sm ml-1">
              ₦{Number(todaySpent || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View className="h-[1px] bg-white/10 my-6" />

      <TouchableOpacity 
        onPress={onFundWallet} 
        activeOpacity={0.8}
        className="bg-white/10 rounded-full py-4 items-center border border-white/20 flex-row justify-center"
      >
        <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
        <Text className="text-white text-[15px] font-black tracking-wide">Fund Wallet</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
