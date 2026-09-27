/**
 * CesiumJS Configuration & Provider Isolation Layer.
 * Decouples Cesium Ion from the application core so it can be replaced
 * with Copernicus DEM, OpenStreetMap, Sentinel-2, or custom WMS/WFS services.
 * 
 * Never hardcode API keys or Ion tokens here.
 */

export type TerrainType = 'ion' | 'copernicus' | 'ellipsoid';
export type ImageryType = 'sentinel2' | 'osm' | 'carto-dark' | 'carto-voyager' | 'topo' | 'ion';

export interface CesiumConfig {
  ionToken: string;
  hasIonToken: boolean;
  defaultTerrain: TerrainType;
  defaultImagery: ImageryType;
}

const envToken = import.meta.env.VITE_CESIUM_ION_TOKEN || '';

export const cesiumConfig: CesiumConfig = {
  ionToken: envToken,
  hasIonToken: Boolean(envToken && envToken.length > 20),
  defaultTerrain: envToken && envToken.length > 20 ? 'ion' : 'ellipsoid',
  defaultImagery: 'sentinel2', // Open Sentinel-2 / ESRI satellite by default
};
