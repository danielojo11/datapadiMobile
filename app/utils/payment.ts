// app/actions/payment.ts

import { authorizedFetch } from "./api-client";

/**
 * Get a Flutterwave hosted payment link for wallet funding[cite: 235, 238].
 * Minimum amount: ₦100[cite: 240].
 */
export async function initializeGatewayFunding(amount: number) {
  try {
    const response = await authorizedFetch("/api/v1/payment/fund/init", {
      method: "POST",
      body: JSON.stringify({ amount }), // [cite: 239, 240]
    });

    const result = await response.json();
    return {
      success: response.ok,
      paymentLink: result.paymentLink,
      error: result.message,
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
  firstName: string,
  lastName: string,
) {
  try {
    const response = await authorizedFetch("/api/v1/payment/kyc/create", {
      method: "POST",
      body: JSON.stringify({ bvn }), // [cite: 256]
    });

    const result = await response.json();
    return {
      success: response.ok,
      data: result.data,
      error: result.message || "Verification failed",
    };
  } catch (error) {
    return { success: false, error: "Network connection failed" };
  }
}
