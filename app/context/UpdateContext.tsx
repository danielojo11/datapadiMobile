import React, { createContext, useState, ReactNode } from 'react';
import { checkAndUpdate, applyUpdate as applyUpdateService } from '../services/otaUpdate';

interface UpdateContextProps {
    checking: boolean;
    available: boolean;
    downloading: boolean;
    downloaded: boolean;
    error: string | null;
    checkForUpdates: () => Promise<void>;
    applyUpdate: () => Promise<void>;
}

export const UpdateContext = createContext<UpdateContextProps>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    checkForUpdates: async () => {},
    applyUpdate: async () => {},
});

export const UpdateProvider = ({ children }: { children: ReactNode }) => {
    const [checking, setChecking] = useState(false);
    const [available, setAvailable] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckForUpdates = async () => {
        if (checking || downloading || downloaded) return;
        
        setChecking(true);
        setError(null);
        
        try {
            const result = await checkAndUpdate(() => {
                setAvailable(true);
                setDownloading(true);
            });
            
            if (result === 'DOWNLOADED') {
                setAvailable(true);
                setDownloaded(true);
            } else if (result === 'ERROR') {
                setError("Failed to fetch or download the update.");
            }
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred");
        } finally {
            setChecking(false);
            setDownloading(false);
        }
    };

    const handleApplyUpdate = async () => {
        try {
            await applyUpdateService();
        } catch (e: any) {
            setError(e.message || "Failed to apply update");
        }
    };

    return (
        <UpdateContext.Provider value={{
            checking,
            available,
            downloading,
            downloaded,
            error,
            checkForUpdates: handleCheckForUpdates,
            applyUpdate: handleApplyUpdate
        }}>
            {children}
        </UpdateContext.Provider>
    );
};
