import React, { useState } from "react";
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
import { verifyJambProfile, buyEducationPin, getEducationPackages } from "../../../utils/vtu";
import TransactionPinInput from '../TransactionPinInput';

type Provider = 'WAEC' | 'JAMB' | 'JAMB_MOCK' | 'NECO' | 'NABTEB';
type Step = 'PROVIDER' | 'DETAILS' | 'CONFIRM' | 'PIN' | 'SUCCESS';

interface BuyEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EDUCATION_PRODUCTS: Record<Provider, { name: string, price: number, examType: string, desc: string, icon: any, bg: string, iconColor: string }> = {
    WAEC: { name: 'WAEC Result Checker', price: 3500, examType: 'waecdirect', desc: 'Check WAEC/WASSCE results instantly', icon: 'document-text-outline', bg: '#ECFDF5', iconColor: '#10B981' },
    JAMB: { name: 'JAMB PIN', price: 7700, examType: 'jamb', desc: 'Get your JAMB registration PIN', icon: 'school-outline', bg: '#F3E8FF', iconColor: '#9333EA' },
    JAMB_MOCK: { name: 'JAMB Mock PIN', price: 1500, examType: 'jamb_mock', desc: 'Get your JAMB Mock PIN', icon: 'school-outline', bg: '#E0E7FF', iconColor: '#4F46E5' },
    NECO: { name: 'NECO Result Token', price: 1500, examType: 'neco', desc: 'Check NECO results with token', icon: 'document-text-outline', bg: '#FEF3C7', iconColor: '#F59E0B' },
    NABTEB: { name: 'NABTEB Result Checker', price: 1500, examType: 'nabteb', desc: 'Check NABTEB results instantly', icon: 'document-text-outline', bg: '#FEE2E2', iconColor: '#EF4444' },
};

const CURRENCY = "₦";

