/**
 * ResQ-GIS Cesium Viewer Core Initialization
 * Decoupled from proprietary providers via the provider abstraction layer.
 */
import * as Cesium from 'cesium';
import { cesiumConfig, type ImageryType, type TerrainType } from './providers/cesium-config';
import { createTerrainProvider, setViewerTerrain } from './providers/terrain-provider';
import { createImageryProvider, setViewerImagery } from './providers/imagery-provider';

let viewerInstance: Cesium.Viewer | null = null;

export function initViewer(container: HTMLElement): Cesium.Viewer {
  if (viewerInstance && !viewerInstance.isDestroyed()) {
    viewerInstance.destroy();
  }

  // Set Cesium Ion token only if user explicitly configured it
  if (cesiumConfig.hasIonToken) {
    Cesium.Ion.defaultAccessToken = cesiumConfig.ionToken;
  }

  // Create base imagery provider (Sentinel-2 satellite / OSM / Carto)
  const initialImagery = createImageryProvider(cesiumConfig.defaultImagery);

  viewerInstance = new Cesium.Viewer(container, {
    baseLayer: new Cesium.ImageryLayer(initialImagery),
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    selectionIndicator: true,
    timeline: false,
    animation: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    vrButton: false,
    infoBox: false,
    creditContainer: document.createElement('div'), // cleanly isolate credits from main HUD
    scene3DOnly: true,
    shadows: false,
    shouldAnimate: false,
  });

  // Asynchronously configure terrain provider (Ion, Copernicus DEM, or Ellipsoid)
  createTerrainProvider(cesiumConfig.defaultTerrain)
    .then((tp) => {
      if (viewerInstance && !viewerInstance.isDestroyed() && tp) {
        if (tp instanceof Cesium.Terrain) {
          viewerInstance.scene.setTerrain(tp);
        } else {
          viewerInstance.terrainProvider = tp;
        }
      }
    })
    .catch((err) => {
      console.warn('Initial terrain load fell back to standard ellipsoid:', err);
    });

  // Disable default double-click camera tracking
  try {
    viewerInstance.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  } catch {
    // Ignore
  }

  // Atmospheric and render settings for high-fidelity GIS
  const scene = viewerInstance.scene;
  scene.globe.enableLighting = false;
  scene.fog.enabled = true;
  scene.fog.density = 0.0002;
  scene.globe.depthTestAgainstTerrain = false;

  // Unconstrained zoom camera controls: allows full zoom out to deep space / full planetary view
  const controller = scene.screenSpaceCameraController;
  controller.enableZoom = true;
  controller.enableTranslate = true;
  controller.enableTilt = true;
  controller.enableRotate = true;
  controller.enableCollisionDetection = false; // prevents terrain collision clamping camera when zooming out
  controller.maximumZoomDistance = 60000000; // 60,000 km altitude (full Earth & space view)
  controller.minimumZoomDistance = 10; // allows close ground inspection
  controller.zoomEventTypes = [
    Cesium.CameraEventType.RIGHT_DRAG,
    Cesium.CameraEventType.WHEEL,
    Cesium.CameraEventType.PINCH,
  ];

  (window as any).cesiumViewer = viewerInstance;

  return viewerInstance;
}

export function getViewer(): Cesium.Viewer | null {
  return viewerInstance;
}

export function switchViewerImagery(type: ImageryType) {
  if (viewerInstance && !viewerInstance.isDestroyed()) {
    setViewerImagery(viewerInstance, type);
  }
}

export function switchViewerTerrain(type: TerrainType) {
  if (viewerInstance && !viewerInstance.isDestroyed()) {
    setViewerTerrain(viewerInstance, type);
  }
}

export function destroyViewer() {
  if (viewerInstance && !viewerInstance.isDestroyed()) {
    viewerInstance.destroy();
    viewerInstance = null;
  }
}
