import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { DeviceEventEmitter } from "react-native";

export interface NotificationData {
    type?: string;
    transactionId?: string;
    message?: string;
    amount?: string | number;
    [key: string]: any;
}

/**
 * Handles notifications received while the app is in the foreground.
 */
export function handleForegroundNotification(notification: Notifications.Notification) {
    const data = notification.request.content.data as NotificationData | null | undefined;
    console.log("Foreground notification received:", data);

    // Trigger a data refresh if it's a financial notification
    if (
        data?.type === "credit" ||
        data?.type === "debit" ||
        data?.type === "transaction" ||
        data?.type === "WALLET_FUNDING" ||
        data?.type === "DATA" ||
        data?.type === "AIRTIME" ||
        data?.type === "ELECTRICITY" ||
        data?.type === "CABLE_TV" ||
        data?.type === "EDUCATION" ||
        data?.type === "RECHARGE_PIN"
    ) {
        DeviceEventEmitter.emit("refreshData");
    }
}

/**
 * Handles interaction with a notification (e.g., when the user taps it).
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as NotificationData | null | undefined;
    console.log("Notification response received:", data);

    const type = data?.type?.toUpperCase() || data?.type;

    switch (type) {
        case "CREDIT":
        case "DEBIT":
        case "TRANSACTION":
        case "AIRTIME_PURCHASE":
        case "DATA_PURCHASE":
        case "ELECTRICITY_PURCHASE":
        case "CABLE_PURCHASE":
        case "WALLET_FUNDING":
        case "DATA":
        case "AIRTIME":
        case "RECHARGE_PIN":
        case "CABLE_TV":
        case "ELECTRICITY":
        case "EDUCATION":
            // Navigate to transaction history
            router.push("/(provider)/(tabs)/history");
            break;

        case "PROFILE":
            router.push("/(provider)/(tabs)/profile");
            break;

        case "GENERAL":
        case "ANNOUNCEMENT":
        case "BROADCAST":
            // Navigate to home screen for general admin notifications
            router.push("/(provider)/(tabs)");
            break;

        default:
            // Default to home or history if type is unknown
            if (data?.transactionId) {
                router.push("/(provider)/(tabs)/history");
            } else {
                router.push("/(provider)/(tabs)");
            }
            break;
    }
}
