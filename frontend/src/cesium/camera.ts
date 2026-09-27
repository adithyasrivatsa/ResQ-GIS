import * as Cesium from 'cesium';
import { getViewer } from './viewer';

// Default camera position: Uttarakhand overview
const UTTARAKHAND_CENTER = {
  longitude: 79.3,
  latitude: 30.4,
  height: 120000, // ~120km altitude
};

export function flyToUttarakhand() {
  const viewer = getViewer();
  if (!viewer) return;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      UTTARAKHAND_CENTER.longitude,
      UTTARAKHAND_CENTER.latitude,
      UTTARAKHAND_CENTER.height
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration: 2,
  });
}

export function flyToLocation(lng: number, lat: number, height: number = 15000) {
  const viewer = getViewer();
  if (!viewer) return;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-35),
      roll: 0,
    },
    duration: 1.5,
  });
}

export function flyToHabitation(lng: number, lat: number) {
  flyToLocation(lng, lat, 8000);
}

export function flyToSite(lng: number, lat: number) {
  flyToLocation(lng, lat, 10000);
}

const DISTRICT_COORDINATES: Record<string, { lng: number; lat: number; height: number }> = {
  // Uttarakhand
  chamoli: { lng: 79.55, lat: 30.55, height: 60000 },
  rudraprayag: { lng: 79.05, lat: 30.45, height: 60000 },
  pithoragarh: { lng: 80.22, lat: 29.58, height: 65000 },
  uttarkashi: { lng: 78.43, lat: 30.73, height: 65000 },
  // Himachal Pradesh
  kinnaur: { lng: 78.35, lat: 31.65, height: 75000 },
  kullu: { lng: 77.10, lat: 31.95, height: 75000 },
  mandi: { lng: 76.93, lat: 31.71, height: 65000 },
  // Kerala
  wayanad: { lng: 76.13, lat: 11.68, height: 70000 },
  idukki: { lng: 77.05, lat: 10.08, height: 75000 },
  alappuzha: { lng: 76.48, lat: 9.42, height: 60000 },
  // Andhra Pradesh
  konaseema: { lng: 81.88, lat: 16.48, height: 60000 },
  'dr. b.r. ambedkar konaseema': { lng: 81.88, lat: 16.48, height: 60000 },
  visakhapatnam: { lng: 83.22, lat: 17.68, height: 65000 },
  // Assam
  majuli: { lng: 94.21, lat: 26.96, height: 60000 },
  silchar: { lng: 92.79, lat: 24.83, height: 65000 },
  cachar: { lng: 92.79, lat: 24.83, height: 65000 },
  'dima hasao': { lng: 93.02, lat: 25.40, height: 80000 },
  // Sikkim
  mangan: { lng: 88.52, lat: 27.50, height: 70000 },
  chungthang: { lng: 88.65, lat: 27.60, height: 60000 },
  gangtok: { lng: 88.61, lat: 27.33, height: 60000 },
  singtam: { lng: 88.50, lat: 27.23, height: 60000 },
  // Odisha
  jagatsinghpur: { lng: 86.42, lat: 19.98, height: 65000 },
  puri: { lng: 85.83, lat: 19.81, height: 65000 },
  ganjam: { lng: 84.85, lat: 19.40, height: 85000 },
  // Jammu & Kashmir
  anantnag: { lng: 75.15, lat: 33.73, height: 65000 },
  srinagar: { lng: 74.80, lat: 34.08, height: 65000 },
  // Meghalaya
  'east khasi hills': { lng: 91.72, lat: 25.28, height: 65000 },
  sohra: { lng: 91.72, lat: 25.28, height: 60000 },
  cherrapunji: { lng: 91.72, lat: 25.28, height: 60000 },
  // Manipur & Nagaland
  noney: { lng: 93.63, lat: 24.78, height: 65000 },
  kohima: { lng: 94.11, lat: 25.67, height: 65000 },
};

const STATE_COORDINATES: Record<string, { lng: number; lat: number; height: number }> = {
  uttarakhand: { lng: 79.3, lat: 30.4, height: 120000 },
  'himachal pradesh': { lng: 77.2, lat: 31.8, height: 140000 },
  kerala: { lng: 76.3, lat: 10.5, height: 180000 },
  'andhra pradesh': { lng: 81.5, lat: 16.8, height: 220000 },
  assam: { lng: 92.8, lat: 26.2, height: 200000 },
  sikkim: { lng: 88.5, lat: 27.5, height: 110000 },
  odisha: { lng: 85.0, lat: 20.3, height: 220000 },
  'jammu & kashmir': { lng: 74.9, lat: 33.9, height: 160000 },
  'jammu and kashmir': { lng: 74.9, lat: 33.9, height: 160000 },
  meghalaya: { lng: 91.5, lat: 25.5, height: 150000 },
  'manipur & nagaland': { lng: 93.8, lat: 25.2, height: 160000 },
  manipur: { lng: 93.8, lat: 24.8, height: 140000 },
  nagaland: { lng: 94.1, lat: 25.7, height: 140000 },
};

export function flyToDistrict(districtName: string) {
  const norm = districtName.toLowerCase().trim();
  const target = DISTRICT_COORDINATES[norm];
  if (target) {
    flyToLocation(target.lng, target.lat, target.height);
  } else {
    flyToUttarakhand();
  }
}

export function flyToState(stateName: string) {
  const norm = stateName.toLowerCase().trim();
  const target = STATE_COORDINATES[norm];
  if (target) {
    flyToLocation(target.lng, target.lat, target.height);
  } else {
    flyToUttarakhand();
  }
}

export function resetCamera() {
  flyToUttarakhand();
}

/**
 * Zoom into the current camera target by a proportional fraction of its altitude
 */
export function zoomIn(amount: number = 0.5) {
  const viewer = getViewer();
  if (!viewer) return;
  const currentHeight = viewer.camera.positionCartographic.height;
  viewer.camera.zoomIn(Math.max(currentHeight * amount, 200));
}

/**
 * Zoom out from the current camera target by a proportional fraction of its altitude
 */
export function zoomOut(amount: number = 0.5) {
  const viewer = getViewer();
  if (!viewer) return;
  const currentHeight = viewer.camera.positionCartographic.height;
  viewer.camera.zoomOut(Math.max(currentHeight * amount, 200));
}

/**
 * Fly out to a high-altitude full globe planetary view (12,000km altitude)
 */
export function flyToFullGlobe() {
  const viewer = getViewer();
  if (!viewer) return;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(79.3, 22.0, 12000000), // 12,000 km altitude showing Earth
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration: 1.8,
  });
}
