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
    const data = notification.request.content.data as NotificationData;
    console.log("Foreground notification received:", data);

    // Trigger a data refresh if it's a financial notification
    if (data.type === "credit" || data.type === "debit" || data.type === "transaction") {
        DeviceEventEmitter.emit("refreshData");
    }
}

/**
 * Handles interaction with a notification (e.g., when the user taps it).
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as NotificationData;
    console.log("Notification response received:", data);

    const type = data.type;

    switch (type) {
        case "credit":
        case "debit":
        case "transaction":
        case "airtime_purchase":
        case "data_purchase":
        case "electricity_purchase":
        case "cable_purchase":
            // Navigate to transaction history
            router.push("/(provider)/(tabs)/history");
            break;

        case "profile":
            router.push("/(provider)/(tabs)/profile");
            break;

        case "general":
        case "announcement":
        case "broadcast":
            // Navigate to home screen for general admin notifications
            router.push("/(provider)/(tabs)");
            break;

        default:
            // Default to home or history if type is unknown
            if (data.transactionId) {
                router.push("/(provider)/(tabs)/history");
            } else {
                router.push("/(provider)/(tabs)");
            }
            break;
    }
}
