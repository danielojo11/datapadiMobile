import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { getReferralStats, ReferralStatsData, Commission, Cashback, ReferralReward } from "@/app/utils/referral";
import { getRewardsDashboard, getMilestones, claimMilestone, RewardsDashboardData, MilestoneData } from "@/app/utils/rewards";
import ConvertRewardsModal from "./components/modals/ConvertRewardsModal";

const CURRENCY = "₦";

type TabType = 'REWARDS' | 'COMMISSIONS' | 'CASHBACK' | 'MILESTONES';

export default function ReferralsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statsData, setStatsData] = useState<ReferralStatsData | null>(null);
    const [dashboardData, setDashboardData] = useState<RewardsDashboardData | null>(null);
    const [milestones, setMilestones] = useState<MilestoneData[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('REWARDS');
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [isConvertModalVisible, setConvertModalVisible] = useState(false);
    const [claimingId, setClaimingId] = useState<string | null>(null);

    const loadStats = async () => {
        try {
            const [statsRes, dashboardRes, milestonesRes] = await Promise.all([
                getReferralStats(),
                getRewardsDashboard(),
                getMilestones()
            ]);

            if (statsRes.success && statsRes.data) {
                setStatsData(statsRes.data);
            }
            if (dashboardRes.success && dashboardRes.data) {
                setDashboardData(dashboardRes.data);
            }
            if (milestonesRes.success && milestonesRes.data) {
                setMilestones(milestonesRes.data);
            }
        } catch (error) {
            console.log("Error loading referral stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimMilestone = async (key: string) => {
        setClaimingId(key);
        try {
            const response = await claimMilestone(key);
            if (response.success) {
                await loadStats();
            } else {
                alert(response.error || "Failed to claim milestone");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setClaimingId(null);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    }, []);

    const handleCopyCode = async () => {
        if (statsData?.overview?.referralCode) {
            await Clipboard.setStringAsync(statsData.overview.referralCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    const handleCopyLink = async () => {
        if (statsData?.overview?.referralCode) {
            const link = `https://muftipay.com/auth/register?code=${statsData.overview.referralCode}`;
            await Clipboard.setStringAsync(link);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    const renderEmptyState = (message: string) => (
        <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{message}</Text>
        </View>
    );

    const renderHistoryItem = (item: any, isReward: boolean) => {
        const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        return (
            <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                    <View style={[styles.iconContainer, isReward ? styles.iconReward : styles.iconCommission]}>
                        <Ionicons name={isReward ? "gift" : "cash"} size={20} color={isReward ? "#4F46E5" : "#059669"} />
                    </View>
                    <View>
                        <Text style={styles.historyTitle} >
                            {item.note?.split(" ")[0] || "Reward"}
                        </Text>
                        <Text style={styles.historyDate}>{formattedDate}</Text>
                    </View>
                </View>
                <Text style={[styles.historyAmount, isReward ? styles.amountReward : styles.amountCommission]}>
                    +{CURRENCY}{item.amount?.toLocaleString() || "0"}
                </Text>
            </View>
        );
    };

    const renderMilestoneItem = (item: MilestoneData) => {
        const progressPercent = Math.min(100, Math.max(0, (item.progress / item.target) * 100));
        
        return (
            <View key={item.key} style={styles.historyCard}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={[styles.historyDate, { marginBottom: 8 }]}>{item.description}</Text>
                    
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{item.progress} / {item.target} completed</Text>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.milestoneAmount}>+{CURRENCY}{item.amount}</Text>
                    {item.isClaimed ? (
                        <View style={styles.claimedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#059669" />
                            <Text style={styles.claimedText}>Claimed</Text>
                        </View>
                    ) : item.isEligible ? (
                        <TouchableOpacity 
                            style={styles.claimBtn}
                            onPress={() => handleClaimMilestone(item.key)}
                            disabled={claimingId === item.key}
                        >
                            {claimingId === item.key ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.claimBtnText}>Claim</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.lockedBadge}>
                            <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                            <Text style={styles.lockedText}>Locked</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading && !statsData) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading rewards data...</Text>
            </SafeAreaView>
        );
    }

    // Default fallbacks in case endpoint is failing initially
    const overview = statsData?.overview || {
        referralCode: "-------",
        totalReferrals: 0,
        bonusBalance: 0,
        totalBonusEarned: 0,
    };

    const displayBonusBalance = dashboardData?.bonusBalance ?? overview.bonusBalance;
    const displayTotalEarned = dashboardData?.totalEarned ?? overview.totalBonusEarned;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rewards & Referrals</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Balances Section */}
                <View style={styles.balanceGrid}>
                    <View style={styles.balanceCard}>
                        <TouchableOpacity style={styles.withdrawBtn} onPress={() => setConvertModalVisible(true)}>
                            <Text style={styles.withdrawText}>Withdraw</Text>
                        </TouchableOpacity>
                        <Text style={styles.balanceLabel}>BONUS BALANCE</Text>
                        <Text style={styles.balanceAmount}>{CURRENCY}{displayBonusBalance?.toLocaleString() || "0"}</Text>
                    </View>

                    <View style={[styles.balanceCard, styles.totalEarnedCard]}>
                        <View style={styles.totalIconBox}>
                            <Ionicons name="trending-up" size={14} color="#047857" />
                        </View>
                        <Text style={[styles.balanceLabel, styles.textGreen]}>TOTAL EARNED</Text>
                        <Text style={[styles.balanceAmount, styles.textGreen]}>{CURRENCY}{displayTotalEarned?.toLocaleString() || "0"}</Text>
                    </View>
                </View>

                {/* Share Section */}
                <View style={styles.shareCard}>
                    <View style={styles.shareHeader}>
                        <Ionicons name="share-social-outline" size={20} color="#4F46E5" />
                        <Text style={styles.shareTitle}>Share & Earn</Text>
                    </View>
                    <Text style={styles.shareSubtitle}>Invite friends and earn a bonus when they sign up and start transacting.</Text>

                    <View style={styles.codeContainer}>
                        <View style={styles.codeLeft}>
                            <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                            <Text style={styles.codeValue}>{overview.referralCode}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                            <Ionicons name={copiedCode ? "checkmark" : "copy-outline"} size={20} color={copiedCode ? "#10B981" : "#4F46E5"} />
                            <Text style={[styles.copyButtonText, copiedCode && styles.textGreen]}>{copiedCode ? "Copied" : "Copy"}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.linkContainer}>
                        <View style={styles.codeLeft}>
                            <Text style={styles.codeLabel}>YOUR LINK</Text>
                            <Text style={styles.linkValue} numberOfLines={1}>muftipay.com/auth/register?code={overview.referralCode}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                            <Ionicons name={copiedLink ? "checkmark" : "copy-outline"} size={20} color={copiedLink ? "#10B981" : "#4F46E5"} />
                            <Text style={[styles.copyButtonText, copiedLink && styles.textGreen]}>{copiedLink ? "Copied" : "Copy"}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.totalReferralsBox}>
                        <Text style={styles.totalRefLabel}>TOTAL REFERRALS</Text>
                        <Text style={styles.totalRefValue}>{overview.totalReferrals}</Text>
                    </View>
                </View>

                {/* History Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'REWARDS' && styles.activeTab]}
                            onPress={() => setActiveTab('REWARDS')}
                        >
                            <Text style={[styles.tabText, activeTab === 'REWARDS' && styles.activeTabText]}>Rewards</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'COMMISSIONS' && styles.activeTab]}
                            onPress={() => setActiveTab('COMMISSIONS')}
                        >
                            <Text style={[styles.tabText, activeTab === 'COMMISSIONS' && styles.activeTabText]}>Commissions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'CASHBACK' && styles.activeTab]}
                            onPress={() => setActiveTab('CASHBACK')}
                        >
                            <Text style={[styles.tabText, activeTab === 'CASHBACK' && styles.activeTabText]}>Cashback</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'MILESTONES' && styles.activeTab]}
                            onPress={() => setActiveTab('MILESTONES')}
                        >
                            <Text style={[styles.tabText, activeTab === 'MILESTONES' && styles.activeTabText]}>Milestones</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* History List */}
                <View style={styles.historyList}>
                    {activeTab === 'REWARDS' && (
                        statsData?.referralRewards?.length ? (
                            statsData.referralRewards.map(item => renderHistoryItem(item, true))
                        ) : renderEmptyState("No referral rewards yet")
                    )}

                    {activeTab === 'COMMISSIONS' && (
                        statsData?.commissions?.length ? (
                            statsData.commissions.map(item => renderHistoryItem(item, false))
                        ) : renderEmptyState("No commissions earned yet")
                    )}

                    {activeTab === 'CASHBACK' && (
                        statsData?.cashbacks?.length ? (
                            statsData.cashbacks.map(item => renderHistoryItem(item, false))
                        ) : renderEmptyState("No cashbacks earned yet")
                    )}

                    {activeTab === 'MILESTONES' && (
                        milestones?.length ? (
                            milestones.map(item => renderMilestoneItem(item))
                        ) : renderEmptyState("No milestones available")
                    )}
                </View>

            </ScrollView>

            <ConvertRewardsModal 
                visible={isConvertModalVisible}
                onClose={() => setConvertModalVisible(false)}
                bonusBalance={displayBonusBalance}
                onSuccess={() => loadStats()}
            />
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
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 60,
    },
    balanceGrid: {
        flexDirection: 'column',
        gap: 16,
        marginBottom: 24,
    },
    balanceCard: {
        backgroundColor: "#1E3A8A",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
    },
    totalEarnedCard: {
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#A7F3D0",
    },
    withdrawBtn: {
        position: 'absolute',
        top: 24,
        right: 24,
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    withdrawText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
    },
    totalIconBox: {
        position: 'absolute',
        top: 24,
        right: 24,
        backgroundColor: "#D1FAE5",
        padding: 6,
        borderRadius: 8,
    },
    balanceLabel: {
        color: "#BFDBFE",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 1,
        marginBottom: 8,
    },
    balanceAmount: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "800",
    },
    textGreen: {
        color: "#065F46",
    },
    shareCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    shareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    shareTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    shareSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 20,
        lineHeight: 20,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: "#F8FAFC",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 12,
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: "#F8FAFC",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
    },
    codeLeft: {
        flex: 1,
    },
    codeLabel: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "600",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    codeValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        letterSpacing: 2,
    },
    linkValue: {
        fontSize: 14,
        fontWeight: "500",
        color: "#3B82F6",
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: "#EEF2FF",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 16,
    },
    copyButtonText: {
        color: "#4F46E5",
        fontWeight: "600",
        fontSize: 12,
    },
    totalReferralsBox: {
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalRefLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
        letterSpacing: 0.5,
    },
    totalRefValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: "#F1F5F9",
        padding: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
    },
    activeTabText: {
        color: "#0F172A",
    },
    historyList: {
        minHeight: 200,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconReward: {
        backgroundColor: "#EEF2FF",
    },
    iconCommission: {
        backgroundColor: "#D1FAE5",
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 13,
        color: "#6B7280",
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: "700",
    },
    amountReward: {
        color: "#4F46E5",
    },
    amountCommission: {
        color: "#059669",
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    progressBarBg: {
        height: 6,
        backgroundColor: "#E2E8F0",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 4,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#4F46E5",
    },
    progressText: {
        fontSize: 11,
        color: "#64748B",
    },
    milestoneAmount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#F59E0B",
        marginBottom: 8,
    },
    claimBtn: {
        backgroundColor: "#4F46E5",
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    claimBtnText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "600",
    },
    claimedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    claimedText: {
        color: "#059669",
        fontSize: 12,
        fontWeight: "600",
    },
    lockedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    lockedText: {
        color: "#64748B",
        fontSize: 12,
        fontWeight: "600",
    }
});
