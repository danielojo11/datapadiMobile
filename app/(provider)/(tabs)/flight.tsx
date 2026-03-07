import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { getAirports, requestFlight, FlightRequestPayload, Airport } from '../../utils/flight';

type TripType = 'ONE_WAY' | 'ROUND_TRIP';
type FlightClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

const Flight = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [tripType, setTripType] = useState<TripType>('ONE_WAY');

    // Form State
    const [origin, setOrigin] = useState<Airport | null>(null);
    const [destination, setDestination] = useState<Airport | null>(null);
    const [targetDate, setTargetDate] = useState<Date | null>(null);
    const [returnDate, setReturnDate] = useState<Date | null>(null);
    const [flightClass, setFlightClass] = useState<FlightClass>('ECONOMY');

    // Passengers
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);

    // Modals
    const [showOriginModal, setShowOriginModal] = useState(false);
    const [showDestModal, setShowDestModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Date Pickers
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState<'target' | 'return'>('target');

    const openDatePicker = (mode: 'target' | 'return') => {
        setDatePickerMode(mode);
        setShowDatePicker(true);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            if (datePickerMode === 'target') {
                setTargetDate(selectedDate);
                if (returnDate && selectedDate >= returnDate) {
                    setReturnDate(null);
                }
            } else {
                setReturnDate(selectedDate);
            }
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Airports
    const [airports, setAirports] = useState<Airport[]>([]);
    const [isAirportsLoading, setIsAirportsLoading] = useState(true);

    useEffect(() => {
        const fetchAirportsData = async () => {
            setIsAirportsLoading(true);
            setErrorMessage('');
            const result = await getAirports();
            if (result.success && result.data) {
                setAirports(result.data);
            } else {
                setErrorMessage(result.error || 'Failed to fetch airports');
            }
            setIsAirportsLoading(false);
        };

        fetchAirportsData();
    }, []);

    const filteredAirports = airports.filter(ap =>
        ap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ap.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ap.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = async () => {
        setErrorMessage('');
        if (!origin || !destination || !targetDate) {
            setErrorMessage('Please fill in all required fields (Origin, Destination, Date).');
            return;
        }

        if (tripType === 'ROUND_TRIP' && !returnDate) {
            setErrorMessage('Please select a return date for your round trip.');
            return;
        }

        if (tripType === 'ROUND_TRIP' && returnDate && targetDate && returnDate <= targetDate) {
            setErrorMessage('Return date must be after departure date.');
            return;
        }

        setIsLoading(true);

        const payload: FlightRequestPayload = {
            origin: origin.code.toUpperCase(),
            destination: destination.code.toUpperCase(),
            targetDate: targetDate.toISOString(),
            tripType,
            flightClass,
            adults,
            children,
            infants,
        };

        if (tripType === 'ROUND_TRIP' && returnDate) {
            payload.returnDate = returnDate.toISOString();
        }

        const result = await requestFlight(payload);

        if (result.success) {
            Alert.alert(
                'Flight Requested',
                'Flight request submitted! We are sourcing the best prices for you.',
                [{ text: 'OK', onPress: () => { /* Optionally reset form or navigate to bookings */ } }]
            );
        } else {
            setErrorMessage(result.error || 'Failed to submit request.');
        }

        setIsLoading(false);
    };

    const renderAirportModal = (type: 'origin' | 'destination') => {
        const isShow = type === 'origin' ? showOriginModal : showDestModal;
        const close = () => {
            if (type === 'origin') setShowOriginModal(false);
            else setShowDestModal(false);
            setSearchQuery('');
        };
        const onSelect = (ap: Airport) => {
            if (type === 'origin') setOrigin(ap);
            else setDestination(ap);
            close();
        };

        return (
            <Modal visible={isShow} animationType="slide" onRequestClose={close}>
                <SafeAreaView style={styles.modalSafeArea}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={close} style={styles.closeBtn}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select {type === 'origin' ? 'Origin' : 'Destination'}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search airports by name or code..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>

                    {isAirportsLoading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#003366" />
                    ) : (
                        <ScrollView style={styles.airportList}>
                            {filteredAirports.map((ap) => (
                                <TouchableOpacity
                                    key={ap.code}
                                    style={styles.airportItem}
                                    onPress={() => onSelect(ap)}
                                >
                                    <View style={styles.airportIconContainer}>
                                        <Ionicons name="location" size={20} color="#6B7280" />
                                    </View>
                                    <View style={styles.airportInfo}>
                                        <Text style={styles.airportName} numberOfLines={1}>{ap.name}</Text>
                                        <Text style={styles.airportLocation}>{ap.location}</Text>
                                    </View>
                                    <View style={styles.airportCodeTag}>
                                        <Text style={styles.airportCodeText}>{ap.code}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.header}>
                        <View style={styles.headerContentContainer}>
                            <View style={styles.headerIconContainer}>
                                <Ionicons name="airplane" size={28} color="#FFF" style={{ transform: [{ rotate: '-45deg' }] }} />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Book Flights</Text>
                                <Text style={styles.headerSub}>Find the best premium flights easily</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/flight-history')}>
                            <Ionicons name="time-outline" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        {errorMessage ? (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        ) : null}
                        {/* Trip Type Tabs */}
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={[styles.tabButton, tripType === 'ONE_WAY' && styles.tabButtonActive]}
                                onPress={() => setTripType('ONE_WAY')}
                            >
                                <Text style={[styles.tabText, tripType === 'ONE_WAY' && styles.tabTextActive]}>One Way</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, tripType === 'ROUND_TRIP' && styles.tabButtonActive]}
                                onPress={() => setTripType('ROUND_TRIP')}
                            >
                                <Text style={[styles.tabText, tripType === 'ROUND_TRIP' && styles.tabTextActive]}>Round Trip</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Origin / Dest */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>From</Text>
                            <TouchableOpacity style={styles.inputBox} onPress={() => setShowOriginModal(true)}>
                                <Ionicons name="airplane-outline" size={20} color="#6B7280" style={{ transform: [{ rotate: '-45deg' }] }} />
                                <Text style={[styles.inputText, !origin && styles.placeholderText]}>
                                    {origin ? `${origin.name} (${origin.code})` : 'Select Origin'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>To</Text>
                            <TouchableOpacity style={styles.inputBox} onPress={() => setShowDestModal(true)}>
                                <Ionicons name="airplane-outline" size={20} color="#6B7280" style={{ transform: [{ rotate: '-45deg' }] }} />
                                <Text style={[styles.inputText, !destination && styles.placeholderText]}>
                                    {destination ? `${destination.name} (${destination.code})` : 'Select Destination'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Dates */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Departure Date</Text>
                                <TouchableOpacity style={styles.inputBox} onPress={() => openDatePicker('target')}>
                                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                    <Text style={[styles.inputText, !targetDate && styles.placeholderText]}>
                                        {targetDate ? formatDate(targetDate) : 'Select Date'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {tripType === 'ROUND_TRIP' && (
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.label}>Return Date</Text>
                                    <TouchableOpacity style={styles.inputBox} onPress={() => openDatePicker('return')}>
                                        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                        <Text style={[styles.inputText, !returnDate && styles.placeholderText]}>
                                            {returnDate ? formatDate(returnDate) : 'Select Date'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Cabin Class */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Cabin Class</Text>
                            <View style={styles.pillsContainer}>
                                {['ECONOMY', 'BUSINESS', 'FIRST'].map((cls) => (
                                    <TouchableOpacity
                                        key={cls}
                                        style={[styles.pill, flightClass === cls && styles.pillActive]}
                                        onPress={() => setFlightClass(cls as FlightClass)}
                                    >
                                        <Text style={[styles.pillText, flightClass === cls && styles.pillTextActive]}>
                                            {cls.charAt(0) + cls.slice(1).toLowerCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Travelers */}
                        <View style={styles.travelersContainer}>
                            <Text style={styles.travelersTitle}>Travelers</Text>

                            <View style={styles.travelerRow}>
                                <View>
                                    <Text style={styles.travelerType}>Adults</Text>
                                    <Text style={styles.travelerSub}>12+ years</Text>
                                </View>
                                <View style={styles.counter}>
                                    <TouchableOpacity onPress={() => setAdults(Math.max(1, adults - 1))} style={styles.counterBtn}>
                                        <Ionicons name="remove" size={16} color="#111827" />
                                    </TouchableOpacity>
                                    <Text style={styles.counterValue}>{adults}</Text>
                                    <TouchableOpacity onPress={() => setAdults(Math.min(9, adults + 1))} style={styles.counterBtnDark}>
                                        <Ionicons name="add" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.divider} />

                            <View style={styles.travelerRow}>
                                <View>
                                    <Text style={styles.travelerType}>Children</Text>
                                    <Text style={styles.travelerSub}>2-11 years</Text>
                                </View>
                                <View style={styles.counter}>
                                    <TouchableOpacity onPress={() => setChildren(Math.max(0, children - 1))} style={styles.counterBtn}>
                                        <Ionicons name="remove" size={16} color="#111827" />
                                    </TouchableOpacity>
                                    <Text style={styles.counterValue}>{children}</Text>
                                    <TouchableOpacity onPress={() => setChildren(Math.min(9, children + 1))} style={styles.counterBtnDark}>
                                        <Ionicons name="add" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.divider} />

                            <View style={styles.travelerRow}>
                                <View>
                                    <Text style={styles.travelerType}>Infants</Text>
                                    <Text style={styles.travelerSub}>Under 2 years</Text>
                                </View>
                                <View style={styles.counter}>
                                    <TouchableOpacity onPress={() => setInfants(Math.max(0, infants - 1))} style={styles.counterBtn}>
                                        <Ionicons name="remove" size={16} color="#111827" />
                                    </TouchableOpacity>
                                    <Text style={styles.counterValue}>{infants}</Text>
                                    <TouchableOpacity onPress={() => setInfants(Math.min(adults, infants + 1))} style={styles.counterBtnDark}>
                                        <Ionicons name="add" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleSearch}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="search" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.submitBtnText}>Find Flights</Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {showDatePicker && (
                <DateTimePicker
                    value={
                        datePickerMode === 'target'
                            ? (targetDate || new Date())
                            : (returnDate || targetDate || new Date())
                    }
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={datePickerMode === 'target' ? new Date() : (targetDate || new Date())}
                />
            )}
            {renderAirportModal('origin')}
            {renderAirportModal('destination')}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSub: {
        fontSize: 14,
        color: '#CBD5E1',
        marginTop: 4,
    },
    formContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: -20,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabButtonActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    tabTextActive: {
        color: '#0F172A',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
    },
    inputText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginLeft: 12,
    },
    placeholderText: {
        color: '#94A3B8',
        fontWeight: '500',
    },
    textInputStyle: {
        flex: 1,
        height: '100%',
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    row: {
        flexDirection: 'row',
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
    },
    pillActive: {
        backgroundColor: '#0F172A',
        borderColor: '#0F172A',
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    pillTextActive: {
        color: '#FFF',
    },
    travelersContainer: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#F8FAFC',
        marginBottom: 24,
    },
    travelersTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    travelerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    travelerType: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    travelerSub: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterBtnDark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        width: 32,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    submitBtn: {
        height: 56,
        backgroundColor: '#003366',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Modal Styles
    modalSafeArea: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    closeBtn: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        paddingHorizontal: 16,
        height: 48,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#0F172A',
    },
    airportList: {
        flex: 1,
    },
    airportItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    airportIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    airportInfo: {
        flex: 1,
        marginRight: 12,
    },
    airportName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 2,
    },
    airportLocation: {
        fontSize: 12,
        color: '#64748B',
    },
    airportCodeTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 6,
    },
    airportCodeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    errorBox: {
        backgroundColor: "#FEE2E2",
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
});

export default Flight;