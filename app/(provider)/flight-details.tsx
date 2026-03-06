import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FlightRequestItem, cancelFlightRequest } from '../utils/flight';
import { SafeAreaView } from 'react-native-safe-area-context';

const FlightDetails = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [flight, setFlight] = useState<FlightRequestItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (params.flightData) {
            try {
                const parsed = JSON.parse(params.flightData as string);
                setFlight(parsed);
            } catch (err) {
                console.error("Failed to parse flight data", err);
            }
        }
    }, [params.flightData]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Request',
            'Are you sure you want to cancel this flight request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        if (!flight?.id) return;
                        setIsSubmitting(true);
                        try {
                            const res = await cancelFlightRequest(flight.id);
                            if (res.success) {
                                Alert.alert('Success', 'Flight request cancelled successfully.');
                                setFlight((prev) => prev ? { ...prev, status: 'CANCELLED' } : null);
                            } else {
                                Alert.alert('Error', res.error || 'Failed to cancel request.');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'An error occurred.');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    if (!flight) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFF" />
            </SafeAreaView>
        );
    }

    const isRoundTrip = flight.tripType === 'ROUND_TRIP';
    const totalPassengers = (flight.adults || 0) + (flight.children || 0) + (flight.infants || 0);

    return (
        <SafeAreaView style={styles.container}>
            <SafeAreaView style={styles.topSection}>
                {/* Header Sequence */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/flight-history')}>
                        <Ionicons name="arrow-back" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Flight Details</Text>
                </View>

                {/* Overarching Dark Card */}
                <View style={styles.flightCard}>
                    {/* Top Pills */}
                    <View style={styles.cardTopRow}>
                        <Text style={styles.tripTypeText}>{flight.tripType.replace('_', ' ')}</Text>
                        <View style={styles.statusPill}>
                            <Text style={styles.statusText}>{flight.status === 'PENDING' ? 'FUTURE HELD' : flight.status}</Text>
                        </View>
                    </View>

                    {/* Route Info */}
                    <View style={styles.routeRow}>
                        <Text style={styles.airportCode}>{flight.origin}</Text>

                        {/* Custom Route Divider */}
                        <View style={styles.routeDividerContainer}>
                            <View style={styles.dividerLine} />
                            <View style={styles.airplaneCircle}>
                                <Ionicons name="airplane" size={16} color="#94A3B8" style={{ transform: [{ rotate: '45deg' }] }} />
                            </View>
                            <View style={styles.dividerLine} />
                        </View>

                        <Text style={styles.airportCode}>{flight.destination}</Text>
                    </View>

                    {/* Horizontal Break */}
                    <View style={styles.horizontalBreak} />

                    {/* Date Row */}
                    <View style={styles.dateRow}>
                        <View style={styles.dateItem}>
                            <Ionicons name="calendar-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                            <Text style={styles.dateText}>{formatDate(flight.targetDate)}</Text>
                        </View>

                        {isRoundTrip && flight.returnDate && (
                            <>
                                <Text style={styles.dateDash}>—</Text>
                                <View style={styles.dateItem}>
                                    <Ionicons name="calendar-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                                    <Text style={styles.dateText}>{formatDate(flight.returnDate)}</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Passengers Row */}
                    <View style={styles.passengersRow}>
                        <Text style={styles.passengerCount}>{totalPassengers}</Text>
                        <Text style={styles.passengerLabel}>PASSENGER(S)</Text>
                    </View>

                </View>
            </SafeAreaView>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                <View style={styles.loadingCircleContainer}>
                    <View style={styles.loadingCircle}>
                        {
                            flight.status === "CANCELLED" ? (
                                <Ionicons name="close-circle" size={24} color="#0F172A" />
                            ) : (

                                <ActivityIndicator size="large" color="#0F172A" />
                            )
                        }
                    </View>
                </View>

                {
                    flight.status === 'CANCELLED' ? (
                        <>
                            <Text style={styles.bottomTitle}>Request Cancelled</Text>
                            <Text style={styles.bottomDesc}>
                                The flight request has been cancelled and is no longer active.
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.bottomTitle}>Curating Best Options</Text>
                            <Text style={styles.bottomDesc}>
                                Our travel experts are manually sourcing the most comfortable and cost-effective flights for your journey. We will notify you shortly.
                            </Text>
                            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#94A3B8" />
                                ) : (
                                    <>
                                        <Ionicons name="close-circle-outline" size={18} color="#94A3B8" />
                                        <Text style={styles.cancelBtnText}>CANCEL RESERVATION</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )
                }


            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    topSection: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 16,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    flightCard: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    tripTypeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#CBD5E1',
        letterSpacing: 1.5,
    },
    statusPill: {
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#CBD5E1',
        letterSpacing: 0.5,
    },
    routeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    airportCode: {
        fontSize: 36,
        color: '#FFF',
        fontWeight: '400',
    },
    routeDividerContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    airplaneCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    horizontalBreak: {
        height: 1,
        backgroundColor: '#334155',
        marginBottom: 20,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        color: '#E2E8F0',
    },
    dateDash: {
        color: '#475569',
        marginHorizontal: 12,
    },
    passengersRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passengerCount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
        marginRight: 6,
    },
    passengerLabel: {
        fontSize: 12,
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    bottomSection: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 32,
        alignItems: 'center',
        paddingTop: 40,
    },
    loadingCircleContainer: {
        marginBottom: 24,
    },
    cancelBtn: {
        marginTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    cancelBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 1.2,
    },
    loadingCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 16,
    },
    bottomDesc: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
    }
});

export default FlightDetails;
