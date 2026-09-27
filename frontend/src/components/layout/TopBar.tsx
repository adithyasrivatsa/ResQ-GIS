import { useState, useMemo } from 'react';
import {
  Search,
  Radio,
  Wifi,
  WifiOff,
  X,
  MapPin,
  Building,
  RefreshCw,
  Sparkles,
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
      <div className="top-bar__brand">
        <div className="top-bar__logo">
          <Radio size={18} strokeWidth={2.5} />
        </div>
        <div className="top-bar__title">
          <h1>RESQ-GIS.EXE</h1>
          <span className="top-bar__subtitle">PROACTIVE RELOCATION ENGINE ★ V2.6</span>
        </div>
      </div>

      {/* Retro Search with Autocomplete */}
      <div className="top-bar__search" style={{ position: 'relative' }}>
        <Search size={14} color="#000" />
        <input
          type="text"
          placeholder="SEARCH VILLAGE, SAFE SITE, HAZARD..."
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
              color: '#000',
              cursor: 'pointer',
              display: 'flex',
              padding: 2,
            }}
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}

        {/* Retro Autocomplete Dropdown */}
        {isFocused && searchQuery.trim() && hasResults && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 6,
              background: '#ffffff',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              borderRadius: '8px',
              zIndex: 1000,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {matchedHabs.map((h) => (
              <div
                key={h.id}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: '2px solid #e2e8f0',
                  background: '#ffffff',
                }}
                onMouseDown={() => {
                  selectHabitation(h.id);
                  flyToHabitation(h.location.lng, h.location.lat);
                  setSearchQuery('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={14} color="#ea580c" />
                  <div>
                    <div style={{ fontFamily: 'Silkscreen', fontSize: 11, color: '#000' }}>{h.name}</div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#64748b' }}>
                      {h.district} · Pop: {h.population.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`risk-badge risk-badge--sm ${h.riskScore >= 0.7 ? 'risk--critical' : 'risk--high'}`}>
                  RISK {h.riskScore.toFixed(2)}
                </span>
              </div>
            ))}

            {matchedSites.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: '2px solid #e2e8f0',
                  background: '#f0fdf4',
                }}
                onMouseDown={() => {
                  selectSite(s.id);
                  flyToSite(s.location.lng, s.location.lat);
                  setSearchQuery('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building size={14} color="#2563eb" />
                  <div>
                    <div style={{ fontFamily: 'Silkscreen', fontSize: 11, color: '#1e40af' }}>{s.name}</div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#475569' }}>
                      Safe Haven · Cap: {s.capacity.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="risk-badge risk-badge--sm risk--low">SAFE SITE</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retro Status Badges & Controls */}
      <div className="top-bar__meta">
        {/* Interactive Administrative Hierarchy Scope Selector (Region -> State -> District -> Block) */}
        <div style={{ position: 'relative' }}>
          <button
            className="top-bar__pill"
            style={{
              background: isScopeOpen ? 'var(--retro-purple)' : '#ffffff',
              color: isScopeOpen ? '#ffffff' : '#000000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => setIsScopeOpen(!isScopeOpen)}
            title="Select Administrative Operational Scope (LGD + Census)"
          >
            <MapPin size={12} color={isScopeOpen ? '#ffffff' : '#ea580c'} />
            <span style={{ fontWeight: 800 }}>
              {selectedDistrict ? `${selectedState.toUpperCase()} / ${selectedDistrict.toUpperCase()}` : selectedState.toUpperCase()}
              {selectedBlock ? ` / ${selectedBlock.toUpperCase()}` : ''}
            </span>
            <ChevronDown size={11} style={{ transform: isScopeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {/* Retro Scope Popover Window */}
          {isScopeOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                width: 380,
                background: '#ffffff',
                border: '3px solid #000000',
                boxShadow: '4px 4px 0px #000000',
                borderRadius: 8,
                padding: 12,
                zIndex: 1000,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} color="var(--retro-purple)" />
                  <div>
                    <div style={{ fontFamily: 'Silkscreen', fontSize: 10, fontWeight: 700 }}>
                      ADMINISTRATIVE JURISDICTION
                    </div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#64748b' }}>
                      LGD DIRECTORY + CENSUS OF INDIA
                    </div>
                  </div>
                </div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  onClick={() => setIsScopeOpen(false)}
                >
                  <X size={14} />
                </button>
              </div>

              {/* State & Expansion Region Switcher */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#475569', marginBottom: 4 }}>
                  STATE / PROVINCE:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {AVAILABLE_STATES.map((st) => (
                    <button
                      key={st.name}
                      onClick={() => handleStateChange(st.name, st.region)}
                      style={{
                        fontFamily: 'Space Mono',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '3px 8px',
                        border: '1.5px solid #000',
                        borderRadius: 4,
                        background: selectedState.toLowerCase() === st.name.toLowerCase() ? 'var(--retro-orange)' : '#f1f5f9',
                        color: selectedState.toLowerCase() === st.name.toLowerCase() ? '#ffffff' : '#000000',
                        cursor: 'pointer',
                      }}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* District Switcher */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#475569', marginBottom: 4 }}>
                  DISTRICT:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {currentDistricts.map((dist) => (
                    <button
                      key={dist}
                      onClick={() => handleDistrictChange(dist)}
                      style={{
                        fontFamily: 'Space Mono',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '3px 8px',
                        border: '1.5px solid #000',
                        borderRadius: 4,
                        background: selectedDistrict.toLowerCase() === dist.toLowerCase() ? 'var(--retro-purple)' : '#f8fafc',
                        color: selectedDistrict.toLowerCase() === dist.toLowerCase() ? '#ffffff' : '#000000',
                        cursor: 'pointer',
                      }}
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Block Switcher */}
              {currentBlocks.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#475569', marginBottom: 4 }}>
                    TEHSIL / BLOCK:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <button
                      onClick={() => setSelectedBlock(null)}
                      style={{
                        fontFamily: 'Space Mono',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        border: '1px solid #000',
                        borderRadius: 4,
                        background: selectedBlock === null ? '#10b981' : '#f1f5f9',
                        color: selectedBlock === null ? '#ffffff' : '#000000',
                        cursor: 'pointer',
                      }}
                    >
                      ALL BLOCKS
                    </button>
                    {currentBlocks.map((blk) => (
                      <button
                        key={blk}
                        onClick={() => setSelectedBlock(blk)}
                        style={{
                          fontFamily: 'Space Mono',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          border: '1px solid #000',
                          borderRadius: 4,
                          background: selectedBlock?.toLowerCase() === blk.toLowerCase() ? '#10b981' : '#f8fafc',
                          color: selectedBlock?.toLowerCase() === blk.toLowerCase() ? '#ffffff' : '#000000',
                          cursor: 'pointer',
                        }}
                      >
                        {blk}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 8 }}>
                <button
                  className="retro-btn"
                  style={{ fontSize: 9, padding: '3px 8px' }}
                  onClick={() => {
                    handleStateChange('Uttarakhand', 'Western Himalayas');
                    handleDistrictChange('Chamoli');
                    setSelectedBlock('Joshimath');
                    flyToUttarakhand();
                    setIsScopeOpen(false);
                  }}
                >
                  DEFAULT (CHAMOLI)
                </button>

                <button
                  className="retro-btn retro-btn--orange"
                  style={{ fontSize: 9, padding: '3px 10px' }}
                  onClick={() => {
                    if (selectedDistrict) flyToDistrict(selectedDistrict);
                    else flyToState(selectedState);
                    setIsScopeOpen(false);
                  }}
                >
                  <Navigation size={10} />
                  <span>CENTER RADAR</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="top-bar__pill top-bar__pill--warning">
          <Sparkles size={12} />
          <span>{activeAlerts} ACTIVE WARNINGS</span>
        </div>

        {/* Backend Connectivity Status Button */}
        <button
          className="top-bar__pill top-bar__pill--status"
          style={{
            background: backendConnected ? (isDemoMode ? '#d97706' : '#10b981') : '#7952f5',
            color: '#fff',
          }}
          onClick={() => loadData()}
          title="Click to sync live feeds"
        >
          {isSyncing ? (
            <RefreshCw size={12} className="spin" />
          ) : backendConnected ? (
            <Wifi size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          <span>{backendConnected ? (isDemoMode ? 'LIVE API (DEMO MODE)' : 'LIVE OPERATIONAL') : 'DEMO MODE'}</span>
        </button>

        {/* Retro Window Control Buttons */}
        <div className="retro-win-controls" style={{ marginLeft: 6 }}>
          <button className="retro-win-btn" title="Minimize">_</button>
          <button className="retro-win-btn" title="Maximize">□</button>
          <button className="retro-win-btn retro-win-btn--close" title="Close">✕</button>
        </div>
      </div>
    </header>
  );
}
