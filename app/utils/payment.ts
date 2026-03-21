// app/actions/payment.ts

import api from "./api";
import { authorizedFetch } from "./api-client";

/**
 * Get a Flutterwave hosted payment link for wallet funding[cite: 235, 238].
 * Minimum amount: ₦100[cite: 240].
 */
export async function initializeGatewayFunding(amount: number) {
  try {
    const response = await api.post("/payment/fund/init", {
      amount,
    });

    const result = response.data;
    console.log("Result from handler: ", result)
    return {
      success: true,
      paymentLink: result.paymentLink,
      error: result.message,
      data: result.data || result,
      ...result
    };
  } catch (error) {
    return { success: false, error: "Failed to connect to payment gateway" };
  }
}

/**
 * Submit BVN for KYC and create a dedicated virtual bank account[cite: 252, 254].
 */
export async function verifyBVN(
  bvn: string,
  // firstName: string,
  // lastName: string,
) {
  try {
    const response = await api.post("payment/kyc/create", {
      bvn,
    });

    const result = response.data;
    console.log("BVN Verification Result from handler: ", result)
    return {
      success: response.status,
      data: result.data,
      successMessage: result.message || "Verification failed",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
