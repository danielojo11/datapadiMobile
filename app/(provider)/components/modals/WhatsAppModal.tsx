import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface WhatsAppModalProps {
    visible: boolean;
    onClose: () => void;
}

const WHATSAPP_LINK = "https://www.whatsapp.com/channel/0029VbCf47mEVccML0Ixyp21";

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ visible, onClose }) => {
    const handleJoin = async () => {
        try {
            await Linking.openURL(WHATSAPP_LINK);
            onClose();
        } catch (error) {
            console.error("Failed to open WhatsApp link:", error);
        }
    };

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
                        colors={['#25D366', '#128C7E']}
                        style={styles.gradientHeader}
                    >
                        <View style={styles.iconCircle}>
                            <Ionicons name="logo-whatsapp" size={40} color="#FFF" />
                        </View>
                    </LinearGradient>

                    <View style={styles.content}>
                        <Text style={styles.title}>Join Our Channel!</Text>
                        <Text style={styles.description}>
                            Get real-time updates, exclusive offers, and the latest news directly on your WhatsApp. Don't miss out!
                        </Text>

                        <TouchableOpacity style={styles.joinButton} onPress={handleJoin} activeOpacity={0.8}>
                            <Text style={styles.joinButtonText}>Join Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.6}>
                            <Text style={styles.closeButtonText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

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
    joinButton: {
        width: '100%',
        backgroundColor: '#25D366',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    joinButtonText: {
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

export default WhatsAppModal;
