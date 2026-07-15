import React, { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Input from "./components/ui/Input";
import Button from "./components/ui/Button";
import { registerUser, validateReferralCode } from "./utils/auth/register";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Animated, { FadeInDown } from "react-native-reanimated";

const signupSchema = z.object({
  username: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email address"),
  referralCode: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  transactionPin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits").optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function CreateAccountScreen() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [referrerName, setReferrerName] = useState("");
    const [isValidatingReferral, setIsValidatingReferral] = useState(false);
    const [referralError, setReferralError] = useState("");

    const router = useRouter();

    const { control, handleSubmit, watch, trigger, setValue } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            username: "",
            phone: "",
            email: "",
            referralCode: "",
            password: "",
            confirmPassword: "",
            transactionPin: "",
        },
    });

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

    const handleNextStep = async () => {
        const isValid = await trigger(["username", "phone", "email", "password", "confirmPassword"]);
        if (isValid) {
            setError("");
            setStep(2);
        }
    };

    const onSubmit = async (data: SignupFormValues) => {
        if (!data.transactionPin || data.transactionPin.length !== 4) {
            setError("Transaction PIN must be 4 digits.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await registerUser({
                userName: data.username,
                email: data.email,
                phoneNumber: data.phone,
                password: data.password,
                transactionPin: data.transactionPin,
                referralCode: data.referralCode || "",
            });

            if (response && response.success) {
                router.push("/login");
            } else {
                setError(response?.error || 'Registration failed. Please try again.');
            }
        } catch (err: any) {
            setError(err?.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 40, paddingHorizontal: 16 }}>
                    <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center mb-10">
                        <Text className="text-4xl font-black text-text tracking-tighter mb-2 text-center">
                            {step === 1 ? "Create Account" : "Create PIN"}
                        </Text>
                        <Text className="text-xs font-bold text-textMuted uppercase tracking-[1.5px] text-center">
                            {step === 1 ? "Fast, Secure & Automated" : "Secure your transactions"}
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} className="bg-card rounded-[32px] p-8 shadow-2xl shadow-black/50 border border-border">
                        {error ? (
                            <View className="flex-row bg-error/10 p-4 rounded-2xl mb-6 items-center border border-error/20">
                                <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                                <Text className="text-error text-sm font-bold flex-1 ml-3">{error}</Text>
                            </View>
                        ) : null}

                        {step === 1 ? (
                            <Animated.View entering={FadeInDown.duration(400)}>
                                <Input control={control} name="username" label="Full Name" placeholder="John Doe" icon="person-outline" />
                                <Input control={control} name="phone" label="Phone Number" placeholder="08012345678" icon="call-outline" keyboardType="numeric" />
                                <Input control={control} name="email" label="Email Address" placeholder="you@example.com" icon="mail-outline" keyboardType="email-address" autoCapitalize="none" />
                                
                                <View className="mb-4">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-textMuted font-bold uppercase tracking-widest text-xs">Referral Code (Optional)</Text>
                                        {isValidatingReferral && <Text className="text-primary text-xs font-bold">Validating...</Text>}
                                    </View>
                                    <Input 
                                        control={control} 
                                        name="referralCode" 
                                        label="" 
                                        placeholder="ABCDEF" 
                                        icon="people-outline" 
                                        autoCapitalize="characters" 
                                        maxLength={6} 
                                        onChangeText={(text: string) => {
                                            const formatted = text.toUpperCase().trim();
                                            setValue("referralCode", formatted);
                                            if (formatted.length === 6) {
                                                handleValidateReferral(formatted);
                                            } else {
                                                setReferrerName("");
                                                setReferralError("");
                                            }
                                        }}
                                    />
                                    {referrerName ? (
                                        <Text className="text-[#10B981] text-xs font-bold mt-[-10px] ml-1"><Ionicons name="checkmark-circle" size={12} /> Referred by {referrerName}</Text>
                                    ) : referralError ? (
                                        <Text className="text-error text-xs font-bold mt-[-10px] ml-1"><Ionicons name="alert-circle" size={12} /> {referralError}</Text>
                                    ) : null}
                                </View>

                                <Input control={control} name="password" label="Password" placeholder="••••••••" icon="lock-closed-outline" isPassword />
                                <Input control={control} name="confirmPassword" label="Confirm Password" placeholder="••••••••" icon="lock-closed-outline" isPassword />
                                
                                <Button label="Next" onPress={handleNextStep} icon="arrow-forward" style={{ marginTop: 16 }} />
                                
                                <View className="flex-row justify-center items-center mt-8 pt-6 border-t border-border">
                                    <Text className="text-sm text-textMuted font-medium">Already have an account? </Text>
                                    <TouchableOpacity onPress={() => router.push("/login")}>
                                        <Text className="text-sm font-black text-primary">Log in</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        ) : (
                            <Animated.View entering={FadeInDown.duration(400)}>
                                <View className="bg-background p-6 rounded-3xl border border-border mb-6 items-center">
                                    <Text className="text-sm font-bold text-text mb-2">Set Transaction PIN</Text>
                                    <Text className="text-xs text-textMuted text-center mb-6">You will use this 4-digit PIN to confirm airtime, data, and bill payments.</Text>
                                    <Input 
                                        control={control} 
                                        name="transactionPin" 
                                        label="" 
                                        placeholder="••••" 
                                        icon="keypad-outline" 
                                        keyboardType="number-pad" 
                                        isPassword 
                                        maxLength={4}
                                    />
                                </View>
                                
                                <Button label="Create My Account" onPress={handleSubmit(onSubmit)} loading={loading} icon="arrow-forward" />
                                
                                <View className="flex-row justify-center items-center mt-8 pt-6 border-t border-border">
                                    <TouchableOpacity onPress={() => setStep(1)} className="flex-row items-center">
                                        <Ionicons name="arrow-back" size={16} color="#64748b" style={{ marginRight: 4 }} />
                                        <Text className="text-xs text-textMuted font-extrabold uppercase tracking-widest">BACK</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
