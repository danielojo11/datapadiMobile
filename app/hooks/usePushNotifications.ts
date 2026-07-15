import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import { handleForegroundNotification, handleNotificationResponse } from '../utils/notificationHandler';

/**
 * A custom hook to encapsulate the notification lifecycle.
 * Automatically manages listeners and exposes push registration methods.
 */
export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string>('');
    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();
    
    useEffect(() => {
        // Listener fired whenever a notification is received while the app is in the foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            handleForegroundNotification(notification);
        });

        // Listener fired whenever a user taps on or interacts with a notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            handleNotificationResponse(response);
        });

        // Clean up listeners when the component using this hook unmounts
        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    /**
     * Authenticates the device with Expo and synchronizes the push token to the backend.
     * Designed to be called safely after the user successfully logs in.
     */
    const registerAndSaveToken = useCallback(async () => {
        try {
            const token = await notificationService.registerForPushNotificationsAsync();
            if (token && token !== expoPushToken) {
                setExpoPushToken(token);
                // Synchronize the acquired token with the backend securely
                await notificationService.sendTokenToBackend(token);
            }
        } catch (error) {
            console.error("Failed to register and save push token:", error);
        }
    }, [expoPushToken]);

    return {
        expoPushToken,
        registerAndSaveToken
    };
}
