import * as React from 'react';

const ICONS: Record<string, string> = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  projects: 'M3 7l3-4h12l3 4M3 7v13a1 1 0 001 1h16a1 1 0 001-1V7M3 7h18M9 12h6',
  plus: 'M12 5v14M5 12h14',
  programs: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
  channels: 'M2 7h20v14H2zM17 2l-5 5-5-5',
  calendar: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  reports: 'M18 20V10M12 20V4M6 20v-6',
  settings: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.36.5 1 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  search: 'M11 11a7 7 0 100-14 7 7 0 000 14zM21 21l-4.35-4.35',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9',
  sun: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M12 3a6 6 0 009 9 9 9 0 11-9-9z',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  alert: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  upload: 'M12 3v12M6 9l6-6 6 6M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2',
  download: 'M12 3v12M6 11l6 6 6-6M4 21h16',
  mail: 'M22 6l-10 7L2 6M2 4h20v16H2z',
  minus: 'M5 12h14',
  menu: 'M3 6h18M3 12h18M3 18h18',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  whatsapp: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
};

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const path = ICONS[name];
  const sizing: React.CSSProperties = { width: size, height: size };

  if (!path) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={sizing}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`fill-current ${className ?? ''}`}
      style={sizing}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
