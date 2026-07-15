import * as Notifications from "expo-notifications";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import BalanceCard from "../components/BalanceCard";
import WalletCard from "../components/WalletCard";
import QuickActionButton from "../components/QuickActionButton";
import RecentActivityItem from "../components/RecentActivityItem";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDashboardData, DashboardData } from "@/app/utils/dashboard";
import { AuthContext } from "@/app/context/AppContext";
import TransactionDetailsModal from "../components/modals/TransactionDetailsModal";
import WhatsAppModal from "../components/modals/WhatsAppModal";
import Animated, { FadeInDown } from "react-native-reanimated";

interface StoredUser {
  userName: string;
  id: string;
  tier: string;
  isKycVerified: boolean;
}

export default function Index() {
  const router = useRouter();
  const authState = useContext(AuthContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const [loadedUser, setLoadedUser] = useState<StoredUser | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null | any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingRecentTransactions, setLoadingRecentTransactions] = useState(false);
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);

  const loadAll = async () => {
    try {
      const login_obj = await AsyncStorage.getItem("login_obj");

      if (!login_obj) {
        await authState.logout();
        return;
      }

      const parsed = JSON.parse(login_obj);
      const user = parsed?.user;

      if (!user) {
        console.log("Invalid credential structure:", parsed);
        await authState.logout();
        return;
      }

      setLoadedUser(user);
      setLoadingRecentTransactions(true);
      const dashResponse = await getDashboardData();
      
      if (dashResponse?.success) {
        setDashboardData(dashResponse.data.data);
      } else {
        console.log("Dashboard fetch failed");
      }
    } catch (error) {
      console.log("Index screen error:", error);
    } finally {
      setLoadingRecentTransactions(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      return undefined;
    }, [])
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('refreshData', () => {
      loadAll();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const checkWhatsAppModal = async () => {
      try {
        const dismissed = await AsyncStorage.getItem("whatsapp_modal_dismissed");
        const today = new Date().toDateString();

        if (dismissed !== today) {
          setTimeout(() => {
            setWhatsappModalVisible(true);
          }, 2000);
        }
      } catch (error) {
        console.log("Error checking WhatsApp modal status:", error);
      }
    };
    checkWhatsAppModal();
  }, []);

  const handleCloseWhatsAppModal = async () => {
    setWhatsappModalVisible(false);
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem("whatsapp_modal_dismissed", today);
    } catch (error) {
      console.log("Error saving WhatsApp modal status:", error);
    }
  };

  const user_name = loadedUser?.userName ?? "";
  const user_tier = dashboardData?.user?.tier ?? "";
  const walletBalance = dashboardData?.user?.walletBalance ?? 0;
  const todaySpent = dashboardData?.todaySpent ?? 0;

  const handleTransactionClick = (tx: any) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-0 pb-0">
      <ScrollView
        className="bg-background px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Animated.View entering={FadeInDown.duration(800).springify()}>
          <BalanceCard user_name={user_name} tier={user_tier} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(100).springify()}>
          <WalletCard
            balance={walletBalance}
            todaySpent={todaySpent}
            onFundWallet={() => router.push("/profile")}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200).springify()}>
          <View className="px-2 mt-4 mb-3">
            <Text className="text-[15px] font-black text-text tracking-wider uppercase">Quick Actions</Text>
          </View>

          <View className="flex-row flex-wrap justify-between px-1">
            <QuickActionButton iconName="wifi-outline" iconColor="#2563EB" label="Buy Data" onPress={() => router.push("/buy-data")} />
            <QuickActionButton iconName="phone-portrait-outline" iconColor="#10B981" label="Airtime" onPress={() => router.push("/buy-airtime")} />
            <QuickActionButton iconName="tv-outline" iconColor="#8B5CF6" label="Cable TV" onPress={() => router.push("/cable-tv")} />
            <QuickActionButton iconName="flash-outline" iconColor="#F59E0B" label="Electricity" onPress={() => router.push("/electricity")} />
            <QuickActionButton iconName="school-outline" iconColor="#4F46E5" label="Education" onPress={() => router.push("/education")} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(300).springify()}>
          <View className="flex-row justify-between items-center my-4 px-2">
            <Text className="text-[15px] font-black text-text tracking-wider uppercase">Recent Activity</Text>

            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text className="text-primary font-black text-[13px]">See All</Text>
            </TouchableOpacity>
          </View>

          {dashboardData?.recentTransactions.length > 0 ? (
            <View>
              {loadingRecentTransactions ? (
                <View className="mt-8 items-center">
                  <ActivityIndicator color="grey" size={24} />
                </View>
              ) : (
                <View className="bg-card rounded-[32px] overflow-hidden border border-border shadow-xl shadow-black/5 mb-8">
                  {dashboardData?.recentTransactions.map((item: any, idx: number) => {
                    const dateObj = new Date(item.date || item.createdAt || new Date());
                    const formattedDate = dateObj.toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    });

                    const title = (() => {
                      if (item.type === 'EDUCATION') {
                        if (item.metadata?.examType === 'utme-mock') return 'JAMB UTME (With Mock)';
                        if (item.metadata?.examType === 'utme-no-mock') return 'JAMB UTME (No Mock)';
                      }
                      return item.metadata?.planName || item.metadata?.network || item.metadata?.provider || item.type?.replace('_', ' ');
                    })();

                    return (
                      <View key={item.id}>
                        <RecentActivityItem
                          amount={item.amount.toString()}
                          subtitle={formattedDate}
                          title={title}
                          type={item.type}
                          status={item.status}
                          onPress={() => handleTransactionClick(item)}
                        />
                        {idx !== dashboardData.recentTransactions.length - 1 && <View className="h-[1px] bg-border ml-20" />}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            <View className="mt-12 items-center justify-center">
              <Text className="text-sm font-bold text-textMuted uppercase tracking-wider">No recent Transactions</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {isModalOpen && (
        <TransactionDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transaction={selectedTransaction}
        />
      )}

      <WhatsAppModal
        visible={whatsappModalVisible}
        onClose={handleCloseWhatsAppModal}
      />
    </SafeAreaView>
  );
}