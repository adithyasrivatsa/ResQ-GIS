import { useState, useMemo } from 'react';
import {
  Search,
  Radio,
  WifiOff,
  X,
  MapPin,
  Building,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Navigation,
  Globe,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  flyToHabitation,
  flyToSite,
  flyToDistrict,
  flyToState,
  flyToUttarakhand,
} from '../../cesium/camera';

const AVAILABLE_STATES = [
  { name: 'Uttarakhand', region: 'Western Himalayas' },
  { name: 'Himachal Pradesh', region: 'North-Western Himalayas' },
  { name: 'Sikkim', region: 'Eastern Himalayas' },
  { name: 'Kerala', region: 'Western Ghats' },
  { name: 'Assam', region: 'North-East Region' },
  { name: 'Odisha', region: 'Eastern Coastal' },
];

const FALLBACK_HIERARCHY = [
  { region: 'Western Himalayas', state: 'Uttarakhand', district: 'Chamoli', block: 'Joshimath' },
  { region: 'Western Himalayas', state: 'Uttarakhand', district: 'Chamoli', block: 'Dasholi' },
  { region: 'Western Himalayas', state: 'Uttarakhand', district: 'Rudraprayag', block: 'Ukhimath' },
  { region: 'Western Himalayas', state: 'Uttarakhand', district: 'Rudraprayag', block: 'Augustmuni' },
  { region: 'North-Western Himalayas', state: 'Himachal Pradesh', district: 'Kinnaur', block: 'Pooh' },
  { region: 'North-Western Himalayas', state: 'Himachal Pradesh', district: 'Kullu', block: 'Manali' },
  { region: 'Eastern Himalayas', state: 'Sikkim', district: 'Mangan', block: 'Chungthang' },
  { region: 'Western Ghats', state: 'Kerala', district: 'Wayanad', block: 'Meppadi' },
  { region: 'Western Ghats', state: 'Kerala', district: 'Idukki', block: 'Devikulam' },
  { region: 'North-East Region', state: 'Assam', district: 'Dima Hasao', block: 'Haflong' },
  { region: 'Eastern Coastal', state: 'Odisha', district: 'Ganjam', block: 'Chatrapur' },
];

