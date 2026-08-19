import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, DeviceEventEmitter } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheetContainer from "../BottomSheet";
import TransactionPinInput from "../TransactionPinInput";
import { convertRewards } from "@/app/utils/rewards";

type Props = {
    visible: boolean;
    onClose: () => void;
    bonusBalance: number;
    onSuccess?: () => void;
};

const CURRENCY = "₦";

export default function ConvertRewardsModal({ visible, onClose, bonusBalance, onSuccess }: Props) {
    const [amount, setAmount] = useState("");
    const [step, setStep] = useState<"AMOUNT" | "PIN" | "SUCCESS">("AMOUNT");
    const [transactionPin, setTransactionPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [pinError, setPinError] = useState(false);

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep("AMOUNT");
            setAmount("");
            setTransactionPin("");
            setError("");
            setPinError(false);
        }, 300);
    };

    const handleProceedToPin = () => {
        setError("");
        const numAmount = parseFloat(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        if (numAmount > bonusBalance) {
            setError(`You cannot convert more than your bonus balance (${CURRENCY}${bonusBalance.toLocaleString()})`);
            return;
        }
        setStep("PIN");
    };

    const handleConvert = async (pin: string) => {
        setTransactionPin(pin);
        setIsLoading(true);
        setError("");
        setPinError(false);

        try {
            const numAmount = parseFloat(amount);
            const response = await convertRewards(numAmount, pin);

            if (response.success) {
                DeviceEventEmitter.emit("refreshData");
                if (onSuccess) onSuccess();
                setStep("SUCCESS");
            } else {
                setError(response.error || "Failed to convert rewards");
                setPinError(true);
            }
        } catch (err: any) {
            setError(err?.message || "An unexpected error occurred");
            setPinError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <BottomSheetContainer
            visible={visible}
            title={step === "SUCCESS" ? "Conversion Successful" : "Convert to Wallet"}
            onClose={handleClose}
        >
            {error && step !== "SUCCESS" ? (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {step === "AMOUNT" && (
                <View style={styles.container}>
                    <View style={styles.balanceBadge}>
                        <Ionicons name="wallet-outline" size={16} color="#4F46E5" />
                        <Text style={styles.balanceText}>
                            Available Bonus: {CURRENCY}{bonusBalance.toLocaleString()}
                        </Text>
                    </View>

                    <Text style={styles.label}>Amount to Convert</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currencyPrefix}>{CURRENCY}</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={(text) => {
                                // Allow only numbers and decimals
                                setAmount(text.replace(/[^0-9.]/g, ""));
                            }}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleProceedToPin}>
                        <Text style={styles.btnText}>Proceed</Text>
                    </TouchableOpacity>
                </View>
            )}

            {step === "PIN" && (
                <View style={styles.container}>
                    <View style={styles.pinHeader}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => { setStep("AMOUNT"); setError(""); setPinError(false); }}>
                            <Ionicons name="arrow-back" size={20} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.pinTitle}>Enter Transaction PIN</Text>
                    </View>

                    <Text style={styles.pinSubtitle}>
                        You are converting <Text style={{ fontWeight: "700", color: "#111827" }}>{CURRENCY}{parseFloat(amount).toLocaleString()}</Text> to your main wallet.
                    </Text>

                    <TransactionPinInput
                        onComplete={handleConvert}
                        error={pinError}
                        clearError={() => setPinError(false)}
                        isLoading={isLoading}
                    />

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#4F46E5" />
                            <Text style={styles.loadingText}>Processing Conversion...</Text>
                        </View>
                    )}
                </View>
            )}

            {step === "SUCCESS" && (
                <View style={styles.successContainer}>
                    <View style={styles.successIconWrapper}>
                        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Successfully Converted</Text>
                    <Text style={styles.successDesc}>
                        {CURRENCY}{parseFloat(amount).toLocaleString()} has been added to your main wallet balance.
                    </Text>

                    <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleClose}>
                        <Text style={styles.btnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            )}
        </BottomSheetContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 8,
        backgroundColor: "#FFFFFF",
    },
    balanceBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF2FF",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 20,
        alignSelf: "flex-start",
    },
    balanceText: {
        marginLeft: 8,
        fontSize: 13,
        fontWeight: "600",
        color: "#4F46E5",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: "#FFF",
        marginBottom: 24,
    },
    currencyPrefix: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 60,
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
    },
    primaryBtn: {
        backgroundColor: "#2563EB",
        borderRadius: 12,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    btnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    pinHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
        marginRight: 8,
    },
    pinTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    pinSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 24,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "600",
        color: "#4F46E5",
    },
    successContainer: {
        alignItems: "center",
        paddingTop: 16,
    },
    successIconWrapper: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    successDesc: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        marginLeft: 8,
        color: "#E53935",
        fontSize: 13,
        fontWeight: "500",
        flex: 1,
    },
});
