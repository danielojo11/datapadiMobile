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
import { buyAirtime } from "@/app/utils/vtu";

type Step = 'NETWORK' | 'DETAILS' | 'CONFIRM' | 'SUCCESS';
type NetworkId = 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';

type BuyAirtimeProps = {
  visible: boolean;
  onClose: () => void;
};

const networks: { id: NetworkId; label: string; color: string }[] = [
  { id: "MTN", label: "MTN", color: "#FFCC00" },
  { id: "AIRTEL", label: "Airtel", color: "#FF0000" },
  { id: "GLO", label: "Glo", color: "#009933" },
  { id: "9MOBILE", label: "9mobile", color: "#006600" },
];

const QUICK_AMOUNTS = ['100', '200', '500', '1000'];
const CURRENCY = "₦";

const BuyAirtime: React.FC<BuyAirtimeProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState<Step>('NETWORK');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible]);

  const reset = () => {
    setStep('NETWORK');
    setSelectedNetwork(null);
    setPhoneNumber('');
    setAmount('');
    setIsLoading(false);
    setErrorMessage('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleNetworkSelect = (networkId: NetworkId) => {
    setSelectedNetwork(networkId);
    setErrorMessage('');
    setStep('DETAILS');
  };

  const handlePurchase = async () => {
    if (!selectedNetwork || !amount || !phoneNumber) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const networkLabel = networks.find(n => n.id === selectedNetwork)?.label || selectedNetwork;

      const result = await buyAirtime(
        networkLabel,
        Number(amount),
        phoneNumber
      );

      if (result && result.success) {
        DeviceEventEmitter.emit('refreshData');
        setStep('SUCCESS');
      } else {
        setErrorMessage(result?.message || result?.error || 'Transaction failed. Please try again.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'A network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={styles.drawerTitle}>{step === 'SUCCESS' ? 'Transaction Status' : 'Buy Airtime'}</Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
        <Ionicons name="close" size={20} color="#333" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
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

          {errorMessage && step !== 'SUCCESS' ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.contentContainer}>
            {step === 'NETWORK' && (
              <View style={styles.stepContainer}>
                <Text style={styles.subText}>Select a network provider to continue</Text>

                <View style={styles.networkContainer}>
                  {networks.map((network) => (
                    <TouchableOpacity
                      key={network.id}
                      style={[
                        styles.networkButton,
                        selectedNetwork === network.id && styles.networkButtonSelected
                      ]}
                      onPress={() => handleNetworkSelect(network.id)}
                    >
                      <View style={[styles.networkCircle, { backgroundColor: network.color }]}>
                        <Text style={styles.networkLetter}>{network.label.charAt(0)}</Text>
                      </View>
                      <Text style={styles.networkLabel}>{network.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {step === 'DETAILS' && (
              <View style={styles.stepContainer}>
                <TouchableOpacity onPress={() => setStep('NETWORK')} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Change Network</Text>
                </TouchableOpacity>

                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={18} color="#9CA3AF" />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 08012345678"
                        keyboardType="number-pad"
                        maxLength={11}
                        value={phoneNumber}
                        onChangeText={(text) => {
                          setPhoneNumber(text.replace(/\D/g, ''));
                          setErrorMessage('');
                        }}
                        autoFocus
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.currencySymbol}>{CURRENCY}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Min ₦50"
                        keyboardType="number-pad"
                        value={amount}
                        onChangeText={(text) => {
                          setAmount(text);
                          setErrorMessage('');
                        }}
                      />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAmountsContainer}>
                      <View style={styles.quickAmountsRow}>
                        {QUICK_AMOUNTS.map((amt) => {
                          const isSelected = amount === amt;
                          return (
                            <TouchableOpacity
                              key={amt}
                              onPress={() => { setAmount(amt); setErrorMessage(''); }}
                              style={[
                                styles.quickAmountPill,
                                isSelected ? styles.quickAmountPillSelected : styles.quickAmountPillNormal
                              ]}
                            >
                              <Ionicons
                                name="flash"
                                size={12}
                                color={isSelected ? "#003366" : "#4B5563"}
                                style={{ marginRight: 2 }}
                              />
                              <Text style={[
                                styles.quickAmountText,
                                isSelected ? styles.quickAmountTextSelected : styles.quickAmountTextNormal
                              ]}>
                                {CURRENCY}{amt}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>

                <View style={styles.bottomAnchored}>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!amount || Number(amount) < 50 || phoneNumber.length < 10) && styles.disabledBtn
                    ]}
                    disabled={!amount || Number(amount) < 50 || phoneNumber.length < 10}
                    onPress={() => setStep('CONFIRM')}
                  >
                    <Text style={styles.btnText}>Proceed to Payment</Text>
                  </TouchableOpacity>
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
                  <View style={styles.receiptAccent} />

                  <Text style={styles.receiptHeader}>You are about to send</Text>
                  <Text style={styles.receiptNetwork}>{networks.find(n => n.id === selectedNetwork)?.label} Airtime</Text>
                  <Text style={styles.receiptAmount}>{CURRENCY}{Number(amount).toLocaleString()}</Text>

                  <View style={styles.dashedDividerWrapper}>
                    <View style={styles.dashedDividerLeftCircle} />
                    <View style={styles.dashedLine} />
                    <View style={styles.dashedDividerRightCircle} />
                  </View>

                  <View style={styles.beneficiarySection}>
                    <Text style={styles.beneficiaryLabel}>BENEFICIARY ACCOUNT</Text>
                    <Text style={styles.beneficiaryPhone}>{phoneNumber}</Text>
                  </View>
                </View>

                <View style={styles.bottomAnchored}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
                    onPress={handlePurchase}
                    disabled={isLoading}
                  >
                    {isLoading ? (
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
                <Text style={styles.successTitle}>Purchase Successful!</Text>
                <Text style={styles.successDesc}>
                  Airtime has been successfully sent to
                </Text>
                <View style={styles.successPhoneBadge}>
                  <Text style={styles.successPhone}>{phoneNumber}</Text>
                </View>

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
    marginBottom: 20,
  },
  networkContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 10,
  },
  networkButton: {
    alignItems: "center",
    width: 70,
  },
  networkButtonSelected: {
    opacity: 0.8,
  },
  networkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  networkLetter: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 24,
  },
  networkLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
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
    fontWeight: "700",
    marginLeft: 6,
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#111827",
  },
  currencySymbol: {
    color: "#6B7280",
    fontWeight: "800",
    fontSize: 15,
    paddingHorizontal: 4,
  },
  quickAmountsContainer: {
    marginTop: 12,
  },
  quickAmountsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  quickAmountPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickAmountPillNormal: {
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
  },
  quickAmountPillSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: "700",
  },
  quickAmountTextNormal: {
    color: "#4B5563",
  },
  quickAmountTextSelected: {
    color: "#003366",
  },
  bottomAnchored: {
    marginTop: "auto",
    paddingTop: 16,
    paddingBottom: 8,
  },
  primaryBtn: {
    backgroundColor: "#003366",
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  receiptCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  receiptAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#3B82F6",
  },
  receiptHeader: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    marginTop: 8,
  },
  receiptNetwork: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  receiptAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#003366",
    marginBottom: 24,
  },
  dashedDividerWrapper: {
    width: "100%",
    height: 24,
    position: "relative",
    justifyContent: "center",
    marginBottom: 24,
  },
  dashedLine: {
    width: "100%",
    height: 1,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderStyle: "dashed",
  },
  dashedDividerLeftCircle: {
    position: "absolute",
    left: -36,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  dashedDividerRightCircle: {
    position: "absolute",
    right: -36,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  beneficiarySection: {
    alignItems: "center",
    width: "100%",
  },
  beneficiaryLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  beneficiaryPhone: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: 1,
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
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successDesc: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  successPhoneBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 32,
  },
  successPhone: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "700",
    color: "#1F2937",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: "#F3F4F6",
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 16,
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 14,
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
    marginLeft: 10,
  },
});

export default BuyAirtime;
