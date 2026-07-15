import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";

type RecentActivityItemProps = {
  iconName?: any;
  iconColor?: any;
  title: string;
  subtitle: string;
  amount: string;
  type: string;
  status: string;
  onPress?: () => void;
};

const getTransactionConfig = (type: string) => {
  switch (type) {
    case 'DATA': return { icon: <Ionicons name="wifi" size={20} color="#2563EB" />, bg: 'bg-blue-500/10' };
    case 'AIRTIME': return { icon: <Feather name="smartphone" size={20} color="#059669" />, bg: 'bg-emerald-500/10' };
    case 'CABLE_TV': return { icon: <Ionicons name="tv-outline" size={20} color="#7C3AED" />, bg: 'bg-violet-500/10' };
    case 'ELECTRICITY': return { icon: <Ionicons name="flash-outline" size={20} color="#D97706" />, bg: 'bg-amber-500/10' };
    case 'WALLET_FUNDING': return { icon: <Ionicons name="card-outline" size={20} color="#4F46E5" />, bg: 'bg-indigo-500/10' };
    case 'RECHARGE_PIN': return { icon: <Ionicons name="print-outline" size={20} color="#0891B2" />, bg: 'bg-cyan-500/10' };
    case 'EDUCATION': return { icon: <Ionicons name="school-outline" size={20} color="#10B981" />, bg: 'bg-emerald-400/10' };
    default: return { icon: <Ionicons name="receipt-outline" size={20} color="#4B5563" />, bg: 'bg-slate-500/10' };
  }
};

const getStatusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
      return (
        <View className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <Text className="text-[9px] font-black text-emerald-600 tracking-widest">SUCCESS</Text>
        </View>
      );
    case 'PENDING':
      return (
        <View className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
          <Text className="text-[9px] font-black text-amber-600 tracking-widest">PENDING</Text>
        </View>
      );
    case 'FAILED':
      return (
        <View className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
          <Text className="text-[9px] font-black text-rose-600 tracking-widest">FAILED</Text>
        </View>
      );
    default: return null;
  }
};

export default function RecentActivityItem({
  title, subtitle, amount, type, status, onPress
}: RecentActivityItemProps) {
  const config = getTransactionConfig(type);
  const isFunding = type === "WALLET_FUNDING";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="flex-row justify-between items-center p-4 border-b border-border bg-card"
      onPress={onPress}
    >
      <View className="flex-row items-center flex-1 mr-3">
        <View className={`w-12 h-12 rounded-full justify-center items-center mr-4 ${config.bg}`}>
          {config.icon}
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-sm font-extrabold text-text mb-1" numberOfLines={1}>
            {title === "MONNIFY" ? "WALLET FUNDING" : title || (type ? type.replace('_', ' ') : "Transaction")}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-semibold text-textMuted">{subtitle}</Text>
            {type === 'RECHARGE_PIN' && (
              <View className="bg-slate-100 px-1.5 py-0.5 rounded">
                <Text className="text-[9px] font-black text-slate-600 tracking-wider">PINS</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="items-end justify-center">
        <Text className={`text-sm font-black mb-1.5 ${isFunding ? 'text-emerald-600' : 'text-text'}`}>
          {isFunding ? '+' : '-'}{amount?.toString().startsWith('₦') ? '' : '₦'}{Number(amount?.toString().replace('₦', '') || 0).toLocaleString()}
        </Text>
        <View className="items-end">
          {getStatusBadge(status)}
        </View>
      </View>
    </TouchableOpacity>
  );
}
