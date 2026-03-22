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
import { buyData, getDataPlans } from "@/app/utils/vtu";
import TransactionPinInput from '../TransactionPinInput';

type Step = 'NETWORK' | 'PLAN' | 'PHONE' | 'CONFIRM' | 'PIN' | 'SUCCESS';
type NetworkId = 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';

interface UIPlan {
  id: string;
  name: string;
  price: number;
  groupName: string;
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

const BuyData: React.FC<BuyDataProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState<Step>('NETWORK');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<UIPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [apiPlans, setApiPlans] = useState<any>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [transactionPin, setTransactionPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (visible && !apiPlans) {
      fetchPlans();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !selectedNetwork && step === 'NETWORK') {
      setSelectedNetwork("MTN");
    }
  }, [visible, selectedNetwork, step]);

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
    setErrorMessage('');
    setTransactionPin('');
    setPinError(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleNetworkSelect = (networkId: NetworkId) => {
    setSelectedNetwork(networkId);
    setErrorMessage('');
    setSearchQuery('');
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
          });
        });
      }
    });

    return flatPlans;
  };

  const currentPlans = getAvailablePlans();
  const filteredPlans = currentPlans.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        pinToUse
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
    <View style={styles.headerRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={[styles.headerIconBtn, { marginRight: 12 }]}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 0 }} />
        )}
        <Text style={[styles.drawerTitle, !showBack && { marginTop: 4 }]}>{step === 'SUCCESS' ? 'Transaction Status' : 'Buy Data'}</Text>
      </View>
      <TouchableOpacity onPress={handleClose} style={styles.headerIconBtn}>
        <Ionicons name="close" size={20} color="#111827" />
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
              <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {step === 'NETWORK' && (
            <View style={styles.stepContainer}>
              {renderHeader(false)}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <Text style={styles.sectionTitle}>SELECT NETWORK</Text>
                {isLoadingPlans ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#111827" />
                  </View>
                ) : (
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
                          onPress={() => handleNetworkSelect(network.id)}
                        >
                          {isSelected && (
                            <View style={[styles.checkCircle, { backgroundColor: network.color }]}>
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                          )}
                          <View style={[styles.networkCircle, { backgroundColor: network.color }]}>
                            <Text style={styles.networkLetter}>{network.label.charAt(0)}</Text>
                          </View>
                          <Text style={[styles.networkLabel, isSelected && styles.networkLabelSelected]}>{network.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {step === 'PLAN' && (
            <View style={styles.stepContainer}>
              {renderHeader(true, () => setStep('NETWORK'))}

              <View style={styles.planHeaderRow}>
                <View style={[styles.smallNetworkCircle, { backgroundColor: activeNetworkObj?.color || '#FFCC00', width: 32, height: 32, borderRadius: 16 }]}>
                  <Text style={[styles.smallNetworkLetter, { fontSize: 16 }]}>{activeNetworkObj?.label.charAt(0) || 'M'}</Text>
                </View>
                <Text style={styles.planHeaderText}>{activeNetworkObj?.label} Data Plans</Text>
              </View>

              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search plans..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <Text style={styles.sectionTitle}>{filteredPlans.length} PLANS AVAILABLE</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              >
                {filteredPlans.length > 0 ? (
                  filteredPlans.map((plan, index) => (
                    <TouchableOpacity
                      key={`${plan.id}-${index}`}
                      onPress={() => handlePlanSelect(plan)}
                      style={styles.planCardNew}
                    >
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.planNameText}>{plan.name}</Text>
                        <View style={{ flexDirection: 'row', marginTop: 8 }}>
                          <View style={styles.planBadge}>
                            <Text style={styles.planBadgeText}>{plan.groupName}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.planPriceText, { color: activeNetworkObj?.color || '#FFCC00' }]}>{CURRENCY}{plan.price.toLocaleString()}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    {searchQuery ? "No matching plans found" : "No plans available"}
                  </Text>
                )}
              </ScrollView>
            </View>
          )}

          {step === 'PHONE' && (
            <View style={styles.stepContainer}>
              {renderHeader(true, () => setStep('PLAN'))}

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={[styles.selectedPlanCard, { borderColor: activeNetworkObj?.color || '#FFCC00', backgroundColor: activeNetworkObj?.bgColor || '#FFF9E6' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.smallNetworkCircle, { backgroundColor: activeNetworkObj?.color || '#FFCC00', width: 44, height: 44, borderRadius: 22, marginRight: 16 }]}>
                      <Text style={[styles.smallNetworkLetter, { fontSize: 22 }]}>{activeNetworkObj?.label.charAt(0) || 'M'}</Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.selectedPlanName} numberOfLines={2}>{selectedPlan?.name}</Text>
                      <Text style={styles.selectedPlanNetwork}>{activeNetworkObj?.label}</Text>
                    </View>
                    <Text style={[styles.selectedPlanPrice, { color: activeNetworkObj?.color || '#FFCC00' }]}>{CURRENCY}{selectedPlan?.price.toLocaleString()}</Text>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>PHONE NUMBER</Text>
                <View style={styles.inputContainer}>
                  <View style={[styles.inputIconCircle, { backgroundColor: activeNetworkObj?.color || '#FFCC00' }]}>
                    <Ionicons name="call" size={16} color="#fff" />
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
                    <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" style={{ marginRight: 12 }} />
                  )}
                </View>
              </ScrollView>

              <View style={styles.bottomAnchoredDetails}>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    phoneNumber.length < 10 && styles.disabledBtn
                  ]}
                  disabled={phoneNumber.length < 10}
                  onPress={() => setStep('CONFIRM')}
                >
                  <Text style={styles.btnText}>Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'CONFIRM' && (
            <View style={styles.stepContainer}>
              {renderHeader(true, () => setStep('PHONE'))}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={styles.confirmCard}>
                  <View style={[styles.confirmTopBar, { backgroundColor: activeNetworkObj?.color || '#FFCC00' }]} />

                  <View style={styles.confirmContent}>
                    <View style={[styles.largeNetworkCircle, { backgroundColor: activeNetworkObj?.color || '#FFCC00' }]}>
                      <Text style={styles.largeNetworkLetter}>{activeNetworkObj?.label.charAt(0) || 'M'}</Text>
                    </View>

                    <Text style={styles.confirmPlanNameInfo}>{selectedPlan?.name}</Text>
                    <Text style={styles.confirmPhone}>{phoneNumber}</Text>
                    <Text style={styles.confirmNetwork}>{activeNetworkObj?.label}</Text>

                    <Text style={[styles.confirmAmount, { color: activeNetworkObj?.color || '#FFCC00' }]}>
                      {CURRENCY}{selectedPlan?.price.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.dividerWrapper}>
                    <View style={styles.leftCutout} />
                    <View style={styles.dashedLine} />
                    <View style={styles.rightCutout} />
                  </View>

                  <View style={styles.transactionTypeRow}>
                    <Text style={styles.typeLabel}>Type</Text>
                    <Text style={styles.typeValue}>Data Bundle</Text>
                  </View>

                  <View style={styles.deliveryBadge}>
                    <Ionicons name="wifi-outline" size={16} color="#8B5CF6" />
                    <Text style={styles.deliveryText}>Data will be activated instantly</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.bottomAnchored}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('PIN')}>
                  <Text style={styles.btnText}>Proceed to Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'PIN' && (
            <View style={styles.stepContainer}>
              {renderHeader(true, () => { setStep('CONFIRM'); setPinError(false); setErrorMessage(''); })}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }}>

                <View style={styles.lockIconContainer}>
                  <View style={styles.lockIconCircle}>
                    <Ionicons name="lock-closed-outline" size={28} color="#3B82F6" />
                  </View>
                  <View style={styles.shieldIconBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#fff" />
                  </View>
                </View>

                <Text style={styles.authorizeTitle}>Authorize Payment</Text>
                <Text style={styles.authorizeSubtitle}>Enter your 4-digit PIN to confirm</Text>

                <View style={[styles.pinPayloadBadge, { backgroundColor: activeNetworkObj?.bgColor || '#FFF9E6', borderColor: activeNetworkObj?.color || '#FFCC00' }]}>
                  <Text style={[styles.pinPayloadAmount, { color: activeNetworkObj?.color || '#FFCC00' }]}>{CURRENCY}{selectedPlan?.price.toLocaleString()}</Text>
                  <Text style={styles.pinPayloadSub}>{activeNetworkObj?.label} Data · {phoneNumber}</Text>
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
                  <View style={[styles.processingRow, { marginTop: 10 }]}>
                    <ActivityIndicator size="small" color="#111827" />
                    <Text style={{ marginLeft: 8, color: '#111827', fontWeight: '600' }}>Processing Payment...</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.bottomAnchored}>
                <TouchableOpacity style={styles.confirmPinBtn} disabled={true}>
                  <Text style={styles.confirmPinBtnText}>Confirm Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'SUCCESS' && (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark-circle" size={80} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Transaction Successful</Text>
              <Text style={styles.successDesc}>
                Data sent to{' '}
                <Text style={styles.successPhone}>{phoneNumber}</Text>
              </Text>

              <View style={[styles.bottomAnchored, { width: '100%' }]}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleClose}>
                  <Text style={styles.btnText}>Done</Text>
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  drawerContainer: {
    backgroundColor: "#E5E7EB", // Like BuyAirtime background
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 24,
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
    marginBottom: 20,
  },
  headerIconBtn: {
    backgroundColor: "#fff",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827"
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  networkGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  networkCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: '23%',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  networkCardSelected: {
    borderWidth: 2,
  },
  checkCircle: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 2,
  },
  networkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  networkLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  networkLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600'
  },
  networkLabelSelected: {
    color: '#111827',
    fontWeight: 'bold'
  },
  planHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  smallNetworkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  smallNetworkLetter: {
    color: '#fff',
    fontWeight: 'bold',
  },
  planHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#111827",
  },
  planCardNew: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  planNameText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111827",
  },
  planBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  planPriceText: {
    fontWeight: "800",
    fontSize: 16,
  },
  selectedPlanCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderWidth: 1,
    borderRadius: 16,
  },
  selectedPlanName: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111827",
  },
  selectedPlanNetwork: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    textTransform: "uppercase",
  },
  selectedPlanPrice: {
    fontWeight: "800",
    fontSize: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 64,
    paddingLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 12,
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
  },
  bottomAnchoredDetails: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  bottomAnchored: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  primaryBtn: {
    backgroundColor: "#71717A",
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginTop: 10,
    overflow: 'hidden',
  },
  confirmTopBar: {
    height: 8,
    width: '100%',
  },
  confirmContent: {
    padding: 30,
    alignItems: 'center',
  },
  largeNetworkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  largeNetworkLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
  },
  confirmPlanNameInfo: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 6,
    textAlign: 'center',
  },
  confirmPhone: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 2,
    marginBottom: 4,
  },
  confirmNetwork: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  confirmAmount: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 10,
  },
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 24,
    marginVertical: 4,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  leftCutout: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  rightCutout: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  transactionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  typeLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  typeValue: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  deliveryText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  lockIconContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  authorizeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  authorizeSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  pinPayloadBadge: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  pinPayloadAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pinPayloadSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  confirmPinBtn: {
    backgroundColor: "#71717A",
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmPinBtnText: {
    color: "#D1D5DB",
    fontWeight: "700",
    fontSize: 16,
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successIconWrapper: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  successPhone: {
    fontWeight: "bold",
    color: "#111827",
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 30,
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
    marginLeft: 8,
    fontSize: 14,
  },
});

export default BuyData;
