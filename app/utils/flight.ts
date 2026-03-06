import api from "./api";

// --- TYPES & INTERFACES ---

export interface FlightRequestPayload {
    origin: string;
    destination: string;
    targetDate: string; // ISO String format
    returnDate?: string; // Optional ISO String for round trips
    tripType: 'ONE_WAY' | 'ROUND_TRIP';
    flightClass: string;
    adults: number;
    children: number;
    infants: number;
}

export interface FlightPassenger {
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO string format
    gender: 'MALE' | 'FEMALE';
}

export interface FlightSelectionPayload {
    selectedOptionId: string;
    passengers: FlightPassenger[];
}

export interface Airport {
    name: string;
    code: string;
    location: string;
}

export interface FlightRequestItem {
    id: string;
    reference: string;
    origin: string;
    destination: string;
    targetDate: string;
    returnDate?: string;
    tripType: 'ONE_WAY' | 'ROUND_TRIP';
    flightClass: string;
    status: string;
    createdAt: string;
    adults: number;
    children: number;
    infants: number;
    // extra fields needed for details view based on status
    eTicketUrl?: string;
    airlineName?: string;
    sellingPrice?: number | string;
    flightOptions?: any[];
}

// --- FLIGHT API ROUTES ---

/**
 * Screen 1: Submit a new flight request
 */
export async function requestFlight(payload: FlightRequestPayload) {
    try {
        const response = await api.post("flights/user/request", payload);
        const result = response.data;

        return {
            success: true,
            data: result.data,
            message: result.message,
        };
    } catch (error: any) {
        console.error('Request Flight Error:', error);
        return { success: false, error: error?.response?.data?.message || 'Network connection failed' };
    }
}

/**
 * Screen 3: User selects an option and provides passenger details
 */
export async function selectFlightOption(requestId: string, payload: FlightSelectionPayload) {
    try {
        const response = await api.post(`flights/user/${requestId}/select`, payload);
        const result = response.data;

        return {
            success: true,
            data: result.data,
            message: result.message,
        };
    } catch (error: any) {
        console.error('Select Flight Option Error:', error);
        return { success: false, error: error?.response?.data?.message || 'Network connection failed' };
    }
}

/**
 * Screen 4: User pays for the flight
 */
export async function payForFlight(requestId: string) {
    try {
        const response = await api.post(`flights/user/${requestId}/pay`, {});
        const result = response.data;

        return {
            success: true,
            data: result.data,
            message: result.message,
        };
    } catch (error: any) {
        console.error('Pay for Flight Error:', error);
        return { success: false, error: error?.response?.data?.message || 'Network connection failed' };
    }
}

/**
 * Utility: Fetch all user's flight requests for the dashboard
 */
export async function getUserFlights() {
    try {
        const response = await api.get('flights/user/requests');
        const result = response.data;

        return {
            success: true,
            data: result.data,
        };
    } catch (error: any) {
        console.error('Get User Flights Error:', error);
        return { success: false, error: error?.response?.data?.message || 'Network connection failed' };
    }
}

/**
 * Utility: Fetch a single flight request by ID to display options and details
 */
export async function getFlightRequest(requestId: string) {
    try {
        const response = await api.get(`flights/user/requests/${requestId}`);
        const result = response.data;

        console.log(result.data)

        return {
            success: true,
            data: result.data,
        };
    } catch (error: any) {
        console.error('Get Flight Request Error:', error);
        return { success: false, error: error?.response?.data?.message || 'Network connection failed' };
    }
}

/**
 * Screen Edge: User Cancels a request
 */
export async function cancelFlightRequest(requestId: string) {
    try {
        const response = await api.post(`flights/user/${requestId}/cancel`, {});
        const result = response.data;

        return {
            success: true,
            data: result.data,
            message: result.message,
        };
    } catch (error: any) {
        console.error('Cancel Flight Error:', error);
        return { success: false, error: error?.response?.data?.message || 'Network connection failed' };
    }
}

/**
 * Utility: Fetch available airports from the backend API
 */
export async function getAirports() {
    try {
        const response = await api.get('flights/user/airports');
        const result = response.data;

        const airportsList = Array.isArray(result.data) ? result.data : (result.data?.airports || []);

        return {
            success: true,
            data: airportsList,
        };
    } catch (error: any) {
        console.error('Get Airports Error:', error);
        return { success: false, error: error?.response?.data?.message || 'Network connection failed' };
    }
}

/**
 * Utility: Fetch flight history (existing wrapper)
 */
export async function getFlightHistory(): Promise<{ success: boolean; data?: FlightRequestItem[]; error?: string }> {
    try {
        const response = await api.get("flights/user/requests");
        const result = response.data;
        return {
            success: true,
            data: result.data || [],
        };
    } catch (error: any) {
        console.error("Get Flight History Error:", error);
        return {
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch flight history."
        };
    }
}
