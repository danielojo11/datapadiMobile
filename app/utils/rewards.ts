import api from "./api";

export interface RewardHistoryItem {
    id: string;
    amount: string;
    source: string;
    note: string;
    createdAt: string;
}

export interface RewardsDashboardData {
    bonusBalance: number;
    totalEarned: number;
    history: RewardHistoryItem[];
}

export interface MilestoneData {
    key: string;
    title: string;
    description: string;
    amount: number;
    progress: number;
    target: number;
    isClaimed: boolean;
    isEligible: boolean;
}

export interface RewardsResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

/**
 * Fetches the user's reward dashboard.
 */
export async function getRewardsDashboard(): Promise<RewardsResponse<RewardsDashboardData>> {
    try {
        const response = await api.get(`user/rewards`);
        const result = response.data;

        return {
            success: true,
            data: result.data,
            message: result.message
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch rewards dashboard",
        };
    }
}

/**
 * Converts funds from the bonus wallet to the main wallet.
 */
export async function convertRewards(amount: number, pin: string): Promise<RewardsResponse<{ newBalance: number; remainingBonus: number }>> {
    try {
        const response = await api.post(`user/rewards/convert`, { amount, pin });
        const result = response.data;

        return {
            success: true,
            data: result.data,
            message: result.message,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to convert rewards",
        };
    }
}

/**
 * Fetches the status and progress of all milestone rewards for the current user.
 */
export async function getMilestones(): Promise<RewardsResponse<MilestoneData[]>> {
    try {
        const response = await api.get(`user/rewards/milestones`);
        const result = response.data;

        return {
            success: true,
            data: result.data,
            message: result.message,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch milestones",
        };
    }
}

/**
 * Claims a specific milestone reward if eligible.
 */
export async function claimMilestone(rewardKey: string): Promise<RewardsResponse<{ amount: number }>> {
    try {
        const response = await api.post(`user/rewards/claim`, { rewardKey });
        const result = response.data;

        return {
            success: true,
            data: result.data,
            message: result.message,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to claim milestone",
        };
    }
}


export default function DummyRoute() { return null; }
