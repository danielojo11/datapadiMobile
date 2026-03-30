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
import TransactionPinInput from '../TransactionPinInput';

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

const BuyAirtime: React.FC<BuyAirtimeProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState<Step>('DETAILS');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !selectedNetwork) {
      setSelectedNetwork("MTN");
    }
  }, [visible, selectedNetwork]);

  const reset = () => {
    setStep('DETAILS');
    setSelectedNetwork("MTN");
    setPhoneNumber('');
    setAmount('');
    setIsLoading(false);
    setErrorMessage('');
    setTransactionPin('');
    setPinError(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
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
        pinToUse
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
    <View style={styles.headerRow}>
      <View style={styles.headerLeftContainer}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
        )}
        <Text style={styles.drawerTitle}>{step === 'SUCCESS' ? 'Status' : 'Buy Airtime'}</Text>
      </View>
      <TouchableOpacity onPress={handleClose} style={styles.headerCloseBtn}>
        <Ionicons name="close" size={20} color="#6B7280" />
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
          {errorMessage && step !== 'SUCCESS' ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {step === 'DETAILS' && (
            <View style={styles.stepContainer}>
              {renderHeader(false)}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>SELECT NETWORK</Text>
                <View style={styles.networkGrid}>
                  {networks.map((network) => {
                    const isSelected = selectedNetwork === network.id;
                    return (
                      <TouchableOpacity
                        key={network.id}
                        style={[
                          styles.networkCard,
                          isSelected && [styles.networkCardSelected, { borderColor: network.color, backgroundColor: network.bgColor }]
                        ]}
                        onPress={() => setSelectedNetwork(network.id)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <View style={[styles.checkCircle, { backgroundColor: network.color }]}>
                            <Ionicons name="checkmark" size={10} color="#FFF" />
                          </View>
                        )}
                        <View style={[styles.networkCircle, { backgroundColor: isSelected ? network.color : '#F3F4F6' }]}>
                          <Text style={[styles.networkLetter, { color: isSelected ? '#FFF' : '#9CA3AF' }]}>{network.label.charAt(0)}</Text>
                        </View>
                        <Text style={[styles.networkLabel, isSelected && styles.networkLabelSelected]}>{network.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.sectionTitle}>PHONE NUMBER</Text>
                <View style={[styles.inputContainer, phoneNumber.length >= 10 && styles.inputContainerSuccess]}>
                  <View style={[styles.inputIconCircle, { backgroundColor: activeNetworkObj ? activeNetworkObj.bgColor : '#F3F4F6' }]}>
                    <Ionicons name="call" size={16} color={activeNetworkObj ? activeNetworkObj.color : '#9CA3AF'} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="08012345678"
                    keyboardType="number-pad"
                    maxLength={11}
                    value={phoneNumber}
                    placeholderTextColor="#9CA3AF"
                    onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
                  />
                  {phoneNumber.length >= 10 && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </View>

                <Text style={styles.sectionTitle}>AMOUNT</Text>
                <View style={[styles.inputContainer, amount && Number(amount) >= 50 ? styles.inputContainerSuccess : {}]}>
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencySymbol}>{CURRENCY}</Text>
                  </View>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    keyboardType="number-pad"
                    value={amount}
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setAmount}
                  />
                  {amount && Number(amount) >= 50 ? (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  ) : null}
                </View>

                <View style={styles.quickAmountsGrid}>
                  {quickAmounts.map((amt) => {
                    const isSelected = amount === amt.toString();
                    return (
                      <TouchableOpacity
                        key={amt}
                        style={[styles.quickAmountPill, isSelected && styles.quickAmountPillSelected]}
                        onPress={() => setAmount(amt.toString())}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="flash" size={14} color={isSelected ? '#3B82F6' : '#9CA3AF'} style={{ marginRight: 6 }} />
                        <Text style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}>
                          {CURRENCY}{amt.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.bottomBarDetails}>
                {selectedNetwork && phoneNumber.length >= 10 && Number(amount) >= 50 && activeNetworkObj && (
                  <View style={styles.bottomSummary}>
                    <View style={styles.bottomSummaryLeft}>
                      <View style={[styles.smallNetworkCircle, { backgroundColor: activeNetworkObj.bgColor }]}>
                        <Text style={[styles.smallNetworkLetter, { color: activeNetworkObj.color }]}>{activeNetworkObj.label.charAt(0)}</Text>
                      </View>
                      <Text style={styles.bottomPhone}>{phoneNumber}</Text>
                    </View>
                    <Text style={styles.bottomAmount}>{CURRENCY}{Number(amount).toLocaleString()}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10) && styles.disabledBtn
                  ]}
                  disabled={!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10}
                  onPress={() => setStep('CONFIRM')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnText, (!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10) && styles.disabledBtnText]}>
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
            <View style={styles.stepContainer}>
              {renderHeader(true, () => setStep('DETAILS'))}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <View style={styles.confirmCard}>
                  <View style={[styles.confirmTopBar, { backgroundColor: activeNetworkObj?.color || '#F59E0B' }]} />

                  <View style={styles.confirmContent}>
                    <View style={[styles.largeNetworkCircle, { backgroundColor: activeNetworkObj?.bgColor || '#FFFBEB' }]}>
                      <Text style={[styles.largeNetworkLetter, { color: activeNetworkObj?.color || '#F59E0B' }]}>{activeNetworkObj?.label.charAt(0) || 'M'}</Text>
                    </View>

                    <Text style={styles.sendToText}>SEND TO</Text>
                    <Text style={styles.confirmPhone}>{phoneNumber}</Text>
                    <Text style={styles.confirmNetwork}>{activeNetworkObj?.label} Mobile</Text>

                    <View style={styles.amountBox}>
                      <Text style={styles.confirmAmountText}>Amount</Text>
                      <Text style={styles.confirmAmount}>
                        {CURRENCY}{Number(amount).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dividerWrapper}>
                    <View style={styles.leftCutout} />
                    <View style={styles.dashedLine} />
                    <View style={styles.rightCutout} />
                  </View>

                  <View style={styles.transactionTypeRow}>
                    <Text style={styles.typeLabel}>Product</Text>
                    <Text style={styles.typeValue}>Airtime Top-Up</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.bottomBarDetails}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('PIN')}>
                  <Text style={styles.btnText}>Proceed to Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'PIN' && (
            <View style={styles.stepContainer}>
              {renderHeader(true, () => { setStep('CONFIRM'); setPinError(false); setErrorMessage(''); })}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">

                <View style={styles.lockIconContainer}>
                  <View style={styles.lockIconCircle}>
                    <Ionicons name="lock-closed" size={28} color="#4F46E5" />
                  </View>
                </View>

                <Text style={styles.authorizeTitle}>Authorize Payment</Text>
                <Text style={styles.authorizeSubtitle}>Enter your highly secure PIN to confirm.</Text>

                <View style={[styles.pinPayloadBadge, { backgroundColor: activeNetworkObj?.bgColor || '#FFFBEB', borderColor: activeNetworkObj?.color || '#F59E0B' }]}>
                  <Text style={[styles.pinPayloadAmount, { color: activeNetworkObj?.color || '#F59E0B' }]}>{CURRENCY}{Number(amount).toLocaleString()}</Text>
                  <Text style={styles.pinPayloadSub}>{activeNetworkObj?.label} · {phoneNumber}</Text>
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
                  <View style={styles.processingRow}>
                    <ActivityIndicator size="small" color="#111827" />
                    <Text style={styles.processingText}>Processing...</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {step === 'SUCCESS' && (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark-circle" size={88} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Transaction Successful</Text>
              <Text style={styles.successDesc}>
                Your airtime top-up has been fully processed and credited to <Text style={styles.successPhone}>{phoneNumber}</Text> instantly.
              </Text>

              <View style={styles.bottomBarDetails}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleClose}>
                  <Text style={styles.btnText}>Return to Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.6)", // Darker, sleeker overlay
    justifyContent: "flex-end",
  },
  drawerContainer: {
    backgroundColor: "#F9FAFB", // Extremely clean slight off-white
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    height: '92%',
  },
  stepContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  networkGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  networkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    width: '23.5%',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  networkCardSelected: {
    borderWidth: 1.5,
  },
  checkCircle: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  networkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  networkLetter: {
    fontWeight: '800',
    fontSize: 18,
  },
  networkLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600'
  },
  networkLabelSelected: {
    color: '#111827',
    fontWeight: '800'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    height: 64,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputContainerSuccess: {
    borderColor: '#34D399',
    backgroundColor: '#F0FDF4',
  },
  inputIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
    letterSpacing: 1,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    color: '#111827',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  currencyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '800',
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  quickAmountPill: {
    width: '31.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  quickAmountPillSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '700',
  },
  quickAmountTextSelected: {
    color: '#2563EB',
  },
  bottomBarDetails: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  bottomSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  bottomSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallNetworkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  smallNetworkLetter: {
    fontSize: 12,
    fontWeight: '800',
  },
  bottomPhone: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomAmount: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: "#111827",
    width: "100%",
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: '#E5E7EB',
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  disabledBtnText: {
    color: '#9CA3AF',
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmTopBar: {
    height: 8,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  confirmContent: {
    padding: 32,
    alignItems: 'center',
  },
  largeNetworkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  largeNetworkLetter: {
    fontWeight: '800',
    fontSize: 28,
  },
  sendToText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  confirmPhone: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  confirmNetwork: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  amountBox: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
  },
  confirmAmountText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  confirmAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: '#111827',
  },
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  leftCutout: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    zIndex: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  rightCutout: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    zIndex: 1,
    borderLeftWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  typeLabel: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  typeValue: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  lockIconContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorizeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  authorizeSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  pinPayloadBadge: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  pinPayloadAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  pinPayloadSub: {
    fontSize: 14,
    fontWeight: '600',
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  processingText: {
    marginLeft: 12,
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successIconWrapper: {
    marginBottom: 32,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 60,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    textAlign: 'center',
  },
  successDesc: {
    color: "#6B7280",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  successPhone: {
    fontWeight: "800",
    color: "#111827",
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    marginLeft: 12,
  },
});

export default BuyAirtime;
