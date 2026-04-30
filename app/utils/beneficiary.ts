import api from "./api";

export type BeneficiaryType = 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'CABLE' | 'EDUCATION';

export interface Beneficiary {
    id: string;
    userId: string;
    type: BeneficiaryType;
    name: string;
    identifier: string;
    provider: string;
    createdAt: string;
    updatedAt: string;
}

export interface BeneficiaryResponse {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}

/**
 * Fetch all beneficiaries. 
 * @param type Optional filter by type
 */
export async function getBeneficiaries(type?: BeneficiaryType): Promise<BeneficiaryResponse> {
    try {
        const url = type ? `user/beneficiary?type=${type}` : `user/beneficiary`;
        const response = await api.get(url);
        const result = response.data;

        return {
            success: true,
            data: result.data || [],
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch beneficiaries",
        };
    }
}

/**
 * Save a new beneficiary manually.
 */
export async function saveBeneficiary(
    type: BeneficiaryType,
    identifier: string,
    provider: string,
    name?: string
): Promise<BeneficiaryResponse> {
    try {
        const body: any = { type, identifier, provider };
        if (name) {
            body.name = name;
        }

        const response = await api.post(`user/beneficiary`, body);
        const result = response.data;

        return {
            success: true,
            message: result.message || "Beneficiary saved successfully",
            data: result.data,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to save beneficiary",
        };
    }
}

/**
 * Update alias for a saved beneficiary
 */
export async function updateBeneficiary(
    id: string,
    name: string
): Promise<BeneficiaryResponse> {
    try {
        const response = await api.patch(`user/beneficiary/${id}`, { name });
        const result = response.data;

        return {
            success: true,
            message: result.message || "Beneficiary updated",
            data: result.data,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to update beneficiary",
        };
    }
}

/**
 * Delete a beneficiary
 */
export async function deleteBeneficiary(id: string): Promise<BeneficiaryResponse> {
    try {
        const response = await api.delete(`user/beneficiary/${id}`);
        const result = response.data;

        return {
            success: true,
            message: result.message || "Beneficiary deleted successfully",
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to delete beneficiary",
        };
    }
}
