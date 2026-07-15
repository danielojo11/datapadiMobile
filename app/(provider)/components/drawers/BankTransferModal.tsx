import React, { useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import GestureModal from '../GestureModal';

interface BankTransferModalProps {
    visible: boolean;
    onClose: () => void;
    amount: number | string;
    accountNumber: string;
    bankName: string;
    accountName: string;
    reference: string;
}

const BankTransferModal = ({
    visible,
    onClose,
    amount,
    accountNumber,
    bankName,
    accountName,
    reference,
}: BankTransferModalProps) => {
    const insets = useSafeAreaInsets();
    const [copied, setCopied] = useState(false);

    const handleCopyAccount = async () => {
        if (accountNumber) {
            await Clipboard.setStringAsync(accountNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Format amount
    const formattedAmount = Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return (
        <GestureModal visible={visible} onClose={onClose}>
                <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>Bank Transfer Details</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={18} color="#555" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Top Amount Card */}
                        <View style={styles.amountCard}>
                            <Text style={styles.amountLabel}>TRANSFER EXACT AMOUNT</Text>
                            <Text style={styles.amountValue}>
                                <Text style={styles.currencySymbol}>₦ </Text>{formattedAmount}
                            </Text>
                            <View style={styles.infoRow}>
                                <Ionicons name="information-circle-outline" size={14} color="#3B82F6" />
                                <Text style={styles.infoText}>
                                    Transfers of incorrect amounts may fail automated verification
                                </Text>
                            </View>
                        </View>

                        {/* Account Details Card */}
                        <View style={styles.detailsCard}>
                            <View style={styles.detailsInner}>
                                {/* Account Number */}
                                <View style={styles.detailRow}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="apps-outline" size={20} color="#9CA3AF" />
                                    </View>
                                    <View style={styles.detailTextCol}>
                                        <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
                                        <Text style={styles.detailValueLarge}>{accountNumber}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopyAccount}>
                                        {copied ? (
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                        ) : (
                                            <Ionicons name="copy-outline" size={20} color="#3B82F6" />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Bank Name */}
                                <View style={styles.detailRow}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="business-outline" size={20} color="#9CA3AF" />
                                    </View>
                                    <View style={styles.detailTextCol}>
                                        <Text style={styles.detailLabel}>BANK NAME</Text>
                                        <Text style={styles.detailValue}>{bankName}</Text>
                                    </View>
                                </View>

                                {/* Account Name */}
                                <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                                    </View>
                                    <View style={styles.detailTextCol}>
                                        <Text style={styles.detailLabel}>ACCOUNT NAME</Text>
                                        <Text style={styles.detailValue}>{accountName}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Reference */}
                            <View style={styles.referenceBox}>
                                <Text style={styles.referenceLabel}>REFERENCE</Text>
                                <Text style={styles.referenceValue}>{reference}</Text>
                            </View>
                        </View>

                        {/* Warning Banner */}
                        <View style={styles.warningBanner}>
                            <Ionicons name="alert-circle-outline" size={20} color="#C2410C" style={styles.warningIcon} />
                            <Text style={styles.warningText}>
                                This account number is primary for this transaction and expires after a single use. Do not save it for future transfers.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
        </GestureModal>
    );
};

export default BankTransferModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    container: {
        backgroundColor: "#F3F4F6",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        maxHeight: "90%",
    },
    handle: {
        width: 45,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#D1D5DB",
        alignSelf: "center",
        marginBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    closeBtn: {
        backgroundColor: "#FFFFFF",
        padding: 8,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    amountCard: {
        backgroundColor: "#EFF6FF",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        marginBottom: 16,
    },
    amountLabel: {
        color: "#3B82F6",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 36,
        fontWeight: "800",
        color: "#1E3A8A",
        marginBottom: 12,
    },
    currencySymbol: {
        color: "#9CA3AF",
        fontSize: 24,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    infoText: {
        color: "#60A5FA",
        fontSize: 12,
        marginLeft: 6,
    },
    detailsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        marginBottom: 24,
        overflow: "hidden",
    },
    detailsInner: {
        padding: 20,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F9FAFB",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    detailTextCol: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#9CA3AF",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    detailValueLarge: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: 1,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    copyBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
    },
    referenceBox: {
        backgroundColor: "#F9FAFB",
        padding: 16,
        flexDirection: "row",
    },
    referenceLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#9CA3AF",
        letterSpacing: 0.5,
        marginRight: 12,
        width: 80,
    },
    referenceValue: {
        flex: 1,
        fontSize: 12,
        fontWeight: "600",
        color: "#4B5563",
        fontFamily: "monospace",
        letterSpacing: 0.5,
    },
    warningBanner: {
        flexDirection: "row",
        backgroundColor: "#FFFBEB",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#FEF3C7",
    },
    warningIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    warningText: {
        flex: 1,
        color: "#9A3412",
        fontSize: 13,
        lineHeight: 20,
        fontWeight: "500",
    },
});
