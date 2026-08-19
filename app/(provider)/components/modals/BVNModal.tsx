import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheetContainer from "../BottomSheet";
import TransactionPinInput from "../TransactionPinInput";
import { authorizedFetch } from "@/app/utils/api-client";
import { generateVerificationPDF } from "@/app/utils/generateVerificationPDF";

type Props = {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
};

export default function BVNModal({ visible, onClose, onSuccess }: Props) {
    const [bvn, setBvn] = useState("");
    const [step, setStep] = useState<"INPUT" | "PIN" | "SUCCESS">("INPUT");
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState("");
    const [pinError, setPinError] = useState(false);
    const [verificationData, setVerificationData] = useState<any>(null);

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep("INPUT");
            setBvn("");
            setError("");
            setPinError(false);
            setVerificationData(null);
        }, 300);
    };

    const handleProceedToPin = () => {
        setError("");
        if (!bvn || bvn.length < 11) {
            setError("Please enter a valid 11-digit BVN");
            return;
        }
        setStep("PIN");
    };

    const handleVerify = async (pin: string) => {
        setIsLoading(true);
        setError("");
        setPinError(false);

        try {
            const response = await authorizedFetch('/api/v1/prembly/verification/bvn', {
                method: 'POST',
                body: JSON.stringify({
                    number: bvn,
                    transactionPin: pin
                })
            });

            const result = await response.json();

            if (response.ok && result.status) {
                setVerificationData(result.data);
                if (onSuccess) onSuccess();
                setStep("SUCCESS");
            } else {
                setError(result.message || "Failed to verify BVN");
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
            await generateVerificationPDF(verificationData, 'document', 'BVN');
        } finally {
            setIsExporting(false);
        }
    };

    const photoSrc = verificationData?.photo || verificationData?.base64Image
        ? { uri: (verificationData.photo || verificationData.base64Image)?.startsWith('data:') ? (verificationData.photo || verificationData.base64Image) : `data:image/jpeg;base64,${verificationData.photo || verificationData.base64Image}` }
        : { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' };

    return (
        <BottomSheetContainer
            visible={visible}
            title={step === "SUCCESS" ? "BVN Verified" : "BVN Verification"}
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
                    <Text style={styles.label}>Enter BVN (Bank Verification Number)</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={24} color="#9CA3AF" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.input}
                            value={bvn}
                            onChangeText={(text) => setBvn(text.replace(/[^0-9]/g, ""))}
                            keyboardType="number-pad"
                            maxLength={11}
                            placeholder="e.g. 22123456789"
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
                        You are about to verify BVN <Text style={{ fontWeight: "700", color: "#111827" }}>{bvn}</Text>.
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
                            <Text style={styles.loadingText}>Verifying BVN...</Text>
                        </View>
                    )}
                </View>
            )}

            {step === "SUCCESS" && verificationData && (
                <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        <Text style={styles.verifiedText}>BVN Verification Successful</Text>
                    </View>

                    <View style={styles.bvnCard}>
                        <View style={styles.photoContainer}>
                            <Image source={photoSrc} style={styles.photo} />
                        </View>
                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailLabel}>Full Name</Text>
                            <Text style={styles.detailValue}>
                                {verificationData.firstName || verificationData.firstname} {verificationData.middleName || verificationData.middlename} {verificationData.lastName || verificationData.surname || verificationData.lastname}
                            </Text>

                            <Text style={styles.detailLabel}>BVN</Text>
                            <Text style={styles.detailValue}>{verificationData.bvn || bvn}</Text>

                            <Text style={styles.detailLabel}>Date of Birth</Text>
                            <Text style={styles.detailValue}>{verificationData.dateOfBirth || verificationData.birthdate}</Text>

                            <Text style={styles.detailLabel}>Gender</Text>
                            <Text style={styles.detailValue}>{verificationData.gender}</Text>

                            <Text style={styles.detailLabel}>Phone Number</Text>
                            <Text style={styles.detailValue}>{verificationData.phoneNumber1 || verificationData.telephoneno || verificationData.phone}</Text>

                            <Text style={styles.detailLabel}>Enrollment Bank</Text>
                            <Text style={styles.detailValue}>{verificationData.enrollmentBank}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleDownloadPDF} disabled={isExporting}>
                        {isExporting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Download PDF Certificate</Text>}
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
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, marginBottom: 24, width: '100%', justifyContent: 'center' },
    verifiedText: { marginLeft: 8, color: '#047857', fontWeight: '700', fontSize: 16 },
    bvnCard: { width: '100%', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 20, backgroundColor: '#FFF' },
    photoContainer: { width: 100, height: 100, borderRadius: 8, overflow: 'hidden', alignSelf: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' },
    photo: { width: '100%', height: '100%' },
    detailsContainer: { width: '100%' },
    detailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4, marginTop: 12 },
    detailValue: { fontSize: 15, color: '#111827', fontWeight: '500', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }
});
