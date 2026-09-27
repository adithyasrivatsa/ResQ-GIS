import type { DisasterAlert } from '../types';

export const DEMO_ALERTS: DisasterAlert[] = [
  {
    id: 'alert-1',
    source: 'IMD',
    eventType: 'Heavy Rain Warning',
    severity: 'orange',
    area: 'Chamoli District',
    description: 'Heavy to very heavy rainfall likely over Chamoli district during next 24 hours.',
    issuedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'alert-2',
    source: 'CWC',
    eventType: 'River Level Warning',
    severity: 'yellow',
    area: 'Alaknanda River, Srinagar Station',
    description: 'Alaknanda River water level approaching warning level at Srinagar gauge station.',
    issuedAt: new Date(Date.now() - 32 * 60000).toISOString(),
  },
  {
    id: 'alert-3',
    source: 'NDMA',
    eventType: 'Landslide Alert',
    severity: 'orange',
    area: 'Joshimath Region',
    description: 'Continued subsidence activity reported in Joshimath. Residents advised to remain vigilant.',
    issuedAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: 'alert-4',
    source: 'IMD',
    eventType: 'Thunderstorm Warning',
    severity: 'yellow',
    area: 'Rudraprayag District',
    description: 'Thunderstorm with lightning likely over Rudraprayag district.',
    issuedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'alert-5',
    source: 'GSI',
    eventType: 'Seismic Activity',
    severity: 'green',
    area: 'Garhwal Region',
    description: 'Minor seismic event (M 2.3) recorded near Chamoli. No damage reported.',
    issuedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];
