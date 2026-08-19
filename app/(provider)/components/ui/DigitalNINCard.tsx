import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

export interface NINCardData {
    surname?: string;
    lastname?: string;
    firstname?: string;
    middlename?: string;
    birthdate?: string;
    dateOfBirth?: string;
    gender?: string;
    nin?: string;
    photo?: string;
    base64Image?: string;
    issueDate?: string;
    verificationRef?: string;
    [key: string]: any;
}

interface DigitalNINCardProps {
    data: NINCardData;
}

export const DigitalNINCard: React.FC<DigitalNINCardProps> = ({ data }) => {
    const [containerWidth, setContainerWidth] = useState<number>(350);

    const formatNIN = (val?: string) => {
        if (!val) return '6204  214  9067';
        const clean = val.replace(/\D/g, '');
        if (clean.length === 11) {
            return `${clean.slice(0, 4)}  ${clean.slice(4, 7)}  ${clean.slice(7)}`;
        }
        return val;
    };

    const formatGender = (g?: string) => {
        if (!g) return 'M';
        const u = g.trim().toUpperCase();
        if (u === 'F' || u === 'FEMALE') return 'F';
        return 'M';
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '30 APR 2000';
        try {
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
                let day = parts[0], month = parts[1], year = parts[2];
                if (day.length === 4) { year = parts[0]; month = parts[1]; day = parts[2]; }
                const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                const mStr = months[parseInt(month, 10) - 1] || month.toUpperCase().slice(0, 3);
                return `${day.padStart(2, '0')} ${mStr} ${year}`;
            }
            return dateStr.toUpperCase();
        } catch { return dateStr; }
    };

    const surname = (data.surname || data.lastname || 'SALAWUDEEN').toUpperCase();
    const givenNames = `${data.firstname || 'TOYEEB'} ${data.middlename || ''}`.trim().toUpperCase();
    const dob = formatDate(data.birthdate || data.dateOfBirth);
    const sex = formatGender(data.gender);
    const rawNin = data.nin || '62042149067';
    const ninFormatted = formatNIN(rawNin);
    const issueDate = formatDate(data.issueDate || '14 OCT 2024');

    const photoSrc = data.photo || data.base64Image
        ? { uri: (data.photo || data.base64Image)?.startsWith('data:') ? (data.photo || data.base64Image) : `data:image/jpeg;base64,${data.photo || data.base64Image}` }
        : { uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' };

    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&margin=0&data=${encodeURIComponent(
        `NIN:${rawNin}|REF:${data.verificationRef || data.verification?.reference || 'MFT-NIN-NIMC'}|AUTH:MUFTIPAY`
    )}`;

    const onLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

    // Base dimensions for scaling fonts
    const BASE_WIDTH = 800;
    const s = containerWidth / BASE_WIDTH;

    return (
        <View style={styles.wrapper}>
            <Text style={styles.headerTitle}>DIGITAL NIN CARD</Text>
            
            <View style={styles.container} onLayout={onLayout}>
                <Image
                    source={require('../../../../assets/images/verification/NIN-Card.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="stretch"
                />

                {/* Photo */}
                <View style={[styles.photoContainer, { left: '9.9%', top: '17%', width: '18.1%', height: '17.5%' }]}>
                    <Image source={photoSrc} style={styles.photo} resizeMode="cover" />
                </View>

                {/* QR Code */}
                <View style={[styles.qrContainer, { left: '69.0%', top: '10.4%', width: '21.9%', height: '15.6%' }]}>
                    <Image source={{ uri: qrDataUrl }} style={styles.qrImage} />
                    <View style={styles.qrLogoOverlay}>
                        <Image source={require('../../../../assets/images/verification/NINQRcodemiddelimage.jpg')} style={styles.qrLogo} resizeMode="contain" />
                    </View>
                </View>

                {/* Text Overlays */}
                <Text style={[styles.textOverlay, { left: '31%', top: '18.3%', right: '32%', fontSize: 15 * s, letterSpacing: 1.5 * s }]} numberOfLines={1}>
                    {surname}
                </Text>

                <Text style={[styles.textOverlay, { left: '31%', top: '24%', right: '32%', fontSize: 15 * s, letterSpacing: 1.5 * s }]} numberOfLines={1}>
                    {givenNames}
                </Text>

                <Text style={[styles.textOverlay, { left: '31%', top: '30.4%', fontSize: 17 * s, letterSpacing: 1 * s }]}>
                    {dob}
                </Text>

                <Text style={[styles.textOverlay, { left: '54%', top: '30.4%', fontSize: 17 * s, letterSpacing: 0.5 * s }]}>
                    {sex}
                </Text>

                <Text style={[styles.textOverlay, { left: '72%', top: '33.2%', width: '20%', fontSize: 19 * s, letterSpacing: 1 * s }]} adjustsFontSizeToFit numberOfLines={1}>
                    {issueDate}
                </Text>

                <Text style={[styles.ninOverlay, { top: '38.6%', fontSize: 38 * s, letterSpacing: 3 * s }]}>
                    {ninFormatted}
                </Text>
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
        aspectRatio: 800 / 1067,
        backgroundColor: '#FFF',
        borderRadius: 12,
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
        top: 0, // In original there was a mt-[16px] which is handled differently, adjusting here for absolute native look
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
    qrContainer: {
        position: 'absolute',
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        overflow: 'hidden',
    },
    qrImage: {
        width: '100%',
        height: '100%',
    },
    qrLogoOverlay: {
        position: 'absolute',
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrLogo: {
        width: '28%',
        height: '28%',
    },
    textOverlay: {
        position: 'absolute',
        color: '#1a1a1a',
        fontWeight: '500',
        fontFamily: 'sans-serif',
        zIndex: 20,
    },
    ninOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#000000',
        fontWeight: '500',
        fontFamily: 'monospace',
        zIndex: 20,
    }
});
