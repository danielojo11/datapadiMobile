import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerUser, validateReferralCode } from "./utils/auth/register";
import { loginUser } from "./utils/auth/login";

const CreateAccountScreen = () => {
  // Form state
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [referralError, setReferralError] = useState("");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleValidateReferral = async (code: string) => {
    setIsValidatingReferral(true);
    setReferralError("");
    setReferrerName("");
    try {
      const result = await validateReferralCode(code);
      if (result.success) {
        setReferrerName(result.data?.referrerName || "a friend");
      } else {
        setReferralError(result.error);
      }
    } catch (err) {
      setReferralError("Could not validate code");
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const initialLoginUser = async () => {
    try {
      const response = await loginUser({
        email: email.toString(),
        password: password.toString(),
      });
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  const handleNextStep = () => {
    if (!username || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSignUp = async () => {
    if (transactionPin.length !== 4) {
      setError("Transaction PIN must be 4 digits.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords must match")
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await registerUser({
        userName: username.toString(),
        email: email.toString(),
        phoneNumber: phone.toString(),
        password: password.toString(),
        transactionPin: transactionPin.toString(),
        referralCode: referralCode.toString(),
      });

      setIsLoading(false);

      if (response && response.success) {
        router.push("/login");
        console.log("Signup success:", response);
      } else {
        setError(response?.error || 'Registration failed. Please try again.');
        console.log("Signup error:", response);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "An unexpected error occurred");
      console.log(err);
    }
  };

  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>

            <Text style={styles.title}>{step === 1 ? "Create an Account" : "Create PIN"}</Text>
            <Text style={styles.subtitle}>{step === 1 ? "Fast, Secure & Automated" : "Secure your transactions"}</Text>
          </View>

          <View style={styles.cardContainer}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: error ? 10 : 0 }}>
              {step === 1 ? (
                <>
                  {/* Username Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.leftIcon}>
                        <Ionicons size={18} name="person-outline" />
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor="#9CA3AF"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {/* Phone Number Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.leftIcon}>
                        <Ionicons size={18} name="call-outline" />
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="08012345678"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.leftIcon}>
                        <Ionicons size={18} name="mail-outline" />
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {/* Referral Code (Optional) */}
                  <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.label}>Referral Code (Optional)</Text>
                      {isValidatingReferral && <ActivityIndicator size="small" color="#2563EB" />}
                    </View>
                    <View style={[styles.inputContainer, referralError ? { borderColor: '#EF4444' } : referrerName ? { borderColor: '#10B981' } : {}]}>
                      <Text style={styles.leftIcon}>
                        <Ionicons size={18} name="people-outline" />
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="ABCDEF"
                        placeholderTextColor="#9CA3AF"
                        value={referralCode}
                        onChangeText={(text) => {
                          const formatted = text.toUpperCase().trim();
                          setReferralCode(formatted);
                          if (formatted.length === 6) {
                            handleValidateReferral(formatted);
                          } else {
                            setReferrerName("");
                            setReferralError("");
                          }
                        }}
                        autoCapitalize="characters"
                        maxLength={6}
                      />
                    </View>
                    {referrerName ? (
                      <Text style={{ marginTop: 4, fontSize: 12, color: "#10B981", fontWeight: '600' }}>
                        <Ionicons name="checkmark-circle" size={12} /> Referred by {referrerName}
                      </Text>
                    ) : referralError ? (
                      <Text style={{ marginTop: 4, fontSize: 12, color: "#EF4444", fontWeight: '600' }}>
                        <Ionicons name="alert-circle" size={12} /> {referralError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.leftIcon}>
                        <Ionicons size={18} name="lock-closed-outline" />
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.rightIcon}
                      >
                        <Text style={styles.eyeIcon}>
                          <Ionicons
                            size={18}
                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                          />
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.leftIcon}>
                        <Ionicons size={18} name="lock-closed-outline" />
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.rightIcon}
                      >
                        <Text style={styles.eyeIcon}>
                          <Ionicons
                            size={18}
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                          />
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Next Step Button */}
                  <TouchableOpacity
                    style={styles.signUpButton}
                    activeOpacity={0.85}
                    onPress={handleNextStep}
                  >
                    <>
                      <Text style={styles.signUpButtonText}>Next</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#FFF"
                        style={{ marginLeft: 8 }}
                      />
                    </>
                  </TouchableOpacity>

                  {/* Footer Login Link */}
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/login")}>
                      <Text style={styles.loginLink}>Log in</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.pinContainerBox}>
                    <View style={styles.pinHeader}>
                      <Text style={styles.pinTitle}>Set Transaction PIN</Text>
                      <Text style={styles.pinSubtitle}>
                        You will use this 4-digit PIN to confirm airtime, data, and bill payments.
                      </Text>
                    </View>
                    <View style={styles.inputGroup}>
                      <View style={[styles.inputContainer, { alignSelf: 'center', width: '80%' }]}>
                        <Text style={styles.leftIcon}>
                          <Ionicons size={18} name="keypad-outline" />
                        </Text>
                        <TextInput
                          style={[styles.input, { letterSpacing: 10, fontSize: 18, textAlign: 'center' }]}
                          placeholder="••••"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="number-pad"
                          secureTextEntry
                          maxLength={4}
                          value={transactionPin}
                          onChangeText={(text) => setTransactionPin(text.replace(/[^0-9]/g, ''))}
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.signUpButton}
                    activeOpacity={0.85}
                    onPress={handleSignUp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.signUpButtonText}>Create My Account</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#FFF"
                          style={{ marginLeft: 8 }}
                        />
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <TouchableOpacity
                      onPress={() => setStep(1)}
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons name="arrow-back" size={16} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.footerText}>BACK</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  brandContainer: {
    marginBottom: 24,
  },
  brandText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 40,
    padding: 30,
    shadowColor: "#e2e8f0",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
  },
  leftIcon: {
    fontSize: 18,
    color: "#94a3b8",
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
  },
  rightIcon: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
    color: "#94a3b8",
  },
  signUpButton: {
    height: 56,
    backgroundColor: "#0f172a", // Match slate-900 in Next.js design
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 16,
    marginBottom: 24,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2563eb",
  },
  pinContainerBox: {
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 16,
  },
  pinHeader: {
    marginBottom: 16,
    alignItems: "center",
  },
  pinTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  pinSubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 240,
  },
});

export default CreateAccountScreen;
