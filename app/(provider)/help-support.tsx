import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import configs from "../../app.json"

// You can edit these details as needed
const APP_NAME = configs.expo.name || "Data Padi";
const APP_VERSION = configs.expo.version || "1.0.0";
const SUPPORT_EMAIL = "support@muftipay.com";
const SUPPORT_PHONE = "+234 800 123 4567";
const WEBSITE_URL = "https://data-padi.vercel.app";
const LOGO_SRC = require("../../assets/images/mufti-icon.png");

export default function HelpSupportScreen() {
    const router = useRouter();

    const handleEmailSupport = () => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
    };

    const handleCallSupport = () => {
        Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`);
    };

    const handleWebsite = () => {
        Linking.openURL(WEBSITE_URL);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* App Info Section */}
                <View style={styles.appInfoSection}>
                    <Image source={LOGO_SRC} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.appName}>{APP_NAME}</Text>
                    <Text style={styles.tagline}>We're here to help you</Text>
                </View>

                {/* Contact Options */}
                <Text style={styles.sectionTitle}>CONTACT US</Text>

                <View style={styles.contactCard}>
                    <TouchableOpacity style={styles.contactRow} onPress={handleEmailSupport}>
                        <View style={[styles.iconBox, { backgroundColor: "#E0E7FF" }]}>
                            <Ionicons name="mail-outline" size={20} color="#4F46E5" />
                        </View>
                        <View style={styles.contactDetails}>
                            <Text style={styles.contactLabel}>Email Support</Text>
                            <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.contactRow} onPress={handleCallSupport}>
                        <View style={[styles.iconBox, { backgroundColor: "#DCFCE7" }]}>
                            <Ionicons name="call-outline" size={20} color="#16A34A" />
                        </View>
                        <View style={styles.contactDetails}>
                            <Text style={styles.contactLabel}>Phone Support</Text>
                            <Text style={styles.contactValue}>{SUPPORT_PHONE}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
                        <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
                            <Ionicons name="globe-outline" size={20} color="#D97706" />
                        </View>
                        <View style={styles.contactDetails}>
                            <Text style={styles.contactLabel}>Website</Text>
                            <Text style={styles.contactValue}>{WEBSITE_URL}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </TouchableOpacity>
                </View>

                {/* FAQ Section */}
                {/* <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
                <View style={styles.faqCard}>
                    <TouchableOpacity style={styles.faqRow}>
                        <Text style={styles.faqText}>How do I fund my wallet?</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.faqRow}>
                        <Text style={styles.faqText}>I forgot my transaction PIN</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.faqRow}>
                        <Text style={styles.faqText}>Transaction failed but I was debited</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View> */}

                {/* Social Links placeholder */}
                {/* <View style={styles.socialSection}>
                    <TouchableOpacity style={styles.socialBtn}>
                        <Ionicons name="logo-x" size={24} color="#1DA1F2" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn}>
                        <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn}>
                        <Ionicons name="logo-instagram" size={24} color="#E1306C" />
                    </TouchableOpacity>
                </View> */}

                {/* Dynamic empty space */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Version Footer */}
            <View style={styles.footer}>
                <Text style={styles.versionText}>Version {APP_VERSION}</Text>
                <Text style={styles.copyrightText}>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    appInfoSection: {
        alignItems: "center",
        marginVertical: 30,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 24,
        marginBottom: 16,
    },
    appName: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    tagline: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#6B7280",
        marginTop: 24,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    contactCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    contactDetails: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 13,
        color: "#6B7280",
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginHorizontal: 12,
    },
    faqCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    faqRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    faqText: {
        fontSize: 14,
        color: "#374151",
        fontWeight: "500",
        flex: 1,
        paddingRight: 16,
    },
    socialSection: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 32,
        gap: 20,
    },
    socialBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    footer: {
        paddingVertical: 20,
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    versionText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 12,
        color: "#9CA3AF",
    },
});
