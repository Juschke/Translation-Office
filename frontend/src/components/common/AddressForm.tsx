import React, { useState, useEffect } from 'react';
import Input from './Input';
import CountrySelect from './CountrySelect';
import { fetchCityByZip } from '../../utils/autoFill';
import axios from 'axios';
import { Label } from '../ui/label';

interface AddressFormProps {
    street: string;
    houseNo: string;
    zip: string;
    city: string;
    country: string;
    onChange: (field: string, value: string) => void;
    errors?: Record<string, string>;
}

const AddressForm: React.FC<AddressFormProps> = ({
    street,
    houseNo,
    zip,
    city,
    country,
    onChange,
    errors = {}
}) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Auto-fill city when ZIP changes
    useEffect(() => {
        const fillCity = async () => {
            if (zip && zip.length === 5 && !city) {
                const autoCity = await fetchCityByZip(zip, country);
                if (autoCity) {
                    onChange('city', autoCity);
                }
            }
        };
        fillCity();
    }, [zip, country, city, onChange]);

    // Street suggestions for Germany
    const handleStreetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onChange('street', value);

        if (country === 'Deutschland' && value.length > 3) {
            try {
                const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        street: value,
                        city: city,
                        postalcode: zip,
                        country: 'Germany',
                        format: 'json',
                        limit: 5,
                        addressdetails: 1
                    },
                    headers: {
                        'Accept-Language': 'de'
                    }
                });

                if (response.data && response.data.length > 0) {
                    setSuggestions(response.data);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('Error fetching street suggestions:', error);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (suggestion: any) => {
        const addr = suggestion.address;
        if (addr.road) onChange('street', addr.road);
        if (addr.postcode) onChange('zip', addr.postcode);
        if (addr.city || addr.town || addr.village) {
            onChange('city', addr.city || addr.town || addr.village);
        }
        setShowSuggestions(false);
    };

    return (
        <div className="grid grid-cols-12 gap-x-4 gap-y-4">
            <div className="col-span-12 md:col-span-9 relative">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Straße *</Label>
                <Input
                    name="address_street"
                    value={street}
                    onChange={handleStreetChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    required
                    placeholder="Straßenname"
                    error={!!errors.address_street}
                    autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-sm shadow-lg overflow-hidden">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => selectSuggestion(s)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 truncate"
                            >
                                <span className="font-medium">{s.address.road}</span>
                                {s.address.postcode && <span className="text-slate-400 ml-2">{s.address.postcode} {s.address.city || s.address.town}</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="col-span-12 md:col-span-3">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Hausnr. *</Label>
                <Input
                    name="address_house_no"
                    value={houseNo}
                    onChange={(e) => onChange('houseNo', e.target.value)}
                    required
                    placeholder="10"
                    error={!!errors.address_house_no}
                    autoComplete="off"
                />
            </div>
            <div className="col-span-12 md:col-span-4">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">PLZ *</Label>
                <Input
                    name="address_zip"
                    value={zip}
                    onChange={(e) => onChange('zip', e.target.value)}
                    required
                    placeholder="12345"
                    error={!!errors.address_zip}
                    autoComplete="off"
                />
            </div>
            <div className="col-span-12 md:col-span-8">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Stadt *</Label>
                <Input
                    name="address_city"
                    value={city}
                    onChange={(e) => onChange('city', e.target.value)}
                    required
                    placeholder="Stadt"
                    error={!!errors.address_city}
                    autoComplete="off"
                />
            </div>
            <div className="col-span-12">
                <CountrySelect
                    value={country}
                    onChange={(val) => onChange('country', val)}
                />
            </div>
        </div>
    );
};

export default AddressForm;
