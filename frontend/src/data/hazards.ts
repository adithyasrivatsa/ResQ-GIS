import type { HazardLayerItem } from '../types';

export const DEMO_HAZARDS: HazardLayerItem[] = [
  {
    id: 'haz-landslide-joshimath',
    name: 'Joshimath Subsidence & Landslide Zone',
    type: 'landslide',
    severity: 'red',
    source: 'GSI / NRSC Subsidence Study 2023',
    description: 'Active slope subsidence with rotational slips affecting Sunil, Marwari and Manohar Bagh sectors.',
    visible: true,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [79.54, 30.565],
          [79.585, 30.565],
          [79.58, 30.53],
          [79.535, 30.535],
          [79.54, 30.565],
        ],
      ],
    },
  },
  {
    id: 'haz-flood-alaknanda',
    name: 'Alaknanda 100-Year Flood Inundation Buffer',
    type: 'flood',
    severity: 'orange',
    source: 'CWC / Bhuvan Flood Hazard Atlas',
    description: 'High velocity floodway zone along Alaknanda riverbed between Vishnuprayag and Chamoli.',
    visible: true,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [79.56, 30.57],
          [79.545, 30.54],
          [79.43, 30.43],
          [79.438, 30.425],
          [79.555, 30.535],
          [79.57, 30.565],
          [79.56, 30.57],
        ],
      ],
    },
  },
  {
    id: 'haz-glof-rishiganga',
    name: 'Rishiganga - Raunthi Glacier GLOF Corridor',
    type: 'glof',
    severity: 'red',
    source: 'IIRS / ISRO High Altitude Glacial Lake Inventory',
    description: 'Historical rock/ice avalanche and glacial outburst flood trajectory (Feb 2021 event pathway).',
    visible: true,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [79.74, 30.61],
          [79.77, 30.605],
          [79.76, 30.575],
          [79.73, 30.585],
          [79.74, 30.61],
        ],
      ],
    },
  },
];
