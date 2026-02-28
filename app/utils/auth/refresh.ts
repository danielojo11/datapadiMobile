import { AuthContext } from "@/app/context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Server Action for user authentication
 * Based on MUFTI PAY API Documentation Section 2.2
 */
export async function refreshUser(refreshToken: string) {
  // const BACKEND_URL = process.env.BACKEND_URL;

  if (!refreshToken) {
    return {
      status: 204,
      message: "Redirect to the login page",
    };
  }

  try {
    const response = await fetch(
      `https://dataappback.onrender.com/api/v1/auth/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refreshToken),
      },
    );

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      // Handles 400 (Missing fields) and 401 (Invalid credentials)
      return { success: false, error: data.message || "Invalid credentials" };
    }

    // Access Token (Short-lived)
    AsyncStorage.setItem("accessToken", data.accessToken);

    return {
      data,
    };
  } catch (error) {
    console.error("Refresh error:", error);
    return { success: false, error: "Failed to connect to the server" };
  }
}
