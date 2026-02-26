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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { buyData, getDataPlans } from "@/app/utils/vtu";

type Step = 'NETWORK' | 'PLAN' | 'PHONE' | 'CONFIRM' | 'SUCCESS';
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

const networks: { id: NetworkId; label: string; color: string }[] = [
  { id: "MTN", label: "MTN", color: "#FFCC00" },
  { id: "AIRTEL", label: "Airtel", color: "#FF0000" },
  { id: "GLO", label: "Glo", color: "#009933" },
  { id: "9MOBILE", label: "9mobile", color: "#006600" },
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

  useEffect(() => {
    if (visible && !apiPlans) {
      fetchPlans();
    }
  }, [visible]);

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
      console.log("Erororororo: ", error)
      setErrorMessage(error?.message || 'An error occurred while fetching plans.');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const reset = () => {
    setStep('NETWORK');
    setSelectedNetwork(null);
    setSelectedPlan(null);
    setPhoneNumber('');
    setIsPurchasing(false);
    setSearchQuery('');
    setErrorMessage('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleNetworkSelect = (networkId: NetworkId) => {
    setSelectedNetwork(networkId);
    setErrorMessage('');
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

  const handlePurchase = async () => {
    if (!selectedNetwork || !selectedPlan || !phoneNumber) return;

    setIsPurchasing(true);
    setErrorMessage('');

    try {
      const networkLabel = networks.find(n => n.id === selectedNetwork)?.label || selectedNetwork;

      const result = await buyData(
        networkLabel,
        selectedPlan.id,
        phoneNumber
      );
      console.log('Buy Data Result:', result);

      if (result.success) {
        setStep('SUCCESS');
      } else {
        setErrorMessage(result.message || result.error || 'Transaction failed. Please try again.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'An unexpected error occurred.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={styles.drawerTitle}>{step === 'SUCCESS' ? 'Success' : 'Buy Data'}</Text>
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.drawerContainer}
        >
          <View style={styles.handle} />
          {renderHeader()}

          {errorMessage && step !== 'SUCCESS' ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
              <Text style={styles.errorText}>Errors...</Text>
            </View>
          ) : null}

          <View style={styles.contentContainer}>
            {step === 'NETWORK' && (
              <View style={styles.stepContainer}>
                <Text style={styles.subText}>Select a network provider</Text>
                {isLoadingPlans ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003366" />
                    <Text style={styles.loadingText}>Loading networks...</Text>
                  </View>
                ) : (
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
                )}
              </View>
            )}

            {step === 'PLAN' && (
              <View style={styles.stepContainer}>
                <TouchableOpacity onPress={() => setStep('NETWORK')} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Back to Networks</Text>
                </TouchableOpacity>

                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color="#999" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search plans (e.g. 1GB)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <Text style={styles.sectionLabel}>AVAILABLE PLANS</Text>

                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map((plan, index) => (
                      <TouchableOpacity
                        key={`${plan.id}-${index}`}
                        onPress={() => handlePlanSelect(plan)}
                        style={styles.planCard}
                      >
                        <View>
                          <View style={styles.planNameRow}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <View style={styles.groupBadge}>
                              <Text style={styles.groupBadgeText}>{plan.groupName}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.planPriceRow}>
                          <Text style={styles.planPrice}>{CURRENCY}{plan.price.toLocaleString()}</Text>
                          <Ionicons name="chevron-forward" size={16} color="#CCC" />
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
                <TouchableOpacity onPress={() => setStep('PLAN')} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Change Plan</Text>
                </TouchableOpacity>

                <View style={styles.summaryBox}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Plan</Text>
                    <Text style={styles.summaryValue}>{selectedPlan?.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Amount</Text>
                    <Text style={styles.summaryPrice}>{CURRENCY}{selectedPlan?.price.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.flex1}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={18} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="08012345678"
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

                <View style={styles.bottomAnchored}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, phoneNumber.length < 10 && styles.disabledBtn]}
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
                <TouchableOpacity onPress={() => setStep('PHONE')} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Edit Details</Text>
                </TouchableOpacity>

                <View style={styles.confirmBox}>
                  <Text style={styles.confirmHeader}>You are about to purchase</Text>
                  <Text style={styles.confirmPlanName}>{selectedPlan?.name}</Text>
                  <Text style={styles.confirmPlanPrice}>{CURRENCY}{selectedPlan?.price.toLocaleString()}</Text>

                  <View style={styles.confirmDivider} />

                  <Text style={styles.confirmLabel}>BENEFICIARY</Text>
                  <Text style={styles.confirmPhone}>{phoneNumber}</Text>
                  <Text style={styles.confirmNetwork}>{networks.find(n => n.id === selectedNetwork)?.label}</Text>
                </View>

                <View style={styles.bottomAnchored}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, isPurchasing && styles.disabledBtn]}
                    onPress={handlePurchase}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <View style={styles.processingRow}>
                        <ActivityIndicator size="small" color="#FFF" />
                        <Text style={[styles.btnText, { marginLeft: 8 }]}>Processing...</Text>
                      </View>
                    ) : (
                      <Text style={styles.btnText}>Confirm Purchase</Text>
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
                <Text style={styles.successTitle}>Transaction Successful</Text>
                <Text style={styles.successDesc}>
                  Your data has been sent to{" "}
                  <Text style={styles.successPhone}>{phoneNumber}</Text>
                </Text>

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
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#003366",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#111827",
  },
  sectionLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  planCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  planName: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111827",
  },
  groupBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4B5563",
    textTransform: "uppercase",
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  planPrice: {
    color: "#003366",
    fontWeight: "700",
    fontSize: 15,
    marginRight: 6,
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 30,
  },
  summaryBox: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#6B7280",
    fontSize: 14,
  },
  summaryValue: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 15,
  },
  summaryPrice: {
    fontWeight: "700",
    color: "#003366",
    fontSize: 15,
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
  bottomAnchored: {
    marginTop: "auto",
    paddingTop: 16,
    paddingBottom: 8,
  },
  primaryBtn: {
    backgroundColor: "#003366",
    width: "100%",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
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
  confirmBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  confirmHeader: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 8,
  },
  confirmPlanName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  confirmPlanPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#003366",
    marginBottom: 20,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    width: "100%",
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  confirmPhone: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 1,
    marginBottom: 2,
  },
  confirmNetwork: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    textTransform: "uppercase",
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
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  successDesc: {
    color: "#6B7280",
    fontSize: 15,
    textAlign: "center",
  },
  successPhone: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "600",
    color: "#374151",
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
    fontWeight: "600",
    fontSize: 16,
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
    fontWeight: "500",
    flex: 1,
    marginLeft: 8,
  },
});

export default BuyData;
