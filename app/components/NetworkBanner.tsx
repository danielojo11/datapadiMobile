import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from "@react-native-community/netinfo"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NetworkBanner() {
    const netInfo = useNetInfo();
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-150); // Start off-screen
    const [status, setStatus] = useState<'online' | 'offline' | null>(null);
    const [bannerText, setBannerText] = useState('');
    const [bannerColor, setBannerColor] = useState('#4CAF50');

    useEffect(() => {
        // Ignore initial null state
        if (netInfo.isConnected === null) return;

        if (netInfo.isConnected && status === 'offline') {
            setStatus('online');
            showBanner('Back Online', '#4CAF50'); // Green
        } else if (netInfo.isConnected === false && (status === 'online' || status === null)) {
            setStatus('offline');
            showBanner('No Internet Connection', '#F44336'); // Red
        } else if (status === null && netInfo.isConnected) {
            // Initially online, just set state without showing banner
            setStatus('online');
        }
    }, [netInfo.isConnected]);

    const showBanner = (text: string, color: string) => {
        setBannerText(text);
        setBannerColor(color);

        // Animate in, hold for 3 seconds, animate out
        translateY.value = withSequence(
            withTiming(0, { duration: 400 }),
            withDelay(3000, withTiming(-150, { duration: 400 }))
        );
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle, { paddingTop: insets.top }]}>
            <View style={[styles.banner, { backgroundColor: bannerColor }]}>
                <Text style={styles.text}>{bannerText}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
    },
    banner: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
