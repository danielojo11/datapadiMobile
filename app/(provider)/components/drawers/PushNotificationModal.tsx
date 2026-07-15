import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GestureModal from '../GestureModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    onAllow: () => void;
}

export default function PushNotificationModal({ visible, onClose, onAllow }: Props) {
    return (
        <GestureModal visible={visible} onClose={onClose}>
            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconBackground}>
                        <Ionicons name="notifications-circle-outline" size={64} color="#2563EB" />
                    </View>
                </View>

                <Text style={styles.title}>Turn on Notifications</Text>
                <Text style={styles.subtitle}>
                    Stay updated! Get instant alerts on your transactions, wallet funding, and exclusive rewards.
                </Text>

                <TouchableOpacity style={styles.allowButton} onPress={onAllow}>
                    <Text style={styles.allowButtonText}>Enable Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                    <Text style={styles.skipButtonText}>Not Now</Text>
                </TouchableOpacity>
            </View>
        </GestureModal>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 48,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconBackground: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    allowButton: {
        backgroundColor: '#2563EB',
        width: '100%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    allowButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    skipButton: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    skipButtonText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '700',
    },
});
