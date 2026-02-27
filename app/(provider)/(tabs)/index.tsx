import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import BuyData from "../components/drawers/BuyData";
import BuyAirtime from "../components/drawers/BuyAirtime";
import BalanceCard from "../components/BalanceCard";
import WalletCard from "../components/WalletCard";
import QuickActionButton from "../components/QuickActionButton";
import RecentActivityItem from "../components/RecentActivityItem";
import BuyElectricityModal from "../components/drawers/Electricity";
import CableTV from "../components/drawers/CableTV";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDashboardData, DashboardData } from "@/app/utils/dashboard";
import { AuthContext } from "@/app/context/AppContext";

interface StoredUser {
  userName: string;
  id: string;
  tier: string;
  isKycVerified: boolean;
}


export default function Index() {
  const router = useRouter();
  const authState = useContext(AuthContext);

  const [dataModalVisisbility, setDataModalVisibility] = useState(false);
  const [airtimeModalVisisbility, setAirtimeModalVisibility] = useState(false);
  const [electricityModalVisisbility, setElectricityModalVisibility] =
    useState(false);
  const [cableModalVisisbility, setCableModalVisibility] = useState(false);

  const [loadedUser, setLoadedUser] = useState<StoredUser | null>(null);
  const [dashboardData, setDashboardData] = useState<
    DashboardData | null | any
  >(null);

  const loadAll = async () => {
    try {
      const login_obj = await AsyncStorage.getItem("login_obj");

      if (!login_obj) {
        await authState.logout();
        return;
      }

      const parsed = JSON.parse(login_obj);
      const user = parsed?.data?.user;

      if (!user) {
        console.log("Invalid credential structure:", parsed);
        await authState.logout();
        return;
      }

      setLoadedUser(user);

      const dashResponse = await getDashboardData();

      if (dashResponse?.success) {
        console.log("dashboard data", dashResponse.data);
        setDashboardData(dashResponse.data);
      } else {
        console.log("Dashboard fetch failed");
      }
    } catch (error) {
      console.log("Index screen error:", error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  )

  useEffect(() => {



  }, []);

  // Safe derived values
  const user_name = loadedUser?.userName ?? "";
  const user_tier = dashboardData?.user?.tier ?? "";
  const walletBalance = dashboardData?.user?.walletBalance ?? 0;
  const todaySpent = dashboardData?.todaySpent ?? 0;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: "#f5f5f5",
      }}
    >
      <BuyData
        visible={dataModalVisisbility}
        onClose={() => setDataModalVisibility(false)}
      />
      <BuyAirtime
        visible={airtimeModalVisisbility}
        onClose={() => setAirtimeModalVisibility(false)}
      />
      <BuyElectricityModal
        isOpen={electricityModalVisisbility}
        onClose={() => setElectricityModalVisibility(false)}
      />
      <CableTV
        isOpen={cableModalVisisbility}
        onClose={() => setCableModalVisibility(false)}
      />

      <ScrollView style={{ backgroundColor: "#F3F4F6" }} showsVerticalScrollIndicator={false}>
        <BalanceCard user_name={user_name} tier={user_tier} />

        <WalletCard
          balance={walletBalance}
          todaySpent={todaySpent}
          onFundWallet={() => router.push("/profile")}
        />

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <QuickActionButton
            iconName="wifi-outline"
            iconColor="#2563EB"
            label="Buy Data"
            onPress={() => setDataModalVisibility(true)}
          />
          <QuickActionButton
            iconName="phone-portrait-outline"
            iconColor="#10B981"
            label="Airtime"
            onPress={() => setAirtimeModalVisibility(true)}
          />
          <QuickActionButton
            iconName="tv-outline"
            iconColor="#8B5CF6"
            label="Cable TV"
            onPress={() => setCableModalVisibility(true)}
          />
          <QuickActionButton
            iconName="flash-outline"
            iconColor="#F59E0B"
            label="Electricity"
            onPress={() => setElectricityModalVisibility(true)}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginVertical: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Recent Activity
          </Text>

          <TouchableOpacity onPress={() => router.push("/history")}>
            <Text style={{ color: "#2563EB", fontWeight: "bold" }}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {dashboardData?.recentTransactions.length > 0 ? (
          // <FlatList
          //   data={dashboardData?.recentTransactions}
          //   keyExtractor={(item) => item.id}
          //   renderItem={({ item }) => (
          //     <RecentActivityItem
          //       amount={item.amount.toString()}
          //       subtitle={item.createdAt}
          //       title={item.metadata}
          //     />
          //   )}


          // />
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            overflow: "hidden",
            borderColor: "#F3F4F6",
            borderWidth: 1,
            marginBottom: 20
          }}>
            {
              dashboardData?.recentTransactions.map((item: any) => (
                <RecentActivityItem
                  amount={item.amount.toString()}
                  subtitle={item.createdAt}
                  title={item.metadat}
                  type={item.type}
                  key={item.id}
                />
              ))
            }
          </View>

        ) : (
          <View
            style={{
              width: 200,
              margin: "auto",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "grey" }}>
              No recent Transactions
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
