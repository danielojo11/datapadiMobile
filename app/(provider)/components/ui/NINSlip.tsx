import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

export interface NINSlipData {
    surname?: string;
    firstname?: string;
    middlename?: string;
    trackingId?: string;
    nin?: string;
    gender?: string;
    photo?: string;
    base64Image?: string;
    residence_address?: string;
    residence_town?: string;
    residence_state?: string;
    [key: string]: any;
}

interface NINSlipProps {
    data: NINSlipData;
}

export const NINSlip: React.FC<NINSlipProps> = ({ data }) => {
    const [containerWidth, setContainerWidth] = useState<number>(350);

    const formatNIN = (val?: string) => {
        if (!val) return '62042149067';
        return val.replace(/\D/g, '');
    };

    const formatGender = (g?: string) => {
        if (!g) return 'M';
        const u = g.trim().toUpperCase();
        if (u === 'F' || u === 'FEMALE') return 'F';
        return 'M';
    };

    const trackingId = (data.trackingId || 'IRHJUMLHZ0005ED').toUpperCase();
    const surname = (data.surname || 'SALAWUDEEN').toUpperCase();
    const firstname = (data.firstname || 'TOYEEB').toUpperCase();
    const middlename = (data.middlename || '').toUpperCase();
    const nin = formatNIN(data.nin);
    const gender = formatGender(data.gender);

    const addressLines = [
        data.residence_address || '12 MAIN STREET',
        data.residence_town || 'IKEJA',
        data.residence_state || 'LAGOS',
    ].filter(Boolean);

    const photoSrc = data.photo || data.base64Image
        ? { uri: (data.photo || data.base64Image)?.startsWith('data:') ? (data.photo || data.base64Image) : `data:image/jpeg;base64,${data.photo || data.base64Image}` }
        : { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' };

    const onLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

    const BASE_WIDTH = 760;
    const s = containerWidth / BASE_WIDTH;

    return (
        <View style={styles.wrapper}>
            <Text style={styles.headerTitle}>STANDARD NIN SLIP</Text>
            
            <View style={styles.container} onLayout={onLayout}>
                <Image
                    source={require('../../../../assets/images/verification/NIN-Slip.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="stretch"
                />

                {/* Photo */}
                <View style={[styles.photoContainer, { left: '75.66%', top: '21.56%', width: '18.42%', height: '36.47%' }]}>
                    <Image source={photoSrc} style={styles.photo} resizeMode="cover" />
                </View>

                {/* Data Fields */}
                <Text style={[styles.textLabel, { left: '11.84%', top: '25.92%', fontSize: 10 * s }]}>
                    {trackingId}
                </Text>

                <Text style={[styles.textLabel, { left: '36.84%', top: '25.92%', fontSize: 10 * s }]}>
                    {surname}
                </Text>

                <Text style={[styles.textLabel, { left: '11.84%', top: '37.16%', fontSize: 10 * s, letterSpacing: 1.5 * s }]}>
                    {nin}
                </Text>

                <Text style={[styles.textLabel, { left: '36.84%', top: '37.39%', fontSize: 10 * s }]}>
                    {firstname}
                </Text>

                <Text style={[styles.textLabel, { left: '36.84%', top: '46.56%', fontSize: 10 * s }]}>
                    {middlename}
                </Text>

                <Text style={[styles.textLabel, { left: '33.29%', top: '54.13%', fontSize: 10 * s }]}>
                    {gender}
                </Text>

                {/* Address Block */}
                <View style={[styles.addressContainer, { left: '52.24%', top: '29.82%', width: '21.71%' }]}>
                    {addressLines.map((line, idx) => (
                        <Text key={idx} style={[styles.addressText, { fontSize: 12 * s, lineHeight: 12 * s * 1.4 }]}>
                            {line}
                        </Text>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 12,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    container: {
        width: '100%',
        aspectRatio: 760 / 436,
        backgroundColor: '#FFF',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
    },
    photoContainer: {
        position: 'absolute',
        overflow: 'hidden',
        zIndex: 20,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    textLabel: {
        position: 'absolute',
        color: '#000',
        fontFamily: 'serif', // closest to Times New Roman natively without importing a font
        zIndex: 20,
    },
    addressContainer: {
        position: 'absolute',
        zIndex: 20,
    },
    addressText: {
        color: '#000',
        fontFamily: 'serif',
    }
});
