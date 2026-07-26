import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Input from "./components/ui/Input";
import Button from "./components/ui/Button";
import { generateOTP, verifyOTP, resetPassword } from "./utils/auth/forgotPassword";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Animated, { FadeInDown } from "react-native-reanimated";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function Forgot() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const { control, watch, trigger } = useForm<ForgotFormValues>({
        resolver: zodResolver(forgotSchema),
        defaultValues: { email: "", otp: "", password: "", confirmPassword: "" },
    });

    const email = watch("email");
    const otp = watch("otp");
    const password = watch("password");

    const handleGenerateOTP = async () => {
        const isValid = await trigger("email");
        if (!isValid) return;

        setLoading(true);
        setError("");
        try {
            const response = await generateOTP({ email });
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
        const isValid = await trigger(["password", "confirmPassword"]);
        if (!isValid) return;

        setLoading(true);
        setError("");
        try {
            await resetPassword({ email: email || "", otp: otp || "", password: password || "" });
            router.replace("/login");
        } catch (err: any) {
            setError(err?.message || "Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background justify-center px-4">
            <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center mb-10">
                <Text className="text-4xl font-black text-text tracking-tighter mb-2">
                    {step === 1 && "Forgot Password"}
                    {step === 2 && "Verify OTP"}
                    {step === 3 && "Reset Password"}
                </Text>
                <Text className="text-xs font-bold text-textMuted uppercase tracking-[1.5px] text-center">
                    {step === 1 && "Enter your email address to receive an OTP."}
                    {step === 2 && `Enter the OTP sent to ${email}.`}
                    {step === 3 && "Enter your new password."}
                </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} className="bg-card rounded-[32px] p-8 shadow-2xl shadow-black/50 border border-border mx-2">
                {error ? (
                    <View className="flex-row bg-error/10 p-4 rounded-2xl mb-6 items-center border border-error/20">
                        <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                        <Text className="text-error text-sm font-bold flex-1 ml-3">{error}</Text>
                    </View>
                ) : null}

                <View style={{ marginTop: error ? 10 : 0 }}>
                    {step === 1 && (
                        <Animated.View entering={FadeInDown.duration(400)}>
                            <Input
                                control={control}
                                name="email"
                                label="Email Address"
                                placeholder="you@example.com"
                                icon="mail-outline"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </Animated.View>
                    )}

                    {step === 2 && (
                        <Animated.View entering={FadeInDown.duration(400)}>
                            <Input
                                control={control}
                                name="otp"
                                label="OTP"
                                placeholder="Enter OTP"
                                icon="key-outline"
                                keyboardType="numeric"
                            />
                        </Animated.View>
                    )}

                    {step === 3 && (
                        <Animated.View entering={FadeInDown.duration(400)}>
                            <Input
                                control={control}
                                name="password"
                                label="New Password"
                                placeholder="••••••••"
                                icon="lock-closed-outline"
                                isPassword
                            />
                            <Input
                                control={control}
                                name="confirmPassword"
                                label="Confirm Password"
                                placeholder="••••••••"
                                icon="lock-closed-outline"
                                isPassword
                            />
                        </Animated.View>
                    )}

                    <Button
                        label={step === 1 ? "Send OTP" : step === 2 ? "Verify OTP" : "Reset Password"}
                        onPress={step === 1 ? handleGenerateOTP : step === 2 ? handleVerifyOTP : handleResetPassword}
                        loading={loading}
                        icon="arrow-forward"
                        style={{ marginTop: 8 }}
                    />
                </View>

                <View className="flex-row justify-center items-center mt-8 pt-6 border-t border-border">
                    <TouchableOpacity
                        onPress={() => { step === 1 ? router.replace("/login") : setStep((prev) => (prev - 1) as any) }}
                        className="flex-row items-center"
                    >
                        <Ionicons name="arrow-back" size={16} color="#64748b" style={{ marginRight: 4 }} />
                        <Text className="text-xs text-textMuted font-extrabold uppercase tracking-widest">{step === 1 ? "Back to Sign In" : "Back"}</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}