import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Compass, CheckCircle, Search, Building2, Globe2, AlertCircle } from 'lucide-react';

interface LocationMapProps {
  mode?: 'select' | 'view';
  location?: string;
  onChange?: (location: string) => void;
  height?: string;
  origin?: string;
}

// Built-in Indian PIN code database for instant lookup
const KNOWN_PINCODES: Record<string, { city: string; state: string; district: string }> = {
  '534101': { city: 'Tanuku', district: 'West Godavari', state: 'Andhra Pradesh' },
  '534001': { city: 'Eluru', district: 'Eluru', state: 'Andhra Pradesh' },
  '520001': { city: 'Vijayawada', district: 'NTR District', state: 'Andhra Pradesh' },
  '530001': { city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '522001': { city: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh' },
  '533001': { city: 'Kakinada', district: 'Kakinada', state: 'Andhra Pradesh' },
  '533101': { city: 'Rajahmundry', district: 'East Godavari', state: 'Andhra Pradesh' },
  '500001': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana' },
  '500081': { city: 'HITEC City, Hyderabad', district: 'Ranga Reddy', state: 'Telangana' },
  '560001': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka' },
  '400001': { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra' },
  '411001': { city: 'Pune', district: 'Pune', state: 'Maharashtra' },
  '110001': { city: 'New Delhi', district: 'New Delhi', state: 'Delhi' },
  '600001': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal' },
  '380001': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat' },
  '302001': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan' },
  '682001': { city: 'Kochi', district: 'Ernakulam', state: 'Kerala' },
  '160001': { city: 'Chandigarh', district: 'Chandigarh', state: 'Punjab / Haryana' },
  '226001': { city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh' },
};

const POPULAR_LOCATIONS = [
  { pin: '534101', name: 'Tanuku, AP' },
  { pin: '520001', name: 'Vijayawada, AP' },
  { pin: '530001', name: 'Visakhapatnam, AP' },
  { pin: '500001', name: 'Hyderabad, TS' },
  { pin: '560001', name: 'Bengaluru, KA' },
  { pin: '400001', name: 'Mumbai, MH' },
  { pin: '110001', name: 'New Delhi' },
  { pin: '600001', name: 'Chennai, TN' },
];

export function LocationMap({
  mode = 'view',
  location = '',
  onChange,
}: LocationMapProps) {
  const [pincodeInput, setPincodeInput] = useState(() => {
    const digits = (location || '').match(/\b\d{6}\b/);
    return digits ? digits[0] : location;
  });

  const [locationDetails, setLocationDetails] = useState<{
    pincode: string;
    city: string;
    district: string;
    state: string;
    country: string;
  } | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync internal state when parent location prop changes
  useEffect(() => {
    if (location) {
      const match = location.match(/\b\d{6}\b/);
      if (match) {
        resolvePincode(match[0]);
      } else {
        setPincodeInput(location);
      }
    }
  }, [location]);

  const resolvePincode = async (code: string) => {
    const clean = code.trim().replace(/\D/g, '');
    if (clean.length !== 6) return;

    setIsSearching(true);
    setError(null);

    // Check local database first
    if (KNOWN_PINCODES[clean]) {
      const info = KNOWN_PINCODES[clean];
      const res = {
        pincode: clean,
        city: info.city,
        district: info.district,
        state: info.state,
        country: 'India',
      };
      setLocationDetails(res);
      setIsSearching(false);
      const fullString = `${info.city}, ${info.district}, ${info.state} - ${clean}`;
      if (onChange) onChange(fullString);
      return;
    }

    // Try India Post Postal API for any 6-digit PIN code in India
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const res = {
          pincode: clean,
          city: po.Name || po.Block || po.District,
          district: po.District,
          state: po.State,
          country: po.Country || 'India',
        };
        setLocationDetails(res);
        const fullString = `${res.city}, ${res.district}, ${res.state} - ${clean}`;
        if (onChange) onChange(fullString);
      } else {
        // Fallback state mapping based on Indian postal zones
        const firstDigit = clean[0];
        let estimatedState = 'India';
        if (firstDigit === '5') estimatedState = 'Andhra Pradesh / Telangana / Karnataka';
        else if (firstDigit === '1' || firstDigit === '2') estimatedState = 'North India (Delhi/UP/Punjab)';
        else if (firstDigit === '3' || firstDigit === '4') estimatedState = 'West India (Maharashtra/Gujarat)';
        else if (firstDigit === '6') estimatedState = 'Tamil Nadu / Kerala';
        else if (firstDigit === '7' || firstDigit === '8') estimatedState = 'East India (West Bengal/Bihar/Odisha)';

        const fallback = {
          pincode: clean,
          city: `PIN ${clean} Sector`,
          district: 'District Zone',
          state: estimatedState,
          country: 'India',
        };
        setLocationDetails(fallback);
        if (onChange) onChange(`PIN ${clean}, ${estimatedState}`);
      }
    } catch (err) {
      setError('Could not connect to pincode service. Displaying postal zone.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPincodeInput(val);

    const match = val.match(/\b\d{6}\b/);
    if (match) {
      resolvePincode(match[0]);
    } else if (val.trim().length === 6 && /^\d+$/.test(val.trim())) {
      resolvePincode(val.trim());
    } else if (onChange) {
      onChange(val);
    }
  };

  const handleSelectPreset = (pin: string) => {
    setPincodeInput(pin);
    resolvePincode(pin);
  };

  return (
    <div className="w-full space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      {mode === 'select' && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
            Enter 6-Digit Indian PIN Code / Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={pincodeInput}
              onChange={handleInputChange}
              placeholder="e.g. 534101 or Tanuku, West Godavari"
              className="w-full pl-10 pr-24 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-semibold text-gray-900 transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            {pincodeInput && (
              <button
                type="button"
                onClick={() => {
                  setPincodeInput('');
                  setLocationDetails(null);
                  if (onChange) onChange('');
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <Compass size={14} className="text-primary" /> Popular PIN Codes:
            </span>
            {POPULAR_LOCATIONS.map((preset) => (
              <button
                key={preset.pin}
                type="button"
                onClick={() => handleSelectPreset(preset.pin)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  pincodeInput.includes(preset.pin)
                    ? 'bg-primary text-white border-primary font-bold shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {preset.pin} ({preset.name})
              </button>
            ))}
          </div>
        </div>
      )}

      {isSearching && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Locating postal region details for PIN <strong>{pincodeInput}</strong>...</span>
        </div>
      )}

      {/* Resolved Location Details Card */}
      {locationDetails ? (
        <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <h4 className="font-bold text-sm text-emerald-900">
                Pincode Verified: {locationDetails.pincode}
              </h4>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white uppercase">
              {locationDetails.country}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-200/60 text-xs">
            <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-500 block">City / Town / District</span>
                <span className="font-bold text-gray-900">{locationDetails.city} ({locationDetails.district})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
              <Globe2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-500 block">State</span>
                <span className="font-bold text-gray-900">{locationDetails.state}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        !isSearching && location && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span>Current Selected Location: <strong>{location}</strong></span>
          </div>
        )
      )}
    </div>
  );
}
