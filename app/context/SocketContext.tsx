import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from './AppContext';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { isAuthenticated } = useContext(AuthContext);

    useEffect(() => {
        let newSocket: Socket | null = null;

        const connectSocket = async () => {
            if (!isAuthenticated) return;

            try {
                const accessToken = await AsyncStorage.getItem("accessToken");
                let token = accessToken;

                if (!token) {
                    const loginObjStr = await AsyncStorage.getItem("login_obj");
                    if (loginObjStr) {
                        const parsed = JSON.parse(loginObjStr);
                        token = parsed.data?.accessToken || parsed.accessToken;
                    }
                }

                newSocket = io('https://dataappback.onrender.com', {
                    auth: { token },
                    transports: ['websocket'],
                    reconnection: true,
                });

                // Use catch-all to trigger a UI refresh anytime the backend pushes data
                newSocket.onAny((eventName, ...args) => {
                    console.log(`Socket received: ${eventName}`, args);
                    DeviceEventEmitter.emit('refreshData');
                });

                setSocket(newSocket);
            } catch (error) {
                console.log("Socket connection error:", error);
            }
        };

        connectSocket();

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
