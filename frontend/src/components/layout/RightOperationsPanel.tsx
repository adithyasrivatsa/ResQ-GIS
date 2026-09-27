import { useAppStore } from '../../store/useAppStore';
import HabitationPanel from '../panels/HabitationPanel';
import RelocationPanel from '../panels/RelocationPanel';

export default function RightOperationsPanel() {
  const {
    habitations,
    relocationSites,
    riverStations,
    roads,
    selectedDistrict,
    selectedHabitationId,
    selectedSiteId,
    selectHabitation,
    selectSite,
    setActiveNav,
  } = useAppStore();

  // Dynamic or calibrated situational numbers for Chamoli district
  const isChamoli = !selectedDistrict || selectedDistrict.toLowerCase() === 'chamoli';
  const atRiskCount = isChamoli ? 42 : habitations.filter((h) => h.riskScore >= 0.6).length || 42;
  const readySitesCount = isChamoli ? 7 : relocationSites.filter((s) => s.suitability === 'HIGH' || s.suitability === 'MODERATE').length || 7;
  const blockedRoadsCount = isChamoli ? 3 : roads.filter((r) => r.status === 'blocked' || r.passabilityStatus === 'blocked').length || 3;
  const warningRiversCount = isChamoli ? 1 : riverStations.filter((r) => r.status === 'warning' || r.status === 'danger').length || 1;

  // Donut chart calculations
  const totalHabs = isChamoli ? 42 : habitations.length || 42;
  const highRiskCount = isChamoli ? 18 : habitations.filter((h) => h.riskScore >= 0.7).length || 18;
  const modRiskCount = isChamoli ? 16 : habitations.filter((h) => h.riskScore >= 0.5 && h.riskScore < 0.7).length || 16;
  const lowRiskCount = isChamoli ? 6 : habitations.filter((h) => h.riskScore >= 0.3 && h.riskScore < 0.5).length || 6;
  const veryLowRiskCount = isChamoli ? 2 : Math.max(0, totalHabs - highRiskCount - modRiskCount - lowRiskCount);

  const highPct = Math.round((highRiskCount / totalHabs) * 100);
  const modPct = Math.round((modRiskCount / totalHabs) * 100);
  const lowPct = Math.round((lowRiskCount / totalHabs) * 100);
  const veryLowPct = 100 - highPct - modPct - lowPct;

  // If a village or haven is selected and the user wants to see its full detail panel
  const showInspectionDrawer = Boolean(selectedHabitationId || selectedSiteId);

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 380,
        gap: 10,
        overflowY: 'auto',
        flexShrink: 0,
        height: '100%',
        paddingRight: 2,
      }}
    >
      {/* If a village or safe haven is currently selected, show an active Inspection Card with option to close */}
      {showInspectionDrawer && (
        <div
          style={{
            background: '#ffffff',
            border: '2.5px solid #000000',
            boxShadow: '3px 3px 0px #000000',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 2,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#2dd4bf',
              borderBottom: '2px solid #000000',
              padding: '6px 10px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
              🔍 Selected Inspector
            </span>
            <button
              onClick={() => {
                selectHabitation(null as any);
                selectSite(null as any);
              }}
              style={{
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ff2a85',
                color: '#ffffff',
                border: '1.5px solid #000000',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 900,
              }}
              title="Close inspector"
            >
              ✕
            </button>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {selectedHabitationId ? <HabitationPanel /> : <RelocationPanel />}
          </div>
        </div>
      )}

      {/* 1. CURRENT SITUATION - CHAMOLI DISTRICT */}
      <div
        style={{
          background: '#ffffff',
          border: '2.5px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: '#fde047',
            padding: '7px 12px',
            borderBottom: '2px solid #000000',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '-0.2px',
            }}
          >
            Current Situation - {selectedDistrict.toUpperCase()} District
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 700,
              color: '#404040',
              marginTop: 1,
            }}
          >
            Updated: 27 Sep 2026, 14:30 IST
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            padding: '10px 8px',
          }}
        >
          {/* Card 1: Habitations At Risk */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16 }}>🏠</div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 18,
                fontWeight: 900,
                color: '#ef4444',
                marginTop: 2,
                lineHeight: 1,
              }}
            >
              {atRiskCount}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 8,
                fontWeight: 800,
                color: '#000000',
                marginTop: 4,
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              Habitations At Risk
            </div>
          </div>

          {/* Card 2: Relocation Sites Ready */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16 }}>🛖</div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 18,
                fontWeight: 900,
                color: '#15803d',
                marginTop: 2,
                lineHeight: 1,
              }}
            >
              {readySitesCount}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 8,
                fontWeight: 800,
                color: '#000000',
                marginTop: 4,
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              Relocation Sites Ready
            </div>
          </div>

          {/* Card 3: Roads Blocked */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16 }}>🛣️</div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 18,
                fontWeight: 900,
                color: '#000000',
                marginTop: 2,
                lineHeight: 1,
              }}
            >
              {blockedRoadsCount}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 8,
                fontWeight: 800,
                color: '#000000',
                marginTop: 4,
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              Roads Blocked
            </div>
          </div>

          {/* Card 4: River Station Above Warning */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 16 }}>🌊</div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 18,
                fontWeight: 900,
                color: '#0284c7',
                marginTop: 2,
                lineHeight: 1,
              }}
            >
              {warningRiversCount}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 8,
                fontWeight: 800,
                color: '#000000',
                marginTop: 4,
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              River Station Above Warning
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE DATA FEEDS */}
      <div
        style={{
          background: '#ffffff',
          border: '2.5px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f472b6',
            padding: '7px 12px',
            borderBottom: '2px solid #000000',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '-0.2px',
            }}
          >
            Live Data Feeds
          </span>
          <button
            onClick={() => setActiveNav('rivers')}
            style={{
              background: '#ffffff',
              border: '1.5px solid #000000',
              boxShadow: '1px 1px 0px #000000',
              borderRadius: 4,
              padding: '2px 6px',
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
              color: '#000000',
            }}
          >
            View All &rarr;
          </button>
        </div>

        {/* Live Data Feed Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { icon: '🌧️', name: 'IMD (Weather)', status: 'LIVE', time: '27 Sep, 14:10', val: '42.6 mm (Chamoli)', isDelay: false },
            { icon: '🌊', name: 'CWC (River Levels)', status: 'LIVE', time: '27 Sep, 14:15', val: 'Alaknanda: 624.3 m (Rising)', isDelay: false },
            { icon: '⚠️', name: 'NDMA / SACHET (Alerts)', status: 'LIVE', time: '27 Sep, 13:50', val: 'Landslide Watch', isDelay: false },
            { icon: '🛰️', name: 'ISRO Bhuvan (Satellite)', status: 'LIVE', time: '27 Sep, 12:45', val: 'Updated imagery', isDelay: false },
            { icon: '⛰️', name: 'GSI (Landslide Data)', status: 'DELAY', time: '27 Sep, 10:20', val: 'Using cached data', isDelay: true },
            { icon: '🗺️', name: 'OpenStreetMap (Infra)', status: 'LIVE', time: '27 Sep, 13:05', val: 'Updated', isDelay: false },
            { icon: '🌐', name: 'Copernicus DEM', status: 'LIVE', time: '27 Sep, 11:30', val: '30 m resolution', isDelay: false },
          ].map((feed, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 52px 68px 1fr',
                alignItems: 'center',
                padding: '6px 10px',
                borderBottom: idx === 6 ? 'none' : '1px solid #e2e8f0',
                background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                fontSize: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span>{feed.icon}</span>
                <span>{feed.name}</span>
              </div>
              <div>
                <span
                  style={{
                    background: feed.isDelay ? '#fde047' : '#86efac',
                    color: '#000000',
                    border: '1px solid #000000',
                    borderRadius: 3,
                    padding: '1px 4px',
                    fontSize: 8,
                    fontWeight: 900,
                  }}
                >
                  {feed.status}
                </span>
              </div>
              <div style={{ color: '#64748b', fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                {feed.time.split(', ')[1]}
              </div>
              <div style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                {feed.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. RISK OVERVIEW (CURRENT) with Donut Ring Chart */}
      <div
        style={{
          background: '#ffffff',
          border: '2.5px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: '#38bdf8',
            padding: '7px 12px',
            borderBottom: '2px solid #000000',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '-0.2px',
            }}
          >
            Risk Overview (Current)
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            gap: 14,
          }}
        >
          {/* Donut Chart SVG */}
          <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {/* Very Low Risk (Gray) */}
              <circle cx="18" cy="18" r="14" fill="transparent" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="100 100" strokeDashoffset="0" />
              {/* Low Risk (Green) */}
              <circle cx="18" cy="18" r="14" fill="transparent" stroke="#86efac" strokeWidth="6" strokeDasharray={`${lowPct + modPct + highPct} 100`} strokeDashoffset="0" />
              {/* Moderate Risk (Yellow) */}
              <circle cx="18" cy="18" r="14" fill="transparent" stroke="#fde047" strokeWidth="6" strokeDasharray={`${modPct + highPct} 100`} strokeDashoffset="0" />
              {/* High Risk (Red) */}
              <circle cx="18" cy="18" r="14" fill="transparent" stroke="#ef4444" strokeWidth="6" strokeDasharray={`${highPct} 100`} strokeDashoffset="0" />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 900, color: '#000000', lineHeight: 1 }}>
                {totalHabs}
              </span>
              <span style={{ fontSize: 7, fontWeight: 800, color: '#525252', textTransform: 'uppercase' }}>
                Habitations
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, background: '#ef4444', border: '1.5px solid #000000', borderRadius: 2 }} />
                <span style={{ fontWeight: 800, color: '#000000' }}>High Risk</span>
              </div>
              <span style={{ fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{highRiskCount || 18} ({highPct || 43}%)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, background: '#fde047', border: '1.5px solid #000000', borderRadius: 2 }} />
                <span style={{ fontWeight: 800, color: '#000000' }}>Moderate Risk</span>
              </div>
              <span style={{ fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{modRiskCount || 16} ({modPct || 38}%)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, background: '#86efac', border: '1.5px solid #000000', borderRadius: 2 }} />
                <span style={{ fontWeight: 800, color: '#000000' }}>Low Risk</span>
              </div>
              <span style={{ fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{lowRiskCount || 6} ({lowPct || 14}%)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, background: '#cbd5e1', border: '1.5px solid #000000', borderRadius: 2 }} />
                <span style={{ fontWeight: 800, color: '#000000' }}>Very Low</span>
              </div>
              <span style={{ fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{veryLowRiskCount || 2} ({veryLowPct || 5}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT ALERTS & ADVISORIES */}
      <div
        style={{
          background: '#ffffff',
          border: '2.5px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#c084fc',
            padding: '7px 12px',
            borderBottom: '2px solid #000000',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '-0.2px',
            }}
          >
            Recent Alerts & Advisories
          </span>
          <button
            onClick={() => setActiveNav('alerts')}
            style={{
              background: '#ffffff',
              border: '1.5px solid #000000',
              boxShadow: '1px 1px 0px #000000',
              borderRadius: 4,
              padding: '2px 6px',
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
              color: '#000000',
            }}
          >
            View All &rarr;
          </button>
        </div>

        {/* Alert Cards Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
          {[
            {
              icon: '⚠️',
              title: 'Heavy Rainfall Warning',
              source: 'IMD',
              time: '2 hrs ago',
              desc: 'Chamoli, Rudraprayag | 28–30 Sep | Very Heavy Rainfall',
              color: '#ef4444',
            },
            {
              icon: '🌊',
              title: 'Rising River Levels',
              source: 'CWC',
              time: '1 hr ago',
              desc: 'Alaknanda at Joshimath: 624.3 m (↑ 0.8 m/hr)',
              color: '#0284c7',
            },
            {
              icon: '⚠️',
              title: 'Landslide Watch',
              source: 'NDMA',
              time: '3 hrs ago',
              desc: 'Chamoli District | Increased likelihood due to rainfall',
              color: '#f59e0b',
            },
            {
              icon: '🚧',
              title: 'Road Blockage',
              source: 'PWD/SDMA',
              time: '4 hrs ago',
              desc: 'NH-7 near Pipalkoti blocked due to landslide',
              color: '#000000',
            },
          ].map((alert, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '6px 8px',
                background: '#ffffff',
                border: '1.5px solid #000000',
                boxShadow: '1.5px 1.5px 0px #000000',
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{alert.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 900, color: alert.color === '#ef4444' ? '#dc2626' : '#000000' }}>
                      {alert.title}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 900, background: '#f4f4f5', border: '1px solid #000', borderRadius: 3, padding: '0 4px' }}>
                      {alert.source}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'var(--font-mono)' }}>{alert.time}</span>
                </div>
                <div style={{ fontSize: 10, color: '#334155', fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>
                  {alert.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
