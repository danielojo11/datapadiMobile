import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    DeviceEventEmitter,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { verifyJambProfile, buyEducationPin } from "../../../utils/vtu";

type Provider = 'WAEC' | 'JAMB' | 'JAMB_MOCK';
type Step = 'PROVIDER' | 'DETAILS' | 'CONFIRM' | 'SUCCESS';

interface BuyEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EDUCATION_PRODUCTS = {
    WAEC: { name: 'WAEC Result Checker', price: 3500, examType: 'waecdirect', icon: 'document-text-outline' as const },
    JAMB: { name: 'JAMB UTME (No Mock)', price: 6200, examType: 'utme-no-mock', icon: 'school-outline' as const },
    JAMB_MOCK: { name: 'JAMB UTME (With Mock)', price: 7700, examType: 'utme-mock', icon: 'school-outline' as const },
};

const CURRENCY = "₦";

const BuyEducationModal: React.FC<BuyEducationModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('PROVIDER');
    const [provider, setProvider] = useState<Provider | null>(null);

    const [phoneNo, setPhoneNo] = useState('');
    const [profileId, setProfileId] = useState('');
    const [verifiedName, setVerifiedName] = useState<string | null>(null);

    const [isVerifying, setIsVerifying] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [transactionData, setTransactionData] = useState<any>(null);

    const resetState = () => {
        setStep('PROVIDER');
        setProvider(null);
        setPhoneNo('');
        setProfileId('');
        setVerifiedName(null);
        setIsPurchasing(false);
        setIsVerifying(false);
        setErrorMessage('');
        setTransactionData(null);
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    };

    const handleProviderSelect = (selected: Provider) => {
        setProvider(selected);
        setErrorMessage('');
        setStep('DETAILS');
    };

    // Verify JAMB Profile ID when it reaches 10 digits
    useEffect(() => {
        const isJambProvider = provider === 'JAMB' || provider === 'JAMB_MOCK';
        if (isJambProvider && profileId.length === 10 && !verifiedName && !isVerifying) {
            handleVerifyProfile();
        } else if (profileId.length !== 10) {
            setVerifiedName(null);
        }
    }, [profileId, provider]);

    const handleVerifyProfile = async () => {
        if (profileId.length !== 10) return;

        setIsVerifying(true);
        setErrorMessage('');
        setVerifiedName(null);

        try {
            const result = await verifyJambProfile(profileId);
            if (result.success && result.data?.customer_name) {
                setVerifiedName(result.data.customer_name);
            } else {
                setErrorMessage(result.error || 'Failed to verify profile ID.');
            }
        } catch (error: any) {
            setErrorMessage(error?.message || 'An error occurred during verification.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleProceedToConfirm = () => {
        setErrorMessage('');
        if (phoneNo.length < 10) {
            setErrorMessage('Please enter a valid phone number');
            return;
        }
        const isJambProvider = provider === 'JAMB' || provider === 'JAMB_MOCK';
        if (isJambProvider && (!verifiedName || profileId.length !== 10)) {
            setErrorMessage('Please enter and verify a valid JAMB Profile ID first');
            return;
        }
        setStep('CONFIRM');
    };

    const handlePurchase = async () => {
        if (!provider) return;

        setIsPurchasing(true);
        setErrorMessage('');

        const product = EDUCATION_PRODUCTS[provider];
        const isJambProvider = provider === 'JAMB' || provider === 'JAMB_MOCK';
        const backendProvider = isJambProvider ? 'JAMB' : 'WAEC';

        try {
            const result = await buyEducationPin(
                backendProvider,
                product.examType,
                phoneNo,
                isJambProvider ? profileId : undefined
            );

            if (result.success) {
                setTransactionData({
                    status: result.status, // 'OK' or 'PENDING'
                    details: result.data?.cardDetails, // The PIN/Serial string
                    message: result.message // For PENDING: "Connection delay... etc."
                });
                DeviceEventEmitter.emit('refreshData');
                setStep('SUCCESS');
            } else {
                setErrorMessage(result.error || 'Transaction failed. Please try again.');
            }
        } catch (error: any) {
            setErrorMessage(error?.message || 'An unexpected error occurred.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerRow}>
            <Text style={styles.drawerTitle}>
                {step === 'SUCCESS' ? 'Transaction Status' : 'Education PINs'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.drawerContainer}
                >
                    <View style={styles.handle} />
                    {renderHeader()}

                    <View style={styles.contentContainer}>
                        {errorMessage && step !== 'SUCCESS' ? (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        ) : null}

                        {step === 'PROVIDER' && (
                            <View style={styles.stepContainer}>
                                <Text style={styles.subText}>Select an Education body</Text>

                                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                                    {(Object.keys(EDUCATION_PRODUCTS) as Provider[]).map((prov) => {
                                        const info = EDUCATION_PRODUCTS[prov];
                                        return (
                                            <TouchableOpacity
                                                key={prov}
                                                style={styles.providerCard}
                                                onPress={() => handleProviderSelect(prov)}
                                            >
                                                <View style={styles.providerInfoRow}>
                                                    <View style={styles.iconCircle}>
                                                        <Ionicons name={info.icon} size={20} color="#4F46E5" />
                                                    </View>
                                                    <View>
                                                        <Text style={styles.providerName}>{prov}</Text>
                                                        <Text style={styles.providerNameSub}>{info.name}</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        {step === 'DETAILS' && (
                            <View style={styles.stepContainer}>
                                <TouchableOpacity onPress={() => setStep('PROVIDER')} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={16} color="#4F46E5" />
                                    <Text style={styles.backButtonText}>Change Provider</Text>
                                </TouchableOpacity>

                                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                                    {(provider === 'JAMB' || provider === 'JAMB_MOCK') && (
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>JAMB Profile ID</Text>
                                            <View style={styles.inputContainer}>
                                                <Ionicons name="person-outline" size={18} color="#666" style={{ marginLeft: 14 }} />
                                                <TextInput
                                                    style={[styles.input, { marginLeft: 10 }]}
                                                    placeholder="Enter 10-digit Profile ID"
                                                    keyboardType="number-pad"
                                                    maxLength={10}
                                                    value={profileId}
                                                    onChangeText={(text) => {
                                                        setProfileId(text.replace(/\D/g, ''));
                                                        setErrorMessage('');
                                                    }}
                                                    editable={!isVerifying}
                                                />
                                            </View>

                                            {isVerifying ? (
                                                <View style={styles.verifyingRow}>
                                                    <ActivityIndicator size="small" color="#4F46E5" />
                                                    <Text style={styles.verifyingText}>Verifying Profile ID...</Text>
                                                </View>
                                            ) : verifiedName ? (
                                                <View style={styles.verifiedBox}>
                                                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                    <Text style={styles.verifiedName}>{verifiedName}</Text>
                                                </View>
                                            ) : profileId.length === 10 && !verifiedName && !errorMessage ? (
                                                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyProfile}>
                                                    <Text style={styles.verifyBtnText}>Verify Manually</Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    )}

                                    <View style={[styles.inputGroup, { marginTop: 16 }]}>
                                        <Text style={styles.inputLabel}>Phone Number</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="call-outline" size={18} color="#666" style={{ marginLeft: 14 }} />
                                            <TextInput
                                                style={[styles.input, { marginLeft: 10 }]}
                                                placeholder="08012345678"
                                                keyboardType="number-pad"
                                                maxLength={11}
                                                value={phoneNo}
                                                onChangeText={(text) => {
                                                    setPhoneNo(text.replace(/\D/g, ''));
                                                    setErrorMessage('');
                                                }}
                                            />
                                        </View>
                                    </View>
                                </ScrollView>

                                <View style={styles.bottomAnchored}>
                                    <TouchableOpacity
                                        style={[
                                            styles.primaryBtn,
                                            (phoneNo.length < 10 || ((provider === 'JAMB' || provider === 'JAMB_MOCK') && !verifiedName)) && styles.disabledBtn
                                        ]}
                                        disabled={phoneNo.length < 10 || ((provider === 'JAMB' || provider === 'JAMB_MOCK') && (!verifiedName))}
                                        onPress={handleProceedToConfirm}
                                    >
                                        <Text style={styles.btnText}>Proceed</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {step === 'CONFIRM' && provider && (
                            <View style={styles.stepContainer}>
                                <TouchableOpacity onPress={() => setStep('DETAILS')} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={16} color="#4F46E5" />
                                    <Text style={styles.backButtonText}>Edit Details</Text>
                                </TouchableOpacity>

                                <View style={styles.receiptCard}>
                                    <Text style={styles.receiptSubText}>You are about to purchase</Text>
                                    <Text style={styles.receiptTitle}>{EDUCATION_PRODUCTS[provider].name}</Text>
                                    <Text style={styles.receiptAmount}>{CURRENCY}{EDUCATION_PRODUCTS[provider].price.toLocaleString()}</Text>

                                    <View style={styles.receiptDividerBorder} />

                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>Provider</Text>
                                        <Text style={styles.receiptValue}>{provider === 'JAMB_MOCK' ? 'JAMB' : provider}</Text>
                                    </View>
                                    {(provider === 'JAMB' || provider === 'JAMB_MOCK') && (
                                        <>
                                            <View style={styles.receiptRow}>
                                                <Text style={styles.receiptLabel}>Profile ID</Text>
                                                <Text style={styles.receiptValue}>{profileId}</Text>
                                            </View>
                                            <View style={styles.receiptRow}>
                                                <Text style={styles.receiptLabel}>Name</Text>
                                                <Text style={[styles.receiptValue, { flex: 1, textAlign: 'right', marginLeft: 16 }]}>{verifiedName}</Text>
                                            </View>
                                        </>
                                    )}
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>Phone Number</Text>
                                        <Text style={styles.receiptValue}>{phoneNo}</Text>
                                    </View>
                                </View>

                                <View style={styles.bottomAnchored}>
                                    <TouchableOpacity
                                        style={[styles.primaryBtn, isPurchasing && styles.disabledBtn]}
                                        onPress={handlePurchase}
                                        disabled={isPurchasing}
                                    >
                                        {isPurchasing ? (
                                            <View style={styles.processingRow}>
                                                <ActivityIndicator size="small" color="#FFF" />
                                                <Text style={[styles.btnText, { marginLeft: 8 }]}>Processing...</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.btnText}>Confirm Purchase</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {step === 'SUCCESS' && (
                            <View style={styles.successContainer}>
                                {transactionData?.status === 'PENDING' ? (
                                    <>
                                        <View style={[styles.successIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                                            <ActivityIndicator size="large" color="#F59E0B" style={{ margin: 20 }} />
                                        </View>
                                        <Text style={styles.successTitle}>Request Accepted</Text>
                                        <Text style={[styles.successDesc, { paddingHorizontal: 20 }]}>
                                            {transactionData.message || 'Connection delay with the board. Your PIN is being generated.'}
                                        </Text>
                                        <Text style={{ color: '#9CA3AF', fontSize: 13 }}>You will receive the PIN shortly.</Text>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.successIconWrapper}>
                                            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                                        </View>
                                        <Text style={styles.successTitle}>Purchase Successful</Text>
                                        <Text style={styles.successDesc}>Your {provider?.replace('_', ' ')} PIN has been generated.</Text>

                                        {transactionData?.details && (
                                            <View style={styles.pinBox}>
                                                <Text style={styles.pinLabel}>PIN DETAILS</Text>
                                                <Text style={styles.pinValue}>{transactionData.details}</Text>
                                            </View>
                                        )}
                                    </>
                                )}

                                <View style={[styles.bottomAnchored, { width: '100%' }]}>
                                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose}>
                                        <Text style={styles.secondaryBtnText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
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
    drawerContainer: {
        backgroundColor: "white",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        height: '85%',
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: "#E5E7EB",
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    drawerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
    closeBtn: {
        backgroundColor: "#F3F4F6",
        padding: 8,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    contentContainer: {
        flex: 1,
    },
    stepContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    flex1: {
        flex: 1,
    },
    subText: {
        color: "#6B7280",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 16,
    },
    providerCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#F3F4F6",
        borderRadius: 16,
        marginBottom: 12,
    },
    providerInfoRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#EEF2FF", // indigo-50
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    providerName: {
        fontWeight: "700",
        fontSize: 16,
        color: "#111827",
    },
    providerNameSub: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 2,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        alignSelf: "flex-start",
    },
    backButtonText: {
        color: "#4F46E5",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 6,
    },
    inputGroup: {
        marginBottom: 4,
    },
    inputLabel: {
        fontWeight: "600",
        fontSize: 14,
        color: "#111827",
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        height: 52,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#111827",
        paddingHorizontal: 14,
    },
    verifyingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        marginTop: 4,
    },
    verifyingText: {
        color: "#4F46E5",
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 8,
    },
    verifiedBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#D1FAE5",
        borderRadius: 8,
        padding: 12,
        marginTop: 4,
    },
    verifiedName: {
        color: "#047857",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 8,
    },
    verifyBtn: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: "flex-start",
        marginTop: 8,
    },
    verifyBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#374151"
    },
    bottomAnchored: {
        marginTop: "auto",
        paddingTop: 16,
    },
    primaryBtn: {
        backgroundColor: "#003366", // from the app styling
        height: 54,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    disabledBtn: {
        opacity: 0.6,
    },
    btnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    processingRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    receiptCard: {
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#F3F4F6",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        marginBottom: 24,
    },
    receiptSubText: {
        color: "#6B7280",
        fontSize: 14,
        marginBottom: 4,
    },
    receiptTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    receiptAmount: {
        fontSize: 28,
        fontWeight: "800",
        color: "#4F46E5",
        marginBottom: 20,
    },
    receiptDividerBorder: {
        width: "100%",
        height: 1,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        borderStyle: "solid",
        marginBottom: 20,
    },
    receiptRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 12,
    },
    receiptLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    receiptValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FEE2E2",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: "#DC2626",
        fontSize: 13,
        fontWeight: "500",
        marginLeft: 8,
        flex: 1,
    },
    successContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 20,
    },
    successIconWrapper: {
        marginBottom: 24,
        backgroundColor: "#ECFDF5",
        borderRadius: 50,
        padding: 4,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 8,
    },
    successDesc: {
        color: "#6B7280",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 24,
    },
    pinBox: {
        width: "100%",
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    pinLabel: {
        fontSize: 10,
        color: "#6B7280",
        fontWeight: "700",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    pinValue: {
        fontSize: 14,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        color: "#1F2937",
    },
    secondaryBtn: {
        backgroundColor: "#F3F4F6",
        height: 54,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    secondaryBtnText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "700",
    },
});

export default BuyEducationModal;
