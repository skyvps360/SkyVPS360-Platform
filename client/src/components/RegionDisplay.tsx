import React from 'react';

interface RegionDisplayProps {
  region: string;
  className?: string;
}

// Map of region codes to human-readable names with flags
const regionNames: Record<string, string> = {
  'nyc1': '🇺🇸 New York 1',
  'nyc2': '🇺🇸 New York 2',
  'nyc3': '🇺🇸 New York 3',
  'sfo2': '🇺🇸 San Francisco 2',
  'sfo3': '🇺🇸 San Francisco 3',
  'ams3': '🇳🇱 Amsterdam 3',
  'sgp1': '🇸🇬 Singapore 1',
  'lon1': '🇬🇧 London 1',
  'fra1': '🇩🇪 Frankfurt 1',
  'tor1': '🇨🇦 Toronto 1',
  'blr1': '🇮🇳 Bangalore 1',
  'syd1': '🇦🇺 Sydney 1'
};

const RegionDisplay: React.FC<RegionDisplayProps> = ({ region, className = '' }) => {
  const displayName = regionNames[region] || region;
  
  return (
    <span className={className} title={`Region: ${displayName}`}>
      {displayName}
    </span>
  );
};

export default RegionDisplay;
