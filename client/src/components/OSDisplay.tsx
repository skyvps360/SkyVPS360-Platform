import React from 'react';

interface OSDisplayProps {
  application: string | null;
  className?: string;
}

const getOSDisplayName = (application: string | null): { name: string; version: string } => {
  if (!application) {
    return { name: 'Ubuntu', version: '22.04 LTS' };
  }

  const appParts = application.split(" on ");
  if (appParts.length > 1) {
    const osInfo = appParts[appParts.length - 1];
    // Extract version if it exists (e.g., "Ubuntu 20.04" -> ["Ubuntu", "20.04"])
    const osMatch = osInfo.match(/([a-zA-Z]+)\s*(.+)/);
    if (osMatch) {
      return { name: osMatch[1], version: osMatch[2] };
    }
  }

  return { name: 'Ubuntu', version: '22.04 LTS' };
};

const OSDisplay: React.FC<OSDisplayProps> = ({ application, className = '' }) => {
  const { name, version } = getOSDisplayName(application);

  return (
    <span className={className} title={`Operating System: ${name} ${version}`}>
      {name} <span className="text-muted-foreground">{version}</span>
    </span>
  );
};

export default OSDisplay;