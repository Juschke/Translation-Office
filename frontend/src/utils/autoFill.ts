import axios from 'axios';

/**
 * Fetches city name based on postal code using OpenPLZ API.
 * Currently optimized for Germany (DE), Austria (AT), and Switzerland (CH).
 */
export const fetchCityByZip = async (zip: string, countryCode: string = 'DE'): Promise<string | null> => {
    if (!zip || zip.length < 4) return null;

    try {
        // Mapping for OpenPLZ API
        const countryMap: Record<string, string> = {
            'DE': 'de',
            'Deutschland': 'de',
            'AT': 'at',
            'Österreich': 'at',
            'CH': 'ch',
            'Schweiz': 'ch'
        };

        const apiCountry = countryMap[countryCode] || 'de';
        const response = await axios.get(`https://openplzapi.org/${apiCountry}/Localities`, {
            params: { postalCode: zip }
        });

        if (response.data && response.data.length > 0) {
            // Usually returns an array of localities, we take the first one
            return response.data[0].name;
        }
    } catch (error) {
        console.error('Error fetching city by ZIP:', error);
    }
    return null;
};

/**
 * Fetches bank details (Bank Name, BIC) based on IBAN using OpenIBAN API.
 */
export const fetchBankByIban = async (iban: string): Promise<{ bankName: string; bic: string } | null> => {
    const cleanIban = iban.replace(/\s/g, '');
    if (cleanIban.length < 15) return null;

    try {
        const response = await axios.get(`https://openiban.com/validate/${cleanIban}?get_bank=true`);

        if (response.data && response.data.valid && response.data.bankData) {
            return {
                bankName: response.data.bankData.name || '',
                bic: response.data.bankData.bic || ''
            };
        }
    } catch (error) {
        console.error('Error fetching bank by IBAN:', error);
    }
    return null;
};
