import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getTransactionHistory } from '../../utils/user';
import TransactionDetailsModal from '../components/modals/TransactionDetailsModal';

const CURRENCY = '₦';

export enum TransactionType {
  DATA = 'DATA',
  AIRTIME = 'AIRTIME',
  RECHARGE_PIN = 'RECHARGE_PIN',
  WALLET_FUNDING = 'WALLET_FUNDING',
  CABLE_TV = 'CABLE_TV',
  ELECTRICITY = 'ELECTRICITY',
}

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: string | number;
  status: string;
  date?: string;
  createdAt?: string;
  metadata?: any;
};

const History: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Added Cable and Electricity to the UI filters
  const filters = ['All', 'Data', 'Airtime', 'Pins', 'Funding', 'Cable', 'Electricity'];

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError('');

    // 2. Used a mapping object for cleaner, more scalable translations to backend Enums
    const filterToApiMap: Record<string, string> = {
      'All': 'All',
      'Data': TransactionType.DATA,
      'Airtime': TransactionType.AIRTIME,
      'Pins': TransactionType.RECHARGE_PIN,
      'Funding': TransactionType.WALLET_FUNDING,
      'Cable': TransactionType.CABLE_TV,
      'Electricity': TransactionType.ELECTRICITY,
    };

    const apiType = filterToApiMap[filter] || filter;
    const result = await getTransactionHistory(1, 50, apiType);

    if (result.success) {
      setTransactions(
        result.data.map((tx: any) => ({
          ...tx,
          date: tx.date || tx.createdAt,
          type: tx.type as TransactionType,
        })) as Transaction[]
      );
    } else {
      setError(result.error || 'Failed to fetch transactions.');
    }
    setIsLoading(false);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [filter]);

  const handleTransactionClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
  };

  // Helper for dynamic icon styling based on transaction type
  const getTransactionConfig = (type: string) => {
    switch (type) {
      case TransactionType.DATA:
        return { icon: <Ionicons name="wifi" size={20} color="#2563EB" />, bg: '#EFF6FF' };
      case TransactionType.AIRTIME:
        return { icon: <Feather name="smartphone" size={20} color="#059669" />, bg: '#ECFDF5' };
      case TransactionType.CABLE_TV:
        return { icon: <Ionicons name="tv-outline" size={20} color="#7C3AED" />, bg: '#F5F3FF' };
      case TransactionType.ELECTRICITY:
        return { icon: <Ionicons name="flash-outline" size={20} color="#D97706" />, bg: '#FFFBEB' };
      case TransactionType.WALLET_FUNDING:
        return { icon: <Ionicons name="card-outline" size={20} color="#4F46E5" />, bg: '#EEF2FF' };
      case TransactionType.RECHARGE_PIN:
        return { icon: <Ionicons name="print-outline" size={20} color="#0891B2" />, bg: '#ECFEFF' };
      default:
        return { icon: <Ionicons name="receipt-outline" size={20} color="#4B5563" />, bg: '#F3F4F6' };
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  // Helper for Status Badge
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header Area */}
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <Text style={styles.headerSubtitle}>Review your recent activity and purchases.</Text>
        </View>

        {/* Filter Chips - Horizontal Scroll */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map((f) => {
              const isActive = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Area */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563EB" style={{ marginBottom: 12 }} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {transactions.length > 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
                {transactions.map((tx, index) => {
                  const config = getTransactionConfig(tx.type);
                  const isFunding = tx.type === TransactionType.WALLET_FUNDING;
                  const dateObj = new Date(tx.date || tx.createdAt || new Date());
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  // Safely fall back to type if metadata is not available
                  const title = tx.metadata?.planName || tx.metadata?.network || tx.type.replace('_', ' ');

                  return (
                    <TouchableOpacity
                      key={`${tx.id}-${index}`}
                      style={styles.transactionCard}
                      onPress={() => handleTransactionClick(tx)}
                    >
                      <View style={styles.cardLeft}>
                        {/* Dynamic Icon */}
                        <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
                          {config.icon}
                        </View>

                        {/* Details */}
                        <View style={styles.detailsCol}>
                          <Text style={styles.txTitle} numberOfLines={1}>
                            {title}
                          </Text>
                          <View style={styles.dateRow}>
                            <Text style={styles.txDate}>{formattedDate}</Text>
                            {tx.type === TransactionType.RECHARGE_PIN && (
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
                          {isFunding ? '+' : '-'}{CURRENCY}{Number(tx.amount).toLocaleString()}
                        </Text>
                        <View style={styles.statusWrapper}>
                          {getStatusBadge(tx.status)}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {/* Pagination Controls */}
                {pagination && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
                      onPress={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <Ionicons name="chevron-back" size={18} color={page === 1 ? '#9CA3AF' : '#111827'} />
                    </TouchableOpacity>
                    <Text style={styles.paginationText}>
                      Page {page} of {pagination.totalPages}
                    </Text>
                    <TouchableOpacity
                      style={[styles.paginationButton, page === pagination.totalPages && styles.paginationButtonDisabled]}
                      onPress={() => handlePageChange(page + 1)}
                      disabled={page === pagination.totalPages}
                    >
                      <Ionicons name="chevron-forward" size={18} color={page === pagination.totalPages ? '#9CA3AF' : '#111827'} />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            ) : (
              /* Empty State */
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons name="time-outline" size={28} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyDesc}>
                  {filter === 'All'
                    ? "When you make purchases or fund your wallet, they will appear here."
                    : `You don't have any recent ${filter.toLowerCase()} transactions.`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Transaction Details Modal */}
        {isModalOpen && (
          <TransactionDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            transaction={selectedTransaction}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default History;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerArea: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  filterWrapper: {
    marginBottom: 24,
  },
  filterContainer: {
    paddingBottom: 8,
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C',
    flex: 1,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 20,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
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
  emptyState: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
