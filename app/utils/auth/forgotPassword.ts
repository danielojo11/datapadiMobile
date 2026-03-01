import api from "../api";

export async function generateOTP(payload: { email: string }) {
    try {
        const response = await api.post("auth/forgot-password/", payload);
        return response.data;
    } catch (error: any) {
        console.error("Generate OTP error:", error?.response?.data);
        throw error?.response?.data || error;
    }
}

export async function verifyOTP(payload: { email: string; otp: string }) {
    try {
        const response = await api.post("auth/verify-otp/", payload);
        return response.data;
    } catch (error: any) {
        console.error("Verify OTP error:", error);
        throw error.response?.data || error;
    }
}

export async function resetPassword(payload: { email: string; otp: string; password: string }) {
    try {
        const response = await api.post("auth/reset-password/", payload);
        return response.data;
    } catch (error: any) {
        console.error("Reset Password error:", error);
        throw error.response?.data || error;
    }
}
