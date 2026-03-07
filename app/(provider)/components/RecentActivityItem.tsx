import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
    case 'DATA':
      return { icon: <Ionicons name="wifi" size={20} color="#2563EB" />, bg: '#EFF6FF' };
    case 'AIRTIME':
      return { icon: <Feather name="smartphone" size={20} color="#059669" />, bg: '#ECFDF5' };
    case 'CABLE_TV':
      return { icon: <Ionicons name="tv-outline" size={20} color="#7C3AED" />, bg: '#F5F3FF' };
    case 'ELECTRICITY':
      return { icon: <Ionicons name="flash-outline" size={20} color="#D97706" />, bg: '#FFFBEB' };
    case 'WALLET_FUNDING':
      return { icon: <Ionicons name="card-outline" size={20} color="#4F46E5" />, bg: '#EEF2FF' };
    case 'RECHARGE_PIN':
      return { icon: <Ionicons name="print-outline" size={20} color="#0891B2" />, bg: '#ECFEFF' };
    case 'EDUCATION':
      return { icon: <Ionicons name="school-outline" size={20} color="#10B981" />, bg: '#D1FAE5' };
    default:
      return { icon: <Ionicons name="receipt-outline" size={20} color="#4B5563" />, bg: '#F3F4F6' };
  }
};

const getStatusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#DCFCE7' }]}>
          <Text style={[styles.badgeText, { color: '#15803D' }]}>SUCCESS</Text>
        </View>
      );
    case 'PENDING':
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.badgeText, { color: '#B45309' }]}>PENDING</Text>
        </View>
      );
    case 'FAILED':
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.badgeText, { color: '#B91C1C' }]}>FAILED</Text>
        </View>
      );
    default:
      return null;
  }
};

export default function RecentActivityItem({
  title,
  subtitle,
  amount,
  type,
  status,
  onPress
}: RecentActivityItemProps) {
  const config = getTransactionConfig(type);
  const isFunding = type === "WALLET_FUNDING";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.transactionCard}
      onPress={onPress}
    >
      <View style={styles.cardLeft}>
        {/* Dynamic Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
          {config.icon}
        </View>

        {/* Details */}
        <View style={styles.detailsCol}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {title === "MONNIFY" ? "WALLET FUNDING" : title || (type ? type.replace('_', ' ') : "Transaction")}
          </Text>
          <View style={styles.dateRow}>
            <Text style={styles.txDate}>{subtitle}</Text>
            {type === 'RECHARGE_PIN' && (
              <View style={styles.pinsTag}>
                <Text style={styles.pinsTagText}>PINS</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Amount & Status */}
      <View style={styles.cardRight}>
        <Text style={[styles.txAmount, isFunding ? styles.txAmountCredit : styles.txAmountDebit]}>
          {isFunding ? '+' : '-'}{amount?.toString().startsWith('₦') ? '' : '₦'}{Number(amount?.toString().replace('₦', '') || 0).toLocaleString()}
        </Text>
        <View style={styles.statusWrapper}>
          {getStatusBadge(status)}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    backgroundColor: '#fff',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  pinsTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinsTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  txAmountCredit: {
    color: '#059669',
  },
  txAmountDebit: {
    color: '#111827',
  },
  statusWrapper: {
    alignItems: 'flex-end',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
