// app/utils/cable.ts

import api from "./api";

// --- TYPES & INTERFACES ---

export interface CablePackage {
    PACKAGE_ID: string;
    PACKAGE_NAME: string;
    PACKAGE_AMOUNT: string;
}

export interface CableGroup {
    ID: string;
    PRODUCT: CablePackage[];
}

export interface CablePackagesResponse {
    [network: string]: CableGroup[];
}

export interface CablePaymentPayload {
    cableTV: string;
    packageCode: string;
    smartCardNo: string;
    phoneNo: string;
}

export interface CablePaymentResponse {
    success: boolean;
    message?: string;
    transactionId?: string;
    error?: string;
}

// --- CABLE TV ROUTES ---

/**
 * Fetch all available cable TV packages
 */
export async function getCablePackages() {
    try {
        const response = await api.get("cable/packages");
        const result = await response.data;
        console.log("cable packages", result);

        return {
            success: true,
            data: result.data || result, // Adjust based on API structure
        };
    } catch (error: any) {
        console.error("Cable Packages Fetch Error:", error);
        return { success: false, error: error?.response?.data?.message || error.message || "Network connection failed" };
    }
}

/**
 * Verify Smartcard/IUC Number before payment
 */
export async function verifySmartCard(
    provider: string,
    smartCardNo: string
) {
    try {
        const query = new URLSearchParams({
            cableTV: provider,
            smartCardNo,
        });

        const response = await api.get(
            `cable/verify?${query.toString()}`
        );
        console.log("smartcard verification", response);
        const result = await response.data;

        return {
            success: true,
            customerName: result.data?.customer_name || result.customerName || result.data?.customerName,
        };
    } catch (error: any) {
        console.error("Smartcard Verification Error:", error);
        return { success: false, error: error?.response?.data?.message || "Smartcard/IUC Verification Failed" };
    }
}

/**
 * Pay Cable TV Subscription
 */
export async function payCableSubscription(
    payload: CablePaymentPayload
): Promise<CablePaymentResponse> {
    try {
        const response = await api.post("cable/pay", payload);
        const result = await response.data;

        return {
            success: true,
            message: result.message,
            transactionId: result.transactionId,
        };
    } catch (error: any) {
        console.error("Cable Payment Error:", error);
        return { success: false, error: error?.response?.data?.message || "Transaction failed due to network error" };
    }
}
