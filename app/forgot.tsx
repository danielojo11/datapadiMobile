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

const Forgot: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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
            if (response.status !== "OK") {
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
        if (password !== confirmPassword) {
            setError("Passwords do not match");
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
            <View style={styles.headerContainer}>

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
            </View>

            <View style={styles.cardContainer}>
                {error ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={{ marginTop: error ? 10 : 0 }}>
                    {step === 1 && (
                        <View style={{ marginBottom: 12 }}>
                            <AuthInput
                                label="Email Address"
                                placeholder="you@example.com"
                                value={email}
                                onChangeText={setEmail}
                                icon="mail-outline"
                                definedKeyboardType="email-address"
                            />
                        </View>
                    )}

                    {step === 2 && (
                        <View style={{ marginBottom: 12 }}>
                            <AuthInput
                                label="OTP"
                                placeholder="Enter OTP"
                                value={otp}
                                onChangeText={setOtp}
                                icon="key-outline"
                                definedKeyboardType="numeric"
                            />
                        </View>
                    )}

                    {step === 3 && (
                        <>
                            <View style={{ marginBottom: 12 }}>
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
                            </View>
                            <View style={{ marginBottom: 12 }}>
                                <AuthInput
                                    label="Confirm Password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    icon="lock-closed-outline"
                                    secureTextEntry={secure}
                                    rightIcon={secure ? "eye-off-outline" : "eye-outline"}
                                    onRightIconPress={() => setSecure(!secure)}
                                />
                            </View>
                        </>
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
                                    {step === 1 && "Send OTP"}
                                    {step === 2 && "Verify OTP"}
                                    {step === 3 && "Reset Password"}
                                </Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={20}
                                    color="#FFF"
                                    style={{ marginLeft: 8 }}
                                />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={() => { step === 1 ? router.replace("/login") : setStep((prev) => (prev - 1) as any) }}
                        style={{ flexDirection: "row", alignItems: "center" }}
                    >
                        <Ionicons name="arrow-back" size={16} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={styles.footerText}>{step === 1 ? "BACK TO SIGN IN" : "BACK"}</Text>
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
        textAlign: "center",
    },
    subtitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 1.5,
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
        marginTop: 8,
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
        fontSize: 12,
        color: "#64748b",
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
});

export default Forgot;