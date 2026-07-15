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
import { Ionicons } from "@expo/vector-icons";
import {
  getDiscos,
  verifyMeter,
  payElectricity,
  DiscoProvider,
} from "@/app/utils/electricity";
import { getBeneficiaries, Beneficiary } from "@/app/utils/beneficiary";
import TransactionPinInput from "./components/TransactionPinInput";
import { useColorScheme } from "nativewind";


type Step = 'PROVIDER' | 'DETAILS' | 'CONFIRM' | 'PIN' | 'SUCCESS';

interface BuyElectricityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCY = "₦";

export default function ElectricityScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [step, setStep] = useState<Step>('PROVIDER');
  const [discos, setDiscos] = useState<DiscoProvider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [meterType, setMeterType] = useState<'PREPAID' | 'POSTPAID'>('PREPAID');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [purchasedUnits, setPurchasedUnits] = useState('');
  const [isLoadingDiscos, setIsLoadingDiscos] = useState(false);
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

  const selectedProvider = discos.find(p => p.id === providerId);

  useEffect(() => {
    if (discos.length === 0) {
      fetchDiscos();
    }
    getBeneficiaries('ELECTRICITY').then(res => {
      if (res.success) setBeneficiaries(res.data);
    });
  }, []);

  const fetchDiscos = async () => {
    setIsLoadingDiscos(true);
    setErrorMessage('');
    try {
      const res = await getDiscos();
      if (res.success && res.data) {
        setDiscos(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to load electricity providers.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'An error occurred while fetching providers.');
    } finally {
      setIsLoadingDiscos(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchDiscos();
    setRefreshing(false);
  }, []);

  const resetState = () => {
    setStep('PROVIDER');
    setProviderId('');
    setMeterType('PREPAID');
    setMeterNumber('');
    setAmount('');
    setCustomerName('');
    setGeneratedToken('');
    setPurchasedUnits('');
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
    setStep('DETAILS');
  };

  const handleValidate = async () => {
    if (!meterNumber || meterNumber.length < 5) {
      setErrorMessage('Please enter a valid Meter Number');
      return;
    }

    setIsValidating(true);
    setErrorMessage('');

    try {
      const res = await verifyMeter(providerId, meterNumber, meterType === 'PREPAID');

      if (res.success && res.data) {
        setCustomerName(res.data.customer_name || res.data["customer_name"] || 'Verified Customer');
        setIsValidated(true);
      } else {
        setErrorMessage(res.error || 'Unable to verify meter number. Please check your details.');
        setIsValidated(false);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'An error occurred during verification.');
      setIsValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceedToConfirm = () => {
    setErrorMessage('');
    if (!isValidated) {
      setErrorMessage('Please verify your meter number first');
      return;
    }
    if (!amount || Number(amount) < 100) {
      setErrorMessage('Please enter a valid amount (Min ₦100)');
      return;
    }

    setStep('CONFIRM');
  };

  const handlePurchase = async (pin?: string) => {
    const purchaseAmount = parseFloat(amount);

    setIsProcessing(true);
    setErrorMessage('');
    setPinError(false);

    const pinToUse = pin || transactionPin;

    if (pinToUse.length !== 4) {
      setErrorMessage("Please enter a valid 4-digit PIN");
      setIsProcessing(false);
      return;
    }

    try {
      const res = await payElectricity({
        discoCode: providerId,
        meterNo: meterNumber,
        meterType: meterType === 'PREPAID' ? '01' : '02',
        amount: purchaseAmount,
        transactionPin: pinToUse,
        saveBeneficiary,
        beneficiaryName
      });

      if (res.success) {
        if (res.token) {
          setGeneratedToken(res.token);
        }
        if (res.units) {
          setPurchasedUnits(String(res.units));
        } else if (res.data?.units) {
          setPurchasedUnits(String(res.data.units));
        } else if (res.data?.data?.units) {
          setPurchasedUnits(String(res.data.data.units));
        }
        DeviceEventEmitter.emit('refreshData');
        setStep('SUCCESS');
      } else {
        setErrorMessage(res.error || 'Transaction failed. Please try again.');
        setPinError(true);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'An unexpected error occurred.');
      setPinError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatToken = (token: string) => {
    return token.match(/.{1,4}/g)?.join('-') || token;
  };

  const renderHeader = () => (
    <View className="flex-row justify-between items-center mb-6">
      <View className="flex-row items-center flex-1">
        <TouchableOpacity onPress={handleClose} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 justify-center items-center mr-3 border border-slate-100 dark:border-slate-800">
          <Ionicons name="arrow-back" size={20} color={isDark ? "#F8FAFC" : "#111827"} />
        </TouchableOpacity>
        <Text className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">
          {step === 'SUCCESS' ? 'Status' : 'Buy Electricity'}
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
              <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-2 mb-4 uppercase">Select Electricity Body</Text>

              {isLoadingDiscos ? (
                <View className="py-10 items-center">
                  <ActivityIndicator size="small" color={isDark ? '#F8FAFC' : '#111827'} />
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#F8FAFC' : '#111827'} />}>
                  <View className="flex-col gap-y-3">
                    {discos.map((provider) => (
                      <TouchableOpacity
                        key={provider.id}
                        className="flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none"
                        onPress={() => handleProviderSelect(provider.id)}
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-orange-50 dark:bg-orange-500/10">
                            <Ionicons name="bulb-outline" size={24} color="#F97316" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-bold text-slate-900 dark:text-white" numberOfLines={1}>{provider.name}</Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pay Electricity Bill</Text>
                          </View>
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
                <Ionicons name="arrow-back" size={16} color="#F97316" />
                <Text className="text-sm font-semibold text-orange-500 ml-1">Change Provider</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <View className="flex-row bg-slate-200/50 dark:bg-slate-800 p-1 rounded-full mb-6">
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-full items-center ${meterType === 'PREPAID' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                    onPress={() => { setMeterType('PREPAID'); setIsValidated(false); setCustomerName(''); }}
                  >
                    <Text className={`text-sm font-bold ${meterType === 'PREPAID' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Prepaid</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-full items-center ${meterType === 'POSTPAID' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                    onPress={() => { setMeterType('POSTPAID'); setIsValidated(false); setCustomerName(''); }}
                  >
                    <Text className={`text-sm font-bold ${meterType === 'POSTPAID' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Postpaid</Text>
                  </TouchableOpacity>
                </View>

                {beneficiaries.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">Saved Beneficiaries</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                      {beneficiaries.map(ben => {
                        const isSelected = meterNumber === ben.identifier;
                        return (
                          <TouchableOpacity
                            key={ben.id}
                            className={`flex-row items-center px-4 py-2.5 rounded-full mr-3 border ${isSelected ? 'border-transparent bg-orange-600' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                            onPress={() => setMeterNumber(ben.identifier)}
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

                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-3 uppercase">Meter Number</Text>
                <View className={`flex-row items-center bg-white dark:bg-slate-900 border rounded-2xl h-16 px-4 mb-4 ${isValidated ? 'border-emerald-400 dark:border-emerald-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
                  <Ionicons name="flash-outline" size={20} color={isDark ? '#64748B' : '#9CA3AF'} />
                  <TextInput
                    className="flex-1 text-lg text-slate-900 dark:text-white font-bold tracking-wide ml-3"
                    placeholder="Enter Meter Number"
                    keyboardType="number-pad"
                    value={meterNumber}
                    placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                    onChangeText={(text) => {
                      setMeterNumber(text.replace(/\D/g, ''));
                      setIsValidated(false);
                      setErrorMessage('');
                    }}
                    editable={!isValidating}
                  />
                  {isValidated && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </View>

                {isValidating ? (
                  <View className="flex-row items-center mb-6 px-2">
                    <ActivityIndicator size="small" color={isDark ? '#94A3B8' : '#64748B'} />
                    <Text className="text-slate-500 dark:text-slate-400 text-sm font-semibold ml-2">Verifying Meter Number...</Text>
                  </View>
                ) : isValidated ? (
                  <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-500/30 mb-6">
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-bold ml-2 flex-1" numberOfLines={1}>{customerName}</Text>
                  </View>
                ) : meterNumber.length >= 5 && !isValidated && !errorMessage ? (
                  <TouchableOpacity 
                    className="py-3 rounded-full border border-orange-500 mb-6 items-center"
                    onPress={handleValidate}
                  >
                    <Text className="text-orange-500 font-bold text-sm">Verify Meter</Text>
                  </TouchableOpacity>
                ) : null}

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

                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-4 mb-3 uppercase">Amount</Text>
                <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-16 px-4 mb-4">
                  <Text className="text-xl font-bold text-slate-400 dark:text-slate-500 mr-2">{CURRENCY}</Text>
                  <TextInput
                    className="flex-1 text-2xl text-slate-900 dark:text-white font-black tracking-wide"
                    placeholder="Min 100"
                    keyboardType="number-pad"
                    value={amount}
                    placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                    onChangeText={(text) => {
                      setAmount(text.replace(/\D/g, ''));
                      setErrorMessage('');
                    }}
                  />
                </View>
              </ScrollView>

              <View className="pt-4 pb-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
                <TouchableOpacity
                  className={`py-4 rounded-full items-center ${(!isValidated || Number(amount) < 100) ? 'bg-slate-200 dark:bg-slate-800' : 'bg-orange-600 dark:bg-orange-500 shadow-lg shadow-orange-500/30'}`}
                  disabled={!isValidated || Number(amount) < 100}
                  onPress={handleProceedToConfirm}
                  activeOpacity={0.8}
                >
                  <Text className={`text-base font-bold ${(!isValidated || Number(amount) < 100) ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`}>Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'CONFIRM' && selectedProvider && (
            <View className="flex-1 flex-col">
              <TouchableOpacity onPress={() => setStep('DETAILS')} className="flex-row items-center mb-6 self-start">
                <Ionicons name="arrow-back" size={16} color="#F97316" />
                <Text className="text-sm font-semibold text-orange-500 ml-1">Edit Details</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                  <View className="h-2 w-full bg-orange-500" />

                  <View className="items-center px-6 pt-8 pb-6">
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center mb-2 px-4">You are about to pay</Text>
                    <Text className="text-xl font-black text-slate-900 dark:text-white text-center mb-6">{selectedProvider.name}</Text>
                    
                    <View className="items-center bg-slate-50 dark:bg-slate-950/50 py-4 px-8 rounded-2xl w-full border border-slate-100 dark:border-slate-800">
                      <Text className="text-3xl font-black text-orange-500">
                        {CURRENCY}{Number(amount).toLocaleString()}
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
                      <Text className="text-sm font-extrabold text-slate-900 dark:text-white text-right flex-1 ml-4" numberOfLines={1}>{selectedProvider.name}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Meter Number</Text>
                      <Text className="text-sm font-extrabold text-slate-900 dark:text-white">{meterNumber}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Meter Type</Text>
                      <Text className="text-sm font-extrabold text-slate-900 dark:text-white">{meterType}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Name</Text>
                      <Text className="text-sm font-extrabold text-slate-900 dark:text-white tracking-widest text-right flex-1 ml-4" numberOfLines={1}>{customerName}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View className="pt-4 pb-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50">
                <TouchableOpacity className="bg-orange-600 dark:bg-orange-500 py-4 rounded-full items-center shadow-lg shadow-orange-500/30" onPress={() => setStep('PIN')} disabled={isProcessing}>
                  <Text className="text-white text-base font-bold">Proceed to Enter PIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'PIN' && (
            <View className="flex-1 flex-col">
              <TouchableOpacity onPress={() => { setStep('CONFIRM'); setPinError(false); setErrorMessage(''); }} className="flex-row items-center mb-6 self-start" disabled={isProcessing}>
                <Ionicons name="arrow-back" size={16} color="#F97316" />
                <Text className="text-sm font-semibold text-orange-500 ml-1">Back</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
                <View className="mt-4 mb-6">
                  <View className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-500/10 items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm relative">
                    <Ionicons name="lock-closed-outline" size={28} color="#F97316" />
                    <View className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white dark:border-slate-900">
                      <Ionicons name="shield-checkmark" size={12} color="#fff" />
                    </View>
                  </View>
                </View>

                <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Authorize Payment</Text>
                <Text className="text-base text-slate-500 dark:text-slate-400 text-center px-8 mb-8">
                  Enter your 4-digit PIN to authorize this payment of <Text className="font-bold text-slate-900 dark:text-white">{CURRENCY}{Number(amount).toLocaleString()}</Text>
                </Text>

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

          {step === 'SUCCESS' && selectedProvider && (
            <View className="flex-1 items-center justify-center pt-6 px-4">
              <View className="mb-6">
                <View className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full items-center justify-center">
                  <Ionicons name="checkmark-circle" size={72} color="#10B981" />
                </View>
              </View>
              <Text className="text-[26px] font-black text-slate-900 dark:text-white mb-2 text-center">Purchase Successful!</Text>
              <Text className="text-base text-slate-500 dark:text-slate-400 text-center px-6 leading-6 mb-8">
                Your electricity payment has been processed.
              </Text>

              <View className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-4 uppercase text-center">Transaction Details</Text>
                {generatedToken ? (
                  <View className="mb-4">
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center mb-1">Token</Text>
                    <View className="bg-slate-50 dark:bg-slate-950 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Text className="text-xl font-black text-slate-900 dark:text-white text-center tracking-[4px]">{formatToken(generatedToken)}</Text>
                    </View>
                  </View>
                ) : null}
                {purchasedUnits ? (
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Units</Text>
                    <Text className="text-sm font-black text-slate-900 dark:text-white">{purchasedUnits}</Text>
                  </View>
                ) : null}
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Meter No</Text>
                  <Text className="text-sm font-black text-slate-900 dark:text-white">{meterNumber}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Name</Text>
                  <Text className="text-sm font-black text-slate-900 dark:text-white flex-1 text-right ml-4" numberOfLines={2}>{customerName}</Text>
                </View>
              </View>

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
