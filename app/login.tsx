import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import AuthInput from "./(provider)/components/AuthInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "./context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<number | null>(null);

  const authState = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    const checkBiometric = async () => {
      const enabled = await AsyncStorage.getItem("biometric_enabled");
      setIsBiometricEnabled(enabled === "true");

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (hasHardware) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType(LocalAuthentication.AuthenticationType.FINGERPRINT);
        }
      }
    };
    checkBiometric();
  }, []);

  const handleBiometricLogin = async () => {
    try {
      setError("");
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setError("Biometrics not available or not enrolled on this device");
        return;
      }

      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: Platform.OS === 'ios' && biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? "Sign in with Face ID" : "Authenticate to Login",
        cancelLabel: "Use Password",
      });

      if (auth.success) {
        setLoading(true);
        const credString = await SecureStore.getItemAsync("biometric_credentials");
        if (credString) {
          await AsyncStorage.setItem("credentials", credString);

          const response = await authState.login();
          if (response && response.success === false) {
            setError(response.error || "Biometric login failed");
          }
        } else {
          setError("Biometric credentials not found.");
        }
      }
    } catch (e: any) {
      console.log("Biometric Login error:", e);
      setError(e.message || "An unexpected error occurred during biometric login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email) {
      setError("Email address is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await AsyncStorage.setItem(
        "credentials",
        JSON.stringify({
          email,
          password,
        }),
      );

      const response = await authState.login();
      if (response && response.success === false) {
        setError(response.error || "Invalid credentials, please try again");
        return;
      }

    } catch (error: any) {
      console.log("Login error:", error);
      setError(error?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.cardContainer}>
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: error ? 10 : 0 }}>
          <AuthInput
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            icon="mail-outline"
            definedKeyboardType="email-address"
          />

          <View style={{ marginTop: 12 }}>
            <AuthInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              icon="lock-closed-outline"
              secureTextEntry={secure}
              rightIcon={secure ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setSecure(!secure)}
            />
          </View>

          <TouchableOpacity style={styles.forgot} onPress={() => router.push("/forgot" as any)}>
            <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.text}>Sign In</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFF"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>

          {isBiometricEnabled && (
            <TouchableOpacity
              style={[styles.button, styles.biometricButton]}
              onPress={handleBiometricLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <>
                  <Ionicons
                    name={Platform.OS === 'ios' && biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? "scan-outline" : "finger-print"}
                    size={20} color="#2563eb" style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.text, { color: "#2563eb", fontSize: 16 }]}>
                    {Platform.OS === 'ios' && biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? "Sign in with Face ID" : "Sign in with Biometrics"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Mufti Pay? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.signupText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
    elevation: 10,
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
  forgot: {
    alignItems: "flex-end",
    marginTop: 8,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  button: {
    height: 56,
    backgroundColor: "#2563eb",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  biometricButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 16,
    shadowColor: "transparent",
    elevation: 0,
  },
  text: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  signupText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2563eb",
  },
});

export default LoginScreen;
