import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  getDiscos,
  verifyMeter,
  payElectricity,
  DiscoProvider,
} from "../../../utils/electricity";
import { SafeAreaView } from "react-native-safe-area-context";

interface BuyElectricityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "PROVIDER" | "DETAILS" | "CONFIRM" | "SUCCESS";

const QUICK_AMOUNTS = ["1000", "2000", "5000", "10000"];

const BuyElectricityModal: React.FC<BuyElectricityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<Step>("SUCCESS");
  const [discos, setDiscos] = useState<DiscoProvider[]>([]);
  const [providerId, setProviderId] = useState("");
  const [meterType, setMeterType] = useState<"PREPAID" | "POSTPAID">("PREPAID");
  const [meterNumber, setMeterNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");

  const [isLoadingDiscos, setIsLoadingDiscos] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedProvider = discos.find((p) => p.id === providerId);

  useEffect(() => {
    if (isOpen && discos.length === 0) {
      fetchDiscos();
    }
  }, [isOpen]);

  const fetchDiscos = async () => {
    setIsLoadingDiscos(true);
    setErrorMessage("");

    const res = await getDiscos();

    if (res.success && res.data) {
      setDiscos(res.data);
    } else {
      setErrorMessage(res.error || "Failed to load providers.");
    }

    setIsLoadingDiscos(false);
  };

  const resetState = () => {
    setStep("PROVIDER");
    setProviderId("");
    setMeterType("PREPAID");
    setMeterNumber("");
    setPhoneNumber("");
    setAmount("");
    setCustomerName("");
    setGeneratedToken("");
    setIsValidated(false);
    setErrorMessage("");
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300);
  };

  const handleValidate = async () => {
    if (meterNumber.length < 5) {
      setErrorMessage("Enter valid meter number");
      return;
    }

    setIsValidating(true);
    setErrorMessage("");

    const res = await verifyMeter(
      providerId,
      meterNumber,
      meterType === "PREPAID",
    );

    if (res.success && res.data) {
      setCustomerName(res.data.customer_name);
      setIsValidated(true);
    } else {
      setErrorMessage(res.error || "Verification failed");
    }

    setIsValidating(false);
  };

  const handlePurchase = async () => {
    if (phoneNumber.length < 10) {
      setErrorMessage("Enter valid phone number");
      setStep("DETAILS");
      return;
    }

    setIsProcessing(true);

    const res = await payElectricity({
      discoCode: providerId,
      meterNo: meterNumber,
      meterType: meterType === "PREPAID" ? "01" : "02",
      amount: Number(amount),
      phoneNo: phoneNumber,
    });

    setIsProcessing(false);

    if (res.success) {
      if (res.token) setGeneratedToken(res.token);
      setStep("SUCCESS");
    } else {
      setErrorMessage(res.error || "Payment failed");
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" style={{ height: 30 }}>
      <SafeAreaView style={styles.container}>
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="red" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* STEP 1: PROVIDER */}
        {step === "PROVIDER" && (
          <>
            <Text style={styles.title}>Select Electricity Provider</Text>

            {isLoadingDiscos ? (
              <ActivityIndicator size="large" color="#f59e0b" />
            ) : (
              <ScrollView>
                {discos.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    style={styles.card}
                    onPress={() => {
                      setProviderId(provider.id);
                      setStep("DETAILS");
                    }}
                  >
                    <Text style={styles.cardText}>{provider.name}</Text>
                    <Ionicons name="chevron-forward" size={18} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* STEP 2: DETAILS */}
        {step === "DETAILS" && (
          <ScrollView>
            <TouchableOpacity onPress={() => setStep("PROVIDER")}>
              <Text style={styles.link}>← Change Provider</Text>
            </TouchableOpacity>

            <View style={styles.toggleRow}>
              {["PREPAID", "POSTPAID"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.toggle,
                    meterType === type && styles.toggleActive,
                  ]}
                  onPress={() => {
                    setMeterType(type as any);
                    setIsValidated(false);
                  }}
                >
                  <Text>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Meter Number"
              keyboardType="numeric"
              value={meterNumber}
              onChangeText={(v) => setMeterNumber(v.replace(/\D/g, ""))}
              style={styles.input}
            />

            {!isValidated ? (
              <TouchableOpacity
                style={styles.button}
                onPress={handleValidate}
                disabled={isValidating}
              >
                {isValidating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Validate Meter</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.successText}>Verified: {customerName}</Text>

                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(v) => setAmount(v.replace(/\D/g, ""))}
                  style={styles.input}
                />

                <View style={styles.quickRow}>
                  {QUICK_AMOUNTS.map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={styles.quickButton}
                      onPress={() => setAmount(amt)}
                    >
                      <Text>₦{amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(v) => setPhoneNumber(v.replace(/\D/g, ""))}
                  style={styles.input}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setStep("CONFIRM")}
                >
                  <Text style={styles.buttonText}>Proceed to Payment</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        )}

        {/* STEP 3: CONFIRM */}
        {step === "CONFIRM" && (
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => setStep("DETAILS")}>
              <Text style={styles.link}>← Edit Details</Text>
            </TouchableOpacity>

            <View style={styles.receipt}>
              <Text style={styles.bigAmount}>
                ₦{Number(amount).toLocaleString()}
              </Text>
              <Text>{selectedProvider?.name}</Text>
              <Text>{customerName}</Text>
              <Text>{meterNumber}</Text>
              <Text>{meterType}</Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Confirm & Pay</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "SUCCESS" && (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={80} color="green" />
            <Text style={styles.title}>Payment Successful</Text>

            {generatedToken ? (
              <View style={styles.tokenBox}>
                <Text style={styles.token}>{generatedToken}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.button} onPress={handleClose}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default BuyElectricityModal;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardText: { fontSize: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#f59e0b",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  toggleRow: { flexDirection: "row", marginBottom: 15 },
  toggle: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  toggleActive: { backgroundColor: "#fde68a" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  receipt: {
    borderWidth: 1,
    padding: 20,
    borderRadius: 15,
    marginVertical: 20,
  },
  bigAmount: { fontSize: 28, fontWeight: "bold" },
  successText: { color: "green", marginBottom: 10 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  errorText: { marginLeft: 8, color: "red" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tokenBox: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
  },
  token: { fontSize: 18, fontWeight: "bold" },
  link: { color: "#f59e0b", marginBottom: 15 },
});
