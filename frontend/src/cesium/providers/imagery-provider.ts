/**
 * ResQ-GIS Imagery Provider Abstraction
 * Supports Sentinel-2 / Satellite, OpenStreetMap, CartoDB, Topo, and Cesium Ion.
 * Streamed tile services avoid downloading massive datasets to the browser.
 */
import * as Cesium from 'cesium';
import { cesiumConfig, type ImageryType } from './cesium-config';

export interface ImageryOption {
  id: ImageryType;
  name: string;
  category: 'satellite' | 'street' | 'topo' | 'dark';
  description: string;
}

export const AVAILABLE_IMAGERY_PROVIDERS: ImageryOption[] = [
  {
    id: 'sentinel2',
    name: 'Sentinel-2 / Satellite High-Res',
    category: 'satellite',
    description: 'Cloudless multispectral satellite imagery suitable for terrain & hazard analysis',
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard',
    category: 'street',
    description: 'Community-driven open cartographic road & habitation network',
  },
  {
    id: 'carto-dark',
    name: 'CartoDB Dark Matter',
    category: 'dark',
    description: 'High-contrast dark cartography for operational emergency dispatch',
  },
  {
    id: 'carto-voyager',
    name: 'CartoDB Voyager',
    category: 'street',
    description: 'Clean, modern navigational basemap with soft relief',
  },
  {
    id: 'topo',
    name: 'World Topographic Relief',
    category: 'topo',
    description: 'Contour lines, ridgelines, and hydrological drainage basins',
  },
];

/**
 * Creates an ImageryLayer from an imagery provider definition.
 */
export function createImageryProvider(
  type: ImageryType = cesiumConfig.defaultImagery
): Cesium.ImageryProvider {
  switch (type) {
    case 'sentinel2':
      // High-res global satellite imagery (ESRI / Sentinel-2 composite)
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: 'ESRI / Maxar / Earthstar Geographics / Sentinel-2',
      });

    case 'osm':
      return new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
        maximumLevel: 19,
        credit: '© OpenStreetMap contributors',
      });

    case 'carto-dark':
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        maximumLevel: 19,
        credit: '© CARTO © OpenStreetMap',
      });

    case 'carto-voyager':
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        maximumLevel: 19,
        credit: '© CARTO © OpenStreetMap',
      });

    case 'topo':
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: 'ESRI World Topo',
      });

    case 'ion':
      if (cesiumConfig.hasIonToken) {
        try {
          return new (Cesium as any).IonImageryProvider({ assetId: 2 });
        } catch {
          // Fall through to default satellite
        }
      }
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
      });

    default:
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
      });
  }
}

/**
 * Replaces the base imagery layer of the Cesium viewer.
 */
export function setViewerImagery(viewer: Cesium.Viewer, type: ImageryType): void {
  if (!viewer || viewer.isDestroyed()) return;

  try {
    const provider = createImageryProvider(type);
    const layers = viewer.imageryLayers;

    // Remove existing bottom layer(s)
    if (layers.length > 0) {
      layers.removeAll();
    }

    layers.addImageryProvider(provider);
  } catch (err) {
    console.warn('Failed to switch base imagery layer:', err);
  }
}
