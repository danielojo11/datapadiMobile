import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

export interface DashboardData {
  user: {
    fullName: string;
    tier: string;
    walletBalance: number;
    lifetimeSpent: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    metadata?: any;
  }>;
  todaySpent: number;
}

export async function getDashboardData() {
  try {
    const response = await api.get("user/dashboard");
    console.log("dashboard data", response.data.data)

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}
