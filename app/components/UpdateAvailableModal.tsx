import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUpdateContext } from '../hooks/useUpdateContext'; // We'll create this or just import context directly.
import { UpdateContext } from '../context/UpdateContext';

export default function UpdateAvailableModal() {
    const { downloaded, applyUpdate, error } = React.useContext(UpdateContext);
    const [dismissed, setDismissed] = React.useState(false);

    if (!downloaded || dismissed) {
        return null;
    }

    const handleRestart = async () => {
        await applyUpdate();
    };

    const handleLater = () => {
        setDismissed(true);
    };

    return (
        <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={handleLater}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBackground}>
                            <Ionicons 
                                name="cloud-done-outline" 
                                size={56} 
                                color="#2563EB" 
                            />
                        </View>
                    </View>

                    <Text style={styles.title}>Update Available</Text>
                    
                    <Text style={styles.subtitle}>
                        A new version has been downloaded and is ready to install.
                    </Text>
                    
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    <TouchableOpacity style={styles.updateButton} onPress={handleRestart}>
                        <Text style={styles.updateButtonText}>Restart Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
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
    errorText: {
        color: '#DC2626',
        fontSize: 12,
        marginBottom: 16,
        textAlign: 'center',
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
