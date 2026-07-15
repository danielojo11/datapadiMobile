import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../utils/api';

// Set up reasonable defaults for how notifications appear in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * A reusable service for interacting with Expo Push Notifications
 * and synchronizing tokens with the backend.
 */
export const notificationService = {
    /**
     * Obtains the required permissions and registers the device with Expo 
     * to get an Expo Push Token.
     */
    async registerForPushNotificationsAsync(): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return null;
        }

        // Android requires creating a notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                sound: 'default',
            });
        }

        // Check current notification permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // If not granted, explicitly request them
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Securely fetch the EAS Project ID from expo constants instead of hardcoding
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        if (!projectId) {
            console.warn('Project ID not found in expo config. Ensure app.json has expo.extra.eas.projectId defined.');
            return null;
        }

        if (Constants.appOwnership === 'expo') {
            console.log('Push notifications are not fully supported in Expo Go. Use a development build.');
            return null;
        }

        try {
            // Obtain the token
            const pushTokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
            return pushTokenResponse.data;
        } catch (error) {
            console.error("Error fetching Expo Push Token:", error);
            return null;
        }
    },

    /**
     * Sends the Expo Push Token to the backend database using the authenticated API client.
     */
    async sendTokenToBackend(token: string): Promise<boolean> {
        if (!token) return false;
        
        try {
            // We do not need to pass authToken manually because the `api` client uses interceptors 
            // to append the Bearer token automatically if the user is authenticated.
            const res = await api.post('user/push-token', { token });
            console.log('Push token successfully synced with backend:', res.data);
            return true;
        } catch (error: any) {
            console.error('Failed to sync push token with backend:', error?.response?.data || error?.message || error);
            return false;
        }
    }
};
