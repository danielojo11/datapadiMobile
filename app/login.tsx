import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AuthInput from "./(provider)/components/AuthInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "./context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const authState = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);

    try {
      await AsyncStorage.setItem(
        "credentials",
        JSON.stringify({
          email,
          password,
        }),
      );

      await authState.login();
    } catch (error) {
      console.log("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>DP</Text>
      </View>

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue to DataPadi</Text>

      <View style={{ marginTop: 30 }}>
        <AuthInput
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          icon="mail-outline"
          definedKeyboardType="email-address"
        />

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

        <TouchableOpacity style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
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
              <Text style={styles.text}>Login</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFF"
                style={{ marginLeft: 6 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },

  logoText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 18,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 24,
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },

  forgot: {
    alignItems: "flex-end",
    marginBottom: 10,
  },

  forgotText: {
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "600",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 30,
  },

  footerText: {
    fontSize: 13,
    color: "#6B7280",
  },

  signupText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  button: {
    height: 54,
    backgroundColor: "#1D4ED8",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 10,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  text: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default LoginScreen;
