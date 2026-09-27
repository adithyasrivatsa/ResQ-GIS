import { useState } from 'react';
import {
  User,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToDistrict } from '../../cesium/camera';

export default function TopBar() {
  const {
    alerts,
    selectedDistrict,
    selectedState,
    setSelectedDistrict,
    loadDistrictReport,
    setActiveNav,
  } = useAppStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Find latest critical warning
  const criticalAlert = alerts.find((a) => a.severity === 'red') || alerts[0] || {
    headline: 'IMD HEAVY RAINFALL WARNING',
    area: 'Chamoli, Rudraprayag',
    issuedAt: '28 Sep – 30 Sep 2026',
    severity: 'red',
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    loadDistrictReport(dist);
    flyToDistrict(dist);
    setIsProfileOpen(false);
  };

  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        gap: 10,
        alignItems: 'stretch',
        width: '100%',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* 1. ResQ-GIS Brand Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#38bdf8',
          border: '2.5px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 10,
          padding: '8px 14px',
          minWidth: 250,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            background: '#ffffff',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#000000',
            flexShrink: 0,
          }}
        >
          ▲
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 18,
                fontWeight: 900,
                color: '#000000',
                letterSpacing: '-0.5px',
                lineHeight: 1,
              }}
            >
              ResQ-GIS
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              fontWeight: 800,
              color: '#000000',
              marginTop: 2,
              lineHeight: 1.1,
            }}
          >
            Disaster Decision Support Platform
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              fontWeight: 800,
              color: '#000000',
              marginTop: 2,
              letterSpacing: '-0.2px',
            }}
          >
            Uttarakhand | NDMA | IMD | CWC | ISRO | GSI
          </span>
        </div>
      </div>

      {/* 2. Emergency Warning Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fecdd3',
          border: '2.5px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 10,
          padding: '8px 16px',
          gap: 12,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: '#ef4444',
              flexShrink: 0,
            }}
          >
            ⚠️
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 900,
                color: '#000000',
                letterSpacing: '-0.2px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {criticalAlert.headline || 'IMD HEAVY RAINFALL WARNING'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 700,
                color: '#404040',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Chamoli, Rudraprayag | 28 Sep – 30 Sep 2026
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              background: '#ef4444',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              fontWeight: 900,
              padding: '3px 8px',
              borderRadius: 4,
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              textTransform: 'uppercase',
            }}
          >
            RED
          </span>

          <button
            onClick={() => setActiveNav('alerts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#ffffff',
              color: '#000000',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              padding: '5px 10px',
              borderRadius: 6,
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <span>View Details</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* 3. System Status Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#86efac',
          border: '2.5px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 10,
          padding: '6px 14px',
          minWidth: 155,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            fontWeight: 800,
            color: '#000000',
            textTransform: 'uppercase',
          }}
        >
          System Status
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#15803d',
              border: '1.5px solid #000000',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 900,
              color: '#000000',
            }}
          >
            Operational
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            fontWeight: 700,
            color: '#1e3a1e',
            marginTop: 2,
          }}
        >
          Updated: 27 Sep 2026, 14:32 IST
        </span>
      </div>

      {/* 4. District Emergency Operator Profile Card */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#7dd3fc',
            border: '2.5px solid #000000',
            boxShadow: '3px 3px 0px #000000',
            borderRadius: 10,
            padding: '6px 14px',
            cursor: 'pointer',
            height: '100%',
            textAlign: 'left',
            transition: 'all 0.1s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translate(-1px, -1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#000000',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            <User size={16} strokeWidth={2.5} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 900,
                color: '#000000',
                lineHeight: 1.1,
              }}
            >
              District Emergency Operator
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#1e293b',
                }}
              >
                {selectedDistrict}, {selectedState}
              </span>
              <ChevronDown size={13} strokeWidth={3} color="#000000" />
            </div>
          </div>
        </button>

        {/* District Switcher Dropdown Popover */}
        {isProfileOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: 220,
              background: '#ffffff',
              border: '2.5px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              borderRadius: 8,
              padding: 6,
              zIndex: 1000,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: '#525252',
                padding: '4px 8px',
                textTransform: 'uppercase',
                borderBottom: '1.5px solid #000000',
                marginBottom: 4,
              }}
            >
              Select Operating District
            </div>
            {['Chamoli', 'Rudraprayag', 'Pithoragarh', 'Uttarkashi'].map((dist) => {
              const isSelected = selectedDistrict.toLowerCase() === dist.toLowerCase();
              return (
                <button
                  key={dist}
                  onClick={() => handleDistrictChange(dist)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: 4,
                    background: isSelected ? 'var(--nb-yellow)' : 'transparent',
                    color: '#000000',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    fontWeight: isSelected ? 900 : 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#f4f4f5';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{dist}</span>
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
