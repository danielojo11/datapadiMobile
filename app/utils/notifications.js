import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Register and get the push token
export async function registerForPushNotificationsAsync(authToken) {
    // Must be a physical device
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
    }

    // Get the Expo push token
    // Reading from expoConfig.extra.eas.projectId is the standard way for SDK 50+
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

    if (!projectId) {
        console.error('Project ID not found in expo config');
        return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('Expo Push Token:', token);

    // Send token to your backend
    if (authToken) {
        try {
            // Import the global API client which includes v1 mapping and Bearer headers automatically
            const api = require('./api').default;
            const res = await api.post('user/push-token', { token });
            console.log('Push token successfully sent to backend!', res.data);
        } catch (error) {
            console.error('Failed to save push token to backend:', error?.response?.data || error?.message || error);
        }
    } else {
        console.log('No auth token provided during register, skipping backend token registration');
    }

    // Android needs a notification channel
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
        });
    }

    return token;
}