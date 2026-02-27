import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as Print from 'expo-print';
import * as Clipboard from 'expo-clipboard';

type PrintBatch = any;

interface PinBatchModalProps {
    visible: boolean;
    onClose: () => void;
    batch: PrintBatch | null;
}

const PinBatchModal: React.FC<PinBatchModalProps> = ({ visible, onClose, batch }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    if (!batch) return null;

    const CURRENCY = "₦";

    const getUSSD = (networkId: string) => {
        switch (networkId) {
            case 'MTN': return '*555*PIN#';
            case 'AIRTEL': return '*126*PIN#';
            case 'GLO': return '*123*PIN#';
            case '9MOBILE': return '*222*PIN#';
            default: return '*XXX*PIN#';
        }
    };

    const formatPin = (pin: string) => {
        return pin.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    };

    const copyToClipboard = async (text: string, index: number) => {
        await Clipboard.setStringAsync(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handlePrint = async () => {
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                        body {
                            font-family: 'Inter', sans-serif;
                            margin: 0;
                            padding: 0;
                            background: white;
                        }
                        .print-header-main {
                            text-align: center;
                            margin-bottom: 20px;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                        }
                        .print-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr); 
                            gap: 15px;
                        }
                        .print-card {
                            border: 1px dashed #666;
                            padding: 12px;
                            page-break-inside: avoid;
                            background: white;
                            display: flex;
                            flex-direction: column;
                            min-height: 120px;
                        }
                        .card-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 8px;
                        }
                        .card-brand {
                            font-size: 10px;
                            font-weight: 800;
                            letter-spacing: 1px;
                            color: #000;
                        }
                        .card-network-badge {
                            font-size: 11px;
                            font-weight: 900;
                            text-transform: uppercase;
                        }
                        .card-amount {
                            font-size: 14px;
                            font-weight: 900;
                            border: 1.5px solid #000;
                            padding: 2px 6px;
                            border-radius: 4px;
                        }
                        .card-body {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 10px 0;
                            border-top: 1px solid #eee;
                            border-bottom: 1px solid #eee;
                        }
                        .pin-label {
                            font-size: 8px;
                            font-weight: bold;
                            text-transform: uppercase;
                            color: #666;
                            margin-bottom: 2px;
                        }
                        .pin-value {
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 18px;
                            font-weight: 900;
                            letter-spacing: 1px;
                            color: #000;
                        }
                        .card-footer {
                            margin-top: 8px;
                            font-size: 8px;
                            color: #333;
                        }
                        .footer-row {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 2px;
                        }
                        .ussd-box {
                            background: #f0f0f0;
                            padding: 2px 4px;
                            border-radius: 2px;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header-main">
                        <h1 style="font-size: 22px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 2px;">DATAPADI</h1>
                        <p style="font-size: 11px; margin: 4px 0; font-weight: bold; color: #666;">Automated Recharge Voucher System</p>
                        <p style="font-size: 9px; margin: 0;">Batch ID: ${batch.id} • Date: ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="print-grid">
                        ${batch.pins?.map((pin: any, idx: number) => `
                        <div class="print-card">
                            <div class="card-header">
                                <span class="card-brand">DATAPADI</span>
                                <span class="card-amount">${CURRENCY}${batch.amount}</span>
                            </div>
                            
                            <div class="card-body">
                                <span class="card-network-badge">${batch.networkId}</span>
                                <span class="pin-label">Recharge PIN</span>
                                <span class="pin-value">${formatPin(pin.pin)}</span>
                            </div>

                            <div class="card-footer">
                                <div class="footer-row">
                                    <span>SN: <strong>${pin.serial}</strong></span>
                                    <span>Load: <strong class="ussd-box">${getUSSD(batch.networkId)}</strong></span>
                                </div>
                                <div class="footer-row" style="opacity: 0.6;">
                                    <span>Valid for 12 months</span>
                                    <span>Powered by DataPadi</span>
                                </div>
                            </div>
                        </div>`).join('') || ''}
                    </div>
                </body>
                </html>
            `;
            await Print.printAsync({
                html: htmlContent,
            });
        } catch (error) {
            console.error("Error printing:", error);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Card Preview & Print</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Summary Info */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryLeft}>
                                <View style={[
                                    styles.networkIcon,
                                    batch.networkId === 'MTN' ? styles.networkMtn : styles.networkOther
                                ]}>
                                    <Text style={[
                                        styles.networkIconText,
                                        batch.networkId === 'MTN' ? { color: '#854d0e' } : { color: '#fff' }
                                    ]}>
                                        {batch.networkId[0]}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.networkNameTitle}>
                                        {batch.networkId} {CURRENCY}{batch.amount}
                                    </Text>
                                    <Text style={styles.quantityText}>
                                        {batch.quantity} Cards generated
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.summaryRight}>
                                <Text style={styles.totalValueLabel}>TOTAL VALUE</Text>
                                <Text style={styles.totalValueText}>
                                    {CURRENCY}{(batch.amount * batch.quantity).toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.listHeaderContainer}>
                            <Text style={styles.listHeaderTitle}>Voucher Previews</Text>
                            <View style={styles.infoBadge}>
                                <Ionicons name="information-circle-outline" size={12} color="#2563EB" />
                                <Text style={styles.infoText}>Click PIN to Copy</Text>
                            </View>
                        </View>

                        {/* Vouchers List */}
                        <View style={styles.vouchersList}>
                            {batch.pins?.map((pin: any, idx: number) => (
                                <TouchableOpacity
                                    key={idx}
                                    activeOpacity={0.7}
                                    onPress={() => copyToClipboard(pin.pin, idx)}
                                    style={styles.voucherItem}
                                >
                                    <View style={styles.voucherItemHeader}>
                                        <Text style={styles.voucherItemBrand}>DataPadi Voucher</Text>
                                        <View style={styles.serialBadge}>
                                            <Text style={styles.serialText}>SN: {pin.serial}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.voucherItemBody}>
                                        <Text style={styles.pinLabel}>RECHARGE PIN</Text>
                                        <View style={styles.pinRow}>
                                            <Text style={styles.pinCode}>{formatPin(pin.pin)}</Text>
                                            <View style={[
                                                styles.copyButton,
                                                copiedIndex === idx && styles.copyButtonSuccess
                                            ]}>
                                                <Ionicons
                                                    name={copiedIndex === idx ? "checkmark" : "copy-outline"}
                                                    size={16}
                                                    color={copiedIndex === idx ? "#22c55e" : "#9ca3af"}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.voucherItemFooter}>
                                        <Text style={styles.loadText}>
                                            To Load: <Text style={styles.ussdText}>{getUSSD(batch.networkId)}</Text>
                                        </Text>
                                        <Text style={styles.networkCostText}>
                                            {batch.networkId} • {CURRENCY}{batch.amount}
                                        </Text>
                                    </View>

                                    {/* Copied Overlay */}
                                    {copiedIndex === idx && (
                                        <View style={styles.copiedOverlay}>
                                            <View style={styles.copiedBadge}>
                                                <Text style={styles.copiedBadgeText}>Copied!</Text>
                                            </View>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Sticky Bottom Area */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
                            <Text style={styles.printButtonText}>
                                <Ionicons name="print-outline" size={24} style={{ verticalAlign: "middle" }} />{" "}
                                Print All Vouchers
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.printHelperText}>
                            A4 Layout: 3 Columns • Landscape or Portrait • Set Margin to "None"
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#F9FAFB",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "92%",
        paddingTop: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: "#D1D5DB",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 15,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    closeButton: {
        backgroundColor: "#E5E7EB",
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    closeText: {
        fontSize: 14,
        color: "#4B5563",
        fontWeight: "600",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    summaryCard: {
        backgroundColor: "#EFF6FF", // primaryDark/5
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#DBEAFE", // primary/10
        marginBottom: 24,
    },
    summaryLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    networkIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    networkMtn: {
        backgroundColor: "#facc15", // yellow-400
    },
    networkOther: {
        backgroundColor: "#ef4444", // red-500
    },
    networkIconText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    networkNameTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
    },
    quantityText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    summaryRight: {
        alignItems: "flex-end",
    },
    totalValueLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#9CA3AF",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    totalValueText: {
        fontSize: 20,
        fontWeight: "900",
        color: "#2563EB", // primary
        marginTop: 4,
    },
    listHeaderContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    listHeaderTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
    },
    infoBadge: {
        flexDirection: "row",
        alignItems: "center",
    },
    infoText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#2563EB",
        marginLeft: 4,
    },
    vouchersList: {
        gap: 16,
    },
    voucherItem: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        overflow: "hidden",
    },
    voucherItemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    voucherItemBrand: {
        fontSize: 10,
        fontWeight: "900",
        color: "#2563EB",
        textTransform: "uppercase",
        letterSpacing: -0.5,
    },
    serialBadge: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    serialText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#4B5563",
    },
    voucherItemBody: {
        alignItems: "center",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#F3F4F6", // border-dashed replacement
        borderStyle: "dashed",
    },
    pinLabel: {
        fontSize: 9,
        fontWeight: "700",
        color: "#9CA3AF",
        textTransform: "uppercase",
        marginBottom: 6,
    },
    pinRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    pinCode: {
        fontSize: 20,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: 2,
    },
    copyButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#F9FAFB",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 12,
    },
    copyButtonSuccess: {
        backgroundColor: "#dcfce7", // green-100
    },
    voucherItemFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
    },
    loadText: {
        fontSize: 10,
        color: "#6B7280",
        fontWeight: "500",
    },
    ussdText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#111827",
    },
    networkCostText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#2563EB",
    },
    copiedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(37, 99, 235, 0.05)", // primary/5
        justifyContent: "center",
        alignItems: "center",
    },
    copiedBadge: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    copiedBadgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    footer: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        paddingBottom: 30, // Safe area
        borderTopWidth: 1,
        borderColor: "#F3F4F6",
    },
    printButton: {
        backgroundColor: "#2563EB",
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    printButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
    },
    printHelperText: {
        textAlign: "center",
        fontSize: 10,
        color: "#9CA3AF",
        fontWeight: "500",
    },
});

export default PinBatchModal;
