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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { buyData, getDataPlans, determineCategory } from "@/app/utils/vtu";
import { getBeneficiaries, Beneficiary } from "@/app/utils/beneficiary";
import { pickContactPhone } from "@/app/utils/contacts";
import TransactionPinInput from "./components/TransactionPinInput";
import { useColorScheme } from "nativewind";


type Step = 'NETWORK' | 'PLAN' | 'PHONE' | 'CONFIRM' | 'PIN' | 'SUCCESS';
type NetworkId = 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';

interface UIPlan {
  id: string;
  name: string;
  price: number;
  groupName: string;
  category: string;
}

type BuyDataProps = {
  visible: boolean;
  onClose: () => void;
};

const networks: { id: NetworkId; label: string; color: string; bgColor: string }[] = [
  { id: "MTN", label: "MTN", color: "#FFCC00", bgColor: "#FFFDF5" },
  { id: "AIRTEL", label: "AIRTEL", color: "#FF0000", bgColor: "#FFF5F5" },
  { id: "GLO", label: "GLO", color: "#00E600", bgColor: "#F5FFF5" },
  { id: "9MOBILE", label: "9MOBILE", color: "#006600", bgColor: "#F5FAF5" },
];

const CURRENCY = "₦";

export default function BuyDataScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [step, setStep] = useState<Step>('NETWORK');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<UIPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [apiPlans, setApiPlans] = useState<any>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const categories = ['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'OTHER'];
  const [refreshing, setRefreshing] = useState(false);
  const [transactionPin, setTransactionPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  useEffect(() => {
    if (!apiPlans) {
      fetchPlans();
    }
    getBeneficiaries('DATA').then(res => {
      if (res.success) setBeneficiaries(res.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedNetwork && step === 'NETWORK') {
      setSelectedNetwork("MTN");
    }
  }, [selectedNetwork, step]);

  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    setErrorMessage('');
    try {
      const result = await getDataPlans();
      if (result && result.data) {
        setApiPlans(result.data);
      } else {
        setErrorMessage('Failed to load data plans.');
      }
    } catch (error: any) {
      console.log("Error: ", error);
      setErrorMessage(error?.message || 'An error occurred while fetching plans.');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  }, []);

  const reset = () => {
    setStep('NETWORK');
    setSelectedNetwork("MTN");
    setSelectedPlan(null);
    setPhoneNumber('');
    setIsPurchasing(false);
    setSearchQuery('');
    setSelectedCategory('ALL');
    setErrorMessage('');
    setTransactionPin('');
    setPinError(false);
    setSaveBeneficiary(false);
    setBeneficiaryName('');
  };

  const handleClose = () => {
    router.back();
  };

  const handleNetworkSelect = (networkId: NetworkId) => {
    setSelectedNetwork(networkId);
    setErrorMessage('');
    setSearchQuery('');
    setSelectedCategory('ALL');
    setStep('PLAN');
  };

  const handlePlanSelect = (plan: UIPlan) => {
    setSelectedPlan(plan);
    setErrorMessage('');
    setStep('PHONE');
  };

  const getAvailablePlans = (): UIPlan[] => {
    if (!apiPlans || !selectedNetwork) return [];

    let networkKey = selectedNetwork.toString();
    if (selectedNetwork === '9MOBILE') networkKey = 'm_9mobile';
    if (selectedNetwork === 'GLO') networkKey = 'Glo';
    if (selectedNetwork === 'AIRTEL') networkKey = 'Airtel';
    if (selectedNetwork === 'MTN') networkKey = 'MTN';

    const groups = apiPlans[networkKey];

    if (!groups || !Array.isArray(groups)) {
      return [];
    }

    const flatPlans: UIPlan[] = [];

    groups.forEach((group: any) => {
      if (group.PRODUCT && Array.isArray(group.PRODUCT)) {
        group.PRODUCT.forEach((p: any) => {
          flatPlans.push({
            id: p.PRODUCT_ID,
            name: p.PRODUCT_NAME,
            price: Number(p.SELLING_PRICE) || 0,
            groupName: p.PRODUCT_NAME.includes('(SME)') ? 'SME' :
              p.PRODUCT_NAME.includes('(Awoof') ? 'Awoof' : 'Direct',
            category: determineCategory(p.VALIDITY),
          });
        });
      }
    });

    return flatPlans;
  };

  const currentPlans = getAvailablePlans();
  const filteredPlans = currentPlans.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePurchase = async (pin?: string) => {
    if (!selectedNetwork || !selectedPlan || !phoneNumber) return;

    setIsPurchasing(true);
    setErrorMessage('');
    setPinError(false);

    const pinToUse = pin || transactionPin;

    try {
      const networkLabel = networks.find(n => n.id === selectedNetwork)?.label || selectedNetwork;

      const result = await buyData(
        networkLabel,
        selectedPlan.id,
        phoneNumber,
        pinToUse,
        saveBeneficiary,
        beneficiaryName
      );

      if (result.success) {
        DeviceEventEmitter.emit('refreshData');
        setStep('SUCCESS');
      } else {
        setErrorMessage(result.message || result.error || 'Transaction failed. Please try again.');
        setPinError(true);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'An unexpected error occurred.');
      setPinError(true);
    } finally {
      setIsPurchasing(false);
    }
  };

  const activeNetworkObj = networks.find(n => n.id === selectedNetwork);

  const renderHeader = (showBack = false, onBack?: () => void) => (
    <View className="flex-row justify-between items-center mb-6">
      <View className="flex-row items-center flex-1">
        <TouchableOpacity onPress={showBack ? onBack : handleClose} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 justify-center items-center mr-3 border border-slate-100 dark:border-slate-800">
          <Ionicons name="arrow-back" size={20} color={isDark ? "#F8FAFC" : "#111827"} />
        </TouchableOpacity>
        <Text className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">{step === 'SUCCESS' ? 'Status' : 'Buy Data'}</Text>
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

          {step === 'NETWORK' && (
            <View className="flex-1 flex-col">
              {renderHeader(false)}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-2 mb-3 uppercase">Select Network</Text>
                {isLoadingPlans ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="small" color={isDark ? '#F8FAFC' : '#111827'} />
                  </View>
                ) : (
                  <View className="flex-row justify-between mb-2 flex-wrap">
                    {networks.map((network) => {
                      const isSelected = selectedNetwork === network.id;
                      return (
                        <TouchableOpacity
                          key={network.id}
                          className={`items-center py-4 w-[48%] mb-4 rounded-2xl border-2 ${isSelected ? 'border-transparent' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                          style={isSelected ? { borderColor: network.color, backgroundColor: isDark ? `${network.color}15` : network.bgColor } : {}}
                          onPress={() => handleNetworkSelect(network.id)}
                        >
                          {isSelected && (
                            <View className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-slate-950 z-10" style={{ backgroundColor: network.color }}>
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                          )}
                          <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: isSelected ? network.color : (isDark ? '#1E293B' : '#F1F5F9') }}>
                            <Text className="font-extrabold text-xl" style={{ color: isSelected ? '#FFF' : (isDark ? '#64748B' : '#94A3B8') }}>{network.label.charAt(0)}</Text>
                          </View>
                          <Text className={`text-sm ${isSelected ? 'font-extrabold dark:text-white' : 'font-semibold text-slate-500 dark:text-slate-400'}`}>{network.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {step === 'PLAN' && (
            <View className="flex-1 flex-col">
              {renderHeader(true, () => setStep('NETWORK'))}

              <View className="flex-row items-center mb-6">
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: activeNetworkObj?.color || '#FFCC00' }}>
                  <Text className="font-extrabold text-lg text-white">{activeNetworkObj?.label.charAt(0) || 'M'}</Text>
                </View>
                <Text className="text-xl font-bold text-slate-900 dark:text-white">{activeNetworkObj?.label} Data Plans</Text>
              </View>

              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-14 px-4 mb-4">
                <Ionicons name="search" size={20} color={isDark ? '#64748B' : '#9CA3AF'} />
                <TextInput
                  className="flex-1 text-base text-slate-900 dark:text-white font-medium ml-2"
                  placeholder="Search plans..."
                  placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View className="mb-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2" keyboardShouldPersistTaps="handled">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setSelectedCategory(cat)}
                        className={`px-5 py-2.5 rounded-full mr-3 border ${isSelected ? 'border-transparent' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                        style={isSelected ? { backgroundColor: activeNetworkObj?.color || '#111827' } : {}}
                      >
                        <Text className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-2 mb-3 uppercase">{filteredPlans.length} PLANS AVAILABLE</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#F8FAFC' : '#111827'} />}
              >
                {filteredPlans.length > 0 ? (
                  filteredPlans.map((plan, index) => (
                    <TouchableOpacity
                      key={`${plan.id}-${index}`}
                      onPress={() => handlePlanSelect(plan)}
                      className="flex-row justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-3 shadow-sm shadow-slate-200/50 dark:shadow-none"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-bold text-slate-900 dark:text-white mb-2">{plan.name}</Text>
                        <View className="flex-row">
                          <View className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">{plan.groupName}</Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-lg font-extrabold" style={{ color: activeNetworkObj?.color || '#FFCC00' }}>{CURRENCY}{plan.price.toLocaleString()}</Text>
                        <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#D1D5DB'} style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="py-10 items-center">
                    <Text className="text-sm text-slate-400 dark:text-slate-500">
                      {searchQuery ? "No matching plans found" : "No plans available"}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {step === 'PHONE' && (
            <View className="flex-1 flex-col">
              {renderHeader(true, () => setStep('PLAN'))}

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <View className="flex-row items-center p-4 rounded-2xl border mb-6" style={{ borderColor: activeNetworkObj?.color || '#FFCC00', backgroundColor: isDark ? `${activeNetworkObj?.color}10` : (activeNetworkObj?.bgColor || '#FFF9E6') }}>
                  <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: activeNetworkObj?.color || '#FFCC00' }}>
                    <Text className="font-extrabold text-xl text-white">{activeNetworkObj?.label.charAt(0) || 'M'}</Text>
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold text-slate-900 dark:text-white" numberOfLines={2}>{selectedPlan?.name}</Text>
                    <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">{activeNetworkObj?.label}</Text>
                  </View>
                  <Text className="text-xl font-extrabold" style={{ color: activeNetworkObj?.color || '#FFCC00' }}>{CURRENCY}{selectedPlan?.price.toLocaleString()}</Text>
                </View>

                {beneficiaries.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">Saved Beneficiaries</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                      {beneficiaries.map(ben => {
                        const isSelected = phoneNumber === ben.identifier;
                        return (
                          <TouchableOpacity
                            key={ben.id}
                            className={`flex-row items-center px-4 py-2.5 rounded-full mr-3 border ${isSelected ? 'border-transparent bg-blue-600' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                            onPress={() => setPhoneNumber(ben.identifier)}
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

                <Text className={`text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase ${beneficiaries.length > 0 ? 'mt-2' : 'mt-4'}`}>Phone Number</Text>
                <View className={`flex-row items-center bg-white dark:bg-slate-900 border rounded-2xl h-16 px-4 mb-2 ${phoneNumber.length >= 10 ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: activeNetworkObj?.color || '#FFCC00' }}>
                    <Ionicons name="call" size={16} color="#fff" />
                  </View>
                  <TextInput
                    className="flex-1 text-lg text-slate-900 dark:text-white font-bold tracking-wide"
                    placeholder="08012345678"
                    keyboardType="number-pad"
                    maxLength={11}
                    value={phoneNumber}
                    placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                    onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
                  />
                  {phoneNumber.length >= 10 && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </View>

                <TouchableOpacity
                  onPress={async () => {
                    const phone = await pickContactPhone();
                    if (phone) {
                      setPhoneNumber(phone.slice(0, 11));
                    }
                  }}
                  className="flex-row items-center mt-1 mb-5 ml-1"
                >
                  <Ionicons name="book-outline" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                  <Text className="text-sm text-blue-500 font-semibold">Select from contacts</Text>
                </TouchableOpacity>

                <View className="flex-row items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-2">
                  <Text className="text-base font-bold text-slate-700 dark:text-slate-200">Save as Beneficiary</Text>
                  <Switch
                    value={saveBeneficiary}
                    onValueChange={setSaveBeneficiary}
                    trackColor={{ false: isDark ? "#334155" : "#E2E8F0", true: "#10B981" }}
                    thumbColor={Platform.OS === 'ios' ? "#FFFFFF" : saveBeneficiary ? "#FFFFFF" : (isDark ? "#94A3B8" : "#F8FAFC")}
                  />
                </View>

                {saveBeneficiary && (
                  <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-14 px-4 mt-2 mb-4">
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
                  className={`py-4 rounded-full items-center ${phoneNumber.length < 10 ? 'bg-slate-200 dark:bg-slate-800' : 'bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/30'}`}
                  disabled={phoneNumber.length < 10}
                  onPress={() => setStep('CONFIRM')}
                  activeOpacity={0.8}
                >
                  <Text className={`text-base font-bold ${phoneNumber.length < 10 ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`}>Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'CONFIRM' && (
            <View className="flex-1 flex-col">
              {renderHeader(true, () => setStep('PHONE'))}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                  <View className="h-2 w-full" style={{ backgroundColor: activeNetworkObj?.color || '#FFCC00' }} />

                  <View className="items-center px-6 pt-8 pb-6">
                    <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: isDark ? `${activeNetworkObj?.color || '#FFCC00'}20` : (activeNetworkObj?.color || '#FFCC00') }}>
                      <Text className="font-black text-2xl text-white">{activeNetworkObj?.label.charAt(0) || 'M'}</Text>
                    </View>

                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center mb-3 px-4">{selectedPlan?.name}</Text>
                    <Text className="text-2xl font-black text-slate-900 dark:text-white mb-1">{phoneNumber}</Text>
                    <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">{activeNetworkObj?.label} Mobile</Text>

                    <View className="items-center mt-6 bg-slate-50 dark:bg-slate-950/50 py-4 px-8 rounded-2xl w-full border border-slate-100 dark:border-slate-800">
                      <Text className="text-3xl font-black" style={{ color: activeNetworkObj?.color || '#FFCC00' }}>
                        {CURRENCY}{selectedPlan?.price.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-center w-full my-2">
                    <View className="w-4 h-8 bg-slate-50 dark:bg-slate-950 rounded-r-full absolute left-0 border-y border-r border-slate-100 dark:border-slate-800" />
                    <View className="flex-1 h-0 border-t border-dashed border-slate-200 dark:border-slate-700 mx-6" />
                    <View className="w-4 h-8 bg-slate-50 dark:bg-slate-950 rounded-l-full absolute right-0 border-y border-l border-slate-100 dark:border-slate-800" />
                  </View>

                  <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Type</Text>
                    <Text className="text-sm font-extrabold text-slate-900 dark:text-white">Data Bundle</Text>
                  </View>
                  <View className="flex-row items-center justify-center py-4 bg-purple-50 dark:bg-purple-900/10">
                    <Ionicons name="wifi-outline" size={16} color="#8B5CF6" />
                    <Text className="text-sm font-semibold text-purple-600 dark:text-purple-400 ml-2">Data will be activated instantly</Text>
                  </View>
                </View>
              </ScrollView>

              <View className="pt-4 pb-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
                <TouchableOpacity className="bg-blue-600 dark:bg-blue-500 py-4 rounded-full items-center shadow-lg shadow-blue-500/30" onPress={() => setStep('PIN')}>
                  <Text className="text-white text-base font-bold">Proceed to Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'PIN' && (
            <View className="flex-1 flex-col">
              {renderHeader(true, () => { setStep('CONFIRM'); setPinError(false); setErrorMessage(''); })}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">

                <View className="mt-8 mb-6">
                  <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm relative">
                    <Ionicons name="lock-closed-outline" size={28} color="#3B82F6" />
                    <View className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white dark:border-slate-900">
                      <Ionicons name="shield-checkmark" size={12} color="#fff" />
                    </View>
                  </View>
                </View>

                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Authorize Payment</Text>
                <Text className="text-base text-slate-500 dark:text-slate-400 text-center px-8 mb-8">Enter your secure PIN to confirm this transaction.</Text>

                <View className="items-center px-6 py-3 rounded-full border mb-8" style={{ backgroundColor: isDark ? `${activeNetworkObj?.color || '#FFCC00'}15` : (activeNetworkObj?.bgColor || '#FFF9E6'), borderColor: isDark ? `${activeNetworkObj?.color || '#FFCC00'}30` : (activeNetworkObj?.color || '#FFCC00') }}>
                  <Text className="font-extrabold text-lg mb-0.5" style={{ color: activeNetworkObj?.color || '#FFCC00' }}>{CURRENCY}{selectedPlan?.price.toLocaleString()}</Text>
                  <Text className="text-xs font-bold" style={{ color: activeNetworkObj?.color || '#FFCC00' }}>{activeNetworkObj?.label} Data · {phoneNumber}</Text>
                </View>

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
              <Text className="text-[28px] font-black text-slate-900 dark:text-white mb-4 text-center">Top-Up Successful!</Text>
              <Text className="text-lg text-slate-500 dark:text-slate-400 text-center px-6 leading-7 mb-12">
                Your data plan has been processed and credited to <Text className="font-black text-slate-900 dark:text-white">{phoneNumber}</Text> instantly.
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

