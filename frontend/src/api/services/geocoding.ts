import axios from 'axios';

export interface NominatimResult {
    display_name: string;
    address: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        postcode?: string;
        country?: string;
    };
    [key: string]: unknown;
}

/**
 * Sucht Straßenvorschläge für Deutschland via Nominatim OpenStreetMap.
 */
export async function searchStreetSuggestions(params: {
    street: string;
    city?: string;
    postalcode?: string;
}): Promise<NominatimResult[]> {
    const response = await axios.get<NominatimResult[]>(
        'https://nominatim.openstreetmap.org/search',
        {
            params: {
                street: params.street,
                city: params.city,
                postalcode: params.postalcode,
                country: 'Germany',
                format: 'json',
                limit: 5,
                addressdetails: 1,
            },
            headers: { 'Accept-Language': 'de' },
        }
    );
    return response.data ?? [];
}
