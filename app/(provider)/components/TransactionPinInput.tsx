import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Animated, Platform, Text, Keyboard } from 'react-native';

type Props = {
    onComplete: (pin: string) => void;
    error?: boolean;
    clearError?: () => void;
    isLoading?: boolean;
};

const TransactionPinInput: React.FC<Props> = ({ onComplete, error, clearError, isLoading }) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [toastMessage, setToastMessage] = useState('');
    const inputRefs = useRef<Array<TextInput | null>>([]);
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    // Setup refs
    if (inputRefs.current.length !== 4) {
        inputRefs.current = Array(4).fill(null);
    }

    useEffect(() => {
        if (error) {
            // Trigger error shake animation
            Animated.sequence([
                Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
            ]).start(() => {
                // Clear inputs after animation
                setPin(['', '', '', '']);
                inputRefs.current[0]?.focus();
            });

            // Show toast
            setToastMessage('Incorrect Transaction PIN');
            const timer = setTimeout(() => {
                setToastMessage('');
                if (clearError) clearError();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, shakeAnimation, clearError]);

    const handleChange = (text: string, index: number) => {
        // Only allow numbers
        if (/^[0-9]$/.test(text) || text === '') {
            if (clearError && text !== '') clearError();
            if (text !== '') setToastMessage('');

            const newPin = [...pin];
            newPin[index] = text;
            setPin(newPin);

            // Auto-focus next input
            if (text !== '' && index < 3) {
                inputRefs.current[index + 1]?.focus();
            }

            // If completing the 4th digit
            if (text !== '' && index === 3) {
                Keyboard.dismiss();
                const pinString = newPin.join('');
                // Give a tiny delay so the UI updates the dot before executing
                setTimeout(() => {
                    onComplete(pinString);
                }, 100);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Handling backspace on empty input to move to previous
        if (e.nativeEvent.key === 'Backspace' && pin[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            {toastMessage ? (
                <View style={styles.toastContainer}>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </View>
            ) : null}
            <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                {pin.map((digit, index) => (
                    <TextInput
                        key={index}
                        style={[
                            styles.input,
                            error ? styles.inputError : null,
                            digit && !error ? styles.inputFilled : null
                        ]}
                        secureTextEntry={true}
                        ref={(ref) => {
                            inputRefs.current[index] = ref;
                        }}
                        value={digit}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        editable={!isLoading}
                    />
                ))}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '100%',
        marginVertical: 20,
        position: 'relative',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
    },
    input: {
        width: 60,
        height: 70,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        textAlign: 'center',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    inputFilled: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
        color: '#EF4444',
    },
    toastContainer: {
        position: 'absolute',
        top: -50,
        backgroundColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    toastText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    }
});

export default TransactionPinInput;
