import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GestureModal from '../GestureModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (pin: string) => void;
}

export default function LoginPinModal({ visible, onClose, onSubmit }: Props) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    // Clear state when modal becomes visible
    useEffect(() => {
        if (visible) {
            setPin('');
            setError('');
        }
    }, [visible]);

    const handleSubmit = () => {
        if (pin.length !== 6) {
            setError('PIN must be exactly 6 digits');
            return;
        }
        setError('');
        onSubmit(pin);
    };

    return (
        <GestureModal visible={visible} onClose={onClose}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Enter App PIN</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subtitle}>
                            Enter your 6-digit MuftiPay PIN to securely sign in.
                        </Text>

                        {!!error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}

                        <TextInput
                            style={styles.input}
                            value={pin}
                            onChangeText={setPin}
                            keyboardType="number-pad"
                            secureTextEntry
                            maxLength={6}
                            autoFocus
                            placeholder="••••••"
                            placeholderTextColor="#9CA3AF"
                        />

                        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
        </GestureModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 48,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
    },
    errorText: {
        color: '#DC2626',
        marginBottom: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 16,
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 12,
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
