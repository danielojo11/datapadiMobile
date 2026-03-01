import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AuthInput from "./(provider)/components/AuthInput";
import { generateOTP, verifyOTP, resetPassword } from "./utils/auth/forgotPassword";

const forgot: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [secure, setSecure] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const handleGenerateOTP = async () => {
        if (!email) {
            setError("Email is required");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const response = await generateOTP({ email });
            console.log("Generate OTP: ", response);
            if (!response.success) {
                setError(response.message);
                return;
            }
            setStep(2);
        } catch (err: any) {
            setError(err?.message || "Failed to generate OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            setError("OTP is required");
            return;
        }
        setLoading(true);
        setError("");

        try {
            await verifyOTP({ email, otp });
            setStep(3);
        } catch (err: any) {
            setError(err?.message || "Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!password) {
            setError("Password is required");
            return;
        }
        setLoading(true);
        setError("");

        try {
            await resetPassword({ email, otp, password });
            router.replace("/login");
        } catch (err: any) {
            setError(err?.message || "Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>

            <Text style={styles.title}>
                {step === 1 && "Forgot Password"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Reset Password"}
            </Text>
            <Text style={styles.subtitle}>
                {step === 1 && "Enter your email address to receive an OTP."}
                {step === 2 && `Enter the OTP sent to ${email}.`}
                {step === 3 && "Enter your new password."}
            </Text>

            {error ? (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            <View style={{ marginTop: error ? 10 : 30 }}>
                {step === 1 && (
                    <AuthInput
                        label="Email Address"
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={setEmail}
                        icon="mail-outline"
                        definedKeyboardType="email-address"
                    />
                )}

                {step === 2 && (
                    <AuthInput
                        label="OTP"
                        placeholder="Enter OTP"
                        value={otp}
                        onChangeText={setOtp}
                        icon="key-outline"
                        definedKeyboardType="numeric"
                    />
                )}

                {step === 3 && (
                    <AuthInput
                        label="New Password"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        icon="lock-closed-outline"
                        secureTextEntry={secure}
                        rightIcon={secure ? "eye-off-outline" : "eye-outline"}
                        onRightIconPress={() => setSecure(!secure)}
                    />
                )}

                <TouchableOpacity
                    style={styles.button}
                    onPress={step === 1 ? handleGenerateOTP : step === 2 ? handleVerifyOTP : handleResetPassword}
                    activeOpacity={0.85}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.text}>
                                {step === 1 && "Verify Email"}
                                {step === 2 && "Verify OTP"}
                                {step === 3 && "Reset Password"}
                            </Text>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 24,
        marginTop: 48
    },
    backButton: {
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
    },
    errorBox: {
        flexDirection: "row",
        backgroundColor: "#FEF2F2",
        padding: 14,
        borderRadius: 12,
        marginTop: 20,
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
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 6,
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

export default forgot;