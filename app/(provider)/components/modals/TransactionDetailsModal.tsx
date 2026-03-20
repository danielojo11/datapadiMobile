import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
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

    // Try to match the exact format: "3/20/2026, 12:35:49 PM"
    const dateObj = new Date(transaction.date || transaction.createdAt || new Date());
    const formattedDate = dateObj.toLocaleDateString() + ', ' + dateObj.toLocaleTimeString();

    const formatType = (type: string) => {
        if (!type) return '';
        const lower = type.toLowerCase().replace('_', ' ');
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    const transactionTypeStr = formatType(transaction.type);

    const statusUpper = transaction.status?.toUpperCase() || 'UNKNOWN';
    let statusColor = '#10B981'; // Default SUCCESS
    if (statusUpper === 'PENDING') statusColor = '#F59E0B';
    if (statusUpper === 'FAILED') statusColor = '#EF4444';

    const renderTopCard = () => {
        let bgGradient = ['#2E2C77', '#0F766E'] as [string, string]; // Default fallback
        let iconName: any = 'cash-outline';
        let typeLabel = transactionTypeStr.toUpperCase();

        if (transaction.type === 'EDUCATION') {
            bgGradient = ['#28246E', '#14A37D'];
            iconName = 'school-outline';
        } else if (transaction.type === 'AIRTIME' || transaction.type === 'DATA') {
            bgGradient = ['#431E6B', '#C026D3'];
            iconName = 'phone-portrait-outline';
        } else if (transaction.type === 'CABLE' || transaction.type === 'CABLE_TV') {
            bgGradient = ['#0F2027', '#2A4365'];
            iconName = 'tv-outline';
        } else if (transaction.type === 'ELECTRICITY') {
            bgGradient = ['#4A1D96', '#E11D48'];
            iconName = 'flash-outline';
        }

        return (
            <LinearGradient
                colors={bgGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topCard}
            >
                <View style={styles.topCardHeader}>
                    <View style={styles.typePill}>
                        <Ionicons name={iconName} size={16} color="#FFF" />
                        <Text style={styles.typePillText}>{typeLabel}</Text>
                    </View>
                    <View style={styles.statusPill}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusUpper}</Text>
                    </View>
                </View>

                <Text style={styles.amountLabel}>AMOUNT PAID</Text>
                <Text style={styles.amountValue}>
                    {isFunding ? '+' : '-'}{CURRENCY}{amountStr}
                </Text>
                <Text style={styles.amountSubtext}>{transactionTypeStr}</Text>
            </LinearGradient>
        );
    };

    const renderBasicDetails = () => (
        <View style={styles.card}>
            <DetailRow label="Date" value={formattedDate} boldValue />
            <DetailRow
                label="Reference"
                value={transaction.reference || transaction.id || 'No Reference'}
                boldValue
                copyable
            />
            <DetailRow label="Type" value={transactionTypeStr} boldValue isLast />
        </View>
    );

    const renderAdditionalDetails = () => {
        const details = transaction.metadata;
        const type = transaction.type as string;

        if (!details && type !== 'FLIGHT') return null;

        let content = null;

        if (type === 'EDUCATION') {
            content = (
                <>
                    <DetailRow label="Exam Body" value={(() => {
                        if (details?.examType === 'utme-mock') return 'JAMB UTME (With Mock)';
                        if (details?.examType === 'utme-no-mock') return 'JAMB UTME (No Mock)';
                        return details?.provider || 'Education PIN';
                    })()} boldValue isLast />

                    {details?.customerName && <DetailRow label="Customer Name" value={details.customerName} boldValue />}
                    {details?.plan && <DetailRow label="Plan" value={details.plan} boldValue />}
                    {details?.quantity && <DetailRow label="Quantity" value={details.quantity} boldValue />}
                    {details?.profileId && <DetailRow label="Profile ID" value={details.profileId} boldValue />}
                    {details?.phoneNumber && <DetailRow label="Phone Number" value={details.phoneNumber} boldValue />}

                    {details?.pins && Array.isArray(details.pins) && details.pins.length > 0 && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={styles.sectionHeader}>PIN DETAILS</Text>
                            {details.pins.map((pin: any, index: number) => (
                                <View key={index} style={styles.pinBox}>
                                    <Text style={styles.pinValue}>Serial: {pin.serial || pin.Serial} | PIN: {pin.pin || pin.Pin}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {details?.cardDetails && typeof details.cardDetails === 'string' && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={styles.sectionHeader}>PIN DETAILS</Text>
                            <View style={styles.pinBox}>
                                <Text style={styles.pinValue}>{details.cardDetails}</Text>
                            </View>
                        </View>
                    )}
                </>
            );
        } else if (type === 'ELECTRICITY') {
            content = (
                <>
                    <DetailRow label="Provider" value={details?.provider} boldValue />
                    <DetailRow label="Meter Type" value={details?.meterType} boldValue />
                    <DetailRow label="Meter Number" value={details?.meterNumber} boldValue />
                    <DetailRow label="Customer Name" value={details?.customerName} boldValue />
                    <DetailRow label="Address" value={details?.address} boldValue isLast />
                    {details?.token && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={styles.sectionHeader}>TOKEN DETAILS</Text>
                            <View style={[styles.pinBox, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                                <Text style={[styles.pinValue, { fontSize: 24, letterSpacing: 2, textAlign: 'center' }]}>{details.token}</Text>
                            </View>
                        </View>
                    )}
                </>
            );
        } else if (type === 'CABLE' || type === 'CABLE_TV') {
            content = (
                <>
                    <DetailRow label="Provider" value={details?.provider} boldValue />
                    <DetailRow label="Package" value={details?.plan} boldValue />
                    <DetailRow label="Smart Card / IUC" value={details?.smartCardNumber} boldValue />
                    <DetailRow label="Customer Name" value={details?.customerName} boldValue isLast />
                </>
            );
        } else if (type === 'DATA') {
            content = (
                <>
                    <DetailRow label="Network" value={details?.network} boldValue />
                    <DetailRow label="Plan" value={details?.plan} boldValue />
                    <DetailRow label="Beneficiary" value={details?.phoneNumber} boldValue isLast />
                </>
            );
        } else if (type === 'AIRTIME') {
            content = (
                <>
                    <DetailRow label="Network" value={details?.network} boldValue />
                    <DetailRow label="Beneficiary" value={details?.phoneNumber} boldValue isLast />
                </>
            );
        } else if (type === 'FLIGHT') {
            const flightBooking = (transaction as any).flightBooking;
            const flight = flightBooking?.flight;
            const passengers = flightBooking?.passengers;
            content = (
                <>
                    <Text style={[styles.sectionHeader, { marginTop: 0 }]}>FLIGHT INFORMATION</Text>
                    <DetailRow label="Airline" value={flight?.airline} boldValue />
                    <DetailRow label="Flight No" value={flight?.flightNumber} boldValue />
                    <DetailRow label="Route" value={`${flight?.departure?.code || '?'} → ${flight?.arrival?.code || '?'}`} boldValue />
                    <DetailRow label="PNR" value={flightBooking?.pnr} boldValue isLast />

                    {passengers && passengers.length > 0 && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={styles.sectionHeader}>PASSENGERS</Text>
                            {passengers.map((p: any, idx: number) => (
                                <View key={idx} style={[styles.pinBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderColor: '#F3F4F6' }]}>
                                    <Text style={{ fontWeight: '500', color: '#111827', fontSize: 13 }}>{p.title} {p.firstName} {p.lastName}</Text>
                                    <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 13 }}>{p.seatNumber || 'N/A'}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </>
            );
        } else {
            content = (
                <>
                    {details && Object.entries(details).map(([key, value], idx, arr) => (
                        <DetailRow key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={String(value)} boldValue isLast={idx === arr.length - 1} />
                    ))}
                </>
            );
        }

        if (!content) return null;

        return (
            <View style={styles.card}>
                {type !== 'FLIGHT' && <Text style={styles.sectionHeader}>ADDITIONAL DETAILS</Text>}
                {content}
            </View>
        );
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
                            <Ionicons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {renderTopCard()}
                        {renderBasicDetails()}
                        {renderAdditionalDetails()}
                    </ScrollView>

                    <View style={styles.footerRow}>
                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                            onPress={handleSaveReceipt}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#111827" size="small" />
                            ) : (
                                <Ionicons name="download-outline" size={20} color="#111827" />
                            )}
                            <Text style={styles.saveBtnText}>Save PDF</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
                            <Text style={styles.closeFooterBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const DetailRow: React.FC<{ label: string; value?: string | number; boldValue?: boolean; copyable?: boolean; isLast?: boolean }> = ({ label, value, boldValue, copyable, isLast }) => {
    if (!value) return null;

    const handleCopy = async () => {
        await Clipboard.setStringAsync(value.toString());
        Alert.alert("Copied!", `${label} successfully copied to clipboard`);
    };

    return (
        <View style={[styles.detailRow, isLast && { marginBottom: 0 }]}>
            <Text style={styles.detailLabel}>{label}</Text>
            <View style={styles.detailValueContainer}>
                <Text numberOfLines={1} style={[styles.detailValue, boldValue && styles.detailValueBold]}>{value}</Text>
                {copyable && (
                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                        <Ionicons name="copy-outline" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>
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
        backgroundColor: '#F3F4F6',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 24,
        maxHeight: '90%',
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#D1D5DB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    closeBtn: {
        backgroundColor: '#FFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    topCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
    },
    topCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    typePillText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    amountLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    amountValue: {
        color: '#FFF',
        fontSize: 40,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -1,
    },
    amountSubtext: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    detailValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    detailValue: {
        fontSize: 14,
        color: '#1F2937',
        textAlign: 'right',
        marginLeft: 30
    },
    detailValueBold: {
        fontWeight: '700',
        color: '#111827',
    },
    copyBtn: {
        marginLeft: 8,
    },
    pinBox: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#D1FAE5',
        padding: 16,
        borderRadius: 12,
    },
    pinValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 22,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    saveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6', // Lighter background 
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 56,
        borderRadius: 16,
        gap: 8,
    },
    saveBtnText: {
        color: '#111827',
        fontSize: 15,
        fontWeight: '700',
    },
    closeFooterBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
        height: 56,
        borderRadius: 16,
    },
    closeFooterBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default TransactionDetailsModal;
