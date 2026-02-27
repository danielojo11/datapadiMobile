// app/actions/vtu.ts

import api from "./api";
import { authorizedFetch } from "./api-client";

// --- TYPES & INTERFACES ---

export interface DataPlan {
  PRODUCT_CODE: string;
  PRODUCT_NAME: string;
  PRODUCT_AMOUNT: string;
  PRODUCT_ID: string;
  SELLING_PRICE: number;
}

export interface VtuResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  error?: string;
  data?: any;
}

export interface RechargePin {
  id: string;
  network: string;
  denomination: number;
  pinCode: string;
  serialNumber?: string;
  batchNumber?: string;
  isSold: boolean;
  soldAt?: string;
}

// --- 1. DATA ROUTES ---

/**
 * Fetch all available data plans.
 * Backend injects a 10% markup into SELLING_PRICE.
 */
// app/actions/vtu.ts

export interface ProviderDataPlan {
  PRODUCT_SNO: string;
  PRODUCT_CODE: string;
  PRODUCT_ID: string;
  PRODUCT_NAME: string;
  PRODUCT_AMOUNT: string;
  SELLING_PRICE: number;
}

export interface NetworkGroup {
  ID: string;
  PRODUCT: ProviderDataPlan[];
}

export interface NetworkPlans {
  // Key names from your response: "MTN", "Glo", "m_9mobile", "Airtel"
  [network: string]: NetworkGroup[];
}

export async function getDataPlans() {
  try {
    const response = await api.get("vtu/data/plans");
    const result = await response.data;
    return { success: true, data: result.data.MOBILE_NETWORK as NetworkPlans };
  } catch (error) {
    console.error("Data Plan Fetch Error:", error);
    return { success: false, error: "Network connection failed" };
  }
}

/**
 * Buy a data bundle.
 */
export async function buyData(
  network: string,
  planId: string,
  phoneNumber: string,
) {
  try {
    const response = await api.post("vtu/data", {
      network,
      planId,
      phoneNumber,
    });

    console.log("Network: ", network);
    console.log("Plan ID: ", planId);
    console.log("Phone Number: ", phoneNumber);

    const result = await response.data;

    console.log("Result from internal handler: ", result);
    return {
      message: result.message, // [cite: 179]
      transactionId: result.transactionId, // [cite: 180]
    };
  } catch (error: any) {
    console.log("Error from internal handler: ", error);
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || "An error occurred"
    };
  }
}

/**
 * Check Data Transaction Status.
 * WARNING: This triggers a live provider sync on the backend if the status is PENDING.
 */
export async function getDataTransactionStatus(
  reference: string,
): Promise<VtuResponse> {
  try {
    const response = await authorizedFetch(`/api/v1/vtu/data/${reference}`); // [cite: 186, 188]
    const result = await response.json();

    return { success: response.ok, data: result.data, error: result.message }; // [cite: 192]
  } catch (error) {
    return { success: false, error: "Failed to fetch status" };
  }
}

// --- 2. AIRTIME ROUTES ---

/**
 * Top up airtime.
 * Minimum amount is 50.
 */
export async function buyAirtime(
  network: string,
  amount: number,
  phoneNumber: string,
): Promise<VtuResponse> {
  try {
    const response = await api.post("vtu/airtime", {
      // [cite: 194]
      network,
      amount,
      phoneNumber,
    });

    const result = await response.data;
    return {
      success: true,
      message: result.message,
      transactionId: result.transactionId, // [cite: 204]
      error: result.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || "An error occurred"
    };
  }
}

/**
 * Check Airtime Transaction Status.
 * WARNING: Triggers live provider sync if PENDING.
 */
export async function getAirtimeTransactionStatus(
  reference: string,
): Promise<VtuResponse> {
  try {
    const response = await authorizedFetch(`/api/v1/vtu/airtime/${reference}`); // [cite: 210]
    const result = await response.json();

    return { success: response.ok, data: result.data, error: result.message };
  } catch (error) {
    return { success: false, error: "Failed to fetch status" };
  }
}

// --- 3. RECHARGE PIN (E-PIN) ROUTES ---

/**
 * Generate physical recharge card PINs.
 * Value must be 100, 200, or 500. Quantity 1-100.
 */
export async function printRechargePins(
  network: string,
  value: string,
  quantity: number,
) {
  try {
    const response = await api.post("vtu/print", {
      network,
      value,
      quantity,
    });

    const result = response.data;
    return {
      success: result.data.success,
      message: result.message,
    };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.message || error?.message || "An error occurred" };
  }
}

export async function getPrintInventory() {
  try {
    const response = await api.get("vtu/pins?limit=50"); // [cite: 117]
    const result = await response.data;

    // if (!response.ok) return { success: false, error: result.message };

    return {
      success: true,
      data: result.data, // [cite: 121]
      error: result.message,
    };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.message || error?.message || "An error occurred" };
  }
}
/**
 * Retrieve the actual PINs for a specific print order reference.
 */
export async function getPrintOrderPins(reference: string) {
  try {
    const response = await authorizedFetch(`/api/v1/vtu/print/${reference}`); // [cite: 231]
    const result = await response.json();

    if (!response.ok)
      return {
        success: false,
        error: result.message || "Failed to fetch PINs",
      };

    return {
      success: true,
      data: result.data as {
        orderId: string; // [cite: 130]
        date: string; // [cite: 131]
        amount: number; // [cite: 132]
        quantity: number; // [cite: 133]
        network: string; // [cite: 134]
        denomination: number; // [cite: 135]
        pins: RechargePin[]; // [cite: 136]
      },
    };
  } catch (error) {
    return { success: false, error: "Network connection failed" };
  }
}
