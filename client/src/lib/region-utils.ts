export interface RegionInfo {
  name: string;
  flag: string;
  countryCode: string;
}

export const regionMap: Record<string, RegionInfo> = {
  'nyc1': { name: 'New York 1', flag: '🇺🇸', countryCode: 'us' },
  'nyc2': { name: 'New York 2', flag: '🇺🇸', countryCode: 'us' },
  'nyc3': { name: 'New York 3', flag: '🇺🇸', countryCode: 'us' },
  'sfo2': { name: 'San Francisco 2', flag: '🇺🇸', countryCode: 'us' },
  'sfo3': { name: 'San Francisco 3', flag: '🇺🇸', countryCode: 'us' },
  'ams3': { name: 'Amsterdam 3', flag: '🇳🇱', countryCode: 'nl' },
  'lon1': { name: 'London 1', flag: '🇬🇧', countryCode: 'gb' },
  'fra1': { name: 'Frankfurt 1', flag: '🇩🇪', countryCode: 'de' },
  'blr1': { name: 'Bangalore 1', flag: '🇮🇳', countryCode: 'in' },
  'sgp1': { name: 'Singapore 1', flag: '🇸🇬', countryCode: 'sg' },
  'tor1': { name: 'Toronto 1', flag: '🇨🇦', countryCode: 'ca' },
  'syd1': { name: 'Sydney 1', flag: '🇦🇺', countryCode: 'au' }
};

export function getRegionInfo(regionSlug: string): RegionInfo {
  return regionMap[regionSlug] || {
    name: regionSlug,
    flag: '🌎',
    countryCode: 'unknown'
  };
}

export function getRegionDisplay(regionSlug: string): string {
  const info = getRegionInfo(regionSlug);
  return `${info.flag} ${info.name}`;
}