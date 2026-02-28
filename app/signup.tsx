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
import { registerUser } from "./utils/auth/register";
import { loginUser } from "./utils/auth/login";

const CreateAccountScreen = () => {
  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleSignUp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await registerUser({
        userName: username.toString(),
        email: email.toString(),
        phoneNumber: phone.toString(),
        password: password.toString(),
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join DataPadi today</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.leftIcon}>
                <Ionicons size={18} name="person-outline" />
              </Text>
              <TextInput
                style={styles.input}
                placeholder="johndoe"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                  />
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.signUpButton}
            activeOpacity={0.8}
            onPress={() => handleSignUp()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Footer Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
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
  inputGroup: {
    marginBottom: 20,
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
    borderColor: "#D1D5DB",
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  leftIcon: {
    fontSize: 16,
    color: "#9CA3AF",
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  rightIcon: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  signUpButton: {
    backgroundColor: "#2563EB", // A rich blue matching the design
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
});

export default CreateAccountScreen;
