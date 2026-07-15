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
    Switch,
    Image,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { verifyJambProfile, buyEducationPin, getEducationPackages } from "@/app/utils/vtu";
import { getBeneficiaries, Beneficiary } from "@/app/utils/beneficiary";
import TransactionPinInput from "./components/TransactionPinInput";
import { useColorScheme } from "nativewind";


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

export default function EducationScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
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

    const [saveBeneficiary, setSaveBeneficiary] = useState(false);
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

    React.useEffect(() => {
        fetchProducts();
        getBeneficiaries('EDUCATION').then(res => {
            if (res.success) setBeneficiaries(res.data);
        });
    }, []);

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
        setSaveBeneficiary(false);
        setBeneficiaryName('');
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
                passedProfileId,
                saveBeneficiary,
                beneficiaryName
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
        <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center flex-1">
                <TouchableOpacity onPress={step !== 'PROVIDER' && step !== 'SUCCESS' ? handleBack : handleClose} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 justify-center items-center mr-3 border border-slate-100 dark:border-slate-800">
                    <Ionicons name="arrow-back" size={20} color={isDark ? "#F8FAFC" : "#111827"} />
                </TouchableOpacity>
                <Text className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">Education Payment</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top", "bottom"]}>
            <View className="flex-1 px-5 pt-4">
                {renderHeader()}

                <View className="flex-1 flex-col">
                    {errorMessage && step !== 'SUCCESS' ? (
                        <View className="flex-row items-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mb-4 border border-red-100 dark:border-red-900/30">
                            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                            <Text className="text-red-500 ml-2 text-sm font-medium">{errorMessage}</Text>
                        </View>
                    ) : null}

                    {step === 'PROVIDER' && (
                        <View className="flex-1 flex-col">
                            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-2 mb-4 uppercase">Select Service</Text>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                                {isLoadingProducts ? (
                                    <View className="py-10 items-center">
                                        <ActivityIndicator size="small" color={isDark ? '#F8FAFC' : '#111827'} />
                                    </View>
                                ) : (
                                    <View className="flex-col gap-y-3">
                                        {products.map((product, idx) => {
                                            const prov = product.providerType as Provider;
                                            const info = EDUCATION_PRODUCTS[prov];
                                            if (!info) return null;

                                            return (
                                                <TouchableOpacity
                                                    key={product.PRODUCT_CODE || idx}
                                                    className="flex-row items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none"
                                                    onPress={() => handleProviderSelect(prov)}
                                                >
                                                    <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: isDark ? info.iconColor + '20' : info.bg }}>
                                                        <Ionicons name={info.icon} size={24} color={info.iconColor} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-base font-bold text-slate-900 dark:text-white" numberOfLines={1}>{product.PRODUCT_NAME}</Text>
                                                        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{info.desc}</Text>
                                                    </View>
                                                    <Text className="text-base font-bold ml-2" style={{ color: info.iconColor }}>{CURRENCY}{product.SELLING_PRICE?.toLocaleString()}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}

                    {step === 'DETAILS' && provider && activeProduct && (
                        <View className="flex-1 flex-col">
                            <View className="flex-row items-center bg-white dark:bg-slate-900 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-800 border-t-4" style={{ borderTopColor: EDUCATION_PRODUCTS[provider].iconColor }}>
                                <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: isDark ? EDUCATION_PRODUCTS[provider].iconColor + '20' : EDUCATION_PRODUCTS[provider].bg }}>
                                    <Ionicons name={EDUCATION_PRODUCTS[provider].icon} size={24} color={EDUCATION_PRODUCTS[provider].iconColor} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-slate-900 dark:text-white" numberOfLines={1}>{activeProduct.PRODUCT_NAME}</Text>
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{EDUCATION_PRODUCTS[provider].desc}</Text>
                                </View>
                                <Text className="text-base font-bold ml-2" style={{ color: EDUCATION_PRODUCTS[provider].iconColor }}>{CURRENCY}{activeProduct.SELLING_PRICE.toLocaleString()}</Text>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                                {isJamb && (
                                    <View className="mb-4">
                                        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">JAMB Profile ID</Text>
                                        <View className={`flex-row items-center bg-white dark:bg-slate-900 border rounded-2xl h-16 px-4 ${profileId.length === 10 ? 'border-emerald-400 dark:border-emerald-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
                                            <View className="w-9 h-9 rounded-full bg-purple-600 items-center justify-center">
                                                <Ionicons name="person" size={16} color="#FFF" />
                                            </View>
                                            <TextInput
                                                className="flex-1 text-lg text-slate-900 dark:text-white font-bold tracking-wide ml-3"
                                                placeholder="10-digit Profile ID"
                                                placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
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
                                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                            )}
                                        </View>
                                        {isVerifying && (
                                            <Text className="text-purple-600 text-sm font-semibold mt-2 ml-1">Verifying Profile ID...</Text>
                                        )}
                                        {verifiedName && !isVerifying && (
                                            <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-xl mt-2 border border-emerald-100 dark:border-emerald-500/30">
                                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                                <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-bold ml-2">{verifiedName}</Text>
                                            </View>
                                        )}
                                        {profileId.length === 10 && !verifiedName && !isVerifying && !errorMessage && (
                                            <TouchableOpacity onPress={handleVerifyProfile} className="mt-2 ml-1">
                                                <Text className="text-purple-600 text-sm font-bold">Verify Manually</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {beneficiaries.length > 0 && (
                                    <View className="mb-4">
                                        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">Saved Beneficiaries</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                                            {beneficiaries.map(ben => {
                                                const isSelected = phoneNo === ben.identifier;
                                                return (
                                                    <TouchableOpacity
                                                        key={ben.id}
                                                        className={`flex-row items-center px-4 py-2.5 rounded-full mr-3 border ${isSelected ? 'border-transparent bg-slate-900 dark:bg-white' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                                                        onPress={() => setPhoneNo(ben.identifier)}
                                                    >
                                                        <Ionicons name="person-circle" size={16} color={isSelected ? (isDark ? '#111827' : '#FFF') : (isDark ? '#64748B' : '#94A3B8')} style={{ marginRight: 6 }} />
                                                        <Text className={`font-semibold text-sm ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {ben.name || ben.identifier}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                )}

                                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">Phone Number</Text>
                                <View className={`flex-row items-center bg-white dark:bg-slate-900 border rounded-2xl h-16 px-4 mb-4 ${phoneNo.length >= 10 ? 'border-emerald-400 dark:border-emerald-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
                                    <View className="w-9 h-9 rounded-full bg-emerald-500 items-center justify-center">
                                        <Ionicons name="call" size={16} color="#FFF" />
                                    </View>
                                    <TextInput
                                        className="flex-1 text-lg text-slate-900 dark:text-white font-bold tracking-wide ml-3"
                                        placeholder="08012345678"
                                        placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                                        keyboardType="number-pad"
                                        maxLength={11}
                                        value={phoneNo}
                                        onChangeText={(text) => {
                                            setPhoneNo(text.replace(/\D/g, ''));
                                            setErrorMessage('');
                                        }}
                                    />
                                    {phoneNo.length >= 10 && (
                                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                    )}
                                </View>

                                <View className="flex-row items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
                                    <Text className="text-base font-bold text-slate-700 dark:text-slate-200">Save as Beneficiary</Text>
                                    <Switch
                                        value={saveBeneficiary}
                                        onValueChange={setSaveBeneficiary}
                                        trackColor={{ false: isDark ? "#334155" : "#E2E8F0", true: "#10B981" }}
                                        thumbColor={Platform.OS === 'ios' ? "#FFFFFF" : saveBeneficiary ? "#FFFFFF" : (isDark ? "#94A3B8" : "#F8FAFC")}
                                    />
                                </View>

                                {saveBeneficiary && (
                                    <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-14 px-4 mb-4">
                                        <Ionicons name="bookmark" size={16} color={isDark ? '#64748B' : '#9CA3AF'} style={{ marginRight: 12 }} />
                                        <TextInput
                                            className="flex-1 text-base text-slate-900 dark:text-white font-semibold"
                                            placeholder="Alias / Name (Optional)"
                                            value={beneficiaryName}
                                            placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                                            onChangeText={setBeneficiaryName}
                                        />
                                    </View>
                                )}
                            </ScrollView>

                            <View className="pt-4 pb-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
                                <TouchableOpacity
                                    className={`py-4 rounded-full items-center ${(phoneNo.length < 10 || (isJamb && (!verifiedName || profileId.length !== 10))) ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-900 dark:bg-white shadow-xl shadow-slate-900/20 dark:shadow-white/20'}`}
                                    disabled={phoneNo.length < 10 || (isJamb && (!verifiedName || profileId.length !== 10))}
                                    onPress={handleProceedToConfirm}
                                    activeOpacity={0.8}
                                >
                                    <Text className={`text-base font-bold ${(phoneNo.length < 10 || (isJamb && (!verifiedName || profileId.length !== 10))) ? 'text-slate-400 dark:text-slate-500' : 'text-white dark:text-slate-900'}`}>
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
                        <View className="flex-1 flex-col">
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                                <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm border-t-4" style={{ borderTopColor: EDUCATION_PRODUCTS[provider].iconColor }}>
                                    <View className="items-center px-6 pt-8 pb-6">
                                        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: isDark ? EDUCATION_PRODUCTS[provider].iconColor + '20' : EDUCATION_PRODUCTS[provider].bg }}>
                                            <Ionicons name={EDUCATION_PRODUCTS[provider].icon} size={32} color={EDUCATION_PRODUCTS[provider].iconColor} />
                                        </View>
                                        <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center mb-2 px-4 uppercase tracking-widest">You are purchasing</Text>
                                        <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-6">{activeProduct.PRODUCT_NAME}</Text>

                                        <View className="items-center bg-slate-50 dark:bg-slate-950/50 py-4 px-8 rounded-2xl w-full border border-slate-100 dark:border-slate-800">
                                            <Text className="text-3xl font-black" style={{ color: EDUCATION_PRODUCTS[provider].iconColor }}>
                                                {CURRENCY}{activeProduct.SELLING_PRICE.toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center justify-center w-full my-2">
                                        <View className="w-4 h-8 bg-slate-50 dark:bg-slate-950 rounded-r-full absolute left-0 border-y border-r border-slate-100 dark:border-slate-800" />
                                        <View className="flex-1 h-0 border-t border-dashed border-slate-200 dark:border-slate-700 mx-6" />
                                        <View className="w-4 h-8 bg-slate-50 dark:bg-slate-950 rounded-l-full absolute right-0 border-y border-l border-slate-100 dark:border-slate-800" />
                                    </View>

                                    <View className="px-6 py-4 space-y-4 mb-4">
                                        <View className="flex-row justify-between items-center mb-4">
                                            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Phone</Text>
                                            <Text className="text-sm font-extrabold text-slate-900 dark:text-white flex-1 text-right ml-4">{phoneNo}</Text>
                                        </View>
                                        {isJamb && (
                                            <>
                                                <View className="flex-row justify-between items-center mb-4">
                                                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Profile ID</Text>
                                                    <Text className="text-sm font-extrabold text-slate-900 dark:text-white">{profileId}</Text>
                                                </View>
                                                <View className="flex-row justify-between items-center">
                                                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Name</Text>
                                                    <Text className="text-sm font-extrabold text-slate-900 dark:text-white flex-1 text-right ml-4" numberOfLines={1}>{verifiedName}</Text>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </ScrollView>

                            <View className="pt-4 pb-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
                                <TouchableOpacity className="bg-slate-900 dark:bg-white py-4 rounded-full items-center shadow-xl shadow-slate-900/20 dark:shadow-white/20" onPress={() => setStep('PIN')} disabled={isPurchasing}>
                                    <Text className="text-white dark:text-slate-900 text-base font-bold">Proceed to Payment</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {step === 'PIN' && (
                        <View className="flex-1 flex-col">
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
                                <View className="mt-4 mb-6">
                                    <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm relative">
                                        <Ionicons name="lock-closed-outline" size={28} color={isDark ? "#F8FAFC" : "#111827"} />
                                        <View className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white dark:border-slate-900">
                                            <Ionicons name="shield-checkmark" size={12} color="#fff" />
                                        </View>
                                    </View>
                                </View>

                                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Enter Transaction PIN</Text>
                                <Text className="text-base text-slate-500 dark:text-slate-400 text-center px-8 mb-8">
                                    Please enter your 4-digit PIN to authorize this purchase
                                </Text>

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
                                    <View className="flex-row items-center justify-center mt-8 bg-white dark:bg-slate-900 px-6 py-3 rounded-full border border-slate-100 dark:border-slate-800">
                                        <ActivityIndicator size="small" color={isDark ? '#F8FAFC' : '#111827'} />
                                        <Text className="text-sm font-bold text-slate-900 dark:text-white ml-3">Processing purchase...</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}

                    {step === 'SUCCESS' && (
                        <View className="flex-1 items-center justify-center pt-6 px-4">
                            {transactionData?.status === 'PENDING' ? (
                                <>
                                    <View className="mb-6">
                                        <View className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full items-center justify-center">
                                            <ActivityIndicator size="large" color="#F59E0B" />
                                        </View>
                                    </View>
                                    <Text className="text-[26px] font-black text-slate-900 dark:text-white mb-2 text-center">Request Accepted</Text>
                                    <Text className="text-base text-slate-500 dark:text-slate-400 text-center px-6 leading-6 mb-4">
                                        {transactionData.message || 'Connection delay with the board. Your PIN is being generated.'}
                                    </Text>
                                    <Text className="text-sm font-semibold text-slate-400 dark:text-slate-500">You will receive the PIN shortly.</Text>
                                </>
                            ) : (
                                <>
                                    <View className="mb-6">
                                        <View className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full items-center justify-center">
                                            <Ionicons name="checkmark-circle" size={72} color="#10B981" />
                                        </View>
                                    </View>
                                    <Text className="text-[26px] font-black text-slate-900 dark:text-white mb-2 text-center">Purchase Successful!</Text>
                                    <Text className="text-base text-slate-500 dark:text-slate-400 text-center px-6 leading-6 mb-8">
                                        Your {provider} PIN has been generated.
                                    </Text>

                                    {transactionData?.details && (
                                        <View className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                                            <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-4 uppercase text-center">PIN Details</Text>
                                            <View className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-center justify-center">
                                                <Text className="text-lg font-black text-slate-900 dark:text-white text-center" selectable>{transactionData.details}</Text>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}

                            <View className="w-full mt-auto pb-6">
                                <TouchableOpacity className="bg-slate-900 dark:bg-white py-4 rounded-full items-center shadow-xl shadow-slate-900/20 dark:shadow-white/20" onPress={handleClose}>
                                    <Text className="text-white dark:text-slate-900 text-base font-bold">Return to Dashboard</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};
