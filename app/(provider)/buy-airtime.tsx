import { Beneficiary, getBeneficiaries } from "@/app/utils/beneficiary";
import { pickContactPhone } from "@/app/utils/contacts";
import { buyAirtime } from "@/app/utils/vtu";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import TransactionPinInput from "./components/TransactionPinInput";
import { useColorScheme } from "nativewind";

type Step = 'DETAILS' | 'CONFIRM' | 'PIN' | 'SUCCESS';
type NetworkId = 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';

type BuyAirtimeProps = {
  visible: boolean;
  onClose: () => void;
};

const networks: { id: NetworkId; label: string; color: string; bgColor: string }[] = [
  { id: "MTN", label: "MTN", color: "#F59E0B", bgColor: "#FFFBEB" },
  { id: "AIRTEL", label: "AIRTEL", color: "#EF4444", bgColor: "#FEF2F2" },
  { id: "GLO", label: "GLO", color: "#10B981", bgColor: "#ECFDF5" },
  { id: "9MOBILE", label: "9MOBILE", color: "#047857", bgColor: "#D1FAE5" },
];

const quickAmounts = [100, 200, 500, 1000, 2000, 5000];
const CURRENCY = "₦";

export default function BuyAirtimeScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [step, setStep] = useState<Step>('DETAILS');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  useEffect(() => {
    getBeneficiaries('AIRTIME').then(res => {
      if (res.success) setBeneficiaries(res.data);
    });
  }, []);
  useEffect(() => {
    if (!selectedNetwork) {
      setSelectedNetwork("MTN");
    }
  }, [selectedNetwork]);

  const reset = () => {
    setStep('DETAILS');
    setSelectedNetwork("MTN");
    setPhoneNumber('');
    setAmount('');
    setIsLoading(false);
    setErrorMessage('');
    setTransactionPin('');
    setPinError(false);
    setSaveBeneficiary(false);
    setBeneficiaryName('');
  };

  const handleClose = () => {
    router.back();
  };

  const handlePurchase = async (pin?: string) => {
    if (!selectedNetwork || !amount || !phoneNumber) return;

    setIsLoading(true);
    setErrorMessage('');
    setPinError(false);

    const pinToUse = pin || transactionPin;

    try {
      const networkLabel = networks.find(n => n.id === selectedNetwork)?.label || selectedNetwork;

      const result = await buyAirtime(
        networkLabel,
        Number(amount),
        phoneNumber,
        pinToUse,
        saveBeneficiary,
        beneficiaryName
      );

      if (result && result.success) {
        DeviceEventEmitter.emit('refreshData');
        setStep('SUCCESS');
      } else {
        setErrorMessage(result?.message || result?.error || 'Transaction failed. Please try again.');
        setPinError(true);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'A network error occurred. Please check your connection.');
      setPinError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const activeNetworkObj = networks.find(n => n.id === selectedNetwork);

  const renderHeader = (showBack = false, onBack?: () => void) => (
    <View className="flex-row justify-between items-center mb-6">
      <View className="flex-row items-center flex-1">
        <TouchableOpacity onPress={showBack ? onBack : handleClose} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 justify-center items-center mr-3 border border-slate-100 dark:border-slate-800">
          <Ionicons name="arrow-back" size={20} color={isDark ? "#F8FAFC" : "#111827"} />
        </TouchableOpacity>
        <Text className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">{step === 'SUCCESS' ? 'Status' : 'Buy Airtime'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc' }} edges={["top", "bottom"]}>
      <View className="flex-1 px-5 pt-1">
        {errorMessage && step !== 'SUCCESS' ? (
          <View className="flex-row items-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mb-4 border border-red-100 dark:border-red-900/30">
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text className="text-red-500 ml-2 text-sm font-medium">{errorMessage}</Text>
          </View>
        ) : null}

        {step === 'DETAILS' && (
          <View className="flex-1 flex-col">
            {renderHeader(false)}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-2 mb-3 uppercase">Select Network</Text>
              <View className="flex-row justify-between mb-2">
                {networks.map((network) => {
                  const isSelected = selectedNetwork === network.id;
                  return (
                    <TouchableOpacity
                      key={network.id}
                      className={`items-center py-3 w-[23%] rounded-2xl border-2 ${isSelected ? 'border-transparent' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                      style={isSelected ? { borderColor: network.color, backgroundColor: isDark ? `${network.color}15` : network.bgColor } : {}}
                      onPress={() => setSelectedNetwork(network.id)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <View className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-slate-950 z-10" style={{ backgroundColor: network.color }}>
                          <Ionicons name="checkmark" size={10} color="#FFF" />
                        </View>
                      )}
                      <View className="w-10 h-10 rounded-full items-center justify-center mb-2" style={{ backgroundColor: isSelected ? network.color : (isDark ? '#1E293B' : '#F1F5F9') }}>
                        <Text className="font-extrabold text-lg" style={{ color: isSelected ? '#FFF' : (isDark ? '#64748B' : '#94A3B8') }}>{network.label.charAt(0)}</Text>
                      </View>
                      <Text className={`text-xs ${isSelected ? 'font-extrabold dark:text-white' : 'font-semibold text-slate-500 dark:text-slate-400'}`}>{network.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {beneficiaries.length > 0 && (
                <View className="mb-4 mt-2">
                  <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">Saved Beneficiaries</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                    {beneficiaries.map(ben => {
                      const isSelected = phoneNumber === ben.identifier;
                      return (
                        <TouchableOpacity
                          key={ben.id}
                          className={`flex-row items-center px-4 py-2.5 rounded-full mr-3 border ${isSelected ? 'border-transparent bg-blue-600' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                          onPress={() => {
                            setPhoneNumber(ben.identifier);
                            const ntwk = networks.find(n => n.label.toUpperCase() === ben.provider?.toUpperCase());
                            if (ntwk) setSelectedNetwork(ntwk.id);
                          }}
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

              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-4 mb-3 uppercase">Phone Number</Text>
              <View className={`flex-row items-center bg-white dark:bg-slate-900 border rounded-2xl h-16 px-4 mb-2 ${phoneNumber.length >= 10 ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: activeNetworkObj ? (isDark ? `${activeNetworkObj.color}20` : activeNetworkObj.bgColor) : (isDark ? '#1E293B' : '#F1F5F9') }}>
                  <Ionicons name="call" size={16} color={activeNetworkObj ? activeNetworkObj.color : (isDark ? '#64748B' : '#94A3B8')} />
                </View>
                <TextInput
                  className="flex-1 text-lg text-slate-900 dark:text-white font-bold tracking-wide"
                  placeholder="08012345678"
                  keyboardType="number-pad"
                  maxLength={11}
                  value={phoneNumber}
                  placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
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
                className="flex-row items-center mt-1 mb-3 ml-1"
              >
                <Ionicons name="book-outline" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                <Text className="text-sm text-blue-500 font-semibold">Select from contacts</Text>
              </TouchableOpacity>

              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-4 mb-3 uppercase">Amount</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: (amount && Number(amount) >= 50) 
                  ? (isDark ? '#064e3b' : '#ecfdf5') 
                  : (isDark ? '#0f172a' : '#ffffff'),
                borderWidth: 1,
                borderRadius: 16,
                height: 64,
                paddingHorizontal: 16,
                marginBottom: 12,
                borderColor: (amount && Number(amount) >= 50) 
                  ? (isDark ? '#10b98180' : '#34d399') 
                  : (isDark ? '#1e293b' : '#e2e8f0')
              }}>
                <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl mr-3">
                  <Text className="text-base text-slate-500 dark:text-slate-400 font-extrabold">{CURRENCY}</Text>
                </View>
                <TextInput
                  className="flex-1 text-[26px] text-slate-900 dark:text-white font-extrabold tracking-tight"
                  placeholder="0"
                  keyboardType="number-pad"
                  value={amount}
                  placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                  onChangeText={setAmount}
                />
                {amount && Number(amount) >= 50 ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : null}
              </View>

              <View className="flex-row flex-wrap justify-between mt-1 mb-5">
                {quickAmounts.map((amt) => {
                  const isSelected = amount === amt.toString();
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '31%',
                        paddingVertical: 12,
                        marginBottom: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isSelected ? '#3b82f6' : (isDark ? '#1e293b' : '#e2e8f0'),
                        backgroundColor: isSelected ? (isDark ? '#3b82f61a' : '#eff6ff') : (isDark ? '#0f172a' : '#ffffff')
                      }}
                      onPress={() => setAmount(amt.toString())}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="flash" size={14} color={isSelected ? '#3B82F6' : (isDark ? '#64748B' : '#94A3B8')} style={{ marginRight: 4 }} />
                      <Text style={{
                        fontWeight: '700',
                        color: isSelected ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#475569')
                      }}>
                        {CURRENCY}{amt.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

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
                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                    onChangeText={setBeneficiaryName}
                  />
                </View>
              )}

            </ScrollView>

            <View className="pt-4 pb-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
              {selectedNetwork && phoneNumber.length >= 10 && Number(amount) >= 50 && activeNetworkObj && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isDark ? '#1e293b' : '#f1f5f9', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: isDark ? `${activeNetworkObj.color}20` : activeNetworkObj.bgColor }}>
                      <Text style={{ fontWeight: '800', fontSize: 14, color: activeNetworkObj.color }}>{activeNetworkObj.label.charAt(0)}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>{phoneNumber}</Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>{CURRENCY}{Number(amount).toLocaleString()}</Text>
                </View>
              )}

              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  borderRadius: 9999,
                  alignItems: 'center',
                  backgroundColor: (!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10) 
                    ? (isDark ? '#1e293b' : '#e2e8f0') 
                    : (isDark ? '#3b82f6' : '#2563eb'),
                  ...((!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10) ? {} : {
                    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10
                  })
                }}
                disabled={!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10}
                onPress={() => setStep('CONFIRM')}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: (!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10) 
                    ? (isDark ? '#64748b' : '#94a3b8') 
                    : '#ffffff'
                }}>
                  {!selectedNetwork ? 'Select a Network' :
                    phoneNumber.length < 10 ? 'Enter Phone Number' :
                      (!amount || Number(amount) < 50) ? 'Enter Amount' :
                        `Buy ${activeNetworkObj?.label} Airtime — ${CURRENCY}${Number(amount).toLocaleString()}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'CONFIRM' && (
          <View className="flex-1 flex-col">
            {renderHeader(true, () => setStep('DETAILS'))}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
              <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                <View className="h-2 w-full" style={{ backgroundColor: activeNetworkObj?.color || '#F59E0B' }} />

                <View className="items-center px-6 pt-8 pb-6">
                  <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: isDark ? `${activeNetworkObj?.color || '#F59E0B'}20` : (activeNetworkObj?.bgColor || '#FFFBEB') }}>
                    <Text className="font-black text-2xl" style={{ color: activeNetworkObj?.color || '#F59E0B' }}>{activeNetworkObj?.label.charAt(0) || 'M'}</Text>
                  </View>

                  <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-1">SEND TO</Text>
                  <Text className="text-2xl font-black text-slate-900 dark:text-white mb-1">{phoneNumber}</Text>
                  <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">{activeNetworkObj?.label} Mobile</Text>

                  <View className="items-center mt-6 bg-slate-50 dark:bg-slate-950/50 py-4 px-8 rounded-2xl w-full border border-slate-100 dark:border-slate-800">
                    <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Amount</Text>
                    <Text className="text-3xl font-black text-slate-900 dark:text-white">
                      {CURRENCY}{Number(amount).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-center w-full my-2">
                  <View className="w-4 h-8 bg-slate-50 dark:bg-slate-950 rounded-r-full absolute left-0 border-y border-r border-slate-100 dark:border-slate-800" />
                  <View className="flex-1 h-0 border-t border-dashed border-slate-200 dark:border-slate-700 mx-6" />
                  <View className="w-4 h-8 bg-slate-50 dark:bg-slate-950 rounded-l-full absolute right-0 border-y border-l border-slate-100 dark:border-slate-800" />
                </View>

                <View className="flex-row justify-between items-center px-6 py-6">
                  <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Product</Text>
                  <Text className="text-sm font-extrabold text-slate-900 dark:text-white">Airtime Top-Up</Text>
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
                <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm">
                  <Ionicons name="lock-closed" size={28} color="#3B82F6" />
                </View>
              </View>

              <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Authorize Payment</Text>
              <Text className="text-base text-slate-500 dark:text-slate-400 text-center px-8 mb-8">Enter your secure PIN to confirm this transaction.</Text>

              <View className="items-center px-6 py-3 rounded-full border mb-8" style={{ backgroundColor: isDark ? `${activeNetworkObj?.color || '#F59E0B'}15` : (activeNetworkObj?.bgColor || '#FFFBEB'), borderColor: isDark ? `${activeNetworkObj?.color || '#F59E0B'}30` : (activeNetworkObj?.color || '#F59E0B') }}>
                <Text className="font-extrabold text-lg mb-0.5" style={{ color: activeNetworkObj?.color || '#F59E0B' }}>{CURRENCY}{Number(amount).toLocaleString()}</Text>
                <Text className="text-xs font-bold" style={{ color: activeNetworkObj?.color || '#F59E0B' }}>{activeNetworkObj?.label} · {phoneNumber}</Text>
              </View>

              <TransactionPinInput
                onComplete={(pin) => {
                  setTransactionPin(pin);
                  handlePurchase(pin);
                }}
                error={pinError}
                clearError={() => setPinError(false)}
                isLoading={isLoading}
              />

              {isLoading && (
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
              Your airtime has been processed and credited to <Text className="font-black text-slate-900 dark:text-white">{phoneNumber}</Text> instantly.
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
}

