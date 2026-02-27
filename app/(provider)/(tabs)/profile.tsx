import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getProfileData } from "@/app/utils/user";
import { initializeGatewayFunding } from "@/app/utils/payment";
import { AuthContext } from "@/app/context/AppContext";
import ActionRequired from "../components/drawers/ActionRequired";
import WebScreen from "../components/WebViewer";

const CURRENCY = "₦";

interface Profile {
  fullName: string;
  email: string;
  isKycVerified: boolean;
  kycData?: {
    status: string;
    virtualAccountNumber?: string;
    bankName?: string;
  };
  walletBalance?: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const authState = useContext(AuthContext);

  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [warningModalVisisbility, setWarningModalVisibility] = useState(false);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [fundingAmount, setFundingAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfileData();
        if (!response) {
          console.log("Profile fetch failed");
          return;
        }
        setProfileData(response.data);
      } catch (error) {
        console.log("Profile screen error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleCopyAccount = async () => {
    const acc = profileData?.kycData?.virtualAccountNumber;
    if (acc) {
      await Clipboard.setStringAsync(acc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFundWithCard = async () => {
    const amount = Number(fundingAmount);
    if (!fundingAmount || isNaN(amount) || amount < 100) {
      setError(`Minimum funding amount is ${CURRENCY}100`);
      return;
    }

    setIsFunding(true);
    setError("");

    try {
      const result: any = await initializeGatewayFunding(amount);
      if (result && result.paymentLink) {
        setWebViewUrl(result.paymentLink);
        setWebViewVisible(true);
        setFundingAmount("");
      } else {
        setError(result?.error || "Could not initialize payment");
      }
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setIsFunding(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            if (authState?.logout) {
              authState.logout();
            } else {
              await AsyncStorage.removeItem("login_obj");
              await AsyncStorage.setItem("isAuthenticated", JSON.stringify(false));
              router.replace("/login");
            }
          } catch (e) {
            console.log("Logout failed", e);
          }
        },
      },
    ]);
  };

  if (loading || !profileData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const firstLetter = profileData.fullName?.charAt(0)?.toUpperCase() || "?";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ActionRequired
        visible={warningModalVisisbility}
        onClose={() => setWarningModalVisibility(false)}
      />
      <WebScreen
        url={webViewUrl}
        visible={webViewVisible}
        onClose={() => setWebViewVisible(false)}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Profile Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
            {profileData.isKycVerified && (
              <View style={styles.verifiedBadgeContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              </View>
            )}
          </View>

          <Text style={styles.fullName}>{profileData.fullName}</Text>
          <Text style={styles.emailText}>{profileData.email}</Text>

          <TouchableOpacity
            disabled={profileData.isKycVerified}
            onPress={() => !profileData.isKycVerified && setWarningModalVisibility(true)}
            style={[
              styles.kycButton,
              profileData.isKycVerified ? styles.kycVerified : styles.kycPending,
            ]}
          >
            {profileData.isKycVerified ? (
              <>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.kycVerifiedText}>KYC Verified</Text>
              </>
            ) : (
              <>
                <Ionicons name="alert-circle" size={14} color="#F97316" />
                <Text style={styles.kycPendingText}>Action Required: Verify Identity</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Wallet Funding Section */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Ionicons name="wallet-outline" size={18} color="#DBEAFE" />
            <Text style={styles.walletHeaderText}>ADD MONEY</Text>
          </View>

          {profileData.isKycVerified && profileData.kycData?.virtualAccountNumber ? (
            <View>
              <Text style={styles.bankTransferLabel}>BANK TRANSFER DETAILS</Text>
              <View style={styles.bankTransferBox}>
                <View>
                  <Text style={styles.accountNumberText}>{profileData.kycData.virtualAccountNumber}</Text>
                  <Text style={styles.bankNameText}>
                    {profileData.kycData.bankName} • DATA PADI {profileData.fullName}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCopyAccount} style={styles.copyBtn}>
                  {copied ? (
                    <Ionicons name="checkmark-circle" size={20} color="#86EFAC" />
                  ) : (
                    <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.fundSubtitle}>Fund via Card or USSD instantly.</Text>

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={14} color="#FCA5A5" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>{CURRENCY}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={fundingAmount}
                  onChangeText={setFundingAmount}
                  placeholder="Min 100"
                  placeholderTextColor="rgba(147, 197, 253, 0.5)"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.fundButton, isFunding && styles.fundButtonDisabled]}
                disabled={isFunding}
                onPress={handleFundWithCard}
                activeOpacity={0.8}
              >
                {isFunding ? (
                  <Text style={styles.fundButtonText}>Processing...</Text>
                ) : (
                  <>
                    <Ionicons name="open-outline" size={18} color="#1D4ED8" />
                    <Text style={styles.fundButtonText}>Pay with Flutterwave</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Settings & Links Menu */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <View style={styles.settingsIconBox}>
                <Ionicons name="shield-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.settingsItemText}>Security & Passwords</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <View style={styles.settingsIconBox}>
                <Ionicons name="notifications-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.settingsItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <View style={styles.settingsIconBox}>
                <Ionicons name="help-circle-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.settingsItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 4. Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 16,
    color: "#6B7280",
    fontWeight: "500",
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 96,
  },

  // Header
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#1A1A1A", // Approximate linear gradient
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },
  verifiedBadgeContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fullName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 16,
  },
  kycButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  kycVerified: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  kycPending: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  kycVerifiedText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "700",
  },
  kycPendingText: {
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "700",
  },

  // Wallet
  walletCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  walletHeaderText: {
    color: "#DBEAFE",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bankTransferLabel: {
    fontSize: 12,
    color: "#BFDBFE",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  bankTransferBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  accountNumberText: {
    fontSize: 24,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
    color: "#FFFFFF",
  },
  bankNameText: {
    fontSize: 12,
    color: "#BFDBFE",
    fontWeight: "500",
  },
  copyBtn: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  fundSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    color: "#DBEAFE",
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#FEE2E2",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  amountInputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    paddingHorizontal: 16,
    fontWeight: "700",
    fontSize: 20,
    color: "#DBEAFE",
  },
  amountInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    height: "100%",
    paddingVertical: 8,
  },
  fundButton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fundButtonDisabled: {
    opacity: 0.5,
  },
  fundButtonText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "700",
  },

  // Settings Menu
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    paddingHorizontal: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  settingsGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 24,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsItemText: {
    fontWeight: "600",
    color: "#1F2937",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#F9FAFB",
  },

  // Logout
  logoutButton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
});
