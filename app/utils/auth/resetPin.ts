import api from "../api";

export async function resetTransactionPin(payload: { password: string; newPin: string }) {
    try {
        const response = await api.post("auth/change-pin", payload);
        return response.data;
    } catch (error: any) {
        console.error("Reset PIN error:", error?.response?.data || error);
        throw error?.response?.data || error;
    }
}
