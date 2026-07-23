import * as Updates from 'expo-updates';
import NetInfo from '@react-native-community/netinfo';

export const checkForUpdates = async () => {
    try {
        const update = await Updates.checkForUpdateAsync();
        return update.isAvailable;
    } catch (error) {
        console.error("Update check failed:", error);
        throw error;
    }
};

export const downloadUpdate = async () => {
    try {
        await Updates.fetchUpdateAsync();
    } catch (error) {
        console.error("Download failed:", error);
        throw error;
    }
};

export const applyUpdate = async () => {
    try {
        console.log("Reloading application...");
        await Updates.reloadAsync();
    } catch (error) {
        console.error("Apply update failed:", error);
        throw error;
    }
};

export const checkAndUpdate = async (onDownloading?: () => void): Promise<'NO_UPDATE' | 'DOWNLOADED' | 'ERROR' | 'OFFLINE'> => {
    try {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            console.log("Offline: Skipping OTA updates.");
            return 'OFFLINE';
        }

        if (__DEV__) {
            console.log("Development mode: Skipping OTA updates.");
            return 'NO_UPDATE';
        }

        console.log("Checking for OTA updates...");
        const isAvailable = await checkForUpdates();
        if (!isAvailable) {
            console.log("No updates available.");
            return 'NO_UPDATE';
        }

        console.log("Update found. Downloading update...");
        if (onDownloading) {
            onDownloading();
        }
        
        await downloadUpdate();
        
        console.log("Update downloaded.");
        return 'DOWNLOADED';
    } catch (error) {
        console.error("Update failed:", error);
        return 'ERROR';
    }
};

export default {
    checkForUpdates,
    downloadUpdate,
    applyUpdate,
    checkAndUpdate,
};