export default function TopBar() {
  const {
    isDemoMode,
    backendConnected,
    isSyncing,
    loadData,
    alerts,
    searchQuery,
    setSearchQuery,
    getFilteredHabitations,
    getFilteredSites,
    selectHabitation,
    selectSite,
    selectedState,
    selectedDistrict,
    selectedBlock,
    adminHierarchy,
    setSelectedRegion,
    setSelectedState,
    setSelectedDistrict,
    setSelectedBlock,
    loadDistrictReport,
  } = useAppStore();

  const [isFocused, setIsFocused] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const activeAlerts = alerts.filter((a) => a.severity === 'red' || a.severity === 'orange').length;

  const hierarchyList = useMemo(() => {
    if (adminHierarchy?.hierarchy && adminHierarchy.hierarchy.length > 0) {
      return adminHierarchy.hierarchy;
    }
    return FALLBACK_HIERARCHY;
  }, [adminHierarchy]);

  // Derived districts for currently selected state
  const currentDistricts = useMemo(() => {
    const list = hierarchyList
      .filter((n) => n.state.toLowerCase() === selectedState.toLowerCase())
      .map((n) => n.district);
    return [...new Set(list)];
  }, [hierarchyList, selectedState]);

  // Derived blocks for currently selected district
  const currentBlocks = useMemo(() => {
    const list = hierarchyList
      .filter(
        (n) =>
          n.state.toLowerCase() === selectedState.toLowerCase() &&
          n.district.toLowerCase() === selectedDistrict.toLowerCase()
      )
      .map((n) => n.block);
    return [...new Set(list)];
  }, [hierarchyList, selectedState, selectedDistrict]);

  const handleStateChange = (stateName: string, regionName: string) => {
    setSelectedState(stateName);
    setSelectedRegion(regionName);
    const firstDist = hierarchyList.find((n) => n.state.toLowerCase() === stateName.toLowerCase());
    if (firstDist) {
      setSelectedDistrict(firstDist.district);
      loadDistrictReport(firstDist.district);
      flyToDistrict(firstDist.district);
    } else {
      flyToState(stateName);
    }
  };

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    loadDistrictReport(districtName);
    flyToDistrict(districtName);
  };

  const matchedHabs = searchQuery.trim() ? getFilteredHabitations() : [];
  const matchedSites = searchQuery.trim() ? getFilteredSites() : [];
  const hasResults = matchedHabs.length > 0 || matchedSites.length > 0;

  return (
    <header className="top-bar">
      {/* Brand Identity */}
      <div className="top-bar__brand">
        <div className="top-bar__logo">
          <Radio size={16} strokeWidth={2.2} />
        </div>
        <div className="top-bar__title">
          <h1>ResQ-GIS</h1>
          <span className="top-bar__subtitle">Disaster Relocation Intelligence</span>
        </div>
      </div>

      {/* Apple-Style Minimal Search Input */}
      <div className="top-bar__search" style={{ position: 'relative' }}>
        <Search size={14} color="#64748b" />
        <input
          type="text"
          placeholder="Search villages, safe havens, or hazards..."
          className="top-bar__search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 250)}
        />
        {searchQuery && (
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: 2,
            }}
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}

        {/* Clean Autocomplete Dropdown */}
        {isFocused && searchQuery.trim() && hasResults && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 8,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
              borderRadius: '12px',
              zIndex: 1000,
              maxHeight: 300,
              overflowY: 'auto',
              padding: '6px',
            }}
          >
            {matchedHabs.map((h) => (
              <div
                key={h.id}
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  background: '#ffffff',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                onMouseDown={() => {
                  selectHabitation(h.id);
                  flyToHabitation(h.location.lng, h.location.lat);
                  setSearchQuery('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '6px',
                      background: '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                    }}
                  >
                    <MapPin size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {h.district} · Pop: {h.population.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`risk-badge risk-badge--sm ${h.riskScore >= 0.7 ? 'risk--critical' : 'risk--high'}`}>
                  Risk {h.riskScore.toFixed(2)}
                </span>
              </div>
            ))}

            {matchedSites.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  background: '#ffffff',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                onMouseDown={() => {
                  selectSite(s.id);
                  flyToSite(s.location.lng, s.location.lat);
                  setSearchQuery('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '6px',
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                    }}
                  >
                    <Building size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Safe Haven · Cap: {s.capacity.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="risk-badge risk-badge--sm risk--low">Safe Site</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meta Controls & Scope */}
      <div className="top-bar__meta">
        {/* Administrative Hierarchy Scope Selector */}
        <div style={{ position: 'relative' }}>
          <button
            className="top-bar__pill"
            style={{
              background: isScopeOpen ? '#f1f5f9' : '#ffffff',
              color: '#0f172a',
            }}
            onClick={() => setIsScopeOpen(!isScopeOpen)}
            title="Select Administrative Operational Scope"
          >
            <MapPin size={13} color="#0284c7" />
            <span>
              {selectedDistrict ? `${selectedState} / ${selectedDistrict}` : selectedState}
              {selectedBlock ? ` / ${selectedBlock}` : ''}
            </span>
            <ChevronDown
              size={12}
              style={{
                transform: isScopeOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                color: '#94a3b8',
              }}
            />
          </button>

          {/* Clean Scope Popover */}
          {isScopeOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                width: 380,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                borderRadius: 14,
                padding: 16,
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: 10,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: '#f0f9ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                    }}
                  >
                    <Globe size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                      Administrative Jurisdiction
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      Official LGD Directory & Census
                    </div>
                  </div>
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: '#94a3b8',
                    borderRadius: 4,
                  }}
                  onClick={() => setIsScopeOpen(false)}
                >
                  <X size={14} />
                </button>
              </div>

              {/* State Switcher */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  State / Province
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {AVAILABLE_STATES.map((st) => {
                    const isSel = selectedState.toLowerCase() === st.name.toLowerCase();
                    return (
                      <button
                        key={st.name}
                        onClick={() => handleStateChange(st.name, st.region)}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '4px 10px',
                          border: `1px solid ${isSel ? '#0f172a' : '#e2e8f0'}`,
                          borderRadius: 6,
                          background: isSel ? '#0f172a' : '#ffffff',
                          color: isSel ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {st.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District Switcher */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  District
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {currentDistricts.map((dist) => {
                    const isSel = selectedDistrict.toLowerCase() === dist.toLowerCase();
                    return (
                      <button
                        key={dist}
                        onClick={() => handleDistrictChange(dist)}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '4px 10px',
                          border: `1px solid ${isSel ? '#0284c7' : '#e2e8f0'}`,
                          borderRadius: 6,
                          background: isSel ? '#0284c7' : '#ffffff',
                          color: isSel ? '#ffffff' : '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {dist}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Block Switcher */}
              {currentBlocks.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Tehsil / Block
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    <button
                      onClick={() => setSelectedBlock(null)}
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '3px 8px',
                        border: `1px solid ${selectedBlock === null ? '#10b981' : '#e2e8f0'}`,
                        borderRadius: 6,
                        background: selectedBlock === null ? '#10b981' : '#ffffff',
                        color: selectedBlock === null ? '#ffffff' : '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      All Blocks
                    </button>
                    {currentBlocks.map((blk) => {
                      const isSel = selectedBlock?.toLowerCase() === blk.toLowerCase();
                      return (
                        <button
                          key={blk}
                          onClick={() => setSelectedBlock(blk)}
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '3px 8px',
                            border: `1px solid ${isSel ? '#10b981' : '#e2e8f0'}`,
                            borderRadius: 6,
                            background: isSel ? '#10b981' : '#ffffff',
                            color: isSel ? '#ffffff' : '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          {blk}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 10,
                }}
              >
                <button
                  className="retro-btn"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={() => {
                    handleStateChange('Uttarakhand', 'Western Himalayas');
                    handleDistrictChange('Chamoli');
                    setSelectedBlock('Joshimath');
                    flyToUttarakhand();
                    setIsScopeOpen(false);
                  }}
                >
                  Reset (Chamoli)
                </button>

                <button
                  className="retro-btn retro-btn--orange"
                  style={{ fontSize: 11, padding: '4px 12px' }}
                  onClick={() => {
                    if (selectedDistrict) flyToDistrict(selectedDistrict);
                    else flyToState(selectedState);
                    setIsScopeOpen(false);
                  }}
                >
                  <Navigation size={11} />
                  <span>Center View</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warnings Counter */}
        <div
          className="top-bar__pill"
          style={{
            background: activeAlerts > 0 ? '#fef2f2' : '#f8fafc',
            borderColor: activeAlerts > 0 ? '#fecaca' : '#e2e8f0',
            color: activeAlerts > 0 ? '#b91c1c' : '#64748b',
          }}
        >
          <AlertCircle size={13} color={activeAlerts > 0 ? '#ef4444' : '#64748b'} />
          <span>{activeAlerts} {activeAlerts === 1 ? 'Alert' : 'Alerts'}</span>
        </div>

        {/* Backend Live Connectivity Status */}
        <button
          className="top-bar__pill"
          style={{
            background: backendConnected ? (isDemoMode ? '#fffbeb' : '#f0fdf4') : '#f8fafc',
            borderColor: backendConnected ? (isDemoMode ? '#fde68a' : '#bbf7d0') : '#e2e8f0',
            color: backendConnected ? (isDemoMode ? '#b45309' : '#15803d') : '#64748b',
          }}
          onClick={() => loadData()}
          title="Click to refresh feeds"
        >
          {isSyncing ? (
            <RefreshCw size={12} className="spin" color="#64748b" />
          ) : backendConnected ? (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isDemoMode ? '#f59e0b' : '#10b981',
                boxShadow: isDemoMode ? '0 0 6px rgba(245,158,11,0.5)' : '0 0 6px rgba(16,185,129,0.5)',
              }}
            />
          ) : (
            <WifiOff size={12} color="#94a3b8" />
          )}
          <span>{backendConnected ? (isDemoMode ? 'Evaluation Mode' : 'Live Feeds Active') : 'Offline Mode'}</span>
        </button>
      </div>
    </header>
  );
}
