import React from "react";
import { StyleSheet, Modal, View, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

interface WebScreenProps {
    url: string;
    visible: boolean;
    onClose: () => void;
}

export default function WebScreen({ url, visible, onClose }: WebScreenProps) {
    if (!url) return null;

    return (
        <SafeAreaView style={styles.container}>
            <Modal
                visible={visible}
                animationType="slide"
                onRequestClose={onClose}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Secure Payment</Text>
                    <View style={{ width: 24 }} />
                </View>
                <WebView
                    source={{ uri: url }}
                    style={styles.webview}
                />
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    webview: {
        flex: 1,
    },
});