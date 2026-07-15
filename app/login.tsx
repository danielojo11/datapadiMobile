import React, { useContext, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "./context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import LoginPinModal from "./(provider)/components/drawers/LoginPinModal";
import Button from "./components/ui/Button";
import Input from "./components/ui/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Animated, { FadeInDown } from "react-native-reanimated";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [loginPinModalVisible, setLoginPinModalVisible] = useState(false);
  const [biometricType, setBiometricType] = useState<number | null>(null);

  const authState = useContext(AuthContext);
  const router = useRouter();

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const checkSecurityOptions = async () => {
      const bioEnabled = await AsyncStorage.getItem("biometric_enabled");
      setIsBiometricEnabled(bioEnabled === "true");

      const pinEnabled = await AsyncStorage.getItem("pin_enabled");
      setIsPinEnabled(pinEnabled === "true");

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
    checkSecurityOptions();
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
      setError(e.message || "An unexpected error occurred during biometric login");
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (pin: string) => {
    try {
      setError("");
      setLoading(true);
      const savedPin = await SecureStore.getItemAsync("app_login_pin");
      if (pin !== savedPin) {
        setLoading(false);
        setLoginPinModalVisible(false);
        setError("Incorrect PIN. Please try again.");
        return;
      }

      setLoginPinModalVisible(false);
      const credString = await SecureStore.getItemAsync("pin_credentials");
      if (credString) {
        await AsyncStorage.setItem("credentials", credString);
        const response = await authState.login();
        if (response && response.success === false) {
          setError(response.error || "PIN login failed");
        }
      } else {
        setError("PIN credentials not found.");
      }
    } catch (e: any) {
      setLoginPinModalVisible(false);
      setError(e.message || "An error occurred during PIN login");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    setLoading(true);
    try {
      await AsyncStorage.setItem("credentials", JSON.stringify(data));
      const response = await authState.login();
      if (response && response.success === false) {
        setError(response.error || "Invalid credentials, please try again");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-4">
      <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center mb-10">
        <Text className="text-4xl font-black text-text tracking-tighter mb-2">Welcome Back</Text>
        <Text className="text-xs font-bold text-textMuted uppercase tracking-[2px]">Sign in to your account</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} className="bg-card rounded-[32px] p-8 shadow-2xl shadow-black/50 border border-border mx-2">
        {error ? (
          <View className="flex-row bg-error/10 p-4 rounded-2xl mb-6 items-center border border-error/20">
            <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
            <Text className="text-error text-sm font-bold flex-1 ml-3">{error}</Text>
          </View>
        ) : null}

        <Input control={control} name="email" label="Email Address" icon="mail-outline" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Input control={control} name="password" label="Password" icon="lock-closed-outline" placeholder="••••••••" isPassword />

        <TouchableOpacity className="items-end mt-2 mb-8" onPress={() => router.push("/forgot" as any)}>
          <Text className="text-xs text-primary font-black uppercase tracking-wider">Forgot Password?</Text>
        </TouchableOpacity>

        <Button label="Sign In" onPress={handleSubmit(onSubmit)} loading={loading} icon="arrow-forward" />

        {isBiometricEnabled && (
          <Button
            label={Platform.OS === 'ios' && biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? "Sign in with Face ID" : "Sign in with Biometrics"}
            variant="secondary"
            icon={Platform.OS === 'ios' && biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? "scan-outline" : "finger-print"}
            onPress={handleBiometricLogin}
            loading={loading}
            style={{ marginTop: 16 }}
          />
        )}

        {isPinEnabled && (
          <Button label="Sign in with PIN" variant="secondary" icon="keypad" onPress={() => setLoginPinModalVisible(true)} loading={loading} style={{ marginTop: 16 }} />
        )}

        <LoginPinModal visible={loginPinModalVisible} onClose={() => setLoginPinModalVisible(false)} onSubmit={handlePinLogin} />

        <View className="flex-row justify-center items-center mt-8 pt-6 border-t border-border">
          <Text className="text-sm text-textMuted font-medium">New to Mufti Pay? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text className="text-sm font-black text-primary">Create an account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
