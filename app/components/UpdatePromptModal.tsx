import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';

interface Props {
    visible: boolean;
    onClose: () => void;
    type: 'STORE' | 'OTA';
    latestVersion?: string;
}

export default function UpdatePromptModal({ visible, onClose, type, latestVersion }: Props) {
    const handleUpdate = async () => {
        if (type === 'OTA') {
            await Updates.reloadAsync();
        } else {
            const url = Platform.OS === 'android'
                ? 'https://play.google.com/store/apps/details?id=com.daniel_ojo.datapadi'
                : 'https://play.google.com/store/apps/details?id=com.daniel_ojo.datapadi'; // Replace when iOS is ready
            
            Linking.canOpenURL(url).then(supported => {
                if (supported) {
                    Linking.openURL(url);
                }
            });
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                            <Ionicons 
                                name={type === 'OTA' ? "cloud-download-outline" : "logo-google-playstore"} 
                                size={56} 
                                color="#2563EB" 
                            />
                        </View>
                    </View>

                    <Text style={styles.title}>
                        {type === 'OTA' ? 'Update Ready' : 'Update Available'}
                    </Text>
                    
                    <Text style={styles.subtitle}>
                        {type === 'OTA' 
                            ? 'A new version of the app has been downloaded. Restart the app to apply the latest features and fixes.'
                            : `A new version ${latestVersion ? `(${latestVersion}) ` : ''}of MUFTI PAY is available on the store. Please update for the best experience.`
                        }
                    </Text>

                    <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                        <Text style={styles.updateButtonText}>
                            {type === 'OTA' ? 'Restart App' : 'Update Now'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                        <Text style={styles.laterButtonText}>Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(17,24,39,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconBackground: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
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
        lineHeight: 22,
    },
    updateButton: {
        backgroundColor: '#2563EB',
        width: '100%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    laterButton: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    laterButtonText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '700',
    },
});
