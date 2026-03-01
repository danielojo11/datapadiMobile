// app/actions/user.ts

import api from "./api";
import { authorizedFetch } from "./api-client";

export async function getTransactionHistory(
  page: number = 1,
  limit: number = 20,
  type?: string,
) {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && type !== "All"
        ? { type: type.toUpperCase().replace("PINS", "RECHARGE_PIN") }
        : {}),
    });

    const response = await api.get(
      `user/transactions?${query}`,
    ); //
    const result = response.data;

    // if (!response.ok) {
    //   return {
    //     success: false,
    //     error: result.message || "Failed to fetch history",
    //   };
    // }

    return {
      success: true,
      data: result.data,
      pagination: result.pagination, // [cite: 23, 29, 113]
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProfileData() {
  try {
    const response = await api.get("/user/profile"); // [cite: 76]
    const result = response.data;

    return { success: true, data: result.data }; // [cite: 80]
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return { success: false, error: "Network connection failed" };
  }
}


export async function generateOTP(email: string) {
  try {
    const response = await api.post("/auth/forgot-password", email);
    const result = response.data;

    return { success: true, data: result.data };
  } catch (error) {
    console.error("OTP Generation Error:", error);
    return { success: false, error: "Network connection failed" };
  }
}

export async function verifyOTP(email: string, otp: string) {
  try {
    const response = await api.post("/auth/verify-otp", { email, otp });
    const result = response.data;

    return { success: true, data: result.data };
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return { success: false, error: "Network connection failed" };
  }
}

export async function resetPassword(email: string, password: string) {
  try {
    const response = await api.post("/auth/reset-password", { email, password });
    const result = response.data;

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Password Reset Error:", error);
    return { success: false, error: "Network connection failed" };
  }
}