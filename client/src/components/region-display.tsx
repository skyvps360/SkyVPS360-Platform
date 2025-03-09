
import React from 'react';

// Map region slugs to country codes for flags
const regionToCountry: Record<string, string> = {
  'nyc1': 'us',
  'nyc3': 'us',
  'sfo2': 'us',
  'sfo3': 'us',
  'tor1': 'ca',
  'ams3': 'nl',
  'lon1': 'gb',
  'blr1': 'in',
  'syd1': 'au',
  'sgp1': 'sg',
};

// Map region slugs to human-readable names
const regionNames: Record<string, string> = {
  'nyc1': '🇺🇸 New York',
  'nyc2': '🇺🇸 New York',
  'nyc3': '🇺🇸 New York',
  'sfo3': '🇺🇸 San Francisco',
  'sfo2': '🇺🇸 San Francisco',
  'ams3': '🇳🇱 Amsterdam',
  'sgp1': '🇸🇬 Singapore',
  'lon1': '🇬🇧 London',
  'tor1': '🇨🇦 Toronto',
  'blr1': '🇮🇳 Bangalore',
  'syd1': '🇦🇺 Sydney',
};

interface RegionDisplayProps {
  regionSlug: string;
  showName?: boolean;
}

const RegionDisplay: React.FC<RegionDisplayProps> = ({ regionSlug, showName = true }) => {
  const countryCode = regionToCountry[regionSlug] || 'unknown';
  const regionName = regionNames[regionSlug] || regionSlug;
  
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-4 inline-block">
        {countryCode !== 'unknown' && (
          <img 
            src={`https://hatscripts.github.io/circle-flags/flags/${countryCode}.svg`} 
            alt={`${regionName} flag`}
            className="w-full h-full object-cover rounded-sm"
          />
        )}
      </span>
      {showName && <span>{regionName}</span>}
    </div>
  );
};

export default RegionDisplay;
