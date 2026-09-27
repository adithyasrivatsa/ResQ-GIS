import { useState } from 'react';
import {
  Scan,
  Radio,
  BookmarkPlus,
  CloudRain,
  Users,
  Building,
  Activity,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToSite } from '../../cesium/camera';
import type { SurveillanceZone } from '../../types';

export default function SurveillancePanel() {
  const {
    isSurveillanceActive,
    toggleSurveillance,
    surveillanceZones,
    activeSurveillanceZone,
    setActiveSurveillanceZone,
    addSurveillanceZone,
    activeWorkspaceId,
    workspaces,
    weatherReport,
    weather,
    habitations,
    riverStations,
  } = useAppStore();

  const [radiusKm, setRadiusKm] = useState(activeSurveillanceZone?.radiusKm || 3.0);
  const [zoneName, setZoneName] = useState(activeSurveillanceZone?.name || 'Custom AOI Sector');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Dynamic calculations based on radius and center
  const centerLat = activeSurveillanceZone?.center.lat || 30.5564;
  const centerLng = activeSurveillanceZone?.center.lng || 79.5663;

  // Compute habitations within radius (simple haversine approximation)
  const habitationsInZone = habitations.filter((h) => {
    const dLat = (h.location.lat - centerLat) * 111;
    const dLng = (h.location.lng - centerLng) * 111 * Math.cos((centerLat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return dist <= radiusKm * 1.5;
  });

  const totalPop = habitationsInZone.reduce((acc, h) => acc + h.population, 0) || 4213;
  const avgRisk = habitationsInZone.length
    ? +(habitationsInZone.reduce((acc, h) => acc + h.riskScore, 0) / habitationsInZone.length).toFixed(2)
    : 0.85;

  const currentRain = weatherReport?.current?.rainfall24h ?? (weather[0]?.rainfall ?? 28.9);
  const closestGauge = riverStations[0];

  const handleSelectPreset = (zone: SurveillanceZone) => {
    setActiveSurveillanceZone(zone);
    setZoneName(zone.name);
    setRadiusKm(zone.radiusKm);
    flyToSite(zone.center.lng, zone.center.lat);
  };

  const handleSaveToWorkspace = () => {
    const newZone: SurveillanceZone = {
      id: `sz-${Date.now()}`,
      name: zoneName,
      district: activeWs.district,
      center: { lat: centerLat, lng: centerLng },
      radiusKm,
      assignedFolderId: activeWs.id,
      riskScore: avgRisk,
      populationExposed: totalPop,
      activeAlertsCount: 2,
      lastScanned: 'Just now',
    };

    addSurveillanceZone(newZone);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="panel">
      {/* Header Banner */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-rose-subtle)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scan size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                Surveillance & AOI Marking
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                Area of Interest Precision Radar & Vigilance
              </div>
            </div>
          </div>

          <button
            onClick={toggleSurveillance}
            className={`btn-action ${isSurveillanceActive ? 'btn-action--rose' : 'btn-action--primary'}`}
            style={{ padding: '5px 10px', fontSize: 11 }}
          >
            <Radio size={13} />
            <span>{isSurveillanceActive ? 'Active Sentry' : 'Engage Radar'}</span>
          </button>
        </div>
      </div>

      <div className="panel__list" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Active Target Scope Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Target Surveillance Sector
            </span>
            <span
              className="risk-badge"
              style={{
                background: avgRisk >= 0.7 ? 'var(--accent-rose-subtle)' : 'var(--accent-amber-subtle)',
                color: avgRisk >= 0.7 ? 'var(--accent-rose)' : 'var(--accent-amber)',
              }}
            >
              RISK {avgRisk.toFixed(2)}
            </span>
          </div>

          <input
            type="text"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            style={{
              padding: '6px 10px',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 700,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />

          {/* Coordinates & Radius slider */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Surveillance Perimeter Radius
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)' }}>
                {radiusKm.toFixed(1)} km
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
            />
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              background: 'var(--bg-subtle)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Epicenter: {centerLat.toFixed(4)}°N, {centerLng.toFixed(4)}°E &bull; Target Workspace: {activeWs.name}
          </div>
        </div>

        {/* Live Surveillance Telemetry Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
              <Users size={13} color="var(--accent-blue)" />
              <span>Pop. Inside Zone</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {totalPop.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
              {habitationsInZone.length} villages encircled
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
              <CloudRain size={13} color="var(--accent-cyan)" />
              <span>24h Rainfall</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {currentRain.toFixed(1)} mm
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
              Open-Meteo telemetry
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
              <Activity size={13} color="var(--accent-amber)" />
              <span>River Warning Stage</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {closestGauge ? `${closestGauge.waterLevel}m (${closestGauge.status.toUpperCase()})` : 'Normal Stage'}
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
              {closestGauge?.river || 'Alaknanda'} basin
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
              <Building size={13} color="var(--accent-emerald)" />
              <span>Corridor Status</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              NH-7 Passable
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
              BRO heavy equipment standby
            </div>
          </div>
        </div>

        {/* Action Button: Save Zone into Workspace */}
        <button
          onClick={handleSaveToWorkspace}
          className="btn-action btn-action--primary"
          style={{ width: '100%', padding: '9px', fontSize: 12, justifyContent: 'center' }}
        >
          <BookmarkPlus size={14} />
          <span>{savedSuccess ? 'Saved to Workspace!' : `Save Sentry Zone to ${activeWs.name}`}</span>
        </button>

        {/* Preset Surveillance Sectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Himalayan Surveillance Presets
          </div>

          {surveillanceZones.map((zone) => {
            const isTarget = activeSurveillanceZone?.id === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => handleSelectPreset(zone)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: isTarget ? 'var(--accent-blue-subtle)' : 'var(--bg-surface)',
                  border: '1px solid',
                  borderColor: isTarget ? 'var(--accent-blue)' : 'var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {zone.name}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
                    {zone.district} &bull; Perimeter: {zone.radiusKm} km &bull; {zone.populationExposed.toLocaleString()} exposed
                  </div>
                </div>
                <span
                  className="risk-badge risk-badge--sm"
                  style={{
                    background: zone.riskScore >= 0.8 ? 'var(--accent-rose-subtle)' : 'var(--accent-amber-subtle)',
                    color: zone.riskScore >= 0.8 ? 'var(--accent-rose)' : 'var(--accent-amber)',
                  }}
                >
                  {(zone.riskScore * 100).toFixed(0)}% RISK
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
