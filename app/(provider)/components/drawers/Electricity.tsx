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

type Step = 'PROVIDER' | 'DETAILS' | 'CONFIRM' | 'SUCCESS';

interface BuyElectricityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = ['1000', '2000', '5000', '10000'];
const CURRENCY = "₦";

const BuyElectricityModal: React.FC<BuyElectricityModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('PROVIDER');
  const [discos, setDiscos] = useState<DiscoProvider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [meterType, setMeterType] = useState<'PREPAID' | 'POSTPAID'>('PREPAID');
  const [meterNumber, setMeterNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [isLoadingDiscos, setIsLoadingDiscos] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
      console.log("disco screen", res)
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
    setPhoneNumber('');
    setAmount('');
    setCustomerName('');
    setGeneratedToken('');
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
    if (!meterNumber || meterNumber.length < 5) {
      setErrorMessage('Please enter a valid Meter Number');
      return;
    }

    setIsValidating(true);
    setErrorMessage('');

    try {
      const res = await verifyMeter(providerId, meterNumber, meterType === 'PREPAID');

      if (res.success && res.data) {
        setCustomerName(res.data.customer_name || res.data["customer_name"]);
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

  const handlePurchase = async () => {
    const purchaseAmount = parseFloat(amount);

    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage('Please provide a valid contact phone number');
      setStep('DETAILS');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    console.log("providerId", providerId)
    console.log("meterNumber", meterNumber)
    console.log("meterType", meterType)
    console.log("amount", amount)
    console.log("phoneNumber", phoneNumber)

    try {
      const res = await payElectricity({
        discoCode: providerId,
        meterNo: meterNumber,
        meterType: meterType === 'PREPAID' ? '01' : '02',
        amount: purchaseAmount,
        phoneNo: phoneNumber
      });

      if (res.success) {
        if (res.token) {
          setGeneratedToken(res.token);
        }
        DeviceEventEmitter.emit('refreshData');
        setStep('SUCCESS');
      } else {
        setErrorMessage(res.error || 'Transaction failed. Please try again.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'An unexpected error occurred.');
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
        {step === 'SUCCESS' ? 'Transaction Status' : 'Buy Electricity'}
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
            {step === 'PROVIDER' && (
              <View style={styles.stepContainer}>
                <Text style={styles.subText}>Select an electricity provider</Text>

                {isLoadingDiscos ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003366" />
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
                    {discos.map((provider) => (
                      <TouchableOpacity
                        key={provider.id}
                        style={styles.providerCard}
                        onPress={() => handleProviderSelect(provider.id)}
                      >
                        <View style={styles.providerInfoRow}>
                          <View style={styles.iconCircle}>
                            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
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
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Change Provider</Text>
                </TouchableOpacity>

                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                  {errorMessage ? (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  ) : null}
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, meterType === 'PREPAID' && styles.toggleBtnActive]}
                      onPress={() => { setMeterType('PREPAID'); setIsValidated(false); }}
                    >
                      <Text style={[styles.toggleText, meterType === 'PREPAID' && styles.toggleTextActive]}>
                        Prepaid
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, meterType === 'POSTPAID' && styles.toggleBtnActive]}
                      onPress={() => { setMeterType('POSTPAID'); setIsValidated(false); }}
                    >
                      <Text style={[styles.toggleText, meterType === 'POSTPAID' && styles.toggleTextActive]}>
                        Postpaid
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Meter Number</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter meter number"
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

                  {isValidated ? (
                    <View style={styles.validatedSection}>
                      <View style={styles.verifiedBox}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        <View style={styles.verifiedTextCol}>
                          <Text style={styles.verifiedLabel}>VERIFIED CUSTOMER</Text>
                          <Text style={styles.verifiedName}>{customerName}</Text>
                        </View>
                      </View>

                      <Text style={[styles.inputLabel, { marginTop: 16 }]}>Amount ({CURRENCY})</Text>
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

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAmountRow}>
                        {QUICK_AMOUNTS.map((amt) => (
                          <TouchableOpacity
                            key={amt}
                            style={[styles.quickAmountBtn, amount === amt && styles.quickAmountBtnActive]}
                            onPress={() => { setAmount(amt); setErrorMessage(''); }}
                          >
                            <Text style={[styles.quickAmountText, amount === amt && styles.quickAmountTextActive]}>
                              {CURRENCY}{parseInt(amt).toLocaleString()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text style={[styles.inputLabel, { marginTop: 16 }]}>Contact Phone Number</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={18} color="#666" style={{ marginLeft: 14 }} />
                        <TextInput
                          style={[styles.input, { marginLeft: 10 }]}
                          placeholder="e.g. 08012345678"
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
                  ) : null}
                </ScrollView>

                <View style={styles.bottomAnchored}>
                  {!isValidated ? (
                    <TouchableOpacity
                      style={[styles.primaryBtn, (isValidating || meterNumber.length < 5) && styles.disabledBtn]}
                      onPress={handleValidate}
                      disabled={isValidating || meterNumber.length < 5}
                    >
                      {isValidating ? (
                        <View style={styles.processingRow}>
                          <ActivityIndicator size="small" color="#FFF" />
                          <Text style={[styles.btnText, { marginLeft: 8 }]}>Verifying Meter...</Text>
                        </View>
                      ) : (
                        <Text style={styles.btnText}>Validate Meter</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.primaryBtn, (!amount || Number(amount) < 100 || phoneNumber.length < 10) && styles.disabledBtn]}
                      disabled={!amount || Number(amount) < 100 || phoneNumber.length < 10}
                      onPress={() => setStep('CONFIRM')}
                    >
                      <Text style={styles.btnText}>Proceed to Payment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {step === 'CONFIRM' && (
              <View style={styles.stepContainer}>
                <TouchableOpacity onPress={() => setStep('DETAILS')} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Edit Details</Text>
                </TouchableOpacity>

                <View style={styles.receiptCard}>
                  <View style={styles.receiptTopBorder} />

                  <Text style={styles.receiptSubText}>You are about to pay</Text>
                  <Text style={styles.receiptTitle}>{selectedProvider?.name}</Text>
                  <Text style={styles.receiptAmount}>{CURRENCY}{Number(amount).toLocaleString()}</Text>

                  <View style={styles.receiptDividerContainer}>
                    <View style={styles.receiptDividerCutoutLeft} />
                    <View style={styles.receiptDividerBorder} />
                    <View style={styles.receiptDividerCutoutRight} />
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Customer Name</Text>
                    <Text style={styles.receiptValue}>{customerName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Meter Number</Text>
                    <Text style={styles.receiptValueMono}>{meterNumber}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Meter Type</Text>
                    <Text style={styles.receiptValue}>{meterType}</Text>
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
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successDesc}>
                  Your electricity payment has been processed.
                </Text>

                {generatedToken ? (
                  <View style={styles.tokenBox}>
                    <Text style={styles.tokenLabel}>YOUR TOKEN</Text>
                    <Text style={styles.tokenValue}>{formatToken(generatedToken)}</Text>
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
    color: "#003366",
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
    backgroundColor: "#FEF3C7", // amber-50
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
    color: "#003366",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  toggleBtnActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
  },
  toggleText: {
    fontWeight: "700",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#B45309",
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
  currencyPrefix: {
    color: "#6B7280",
    fontWeight: "800",
    fontSize: 16,
    marginLeft: 14,
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
  quickAmountRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
    overflow: "hidden",
  },
  quickAmountBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    alignSelf: "flex-start",
  },
  quickAmountBtnActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  quickAmountTextActive: {
    color: "#B45309",
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
    backgroundColor: "#F59E0B",
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
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  receiptAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#D97706",
    marginBottom: 24,
  },
  receiptDividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
    position: "relative",
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
  tokenBox: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
  },
  tokenLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  bottomAnchored: {
    marginTop: "auto",
    paddingTop: 16,
    paddingBottom: 8,
  },
  primaryBtn: {
    backgroundColor: "#F59E0B",
    width: "100%",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtn: {
    backgroundColor: "#F3F4F6",
    width: "100%",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  btnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginLeft: 8,
  },
});

export default BuyElectricityModal;
