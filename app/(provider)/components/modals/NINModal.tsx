import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheetContainer from "../BottomSheet";
import TransactionPinInput from "../TransactionPinInput";
import { authorizedFetch } from "@/app/utils/api-client";
import { DigitalNINCard } from "../ui/DigitalNINCard";
import { NINSlip } from "../ui/NINSlip";
import { generateVerificationPDF } from "@/app/utils/generateVerificationPDF";

type Props = {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
};

export default function NINModal({ visible, onClose, onSuccess }: Props) {
    const [nin, setNin] = useState("");
    const [step, setStep] = useState<"INPUT" | "PIN" | "SUCCESS">("INPUT");
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState("");
    const [pinError, setPinError] = useState(false);
    const [verificationData, setVerificationData] = useState<any>(null);
    const [activeView, setActiveView] = useState<"card" | "slip">("card");

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep("INPUT");
            setNin("");
            setError("");
            setPinError(false);
            setVerificationData(null);
            setActiveView("card");
        }, 300);
    };

    const handleProceedToPin = () => {
        setError("");
        if (!nin || nin.length < 11) {
            setError("Please enter a valid 11-digit NIN");
            return;
        }
        setStep("PIN");
    };

    const handleVerify = async (pin: string) => {
        setIsLoading(true);
        setError("");
        setPinError(false);

        try {
            const response = await authorizedFetch('/api/v1/prembly/verification/nin', {
                method: 'POST',
                body: JSON.stringify({
                    number_nin: nin,
                    transactionPin: pin
                })
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setVerificationData(result.data);
                if (onSuccess) onSuccess();
                setStep("SUCCESS");
            } else {
                setError(result.message || "Failed to verify NIN");
                setPinError(true);
            }
        } catch (err: any) {
            setError(err?.message || "An unexpected error occurred");
            setPinError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!verificationData) return;
        setIsExporting(true);
        try {
            await generateVerificationPDF(verificationData, activeView, 'NIN');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <BottomSheetContainer
            visible={visible}
            title={step === "SUCCESS" ? "NIN Verified" : "NIN Verification"}
            onClose={handleClose}
        >
            {error && step !== "SUCCESS" ? (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {step === "INPUT" && (
                <View style={styles.container}>
                    <Text style={styles.label}>Enter NIN (National Identity Number)</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="card-outline" size={24} color="#9CA3AF" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.input}
                            value={nin}
                            onChangeText={(text) => setNin(text.replace(/[^0-9]/g, ""))}
                            keyboardType="number-pad"
                            maxLength={11}
                            placeholder="e.g. 62042149067"
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
                        <TouchableOpacity style={styles.backBtn} onPress={() => { setStep("INPUT"); setError(""); setPinError(false); }}>
                            <Ionicons name="arrow-back" size={20} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.pinTitle}>Enter Transaction PIN</Text>
                    </View>

                    <Text style={styles.pinSubtitle}>
                        You are about to verify NIN <Text style={{ fontWeight: "700", color: "#111827" }}>{nin}</Text>.
                    </Text>

                    <TransactionPinInput
                        onComplete={handleVerify}
                        error={pinError}
                        clearError={() => setPinError(false)}
                        isLoading={isLoading}
                    />

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#4F46E5" />
                            <Text style={styles.loadingText}>Verifying NIN...</Text>
                        </View>
                    )}
                </View>
            )}

            {step === "SUCCESS" && verificationData && (
                <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, activeView === 'card' && styles.toggleBtnActive]} 
                            onPress={() => setActiveView('card')}
                        >
                            <Text style={[styles.toggleBtnText, activeView === 'card' && styles.toggleBtnTextActive]}>Digital Card</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, activeView === 'slip' && styles.toggleBtnActive]} 
                            onPress={() => setActiveView('slip')}
                        >
                            <Text style={[styles.toggleBtnText, activeView === 'slip' && styles.toggleBtnTextActive]}>NIN Slip</Text>
                        </TouchableOpacity>
                    </View>

                    {activeView === 'card' ? (
                        <DigitalNINCard data={verificationData} />
                    ) : (
                        <NINSlip data={verificationData} />
                    )}

                    <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleDownloadPDF} disabled={isExporting}>
                        {isExporting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Download PDF</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 12 }]} onPress={handleClose}>
                        <Text style={styles.secondaryBtnText}>Done</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </BottomSheetContainer>
    );
}

const styles = StyleSheet.create({
    container: { paddingTop: 8, backgroundColor: "#FFFFFF" },
    label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
    inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, paddingHorizontal: 16, backgroundColor: "#FFF", marginBottom: 24 },
    input: { flex: 1, height: 60, fontSize: 18, fontWeight: "500", color: "#111827" },
    primaryBtn: { backgroundColor: "#2563EB", borderRadius: 12, height: 52, justifyContent: "center", alignItems: "center", width: "100%" },
    secondaryBtn: { backgroundColor: "#F3F4F6", borderRadius: 12, height: 52, justifyContent: "center", alignItems: "center", width: "100%" },
    btnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
    secondaryBtnText: { color: "#111827", fontSize: 16, fontWeight: "700" },
    pinHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
    pinTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
    pinSubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 },
    loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 },
    loadingText: { marginLeft: 8, fontSize: 14, fontWeight: "600", color: "#4F46E5" },
    successContainer: { alignItems: "center", paddingTop: 16, paddingBottom: 40 },
    errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", padding: 12, borderRadius: 8, marginBottom: 16 },
    errorText: { marginLeft: 8, color: "#E53935", fontSize: 13, fontWeight: "500", flex: 1 },
    toggleRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4, marginBottom: 16, width: '100%' },
    toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    toggleBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    toggleBtnText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    toggleBtnTextActive: { color: '#111827', fontWeight: '600' }
});
