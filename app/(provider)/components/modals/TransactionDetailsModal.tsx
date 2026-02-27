import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TransactionDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
};

const CURRENCY = '₦';

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
    isOpen,
    onClose,
    transaction,
}) => {
    if (!transaction) return null;

    const isFunding = transaction.type === 'WALLET_FUNDING';
    const amountStr = Number(transaction.amount).toLocaleString();

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'SUCCESS': return '#15803D';
            case 'PENDING': return '#B45309';
            case 'FAILED': return '#B91C1C';
            default: return '#6B7280';
        }
    };

    const formattedDate = new Date(transaction.date || transaction.createdAt || new Date()).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>Transaction Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.amountContainer}>
                            <Text style={styles.amountLabel}>Amount</Text>
                            <Text style={[styles.amountValue, isFunding && { color: '#059669' }]}>
                                {isFunding ? '+' : '-'}{CURRENCY}{amountStr}
                            </Text>

                            <View style={[styles.statusBadge, { borderColor: getStatusColor(transaction.status) }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                                    {transaction.status || 'UNKNOWN'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailsGroup}>
                            <Text style={styles.groupLabel}>TRANSACTION INFO</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Type</Text>
                                <Text style={styles.detailValue}>{transaction.type.replace('_', ' ')}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={styles.detailValue}>{formattedDate}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Reference</Text>
                                <Text style={styles.detailValue}>{transaction.reference || transaction.id || 'No Reference'}</Text>
                            </View>

                            {transaction.metadata?.planName && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Plan</Text>
                                    <Text style={styles.detailValue}>{transaction.metadata.planName}</Text>
                                </View>
                            )}

                            {transaction.metadata?.network && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Network</Text>
                                    <Text style={styles.detailValue}>{transaction.metadata.network}</Text>
                                </View>
                            )}
                        </View>

                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                            <Text style={styles.doneBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '80%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    closeBtn: {
        backgroundColor: '#F3F4F6',
        padding: 8,
        borderRadius: 20,
    },
    amountContainer: {
        alignItems: 'center',
        marginBottom: 32,
        paddingVertical: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
    },
    amountLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    detailsGroup: {
        marginBottom: 24,
    },
    groupLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        maxWidth: '60%',
        textAlign: 'right',
    },
    footer: {
        marginTop: 16,
    },
    doneBtn: {
        backgroundColor: '#111827',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TransactionDetailsModal;
