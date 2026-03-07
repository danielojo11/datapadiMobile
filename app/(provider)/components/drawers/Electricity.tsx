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
import { Ionicons } from "@expo/vector-icons";
import {
  getDiscos,
  verifyMeter,
  payElectricity,
  DiscoProvider,
} from "../../../utils/electricity";
import TransactionPinInput from '../TransactionPinInput';

type Step = 'PROVIDER' | 'DETAILS' | 'CONFIRM' | 'PIN' | 'SUCCESS';

interface BuyElectricityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCY = "₦";

const BuyElectricityModal: React.FC<BuyElectricityModalProps> = ({ isOpen, onClose }) => {
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

  const selectedProvider = discos.find(p => p.id === providerId);

  useEffect(() => {
    if (isOpen && discos.length === 0) {
      fetchDiscos();
    }
  }, [isOpen]);

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
        transactionPin: pinToUse
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
    <View style={styles.headerRow}>
      <Text style={styles.drawerTitle}>
        {step === 'SUCCESS' ? 'Success' : 'Electricity Payment'}
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
            {errorMessage !== '' && step !== 'SUCCESS' && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {step === 'PROVIDER' && (
              <View style={styles.stepContainer}>
                <Text style={styles.subText}>Select an electricity body</Text>

                {isLoadingDiscos ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading providers...</Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.flex1}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                  >
                    <View style={{ paddingBottom: 20 }}>
                      {discos.map((provider) => (
                        <TouchableOpacity
                          key={provider.id}
                          style={styles.providerCard}
                          onPress={() => handleProviderSelect(provider.id)}
                        >
                          <View style={styles.iconCircle}>
                            <Ionicons name="bulb-outline" size={24} color="#4F46E5" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.providerName}>{provider.name}</Text>
                            <Text style={styles.providerDesc}>Pay Electricity Bill</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}

            {step === 'DETAILS' && (
              <View style={styles.stepContainer}>
                <TouchableOpacity onPress={() => setStep('PROVIDER')} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Change Provider</Text>
                </TouchableOpacity>

                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, meterType === 'PREPAID' && styles.toggleBtnActive]}
                      onPress={() => { setMeterType('PREPAID'); setIsValidated(false); setCustomerName(''); }}
                    >
                      <Text style={[styles.toggleText, meterType === 'PREPAID' && styles.toggleTextActive]}>
                        Prepaid
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, meterType === 'POSTPAID' && styles.toggleBtnActive]}
                      onPress={() => { setMeterType('POSTPAID'); setIsValidated(false); setCustomerName(''); }}
                    >
                      <Text style={[styles.toggleText, meterType === 'POSTPAID' && styles.toggleTextActive]}>
                        Postpaid
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Meter Number</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="flash-outline" size={18} color="#6B7280" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Meter Number"
                        keyboardType="number-pad"
                        value={meterNumber}
                        onChangeText={(text) => {
                          setMeterNumber(text.replace(/\D/g, ''));
                          setIsValidated(false);
                          setErrorMessage('');
                        }}
                        editable={!isValidating}
                      />
                    </View>

                    {isValidating ? (
                      <View style={styles.verifyingRow}>
                        <ActivityIndicator size="small" color="#003366" />
                        <Text style={styles.verifyingText}>Verifying Meter Number...</Text>
                      </View>
                    ) : isValidated ? (
                      <View style={styles.verifiedBox}>
                        <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                        <Text style={styles.verifiedText}>{customerName}</Text>
                      </View>
                    ) : meterNumber.length >= 5 && !isValidated && !errorMessage ? (
                      <TouchableOpacity style={styles.verifyBtnOutline} onPress={handleValidate}>
                        <Text style={styles.verifyBtnTextOutline}>Verify Meter</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>



                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Amount</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.currencyPrefix}>{CURRENCY}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Min ₦100"
                        keyboardType="number-pad"
                        value={amount}
                        onChangeText={(text) => {
                          setAmount(text.replace(/\D/g, ''));
                          setErrorMessage('');
                        }}
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.bottomAnchored}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, (!isValidated || Number(amount) < 100) && styles.disabledBtn]}
                    disabled={!isValidated || Number(amount) < 100}
                    onPress={handleProceedToConfirm}
                  >
                    <Text style={styles.btnText}>Proceed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 'CONFIRM' && selectedProvider && (
              <View style={styles.stepContainer}>
                <TouchableOpacity onPress={() => setStep('DETAILS')} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Edit Details</Text>
                </TouchableOpacity>

                <View style={styles.receiptCard}>
                  <View style={styles.receiptHeaderBox}>
                    <Text style={styles.receiptSubText}>You are about to pay</Text>
                    <Text style={styles.receiptTitle}>{selectedProvider.name}</Text>
                    <Text style={styles.receiptAmount}>{CURRENCY}{Number(amount).toLocaleString()}</Text>
                  </View>

                  <View style={styles.receiptDetails}>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Provider</Text>
                      <Text style={styles.receiptValue}>{selectedProvider.name}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Meter Number</Text>
                      <Text style={styles.receiptValue}>{meterNumber}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Meter Type</Text>
                      <Text style={styles.receiptValue}>{meterType}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Name</Text>
                      <Text style={[styles.receiptValue, { textAlign: 'right', flex: 1, marginLeft: 16 }]}>{customerName}</Text>
                    </View>

                  </View>
                </View>

                <View style={styles.bottomAnchored}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => setStep('PIN')}
                    disabled={isProcessing}
                  >
                    <Text style={styles.btnText}>Proceed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 'PIN' && (
              <View style={styles.stepContainer}>
                <TouchableOpacity
                  onPress={() => { setStep('CONFIRM'); setPinError(false); setErrorMessage(''); }}
                  style={[styles.backButton, { marginBottom: 20 }]}
                  disabled={isProcessing}
                >
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.pinWrapper}>
                  <View style={styles.pinIconBox}>
                    <Ionicons name="lock-closed" size={28} color="#2563EB" />
                  </View>
                  <Text style={styles.pinTitle}>Enter Transaction PIN</Text>
                  <Text style={styles.pinSubtitle}>
                    Please enter your 4-digit PIN to authorize this payment of <Text style={styles.pinSubtitleBold}>{CURRENCY}{Number(amount).toLocaleString()}</Text>
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
                    <View style={[styles.processingRow, { marginTop: 30 }]}>
                      <ActivityIndicator size="small" color="#003366" />
                      <Text style={{ marginLeft: 8, color: '#003366', fontWeight: '600' }}>Processing Payment...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.bottomAnchored}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, (isProcessing || transactionPin.length !== 4) && styles.disabledBtn]}
                    onPress={() => handlePurchase(transactionPin)}
                    disabled={isProcessing || transactionPin.length !== 4}
                  >
                    {isProcessing ? (
                      <View style={styles.processingRow}>
                        <ActivityIndicator size="small" color="#FFF" />
                        <Text style={[styles.btnText, { marginLeft: 8 }]}>Verifying...</Text>
                      </View>
                    ) : (
                      <Text style={styles.btnText}>Confirm PIN</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 'SUCCESS' && selectedProvider && (
              <View style={styles.successContainer}>
                <View style={styles.successIconWrapper}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Purchase Successful</Text>
                <Text style={styles.successDesc}>Your electricity payment has been processed.</Text>

                {generatedToken ? (
                  <View style={styles.tokenBox}>
                    <Text style={styles.tokenLabel}>DETAILS</Text>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Token</Text>
                      <Text style={styles.receiptValueMax}>{formatToken(generatedToken)}</Text>
                    </View>
                    {purchasedUnits ? (
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Units</Text>
                        <Text style={styles.receiptValueMax}>{purchasedUnits}</Text>
                      </View>
                    ) : null}
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Meter No</Text>
                      <Text style={styles.receiptValueMax}>{meterNumber}</Text>
                    </View>
                  </View>
                ) : null}

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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  drawerContainer: { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 20, height: '85%' },
  handle: { width: 40, height: 5, backgroundColor: "#E5E7EB", borderRadius: 3, alignSelf: "center", marginBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  drawerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  closeBtn: { backgroundColor: "#F3F4F6", padding: 8, borderRadius: 20 },
  contentContainer: { flex: 1, flexDirection: 'column' },
  stepContainer: { flex: 1, display: 'flex', flexDirection: 'column' },
  flex1: { flex: 1 },
  subText: { color: "#6B7280", fontSize: 14, fontWeight: "500", marginBottom: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: "600", color: "#4F46E5" },
  errorBox: { flexDirection: "row", backgroundColor: "#FEF2F2", padding: 12, borderRadius: 12, marginBottom: 16, alignItems: "center", borderWidth: 1, borderColor: "#FEE2E2" },
  errorText: { color: "#DC2626", fontSize: 14, fontWeight: "500", flex: 1, marginLeft: 8 },
  providerCard: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center", marginRight: 16 },
  providerName: { fontWeight: "700", fontSize: 16, color: "#111827", marginBottom: 4 },
  providerDesc: { fontSize: 13, color: "#6B7280" },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 16, alignSelf: "flex-start" },
  backButtonText: { color: "#003366", fontSize: 14, fontWeight: "600", marginLeft: 6 },
  toggleContainer: { flexDirection: "row", gap: 16, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, backgroundColor: "#FFF" },
  toggleBtnActive: { borderColor: "#F59E0B", backgroundColor: "#FEF3C7" },
  toggleText: { fontWeight: "600", color: "#6B7280" },
  toggleTextActive: { color: "#B45309" },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontWeight: "600", fontSize: 14, color: "#111827", marginBottom: 8 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, height: 52, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 16, color: "#111827", paddingHorizontal: 10 },
  currencyPrefix: { color: "#6B7280", fontWeight: "700", fontSize: 16, paddingRight: 4 },
  verifyingRow: { flexDirection: "row", alignItems: "center", marginTop: 8, paddingHorizontal: 8 },
  verifyingText: { color: "#003366", fontSize: 13, fontWeight: "500", marginLeft: 8 },
  verifiedBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#DCFCE7", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginTop: 10 },
  verifiedText: { color: "#15803D", fontWeight: "600", fontSize: 14, marginLeft: 8 },
  verifyBtnOutline: { marginTop: 10, borderWidth: 1, borderColor: "#003366", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: "flex-end" },
  verifyBtnTextOutline: { color: "#003366", fontSize: 12, fontWeight: "600" },
  bottomAnchored: { marginTop: "auto", paddingTop: 16, paddingBottom: 8 },
  primaryBtn: { backgroundColor: "#003366", width: "100%", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  disabledBtn: { opacity: 0.5 },
  btnText: { color: "white", fontWeight: "600", fontSize: 16 },
  receiptCard: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  receiptHeaderBox: { alignItems: "center", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingBottom: 16 },
  receiptSubText: { color: "#6B7280", fontSize: 14, marginBottom: 6 },
  receiptTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
  receiptAmount: { fontSize: 28, fontWeight: "800", color: "#003366" },
  receiptDetails: { paddingTop: 8 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  receiptLabel: { fontSize: 14, color: "#6B7280" },
  receiptValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  pinWrapper: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -20 },
  pinIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  pinTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  pinSubtitle: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 30, paddingHorizontal: 20 },
  pinSubtitleBold: { fontWeight: "700", color: "#334155" },
  processingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 20 },
  successIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 8 },
  successDesc: { fontSize: 15, color: "#6B7280", marginBottom: 24, textAlign: "center" },
  tokenBox: { backgroundColor: "#F9FAFB", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", width: "100%", marginBottom: 30 },
  tokenLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "700", textTransform: "uppercase", marginBottom: 16, letterSpacing: 1 },
  tokenValue: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 16, color: "#1F2937", flexWrap: "wrap" },
  receiptValueMax: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 15, fontWeight: "700", color: "#111827" },
  secondaryBtn: { backgroundColor: "#F3F4F6", width: "100%", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  secondaryBtnText: { color: "#374151", fontWeight: "600", fontSize: 16 },
});

export default BuyElectricityModal;
