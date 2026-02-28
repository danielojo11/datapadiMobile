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
    RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
    getCablePackages,
    verifySmartCard,
    payCableSubscription,
    CablePackagesResponse,
    CablePackage,
} from "../../../utils/cable";

interface BuyCableModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'PROVIDER' | 'DETAILS' | 'CONFIRM' | 'SUCCESS';

interface UIPlan {
    id: string;
    name: string;
    price: number;
}

const CABLE_PROVIDERS = [
    { id: 'dstv', name: 'DStv', themeBg: '#E0E7FF', themeText: '#2563EB' },
    { id: 'gotv', name: 'GOtv', themeBg: '#DCFCE7', themeText: '#16A34A' },
    { id: 'startimes', name: 'StarTimes', themeBg: '#FFEDD5', themeText: '#EA580C' },
    { id: 'showmax', name: 'Showmax', themeBg: '#F3E8FF', themeText: '#9333EA' }
];

const CURRENCY = "₦";

const CableTV: React.FC<BuyCableModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('PROVIDER');
    const [apiPackages, setApiPackages] = useState<CablePackagesResponse | null>(null);

    const [providerId, setProviderId] = useState('');
    const [smartCardNumber, setSmartCardNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<UIPlan | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [customerName, setCustomerName] = useState('');
    const [isLoadingPackages, setIsLoadingPackages] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const selectedProvider = CABLE_PROVIDERS.find(p => p.id === providerId);

    useEffect(() => {
        if (isOpen && !apiPackages) {
            fetchPackages();
        }
    }, [isOpen]);

    const fetchPackages = async () => {
        setIsLoadingPackages(true);
        setErrorMessage('');
        const res = await getCablePackages();

        if (res.success && res.data) {
            setApiPackages(res.data);
        } else {
            setErrorMessage(res.error || 'Failed to load cable TV packages.');
        }
        setIsLoadingPackages(false);
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchPackages();
        setRefreshing(false);
    }, []);

    const resetState = () => {
        setStep('PROVIDER');
        setProviderId('');
        setSmartCardNumber('');
        setPhoneNumber('');
        setSelectedPlan(null);
        setSearchQuery('');
        setCustomerName('');
        setIsValidated(false);
        setIsValidating(false);
        setIsProcessing(false);
        setErrorMessage('');
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    };

    const handleProviderSelect = (id: string) => {
        setProviderId(id);
        setErrorMessage('');
        setStep('DETAILS');
    };

    const handleValidate = async () => {
        if (!smartCardNumber || smartCardNumber.length < 8) {
            setErrorMessage('Please enter a valid Smartcard/IUC Number (min 8 digits)');
            return;
        }

        setIsValidating(true);
        setErrorMessage('');

        const res = await verifySmartCard(providerId, smartCardNumber);

        if (res.success && res.customerName) {
            setCustomerName(res.customerName);
            setIsValidated(true);
        } else {
            setErrorMessage(res.error || 'Unable to verify smartcard. Please check your details.');
            setIsValidated(false);
        }
        setIsValidating(false);
    };

    const getAvailablePlans = (): UIPlan[] => {
        if (!apiPackages || !providerId) return [];

        const apiKeys = Object.keys(apiPackages);
        const mappedKey = apiKeys.find(k => k.toLowerCase() === providerId.toLowerCase());

        if (!mappedKey) return [];

        const groups = apiPackages[mappedKey];
        const flatPlans: UIPlan[] = [];

        groups.forEach((group) => {
            if (group.PRODUCT && Array.isArray(group.PRODUCT)) {
                group.PRODUCT.forEach((p: CablePackage) => {
                    flatPlans.push({
                        id: p.PACKAGE_ID,
                        name: p.PACKAGE_NAME,
                        price: parseFloat(p.PACKAGE_AMOUNT)
                    });
                });
            }
        });

        return flatPlans;
    };

    const availablePlans = getAvailablePlans();
    const filteredPlans = availablePlans.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePurchase = async () => {
        if (!selectedPlan) return;

        if (!phoneNumber || phoneNumber.length < 10) {
            setErrorMessage('Please provide a valid contact phone number');
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');

        const res = await payCableSubscription({
            cableTV: providerId,
            packageCode: selectedPlan.id,
            smartCardNo: smartCardNumber,
            phoneNo: phoneNumber
        });

        setIsProcessing(false);

        if (res.success) {
            DeviceEventEmitter.emit('refreshData');
            setStep('SUCCESS');
        } else {
            setErrorMessage(res.error || 'Transaction failed. Please try again.');
        }
    };

    const renderHeader = () => (
        <View style={styles.headerRow}>
            <Text style={styles.drawerTitle}>
                {step === 'SUCCESS' ? 'Transaction Status' : 'Cable Subscription'}
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
                        {errorMessage && step !== 'SUCCESS' && (
                            <View style={styles.globalErrorBox}>
                                <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                                <Text style={styles.globalErrorText}>{errorMessage}</Text>
                            </View>
                        )}

                        {step === 'PROVIDER' && (
                            <View style={styles.stepContainer}>
                                <Text style={styles.subText}>Select your cable provider</Text>

                                {isLoadingPackages ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#9333EA" />
                                        <Text style={[styles.loadingText, { color: '#9333EA' }]}>Loading packages...</Text>
                                    </View>
                                ) : (
                                    <ScrollView
                                        style={styles.flex1}
                                        showsVerticalScrollIndicator={false}
                                        refreshControl={
                                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                                        }
                                    >
                                        {CABLE_PROVIDERS.map((provider) => (
                                            <TouchableOpacity
                                                key={provider.id}
                                                style={styles.providerCard}
                                                onPress={() => handleProviderSelect(provider.id)}
                                            >
                                                <View style={styles.providerInfoRow}>
                                                    <View style={[styles.iconCircle, { backgroundColor: provider.themeBg }]}>
                                                        <MaterialCommunityIcons name="television-classic" size={20} color={provider.themeText} />
                                                    </View>
                                                    <Text style={styles.providerName}>{provider.name}</Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={18} color="#CCC" />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}

                        {step === 'DETAILS' && (
                            <View style={styles.stepContainer}>
                                <TouchableOpacity onPress={() => setStep('PROVIDER')} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={16} color="#9333EA" />
                                    <Text style={[styles.backButtonText, { color: '#9333EA' }]}>Change Provider</Text>
                                </TouchableOpacity>

                                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.inputLabel}>Smartcard / IUC Number</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter decoder number"
                                            keyboardType="number-pad"
                                            value={smartCardNumber}
                                            onChangeText={(text) => {
                                                setSmartCardNumber(text.replace(/\D/g, ''));
                                                setIsValidated(false);
                                                setErrorMessage('');
                                                setSelectedPlan(null);
                                            }}
                                            editable={!isValidating}
                                        />
                                    </View>

                                    {!isValidated ? (
                                        <TouchableOpacity
                                            style={[styles.primaryBtn, (isValidating || smartCardNumber.length < 8) && styles.disabledBtn]}
                                            onPress={handleValidate}
                                            disabled={isValidating || smartCardNumber.length < 8}
                                        >
                                            {isValidating ? (
                                                <View style={styles.processingRow}>
                                                    <ActivityIndicator size="small" color="#FFF" />
                                                    <Text style={[styles.btnText, { marginLeft: 8 }]}>Verifying Smartcard...</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.btnText}>Validate Smartcard</Text>
                                            )}
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.validatedSection}>
                                            <View style={styles.verifiedBox}>
                                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                                <View style={styles.verifiedTextCol}>
                                                    <Text style={styles.verifiedLabel}>VERIFIED CUSTOMER</Text>
                                                    <Text style={styles.verifiedName}>{customerName}</Text>
                                                </View>
                                            </View>


                                            {/* Contact Phone Number */}
                                            <View>
                                                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Contact Phone Number</Text>
                                                <View style={styles.inputContainer}>
                                                    <Ionicons name="call-outline" size={18} color="#9CA3AF" style={{ marginLeft: 14 }} />
                                                    <TextInput
                                                        style={[styles.input, { marginLeft: 10 }]}
                                                        placeholder="Required for receipt"
                                                        keyboardType="number-pad"
                                                        maxLength={11}
                                                        value={phoneNumber}
                                                        onChangeText={(text) => {
                                                            setPhoneNumber(text.replace(/\D/g, ''));
                                                            setErrorMessage('');
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Available Packages</Text>
                                            <View style={[styles.inputContainer, { paddingHorizontal: 12 }]}>
                                                <Ionicons name="search" size={18} color="#9CA3AF" />
                                                <TextInput
                                                    style={[styles.input, { paddingHorizontal: 8 }]}
                                                    placeholder={`Search ${selectedProvider?.name} plans...`}
                                                    value={searchQuery}
                                                    onChangeText={setSearchQuery}
                                                />
                                            </View>
                                            {/* Plans Container */}
                                            <View style={styles.plansContainer}>
                                                {filteredPlans.length > 0 ? (
                                                    filteredPlans.map((plan) => {
                                                        const isSelected = selectedPlan?.id === plan.id;
                                                        return (
                                                            <TouchableOpacity
                                                                key={plan.id}
                                                                style={[styles.planCard, isSelected && styles.planCardActive]}
                                                                onPress={() => setSelectedPlan(plan)}
                                                            >
                                                                <Text style={styles.planName}>{plan.name}</Text>
                                                                <Text style={[styles.planPrice, isSelected && styles.planPriceActive]}>
                                                                    {CURRENCY}{plan.price.toLocaleString()}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        )
                                                    })
                                                ) : (
                                                    <Text style={styles.emptyPlansText}>No packages found.</Text>
                                                )}
                                            </View>



                                        </View>
                                    )}
                                </ScrollView>

                                {isValidated && (
                                    <View style={styles.bottomAnchored}>
                                        <TouchableOpacity
                                            style={[styles.primaryBtn, (!selectedPlan || phoneNumber.length < 10) && styles.disabledBtn]}
                                            disabled={!selectedPlan || phoneNumber.length < 10}
                                            onPress={() => setStep('CONFIRM')}
                                        >
                                            <Text style={styles.btnText}>Proceed to Payment</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {step === 'CONFIRM' && (
                            <View style={styles.stepContainer}>
                                <TouchableOpacity onPress={() => setStep('DETAILS')} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={16} color="#9333EA" />
                                    <Text style={[styles.backButtonText, { color: '#9333EA' }]}>Edit Details</Text>
                                </TouchableOpacity>

                                <View style={styles.receiptCard}>
                                    <View style={styles.receiptTopBorder} />

                                    <Text style={styles.receiptSubText}>You are about to subscribe to</Text>
                                    <Text style={styles.receiptTitle}>{selectedPlan?.name}</Text>
                                    <Text style={styles.receiptAmount}>{CURRENCY}{Number(selectedPlan?.price).toLocaleString()}</Text>

                                    <View style={styles.receiptDividerContainer}>
                                        <View style={styles.receiptDividerCutoutLeft} />
                                        <View style={styles.receiptDividerBorder} />
                                        <View style={styles.receiptDividerCutoutRight} />
                                    </View>

                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>Provider</Text>
                                        <Text style={styles.receiptValue}>{selectedProvider?.name}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>Customer</Text>
                                        <Text style={styles.receiptValue}>{customerName}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>Smartcard No.</Text>
                                        <Text style={styles.receiptValueMono}>{smartCardNumber}</Text>
                                    </View>
                                </View>

                                <View style={styles.bottomAnchored}>
                                    <TouchableOpacity
                                        style={[styles.primaryBtn, isProcessing && styles.disabledBtn]}
                                        onPress={handlePurchase}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <View style={styles.processingRow}>
                                                <ActivityIndicator size="small" color="#FFF" />
                                                <Text style={[styles.btnText, { marginLeft: 8 }]}>Processing Payment...</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.btnText}>Confirm & Pay</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {step === 'SUCCESS' && (
                            <View style={styles.successContainer}>
                                <View style={styles.successIconWrapper}>
                                    <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                                </View>
                                <Text style={styles.successTitle}>Subscription Successful!</Text>
                                <Text style={styles.successDesc}>
                                    Your {selectedProvider?.name} decoder has been successfully credited.
                                </Text>

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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: "600",
    },
    globalErrorBox: {
        flexDirection: "row",
        backgroundColor: "#FEF2F2",
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#FEE2E2",
    },
    globalErrorText: {
        color: "#DC2626",
        fontSize: 13,
        fontWeight: "600",
        flex: 1,
        marginLeft: 10,
    },
    providerCard: {
        flexDirection: "row",
        justifyContent: "space-between",
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
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    providerName: {
        fontWeight: "600",
        fontSize: 15,
        color: "#1F2937",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        alignSelf: "flex-start",
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 6,
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
        marginBottom: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#111827",
        paddingHorizontal: 14,
    },
    validatedSection: {
        marginTop: 16,
    },
    verifiedBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#D1FAE5",
        borderRadius: 12,
        padding: 16,
    },
    verifiedTextCol: {
        marginLeft: 12,
    },
    verifiedLabel: {
        fontSize: 10,
        color: "#059669",
        fontWeight: "700",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    verifiedName: {
        fontWeight: "700",
        color: "#1F2937",
        fontSize: 15,
    },
    plansContainer: {
        marginBottom: 16,
    },
    planCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#F3F4F6",
        borderRadius: 12,
        marginBottom: 12,
    },
    planCardActive: {
        borderColor: "#9333EA",
        backgroundColor: "#FAF5FF",
    },
    planName: {
        fontWeight: "600",
        color: "#1F2937",
        fontSize: 14,
        width: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    planPrice: {
        fontWeight: "700",
        color: "#4B5563",
    },
    planPriceActive: {
        color: "#9333EA",
    },
    emptyPlansText: {
        textAlign: "center",
        color: "#9CA3AF",
        marginVertical: 20,
    },
    bottomAnchored: {
        marginTop: "auto",
        paddingTop: 16,
    },
    primaryBtn: {
        backgroundColor: "#9333EA",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    secondaryBtn: {
        backgroundColor: "#F3F4F6",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    disabledBtn: {
        opacity: 0.6,
    },
    processingRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    btnText: {
        color: "#FFF",
        fontWeight: "700",
        fontSize: 16,
    },
    secondaryBtnText: {
        color: "#374151",
        fontWeight: "700",
        fontSize: 16,
    },
    receiptCard: {
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#F3F4F6",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        marginBottom: 24,
        overflow: "hidden",
    },
    receiptTopBorder: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: "#A855F7",
    },
    receiptSubText: {
        color: "#6B7280",
        fontSize: 14,
        fontWeight: "500",
        marginTop: 8,
        marginBottom: 4,
    },
    receiptTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
        marginBottom: 8,
    },
    receiptAmount: {
        fontSize: 32,
        fontWeight: "900",
        color: "#9333EA",
        marginBottom: 24,
    },
    receiptDividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginBottom: 24,
    },
    receiptDividerBorder: {
        flex: 1,
        height: 1,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        borderStyle: "dashed",
    },
    receiptDividerCutoutLeft: {
        position: "absolute",
        left: -32,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#F9FAFB",
        zIndex: 1,
    },
    receiptDividerCutoutRight: {
        position: "absolute",
        right: -32,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#F9FAFB",
        zIndex: 1,
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
    receiptValueMono: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
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
});

export default CableTV;
