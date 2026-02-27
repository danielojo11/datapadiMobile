import api from "../api";

// app/actions/auth.ts
export async function registerUser(formData: {
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  // Grab the base URL from your .env file
  const BACKEND_URL = process.env.BACKEND_URL;

  // Extract fields from the form
  // const payload = {
  //   userName: formData.get("username"),
  //   email: formData.get("email"),
  //   phoneNumber: formData.get("phone"),
  //   password: formData.get("password"),
  // };

  try {
    const response = await api.post("auth/register/", formData);

    console.log(response);

    const data = response.data;

    // Handle standard Data Padi errors (400, 409)

    // Handle success (201)
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error.response.data.message || "Failed to connect to the server. Please try again later.",
    };
  }
}
