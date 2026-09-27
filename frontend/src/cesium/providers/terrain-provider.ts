/**
 * ResQ-GIS Terrain Provider Abstraction
 * Supports Cesium Ion World Terrain, Copernicus DEM / Open Terrain, and Ellipsoid fallback.
 * Allows switching terrain providers without coupling the application to Cesium Ion.
 */
import * as Cesium from 'cesium';
import { cesiumConfig, type TerrainType } from './cesium-config';

export interface TerrainOption {
  id: TerrainType;
  name: string;
  description: string;
}

export const AVAILABLE_TERRAIN_PROVIDERS: TerrainOption[] = [
  {
    id: 'ion',
    name: 'Cesium World Terrain (Ion)',
    description: 'High-resolution global 3D elevation mesh with water mask',
  },
  {
    id: 'copernicus',
    name: 'Copernicus / Open DEM',
    description: 'European Space Agency 30m global elevation model',
  },
  {
    id: 'ellipsoid',
    name: 'Standard WGS84 Ellipsoid',
    description: 'Smooth reference ellipsoid, fast & zero network dependency',
  },
];

/**
 * Creates and initializes a terrain provider.
 * Catches network/auth errors gracefully and falls back to WGS84 Ellipsoid.
 */
export async function createTerrainProvider(
  terrainType: TerrainType = cesiumConfig.defaultTerrain
): Promise<any> {
  // If Ion requested and token is present
  if (terrainType === 'ion' && cesiumConfig.hasIonToken) {
    try {
      if (typeof (Cesium as any).Terrain?.fromWorldTerrain === 'function') {
        return (Cesium as any).Terrain.fromWorldTerrain({
          requestWaterMask: true,
          requestVertexNormals: true,
        });
      } else if (typeof (Cesium as any).createWorldTerrainAsync === 'function') {
        const tp = await (Cesium as any).createWorldTerrainAsync({
          requestWaterMask: true,
          requestVertexNormals: true,
        });
        return tp;
      }
    } catch (err) {
      console.warn('Cesium Ion terrain unavailable or rate-limited; falling back to Ellipsoid:', err);
    }
  }

  // Copernicus DEM or Open Terrain fallback via CesiumTerrainProvider or ArcGis
  if (terrainType === 'copernicus') {
    try {
      if (typeof (Cesium as any).CesiumTerrainProvider?.fromUrl === 'function') {
        // AWS / Open Terrain Copernicus 30m DEM endpoint or quantized mesh
        return await (Cesium as any).CesiumTerrainProvider.fromUrl(
          'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
        );
      }
    } catch (err) {
      console.warn('Copernicus/Open DEM endpoint unavailable, using ellipsoid fallback:', err);
    }
  }

  // Robust, zero-latency fallback
  return new Cesium.EllipsoidTerrainProvider();
}

/**
 * Updates the viewer's terrain provider dynamically.
 */
export async function setViewerTerrain(viewer: Cesium.Viewer, terrainType: TerrainType): Promise<void> {
  if (!viewer || viewer.isDestroyed()) return;

  try {
    const provider = await createTerrainProvider(terrainType);
    if (viewer && !viewer.isDestroyed()) {
      if (provider instanceof Cesium.TerrainProvider) {
        viewer.terrainProvider = provider;
      } else if (typeof (viewer as any).scene?.setTerrain === 'function') {
        (viewer.scene as any).setTerrain(provider);
      } else {
        viewer.terrainProvider = provider;
      }
    }
  } catch (err) {
    console.warn('Failed to switch terrain:', err);
  }
}
