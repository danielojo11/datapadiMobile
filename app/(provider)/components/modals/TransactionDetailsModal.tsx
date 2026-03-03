import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import generateReceipt from '../../../utils/generateReceipt';

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
    const [isSaving, setIsSaving] = useState(false);

    if (!transaction) return null;

    const handleSaveReceipt = async () => {
        setIsSaving(true);
        try {
            await generateReceipt(transaction);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

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

    const renderDetails = () => {
        const details = transaction.metadata;
        const type = transaction.type as any;

        if (!details && type !== 'FLIGHT') return <Text style={[styles.detailValue, { color: '#6B7280', textAlign: 'center', width: '100%' }]}>No additional details available.</Text>;

        switch (type) {
            case 'ELECTRICITY':
                return (
                    <View style={styles.detailsGroup}>
                        <DetailRow label="Provider" value={details?.provider} />
                        <DetailRow label="Meter Type" value={details?.meterType} />
                        <DetailRow label="Meter Number" value={details?.meterNumber} />
                        <DetailRow label="Customer Name" value={details?.customerName} />
                        <DetailRow label="Address" value={details?.address} />
                        {details?.token && (
                            <View style={styles.tokenBox}>
                                <Text style={styles.tokenLabel}>TOKEN</Text>
                                <Text style={styles.tokenValue}>{details.token}</Text>
                            </View>
                        )}
                    </View>
                );

            case 'EDUCATION':
                return (
                    <View style={styles.detailsGroup}>
                        <DetailRow label="Exam Body" value={(() => {
                            if (details?.examType === 'utme-mock') return 'JAMB UTME (With Mock)';
                            if (details?.examType === 'utme-no-mock') return 'JAMB UTME (No Mock)';
                            return details?.provider || 'Education PIN';
                        })()} />
                        {details?.customerName && <DetailRow label="Customer Name" value={details.customerName} />}
                        {details?.plan && <DetailRow label="Plan" value={details.plan} />}
                        <DetailRow label="Quantity" value={details?.quantity} />
                        {details?.profileId && <DetailRow label="Profile ID" value={details.profileId} />}
                        <DetailRow label="Phone Number" value={details?.phoneNumber} />
                        {details?.pins && Array.isArray(details.pins) && (
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.groupLabel}>PURCHASED PINS</Text>
                                {details.pins.map((pin: any, index: number) => (
                                    <View key={index} style={styles.pinBox}>
                                        <Text style={styles.pinLabel}>Serial: {pin.serial || pin.Serial}</Text>
                                        <Text style={styles.pinValue}>{pin.pin || pin.Pin}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {details?.cardDetails && typeof details.cardDetails === 'string' && (
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.groupLabel}>PIN DETAILS</Text>
                                <View style={styles.pinBox}>
                                    <Text style={styles.pinValue}>{details.cardDetails}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                );

            case 'CABLE':
            case 'CABLE_TV':
                return (
                    <View style={styles.detailsGroup}>
                        <DetailRow label="Provider" value={details?.provider} />
                        <DetailRow label="Package" value={details?.plan} />
                        <DetailRow label="Smart Card / IUC" value={details?.smartCardNumber} />
                        <DetailRow label="Customer Name" value={details?.customerName} />
                    </View>
                );

            case 'DATA':
                return (
                    <View style={styles.detailsGroup}>
                        <DetailRow label="Network" value={details?.network} />
                        <DetailRow label="Plan" value={details?.plan} />
                        <DetailRow label="Beneficiary" value={details?.phoneNumber} />
                    </View>
                );

            case 'AIRTIME':
                return (
                    <View style={styles.detailsGroup}>
                        <DetailRow label="Network" value={details?.network} />
                        <DetailRow label="Beneficiary" value={details?.phoneNumber} />
                    </View>
                );

            case 'FLIGHT':
                const flightBooking = (transaction as any).flightBooking;
                const flight = flightBooking?.flight;
                const passengers = flightBooking?.passengers;
                return (
                    <View style={styles.detailsGroup}>
                        <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 16 }}>
                            <Text style={[styles.groupLabel, { marginBottom: 8 }]}>FLIGHT INFORMATION</Text>
                            <DetailRow label="Airline" value={flight?.airline} />
                            <DetailRow label="Flight No" value={flight?.flightNumber} />
                            <DetailRow label="Route" value={`${flight?.departure?.code} → ${flight?.arrival?.code}`} />
                            <DetailRow label="PNR" value={flightBooking?.pnr} />
                        </View>

                        {passengers && (
                            <View>
                                <Text style={styles.groupLabel}>PASSENGERS</Text>
                                {passengers.map((p: any, idx: number) => (
                                    <View key={idx} style={[styles.pinBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                        <Text style={{ fontWeight: '500', color: '#111827', fontSize: 13 }}>{p.title} {p.firstName} {p.lastName}</Text>
                                        <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 13 }}>{p.seatNumber || 'N/A'}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                );

            default:
                return (
                    <View style={styles.detailsGroup}>
                        {details && Object.entries(details).map(([key, value]) => (
                            <DetailRow key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={String(value)} />
                        ))}
                    </View>
                );
        }
    };

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
                            <Text style={styles.groupLabel}>TRANSACTION OVERVIEW</Text>
                            <DetailRow label="Date" value={formattedDate} />
                            <DetailRow label="Reference" value={transaction.reference || transaction.id || 'No Reference'} />
                            <DetailRow label="Type" value={transaction.type.replace('_', ' ')} />
                        </View>

                        {renderDetails()}

                    </ScrollView>

                    <View style={styles.footer}>
                        {transaction.type === 'ELECTRICITY' && (
                            <TouchableOpacity
                                style={[styles.downloadBtn, isSaving && { opacity: 0.7 }]}
                                onPress={handleSaveReceipt}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Ionicons name="download-outline" size={20} color="#fff" />
                                )}
                                <Text style={styles.downloadBtnText}>
                                    {isSaving ? 'Saving...' : 'Save Receipt'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                            <Text style={styles.doneBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const DetailRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
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
    tokenBox: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FEF3C7',
        borderRadius: 12,
        alignItems: 'center',
    },
    tokenLabel: {
        fontSize: 12,
        color: '#D97706',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    tokenValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: 2,
    },
    pinBox: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    pinLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    pinValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 16,
    },
    downloadBtn: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 8,
    },
    downloadBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
