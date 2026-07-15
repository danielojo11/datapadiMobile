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
    Switch,
    Image,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
    getCablePackages,
    verifySmartCard,
    payCableSubscription,
    CablePackagesResponse,
    CablePackage,
} from "@/app/utils/cable";
import { getBeneficiaries, Beneficiary } from "@/app/utils/beneficiary";
import TransactionPinInput from "./components/TransactionPinInput";
import { useColorScheme } from "nativewind";


interface BuyCableModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'PROVIDER' | 'DETAILS' | 'CONFIRM' | 'PIN' | 'SUCCESS';

interface UIPlan {
    id: string;
    name: string;
    price: number;
}

const CABLE_PROVIDERS = [
    { id: 'dstv', name: 'DStv', themeBg: '#E0E7FF', themeText: '#2563EB' },
    { id: 'gotv', name: 'GOtv', themeBg: '#DCFCE7', themeText: '#16A34A' },
    { id: 'startimes', name: 'StarTimes', themeBg: '#FFEDD5', themeText: '#EA580C' },
];

const CURRENCY = "₦";

export default function CableTVScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [step, setStep] = useState<Step>('PROVIDER');
    const [apiPackages, setApiPackages] = useState<CablePackagesResponse | null>(null);

    const [providerId, setProviderId] = useState('');
    const [smartCardNumber, setSmartCardNumber] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<UIPlan | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [customerName, setCustomerName] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [currentBouquet, setCurrentBouquet] = useState('');
    const [isLoadingPackages, setIsLoadingPackages] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [transactionPin, setTransactionPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [saveBeneficiary, setSaveBeneficiary] = useState(false);
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

    const selectedProvider = CABLE_PROVIDERS.find(p => p.id === providerId);

    useEffect(() => {
        if (!apiPackages) {
            fetchPackages();
        }
        getBeneficiaries('CABLE').then(res => {
            if (res.success) setBeneficiaries(res.data);
        });
    }, []);

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
        setSelectedPlan(null);
        setSearchQuery('');
        setCustomerName('');
        setDueDate('');
        setCurrentBouquet('');
        setIsValidated(false);
        setIsValidating(false);
        setIsProcessing(false);
        setErrorMessage('');
        setTransactionPin('');
        setPinError(false);
        setSaveBeneficiary(false);
        setBeneficiaryName('');
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    };

    const handleProviderSelect = (id: string) => {
        setProviderId(id);
        setErrorMessage('');
        setSearchQuery('');
        setSelectedPlan(null);
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
        console.log("Cable TV", res)
        if (res.success) {
            setCustomerName(res.customerName);
            setDueDate(res.dueDate);
            setCurrentBouquet(res.currentBouquet || '');
            setIsValidated(true);
        } else {
            setErrorMessage(res.error);
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

    const handlePurchase = async (pin?: string) => {
        if (!selectedPlan) return;



        setIsProcessing(true);
        setErrorMessage('');
        setPinError(false);

        const pinToUse = pin || transactionPin;

        const res = await payCableSubscription({
            cableTV: providerId,
            packageCode: selectedPlan.id,
            smartCardNo: smartCardNumber,
            transactionPin: pinToUse,
            saveBeneficiary,
            beneficiaryName
        });

        setIsProcessing(false);

        if (res.success) {
            DeviceEventEmitter.emit('refreshData');
            setStep('SUCCESS');
        } else {
            setErrorMessage(res.error || 'Transaction failed. Please try again.');
            setPinError(true);
        }
    };

    const renderHeader = () => (
        <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center flex-1">
                <TouchableOpacity onPress={handleClose} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 justify-center items-center mr-3 border border-slate-100 dark:border-slate-800">
                    <Ionicons name="arrow-back" size={20} color={isDark ? "#F8FAFC" : "#111827"} />
                </TouchableOpacity>
                <Text className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {step === 'SUCCESS' ? 'Status' : 'Cable TV'}
                </Text>
            </View>
        </View>
    );

    return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top", "bottom"]}>
      <View className="flex-1 px-5 pt-4">
          {errorMessage && step !== 'SUCCESS' ? (
            <View className="flex-row items-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mb-4 border border-red-100 dark:border-red-900/30">
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text className="text-red-500 ml-2 text-sm font-medium">{errorMessage}</Text>
            </View>
          ) : null}

          {step === 'PROVIDER' && (
            <View className="flex-1 flex-col">
              {renderHeader()}
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-2 mb-4 uppercase">Select Provider</Text>

              {isLoadingPackages ? (
                <View className="py-10 items-center">
                  <ActivityIndicator size="small" color={isDark ? '#F8FAFC' : '#111827'} />
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#F8FAFC' : '#111827'} />}>
                  <View className="flex-col gap-y-3">
                    {CABLE_PROVIDERS.map((provider) => (
                      <TouchableOpacity
                        key={provider.id}
                        className="flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none"
                        onPress={() => handleProviderSelect(provider.id)}
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: isDark ? `${provider.themeText}15` : provider.themeBg }}>
                            <MaterialCommunityIcons name="television-classic" size={24} color={provider.themeText} />
                          </View>
                          <Text className="text-base font-bold text-slate-900 dark:text-white">{provider.name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#475569' : '#D1D5DB'} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {step === 'DETAILS' && (
            <View className="flex-1 flex-col">
              <TouchableOpacity onPress={() => setStep('PROVIDER')} className="flex-row items-center mb-6 self-start">
                <Ionicons name="arrow-back" size={16} color="#3B82F6" />
                <Text className="text-sm font-semibold text-blue-500 ml-1">Change Provider</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                {beneficiaries.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">Saved Beneficiaries</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                      {beneficiaries.map(ben => {
                        const isSelected = smartCardNumber === ben.identifier;
                        return (
                          <TouchableOpacity
                            key={ben.id}
                            className={`flex-row items-center px-4 py-2.5 rounded-full mr-3 border ${isSelected ? 'border-transparent bg-blue-600' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                            onPress={() => setSmartCardNumber(ben.identifier)}
                          >
                            <Ionicons name="person-circle" size={16} color={isSelected ? '#FFF' : (isDark ? '#64748B' : '#94A3B8')} style={{ marginRight: 6 }} />
                            <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {ben.name || ben.identifier}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 mt-2 uppercase">Smartcard / IUC Number</Text>
                <View className={`flex-row items-center bg-white dark:bg-slate-900 border rounded-2xl h-16 px-4 mb-4 ${isValidated ? 'border-emerald-400 dark:border-emerald-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
                  <TextInput
                    className="flex-1 text-lg text-slate-900 dark:text-white font-bold tracking-wide"
                    placeholder="Enter decoder number"
                    keyboardType="number-pad"
                    value={smartCardNumber}
                    placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                    onChangeText={(text) => {
                      setSmartCardNumber(text.replace(/\D/g, ''));
                      setIsValidated(false);
                      setErrorMessage('');
                      setSelectedPlan(null);
                    }}
                    editable={!isValidating}
                  />
                  {isValidated && (
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

                {!isValidated ? (
                  <TouchableOpacity
                    className={`py-4 rounded-full items-center ${(isValidating || smartCardNumber.length < 8) ? 'bg-slate-200 dark:bg-slate-800' : 'bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/30'}`}
                    onPress={handleValidate}
                    disabled={isValidating || smartCardNumber.length < 8}
                    activeOpacity={0.8}
                  >
                    {isValidating ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator size="small" color={isDark ? '#94A3B8' : '#64748B'} />
                        <Text className="text-slate-500 dark:text-slate-400 text-base font-bold ml-2">Verifying...</Text>
                      </View>
                    ) : (
                      <Text className={`text-base font-bold ${(isValidating || smartCardNumber.length < 8) ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`}>Validate Smartcard</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View className="mt-2">
                    <View className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 overflow-hidden mb-6">
                      <View className="flex-row items-center bg-emerald-100 dark:bg-emerald-500/20 px-4 py-3 border-b border-emerald-200 dark:border-emerald-500/30">
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-widest ml-2 uppercase">Verified Customer</Text>
                      </View>
                      <View className="p-4 space-y-3">
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Name</Text>
                          <Text className="text-sm font-bold text-slate-900 dark:text-white text-right flex-1 ml-4" numberOfLines={1}>{customerName}</Text>
                        </View>
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Smartcard No.</Text>
                          <Text className="text-sm font-bold text-slate-900 dark:text-white">{smartCardNumber}</Text>
                        </View>
                        {dueDate ? (
                          <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Due Date</Text>
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">{dueDate}</Text>
                          </View>
                        ) : null}
                        {currentBouquet ? (
                          <View className="flex-row justify-between items-center">
                            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Current Bouquet</Text>
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">{currentBouquet}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">Available Packages</Text>
                    
                    <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-14 px-4 mb-4">
                      <Ionicons name="search" size={20} color={isDark ? '#64748B' : '#9CA3AF'} />
                      <TextInput
                        className="flex-1 text-base text-slate-900 dark:text-white font-medium ml-2"
                        placeholder={`Search ${selectedProvider?.name} plans...`}
                        placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>

                    <View className="flex-col gap-y-3 pb-8">
                      {filteredPlans.length > 0 ? (
                        filteredPlans.map((plan) => {
                          const isSelected = selectedPlan?.id === plan.id;
                          return (
                            <TouchableOpacity
                              key={plan.id}
                              className={`flex-row justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800'} shadow-sm shadow-slate-200/50 dark:shadow-none`}
                              onPress={() => setSelectedPlan(plan)}
                            >
                              <Text className={`text-base font-bold flex-1 pr-4 ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{plan.name}</Text>
                              <Text className={`text-lg font-extrabold ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                {CURRENCY}{plan.price.toLocaleString()}
                              </Text>
                            </TouchableOpacity>
                          )
                        })
                      ) : (
                        <View className="py-10 items-center">
                          <Text className="text-sm text-slate-400 dark:text-slate-500">No packages found.</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>

              {isValidated && (
                <View className="pt-4 pb-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
                  <TouchableOpacity
                    className={`py-4 rounded-full items-center ${!selectedPlan ? 'bg-slate-200 dark:bg-slate-800' : 'bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/30'}`}
                    disabled={!selectedPlan}
                    onPress={() => setStep('CONFIRM')}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-base font-bold ${!selectedPlan ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`}>Proceed to Payment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {step === 'CONFIRM' && (
            <View className="flex-1 flex-col">
              <TouchableOpacity onPress={() => setStep('DETAILS')} className="flex-row items-center mb-6 self-start">
                <Ionicons name="arrow-back" size={16} color="#3B82F6" />
                <Text className="text-sm font-semibold text-blue-500 ml-1">Edit Details</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                  <View className="h-2 w-full" style={{ backgroundColor: selectedProvider?.themeText || '#3B82F6' }} />

                  <View className="items-center px-6 pt-8 pb-6">
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center mb-2 px-4">You are about to subscribe to</Text>
                    <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-6">{selectedPlan?.name}</Text>
                    
                    <View className="items-center bg-slate-50 dark:bg-slate-950/50 py-4 px-8 rounded-2xl w-full border border-slate-100 dark:border-slate-800">
                      <Text className="text-3xl font-black" style={{ color: selectedProvider?.themeText || '#3B82F6' }}>
                        {CURRENCY}{Number(selectedPlan?.price).toLocaleString()}
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
                      <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Provider</Text>
                      <Text className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedProvider?.name}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Customer</Text>
                      <Text className="text-sm font-extrabold text-slate-900 dark:text-white">{customerName}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Smartcard No.</Text>
                      <Text className="text-sm font-extrabold text-slate-900 dark:text-white tracking-widest">{smartCardNumber}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View className="pt-4 pb-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
                <TouchableOpacity className="bg-blue-600 dark:bg-blue-500 py-4 rounded-full items-center shadow-lg shadow-blue-500/30" onPress={() => setStep('PIN')}>
                  <Text className="text-white text-base font-bold">Proceed to Enter PIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'PIN' && (
            <View className="flex-1 flex-col">
              <TouchableOpacity onPress={() => { setStep('CONFIRM'); setPinError(false); setErrorMessage(''); }} className="flex-row items-center mb-6 self-start">
                <Ionicons name="arrow-back" size={16} color="#3B82F6" />
                <Text className="text-sm font-semibold text-blue-500 ml-1">Back</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
                <View className="mt-4 mb-6">
                  <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm relative">
                    <Ionicons name="lock-closed-outline" size={28} color="#3B82F6" />
                    <View className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white dark:border-slate-900">
                      <Ionicons name="shield-checkmark" size={12} color="#fff" />
                    </View>
                  </View>
                </View>

                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Authorize Payment</Text>
                <Text className="text-base text-slate-500 dark:text-slate-400 text-center px-8 mb-8">Enter your 4-digit PIN to confirm</Text>

                <TransactionPinInput
                  onComplete={(pin) => {
                    setTransactionPin(pin);
                    handlePurchase(pin);
                  }}
                  error={pinError}
                  clearError={() => setPinError(false)}
                  isLoading={isProcessing}
                />

                {isProcessing && (
                  <View className="flex-row items-center justify-center mt-8 bg-white dark:bg-slate-900 px-6 py-3 rounded-full border border-slate-100 dark:border-slate-800">
                    <ActivityIndicator size="small" color={isDark ? '#F8FAFC' : '#111827'} />
                    <Text className="text-sm font-bold text-slate-900 dark:text-white ml-3">Processing payment...</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {step === 'SUCCESS' && (
            <View className="flex-1 items-center justify-center pt-10 px-4">
              <View className="mb-8">
                <View className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full items-center justify-center">
                  <Ionicons name="checkmark-circle" size={88} color="#10B981" />
                </View>
              </View>
              <Text className="text-[28px] font-black text-slate-900 dark:text-white mb-4 text-center">Subscription Successful!</Text>
              <Text className="text-lg text-slate-500 dark:text-slate-400 text-center px-6 leading-7 mb-12">
                Your <Text className="font-black text-slate-900 dark:text-white">{selectedProvider?.name}</Text> decoder has been successfully credited.
              </Text>

              <View className="w-full mt-auto pb-6">
                <TouchableOpacity className="bg-slate-900 dark:bg-white py-4 rounded-full items-center shadow-xl shadow-slate-900/20 dark:shadow-white/20" onPress={handleClose}>
                  <Text className="text-white dark:text-slate-900 text-base font-bold">Return to Dashboard</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

      </View>
    </SafeAreaView>
  );
};

