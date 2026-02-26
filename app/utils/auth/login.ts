import { AuthContext } from "@/app/context/AppContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";

export async function loginUser(formData: { email: string; password: string }) {
  if (!formData.email || !formData.password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const response = await api.post("auth/login/", formData);

    const data = response.data;
    console.log(data);

    AsyncStorage.setItem("accessToken", data.accessToken);
    AsyncStorage.setItem("refreshToken", data.refreshToken);

    return {
      data,
    };
  } catch (error) {
    console.error("Login error:", error);

    return { success: false, error: "Failed to connect to the server" };
  }
}
