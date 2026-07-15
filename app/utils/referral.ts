import api from "./api";

export interface ReferralOverview {
    referralCode: string;
    totalReferrals: number;
    bonusBalance: number;
    totalBonusEarned: number;
}

export interface Commission {
    id: string;
    amount: number;
    description: string;
    createdAt: string;
}

export interface Cashback {
    id: string;
    amount: number;
    description: string;
    createdAt: string;
}

export interface ReferralReward {
    id: string;
    amount: number;
    referredUser: string;
    createdAt: string;
}

export interface ReferralStatsData {
    overview: ReferralOverview;
    commissions: Commission[];
    cashbacks: Cashback[];
    referralRewards: ReferralReward[];
}

export interface ReferralResponse {
    success: boolean;
    message?: string;
    data?: ReferralStatsData;
    error?: string;
}

/**
 * Fetch user referral statistics and rewards history.
 */
export async function getReferralStats(): Promise<ReferralResponse> {
    try {
        const response = await api.get(`user/referral/stats`);
        const result = response.data;

        return {
            success: true,
            data: result.data,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch referral stats",
        };
    }
}


export default function DummyRoute() { return null; }
