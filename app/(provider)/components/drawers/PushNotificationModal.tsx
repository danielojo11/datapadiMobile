import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    visible: boolean;
    onClose: () => void;
    onAllow: () => void;
}

export default function PushNotificationModal({ visible, onClose, onAllow }: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <LinearGradient
                        colors={['#2563EB', '#1D4ED8']}
                        style={styles.gradientHeader}
                    >
                        <View style={styles.iconCircle}>
                            <Ionicons name="notifications" size={40} color="#FFF" />
                        </View>
                    </LinearGradient>

                    <View style={styles.content}>
                        <Text style={styles.title}>Enable Notifications</Text>
                        <Text style={styles.description}>
                            Stay in the loop! Turn on push notifications to receive real-time alerts for your transactions, wallet funding, and updates.
                        </Text>

                        <TouchableOpacity style={styles.allowButton} onPress={onAllow} activeOpacity={0.8}>
                            <Text style={styles.allowButtonText}>Turn On Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.6}>
                            <Text style={styles.closeButtonText}>Not Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    gradientHeader: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    allowButton: {
        width: '100%',
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    allowButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    closeButton: {
        paddingVertical: 8,
    },
    closeButtonText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
});