const BuyEducationModal: React.FC<BuyEducationModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('PROVIDER');
    const [provider, setProvider] = useState<Provider | null>(null);

    const [phoneNo, setPhoneNo] = useState('');

    const [isPurchasing, setIsPurchasing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [transactionData, setTransactionData] = useState<any>(null);
    const [transactionPin, setTransactionPin] = useState('');
    const [pinError, setPinError] = useState(false);

    const [profileId, setProfileId] = useState('');
    const [verifiedName, setVerifiedName] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const [products, setProducts] = useState<any[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const [waecRes, jambRes, jambMockRes, necoRes, nabtebRes] = await Promise.all([
                getEducationPackages('WAEC'),
                getEducationPackages('JAMB'),
                getEducationPackages('JAMB_MOCK'),
                getEducationPackages('NECO'),
                getEducationPackages('NABTEB')
            ]);

            let allProducts: any[] = [];

            // Collect any errors without breaking the rest
            const results = [
                { name: 'WAEC', res: waecRes },
                { name: 'JAMB', res: jambRes },
                { name: 'JAMB MOCK', res: jambMockRes },
                { name: 'NECO', res: necoRes },
                { name: 'NABTEB', res: nabtebRes }
            ];

            let errorList: string[] = [];
            for (const item of results) {
                if (!item.res.success) {
                    errorList.push(`${item.name}: ${item.res.error || 'Unknown error'}`);
                }
            }

            if (waecRes.success && waecRes.data) {
                allProducts = [...allProducts, ...waecRes.data.map((p: any) => ({ ...p, providerType: 'WAEC' as Provider }))];
            }
            if (jambRes.success && jambRes.data) {
                allProducts = [...allProducts, ...jambRes.data.map((p: any) => ({ ...p, providerType: 'JAMB' as Provider }))];
            }
            if (jambMockRes.success && jambMockRes.data) {
                allProducts = [...allProducts, ...jambMockRes.data.map((p: any) => ({ ...p, providerType: 'JAMB_MOCK' as Provider }))];
            }
            if (necoRes.success && necoRes.data) {
                allProducts = [...allProducts, ...necoRes.data.map((p: any) => ({ ...p, providerType: 'NECO' as Provider }))];
            }
            if (nabtebRes.success && nabtebRes.data) {
                allProducts = [...allProducts, ...nabtebRes.data.map((p: any) => ({ ...p, providerType: 'NABTEB' as Provider }))];
            }

            setProducts(allProducts);

            if (allProducts.length === 0 && errorList.length > 0) {
                setErrorMessage("Failed to load any packages.\n" + errorList.join('\n'));
            } else if (errorList.length > 0) {
                // If some loaded, maybe we don't need to show an aggressive error, or just a little warning.
                console.warn("Some providers failed to load:", errorList.join(', '));
            }
        } catch (error: any) {
            console.error("Failed to fetch education products", error);
            setErrorMessage(error?.message || "Failed to fetch education products");
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const activeProduct = provider ? products.find(p => p.providerType === provider) : null;
    const isJamb = provider === 'JAMB' || provider === 'JAMB_MOCK';

    React.useEffect(() => {
        if (isJamb && profileId.length === 10 && !verifiedName && !isVerifying) {
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

        const result = await verifyJambProfile(profileId);
        setIsVerifying(false);

        if (result.success && result.data?.customer_name) {
            setVerifiedName(result.data.customer_name);
        } else {
            setErrorMessage(result.error || 'Failed to verify Profile ID.');
        }
    };

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
        setTransactionPin('');
        setPinError(false);
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

    const handleProceedToConfirm = () => {
        setErrorMessage('');
        if (phoneNo.length < 10) {
            setErrorMessage('Please enter a valid phone number');
            return;
        }
        if (isJamb && (!verifiedName || profileId.length !== 10)) {
            setErrorMessage('Please enter and verify a valid JAMB Profile ID first');
            return;
        }
        setStep('CONFIRM');
    };

    const handleBack = () => {
        if (step === 'PIN') {
            setStep('CONFIRM');
            setPinError(false);
            setErrorMessage('');
        } else if (step === 'CONFIRM') {
            setStep('DETAILS');
        } else if (step === 'DETAILS') {
            setStep('PROVIDER');
            setProvider(null);
        }
    };

    const handlePurchase = async (pin?: string) => {
        if (!provider) return;

        setIsPurchasing(true);
        setErrorMessage('');
        setPinError(false);

        const pinToUse = pin || transactionPin;
        const backendProvider = isJamb ? 'JAMB' : provider;
        const passedProfileId = isJamb ? profileId : undefined;

        try {
            const result = await buyEducationPin(
                backendProvider,
                activeProduct?.PRODUCT_CODE || EDUCATION_PRODUCTS[provider].examType,
                phoneNo,
                pinToUse,
                passedProfileId
            );

            if (result.success) {
                setTransactionData({
                    status: result.status,
                    details: result.data?.cardDetails,
                    message: result.message
                });
                DeviceEventEmitter.emit('refreshData');
                setStep('SUCCESS');
            } else {
                setErrorMessage(result.error || 'Transaction failed. Please try again.');
                setPinError(true);
            }
        } catch (error: any) {
            setErrorMessage(error?.message || 'An unexpected error occurred.');
            setPinError(true);
        } finally {
            setIsPurchasing(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerRow}>
            {step !== 'PROVIDER' && step !== 'SUCCESS' ? (
                <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={20} color="#333" />
                </TouchableOpacity>
            ) : (
                <View style={[styles.iconBtn, { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]} />
            )}
            <Text style={styles.drawerTitle}>Education Payment</Text>
            <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
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
                                <Text style={styles.sectionTitle}>SELECT SERVICE</Text>

                                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                                    {isLoadingProducts ? (
                                        <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 24 }} />
                                    ) : (
                                        products.map((product, idx) => {
                                            const prov = product.providerType as Provider;
                                            const info = EDUCATION_PRODUCTS[prov];
                                            if (!info) return null;

                                            return (
                                                <TouchableOpacity
                                                    key={product.PRODUCT_CODE || idx}
                                                    style={styles.providerCard}
                                                    onPress={() => handleProviderSelect(prov)}
                                                >
                                                    <View style={styles.providerInfoRow}>
                                                        <View style={[styles.iconCircle, { backgroundColor: info.bg }]}>
                                                            <Ionicons name={info.icon} size={20} color={info.iconColor} />
                                                        </View>
                                                        <View style={styles.providerTextCol}>
                                                            <Text style={styles.providerName}>{product.PRODUCT_NAME}</Text>
                                                            <Text style={styles.providerNameSub}>{info.desc}</Text>
                                                        </View>
                                                        <Text style={[styles.providerPrice, { color: info.iconColor }]}>{CURRENCY}{product.SELLING_PRICE?.toLocaleString()}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        {step === 'DETAILS' && provider && activeProduct && (
                            <View style={styles.stepContainer}>
                                <View style={[styles.selectedProviderCard, { borderTopColor: EDUCATION_PRODUCTS[provider].iconColor, backgroundColor: EDUCATION_PRODUCTS[provider].bg }]}>
                                    <View style={styles.providerInfoRow}>
                                        <View style={[styles.iconCircle, { backgroundColor: '#FFF' }]}>
                                            <Ionicons name={EDUCATION_PRODUCTS[provider].icon} size={20} color={EDUCATION_PRODUCTS[provider].iconColor} />
                                        </View>
                                        <View style={styles.providerTextCol}>
                                            <Text style={styles.providerName}>{activeProduct.PRODUCT_NAME}</Text>
                                            <Text style={styles.providerNameSub}>{EDUCATION_PRODUCTS[provider].desc}</Text>
                                        </View>
                                        <Text style={[styles.providerPrice, { color: EDUCATION_PRODUCTS[provider].iconColor }]}>{CURRENCY}{activeProduct.SELLING_PRICE.toLocaleString()}</Text>
                                    </View>
                                </View>

                                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                                    {isJamb && (
                                        <View style={{ marginBottom: 16 }}>
                                            <Text style={styles.sectionTitle}>JAMB PROFILE ID</Text>
                                            <View style={[styles.inputContainer, profileId.length === 10 && styles.inputContainerSuccess]}>
                                                <View style={[styles.phoneIconCircle, { backgroundColor: '#9333EA' }]}>
                                                    <Ionicons name="person" size={16} color="#FFF" />
                                                </View>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="10-digit Profile ID"
                                                    placeholderTextColor="#9CA3AF"
                                                    keyboardType="number-pad"
                                                    maxLength={10}
                                                    value={profileId}
                                                    onChangeText={(text) => {
                                                        setProfileId(text.replace(/\D/g, ''));
                                                        setErrorMessage('');
                                                    }}
                                                />
                                                {isVerifying && <ActivityIndicator size="small" color="#9333EA" style={{ marginRight: 14 }} />}
                                                {verifiedName && !isVerifying && (
                                                    <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" style={{ marginRight: 14 }} />
                                                )}
                                            </View>
                                            {isVerifying && (
                                                <Text style={{ color: '#9333EA', fontSize: 13, marginTop: 4, marginLeft: 4, fontWeight: '600' }}>Verifying Profile ID...</Text>
                                            )}
                                            {verifiedName && !isVerifying && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8, marginTop: 8 }}>
                                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                                    <Text style={{ color: '#065F46', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>{verifiedName}</Text>
                                                </View>
                                            )}
                                            {profileId.length === 10 && !verifiedName && !isVerifying && !errorMessage && (
                                                <TouchableOpacity onPress={handleVerifyProfile} style={{ marginTop: 8 }}>
                                                    <Text style={{ color: '#9333EA', fontSize: 13, fontWeight: '700', marginLeft: 4 }}>Verify Manually</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}

                                    <Text style={styles.sectionTitle}>PHONE NUMBER</Text>
                                    <View style={[styles.inputContainer, phoneNo.length >= 10 && styles.inputContainerSuccess]}>
                                        <View style={styles.phoneIconCircle}>
                                            <Ionicons name="call" size={16} color="#FFF" />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="08012345678"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="number-pad"
                                            maxLength={11}
                                            value={phoneNo}
                                            onChangeText={(text) => {
                                                setPhoneNo(text.replace(/\D/g, ''));
                                                setErrorMessage('');
                                            }}
                                        />
                                        {phoneNo.length >= 10 && (
                                            <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" style={{ marginRight: 14 }} />
                                        )}
                                    </View>
                                </ScrollView>

                                <View style={styles.bottomAnchored}>
                                    <TouchableOpacity
                                        style={[styles.primaryBtn, (phoneNo.length < 10 || (isJamb && (!verifiedName || profileId.length !== 10))) && styles.disabledBtn]}
                                        disabled={phoneNo.length < 10 || (isJamb && (!verifiedName || profileId.length !== 10))}
                                        onPress={handleProceedToConfirm}
                                    >
                                        <Text style={styles.btnText}>
                                            {!phoneNo || phoneNo.length < 10
                                                ? 'Enter Phone Number'
                                                : isJamb && !verifiedName
                                                    ? 'Verify Profile ID First'
                                                    : `Proceed — ${CURRENCY}${activeProduct?.SELLING_PRICE?.toLocaleString()}`}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {step === 'CONFIRM' && provider && activeProduct && (
                            <View style={styles.stepContainer}>
                                <View style={[styles.receiptCard, { borderTopColor: EDUCATION_PRODUCTS[provider].iconColor }]}>
                                    <View style={[styles.iconCircle, { backgroundColor: EDUCATION_PRODUCTS[provider].bg, marginBottom: 12 }]}>
                                        <Ionicons name={EDUCATION_PRODUCTS[provider].icon} size={24} color={EDUCATION_PRODUCTS[provider].iconColor} />
                                    </View>
                                    <Text style={styles.receiptSubText}>YOU ARE PURCHASING</Text>
                                    <Text style={styles.receiptTitle}>{activeProduct.PRODUCT_NAME}</Text>
                                    <Text style={[styles.receiptAmount, { color: EDUCATION_PRODUCTS[provider].iconColor }]}>{CURRENCY}{activeProduct.SELLING_PRICE.toLocaleString()}</Text>

                                    <View style={styles.receiptDividerContainer}>
                                        <View style={styles.receiptDividerCutoutLeft} />
                                        <View style={styles.receiptDividerBorder} />
                                        <View style={styles.receiptDividerCutoutRight} />
                                    </View>

                                    <View style={[styles.receiptRow, { marginBottom: isJamb ? 12 : 0 }]}>
                                        <Text style={styles.receiptLabel}>Phone</Text>
                                        <Text style={styles.receiptValue}>{phoneNo}</Text>
                                    </View>
                                    {isJamb && (
                                        <>
                                            <View style={[styles.receiptRow, { marginBottom: 12 }]}>
                                                <Text style={styles.receiptLabel}>Profile ID</Text>
                                                <Text style={styles.receiptValue}>{profileId}</Text>
                                            </View>
                                            <View style={styles.receiptRow}>
                                                <Text style={styles.receiptLabel}>Name</Text>
                                                <Text style={[styles.receiptValue, { maxWidth: '60%', textAlign: 'right' }]} numberOfLines={1}>{verifiedName}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>

                                <View style={styles.bottomAnchored}>
                                    <TouchableOpacity
                                        style={styles.primaryBtn}
                                        onPress={() => setStep('PIN')}
                                    >
                                        <Text style={styles.btnText}>Proceed to Payment</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {step === 'PIN' && (
                            <View style={styles.stepContainer}>
                                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                                    <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 20 }]}>Enter Transaction PIN</Text>

                                    <TransactionPinInput
                                        onComplete={(pin) => {
                                            setTransactionPin(pin);
                                            handlePurchase(pin);
                                        }}
                                        error={pinError}
                                        clearError={() => setPinError(false)}
                                        isLoading={isPurchasing}
                                    />

                                    {isPurchasing && (
                                        <View style={[styles.processingRow, { marginTop: 30, justifyContent: 'center' }]}>
                                            <ActivityIndicator size="small" color="#111827" />
                                            <Text style={{ marginLeft: 8, color: '#111827', fontWeight: '600' }}>Processing Purchase...</Text>
                                        </View>
                                    )}
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
                                        <Text style={styles.successDesc}>Your {provider} PIN has been generated.</Text>

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
        backgroundColor: "#F3F4F6",
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
        backgroundColor: "#D1D5DB",
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    drawerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
    iconBtn: {
        backgroundColor: "#FFF",
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
    sectionTitle: {
        color: "#9CA3AF",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 12,
    },
    providerCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#FFF", // Subtle or no border
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedProviderCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderTopWidth: 4,
    },
    providerInfoRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    providerTextCol: {
        flex: 1,
    },
    providerName: {
        fontWeight: "700",
        fontSize: 15,
        color: "#111827",
        marginBottom: 2,
    },
    providerNameSub: {
        fontSize: 13,
        color: "#9CA3AF",
    },
    providerPrice: {
        fontWeight: "700",
        fontSize: 16,
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
        backgroundColor: "#FFF",
        borderRadius: 16,
        height: 60,
        marginBottom: 8,
        paddingLeft: 12,
        borderWidth: 1,
        borderColor: "transparent",
    },
    inputContainerSuccess: {
        borderColor: "#10B981",
    },
    phoneIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#10B981",
        justifyContent: "center",
        alignItems: "center",
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#111827",
        paddingHorizontal: 12,
        fontWeight: "600",
    },
    bottomAnchored: {
        marginTop: "auto",
        paddingTop: 16,
    },
    primaryBtn: {
        backgroundColor: "#171717",
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    disabledBtn: {
        opacity: 0.5,
    },
    btnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    receiptCard: {
        backgroundColor: "#FFF",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        marginBottom: 24,
        borderTopWidth: 4,
    },
    receiptSubText: {
        color: "#9CA3AF",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 8,
    },
    receiptTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    receiptAmount: {
        fontSize: 36,
        fontWeight: "800",
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
        borderColor: "#E5E7EB",
        borderStyle: "dashed",
    },
    receiptDividerCutoutLeft: {
        position: "absolute",
        left: -32,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        zIndex: 1,
    },
    receiptDividerCutoutRight: {
        position: "absolute",
        right: -32,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        zIndex: 1,
    },
    receiptRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    receiptLabel: {
        fontSize: 15,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    receiptValue: {
        fontSize: 15,
        fontWeight: "700",
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
    processingRow: {
        flexDirection: "row",
        alignItems: "center",
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
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    pinLabel: {
        fontSize: 11,
        color: "#9CA3AF",
        fontWeight: "700",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    pinValue: {
        fontSize: 16,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        color: "#111827",
        fontWeight: "700",
    },
    secondaryBtn: {
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        height: 56,
        borderRadius: 16,
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
