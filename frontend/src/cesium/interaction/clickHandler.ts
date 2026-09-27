import * as Cesium from 'cesium';
import { getViewer } from '../viewer';

export interface ClickHandlerCallbacks {
  onHabitationClick?: (id: string) => void;
  onSiteClick?: (id: string) => void;
  onRiverClick?: (id: string) => void;
  onHazardClick?: (id: string) => void;
}

export function setupClickHandler(
  onHabitationOrCallbacks: ((id: string) => void) | ClickHandlerCallbacks,
  legacyOnSiteClick?: (id: string) => void
) {
  const viewer = getViewer();
  if (!viewer) return;

  const callbacks: ClickHandlerCallbacks =
    typeof onHabitationOrCallbacks === 'function'
      ? {
          onHabitationClick: onHabitationOrCallbacks,
          onSiteClick: legacyOnSiteClick,
        }
      : onHabitationOrCallbacks;

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handler.setInputAction((movement: { position: Cesium.Cartesian2 }) => {
    const picked = viewer.scene.pick(movement.position);

    if (Cesium.defined(picked) && picked.id) {
      const entity = picked.id as Cesium.Entity;
      const entityId = entity.id || '';
      const props = entity.properties;

      if (props) {
        const type = props.type?.getValue(Cesium.JulianDate.now());
        if (type === 'habitation' && callbacks.onHabitationClick) {
          callbacks.onHabitationClick(entityId);
        } else if (type === 'relocation-site' && callbacks.onSiteClick) {
          callbacks.onSiteClick(entityId);
        } else if (type === 'river-station' && callbacks.onRiverClick) {
          const rawId = entityId.replace('river-station-', '');
          callbacks.onRiverClick(rawId);
        } else if (type === 'hazard-layer' && callbacks.onHazardClick) {
          const rawId = entityId.replace('hazard-poly-', '').replace('hazard-label-', '');
          callbacks.onHazardClick(rawId);
        }
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return handler;
}
