import React, { useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resetTransactionPin } from "@/app/utils/auth/resetPin";

interface ResetPinModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ResetPinModal({ visible, onClose }: ResetPinModalProps) {
    const [password, setPassword] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [showPassword, setShowPassword] = useState(false);

    const handleResetPin = async () => {
        setError(null);
        setSuccess(null);

        if (!password) {
            setError("Please enter your current login password.");
            return;
        }
        if (!newPin || newPin.length !== 4) {
            setError("New PIN must be exactly 4 digits.");
            return;
        }
        if (newPin !== confirmPin) {
            setError("PINs do not match. Please try again.");
            return;
        }

        try {
            setLoading(true);
            const res = await resetTransactionPin({ password, newPin });
            if (res?.status === "OK" || res?.message) {
                setSuccess(res.message || "Transaction PIN successfully updated.");
                setPassword("");
                setNewPin("");
                setConfirmPin("");
                setTimeout(() => {
                    onClose();
                    setSuccess(null);
                }, 2000);
            }
        } catch (err: any) {
            setError(err?.message || "Failed to reset PIN. Please check your password and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setSuccess(null);
        setPassword("");
        setNewPin("");
        setConfirmPin("");
        onClose();
    };

    const isFormValid = password.length > 0 && newPin.length === 4 && confirmPin.length === 4;

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <View style={styles.handle} />

                        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                            <Ionicons name="close" size={18} color="#555" />
                        </TouchableOpacity>

                        <View style={styles.iconWrapper}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="key-outline" size={32} color="#fff" />
                            </View>
                        </View>

                        <Text style={styles.title}>Change Transaction PIN</Text>
                        <Text style={styles.subtitle}>
                            Set a new 4-digit PIN for securing your transactions. You must verify your main login password to proceed.
                        </Text>

                        {error && (
                            <View style={[styles.messageBox, styles.errorBox]}>
                                <Ionicons name="alert-circle-outline" size={18} color="#E53935" style={{ marginRight: 8 }} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {success && (
                            <View style={[styles.messageBox, styles.successBox]}>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#059669" style={{ marginRight: 8 }} />
                                <Text style={styles.successText}>{success}</Text>
                            </View>
                        )}

                        <Text style={styles.label}>Login Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter current password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.inputHalf}>
                                <Text style={styles.label}>New PIN</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="key-outline" size={18} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="4 digits"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        maxLength={4}
                                        value={newPin}
                                        onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, ''))}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.inputHalf}>
                                <Text style={styles.label}>Confirm PIN</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="key-outline" size={18} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="4 digits"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        maxLength={4}
                                        value={confirmPin}
                                        onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, ''))}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={[
                                styles.primaryButton,
                                (!isFormValid || loading) && styles.primaryButtonDisabled,
                            ]}
                            disabled={!isFormValid || loading}
                            onPress={handleResetPin}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Set New PIN</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
        minHeight: "100%",
    },
    container: {
        backgroundColor: "#F4F5F7",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    handle: {
        width: 45,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#D1D5DB",
        alignSelf: "center",
        marginVertical: 12,
    },
    closeBtn: {
        position: "absolute",
        right: 20,
        top: 12,
        backgroundColor: "#FFFFFF",
        padding: 8,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    iconWrapper: {
        alignItems: "center",
        marginTop: 10,
        marginBottom: 15,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#1D4ED8",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 6,
        borderColor: "#E0E7FF",
    },
    title: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    subtitle: {
        textAlign: "center",
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    messageBox: {
        flexDirection: "row",
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: "center",
    },
    errorBox: {
        backgroundColor: "#FEE2E2",
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 13,
        flex: 1,
    },
    successBox: {
        backgroundColor: "#D1FAE5",
    },
    successText: {
        color: "#047857",
        fontSize: 13,
        flex: 1,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    inputHalf: {
        width: "48%",
    },
    label: {
        fontSize: 13,
        fontWeight: "500",
        marginBottom: 6,
        color: "#374151",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 50,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: "#111827",
        letterSpacing: 2,
    },
    primaryButton: {
        width: "100%",
        height: 56,
        backgroundColor: "#2563EB",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },
    primaryButtonDisabled: {
        backgroundColor: "#8A8F98",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
