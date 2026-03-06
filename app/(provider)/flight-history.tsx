import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getFlightHistory, FlightRequestItem } from '../utils/flight';

const FlightHistory = () => {
    const router = useRouter();
    const [history, setHistory] = useState<FlightRequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = async () => {
        setError(null);
        const result = await getFlightHistory();
        if (result.success && result.data) {
            setHistory(result.data);
            console.log("Flight history loaded successfully", result.data);
        } else {
            setError(result.error || 'Failed to fetch flight history.');
        }
    };

    const initialLoad = async () => {
        setIsLoading(true);
        await loadHistory();
        setIsLoading(false);
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        await loadHistory();
        setIsRefreshing(false);
    };

    useEffect(() => {
        initialLoad();
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `${day} ${month}, ${year}`;
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="airplane-outline" size={64} color="#CBD5E1" style={{ marginBottom: 16, transform: [{ rotate: '-45deg' }] }} />
            <Text style={styles.emptyTitle}>No flights found</Text>
            <Text style={styles.emptySub}>You haven't made any flight requests yet.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
                <Text style={styles.emptyBtnText}>Book a Flight</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }: { item: FlightRequestItem }) => {
        const isRoundTrip = item.tripType === 'ROUND_TRIP';
        const displayStatus = item.status === 'CANCELLED' ? 'CANCELLED' : "Finding Best Price";

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.destinationRow}>
                        <Text style={styles.airportCode}>{item.origin}</Text>
                        <Ionicons name="airplane" size={20} color="#CBD5E1" style={{ marginHorizontal: 16, transform: [{ rotate: '45deg' }] }} />
                        <Text style={styles.airportCode}>{item.destination}</Text>
                    </View>

                    <View style={styles.datesRow}>
                        <View style={styles.datesContainer}>
                            <View style={styles.dateBlock}>
                                <Ionicons name="calendar-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                                <Text style={styles.dateText}>{formatDate(item.targetDate)}</Text>
                            </View>
                            {isRoundTrip && item.returnDate && (
                                <>
                                    <View style={styles.dotSeparator} />
                                    <View style={styles.dateBlock}>
                                        <Ionicons name="calendar-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                                        <Text style={styles.dateText}>{formatDate(item.returnDate)}</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                    <View style={styles.tripTypePill}>
                        <Text style={styles.tripTypeText}>
                            {item.tripType.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                <View style={styles.statusPill}>
                    {
                        item.status !== 'CANCELLED' && (
                            <ActivityIndicator size="small" color="#64748B" style={{ marginRight: 8 }} />
                        )
                    }
                    <Text style={styles.statusText}>{displayStatus}</Text>
                </View>

                {item.status === 'PENDING' && (
                    <View style={styles.infoBox}>
                        <View style={styles.infoIconWrapper}>
                            <Ionicons name="alert-circle-outline" size={16} color="#64748B" />
                        </View>
                        <Text style={styles.infoText}>
                            We are currently sourcing the best prices for you. Check back shortly.
                        </Text>
                    </View>
                )}

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                    <Text style={styles.idText}>ID: {item.reference?.split("-")[0] || item.id?.split("-")[0] || 'N/A'}</Text>
                    <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => router.push({ pathname: '/flight-details', params: { flightData: JSON.stringify(item) } })}
                    >
                        <Text style={styles.detailsBtnText}>DETAILS</Text>
                        <Ionicons name="airplane" size={14} color="#0F172A" style={{ marginLeft: 6, transform: [{ rotate: '45deg' }] }} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.titleRow}>
                    <View style={styles.clockBox}>
                        <Ionicons name="time-outline" size={26} color="#FFF" />
                    </View>
                    <Text style={styles.headerTitle}>My Flights</Text>
                </View>
                <Text style={styles.headerSub}>Manage your premium flight requests and past bookings.</Text>
            </View>

            {/* Body */}
            <View style={styles.listContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#003366" />
                        <Text style={styles.loadingText}>Loading history...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 16 }} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={initialLoad}>
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={history}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.flatListContent}
                        ListEmptyComponent={renderEmptyComponent}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#003366" />
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        marginTop: 40
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    clockBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSub: {
        fontSize: 15,
        color: '#CBD5E1',
        lineHeight: 22,
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        overflow: 'hidden',
    },
    flatListContent: {
        padding: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    // Card Styles
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        marginBottom: 16,
    },
    destinationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    airportCode: {
        fontSize: 34,
        fontWeight: '400',
        color: '#0F172A',
    },
    datesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    datesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateBlock: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        letterSpacing: 0.5,
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 12,
    },
    tripTypePill: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-end',
    },
    tripTypeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.5,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    infoIconWrapper: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginTop: 8,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    idText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    detailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    detailsBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
    // States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748B',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryBtn: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
    },
    emptyBtn: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    emptyBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default FlightHistory;
