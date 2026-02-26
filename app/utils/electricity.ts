// app/actions/electricity.ts

import api from "./api";
import { authorizedFetch } from "./api-client";

// --- TYPES & INTERFACES ---

export interface DiscoProvider {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
}

export interface MeterVerificationResult {
  "customer name": string;
  "meter number": string;
}

export interface ElectricityPaymentPayload {
  discoCode: string;
  meterNo: string;
  meterType: "01" | "02"; // "01" = Prepaid | "02" = Postpaid
  amount: number;
  phoneNo: string;
}

export interface ElectricityPaymentResponse {
  success: boolean;
  message?: string;
  token?: string;
  customerName?: string;
  transactionId?: string;
  error?: string;
}

// --- ELECTRICITY ROUTES ---

/**
 * Fetch all available electricity distribution companies (Discos)
 */
export async function getDiscos() {
  try {
    const response = await api.get("electricity/disco");
    const result = await response.data;
    console.log("disco", result)

    // if (!response.ok) {
    //   return {
    //     success: false,
    //     error: result.message || "Failed to fetch electricity providers.",
    //   };
    // }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    console.error("Disco Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify Meter Number before payment
 * Note: Always call this before payElectricity to ensure the meter is valid and fetch the customer name.
 */
export async function verifyMeter(
  discoCode: string,
  meterNo: string,
  isPrepaid: boolean,
) {
  try {
    // The API expects "01" for Prepaid and "02" for Postpaid
    const meterType = isPrepaid ? "01" : "02";

    const query = new URLSearchParams({
      discoCode,
      meterNo,
      meterType,
    });

    const response = await api.get(
      `electricity/verify?${query.toString()}`,
    );
    console.log("meter verification", response)
    const result = await response.data;



    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return { success: false, error: "Meter Verification Failed" };
  }
}

/**
 * Pay Electricity Bill
 * Note: Transactions are atomic. The wallet is debited before the provider is called. [cite: 116]
 */
export async function payElectricity(
  payload: ElectricityPaymentPayload,
): Promise<ElectricityPaymentResponse> {
  try {
    // The API requires amount to be between N100 and N500,000 [cite: 261]
    if (payload.amount < 100 || payload.amount > 500000) {
      return {
        success: false,
        error: "Amount must be between N100 and N500,000",
      };
    }

    const response = await api.post("electricity/pay", payload);

    const result = await response.data;

    // if (!response.ok) {
    //   return { success: false, error: result.message || "Payment failed" };
    // }

    return {
      success: true,
      message: result.message,
      token: result.token, // Present for prepaid meters [cite: 259, 263]
      customerName: result.customerName,
      transactionId: result.transactionId,
    };
  } catch (error) {
    console.error("Electricity Payment Error:", error);
    return { success: false, error: "Transaction failed due to network error" };
  }
}
