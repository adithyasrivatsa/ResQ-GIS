import { Bookmark } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToDistrict } from '../../cesium/camera';

export default function FilterBar() {
  const {
    selectedDistrict,
    setSelectedDistrict,
    selectedBlock,
    setSelectedBlock,
    loadDistrictReport,
  } = useAppStore();

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    loadDistrictReport(dist);
    flyToDistrict(dist);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        border: '2.5px solid #000000',
        boxShadow: '3px 3px 0px #000000',
        borderRadius: 10,
        padding: '6px 12px',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
        {/* District Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
            District
          </span>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            style={{
              padding: '3px 8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              color: '#000000',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 6,
              boxShadow: '1.5px 1.5px 0px #000000',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="Chamoli">Chamoli</option>
            <option value="Rudraprayag">Rudraprayag</option>
            <option value="Pithoragarh">Pithoragarh</option>
            <option value="Uttarkashi">Uttarkashi</option>
          </select>
        </div>

        {/* Block Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
            Block
          </span>
          <select
            value={selectedBlock ?? 'all'}
            onChange={(e) => setSelectedBlock(e.target.value === 'all' ? null : e.target.value)}
            style={{
              padding: '3px 8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              color: '#000000',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 6,
              boxShadow: '1.5px 1.5px 0px #000000',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All</option>
            <option value="Joshimath">Joshimath</option>
            <option value="Dasholi">Dasholi</option>
            <option value="Ghat">Ghat</option>
            <option value="Ukhimath">Ukhimath</option>
          </select>
        </div>

        {/* Hazard Type Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
            Hazard Type
          </span>
          <select
            defaultValue="all"
            style={{
              padding: '3px 8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              color: '#000000',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 6,
              boxShadow: '1.5px 1.5px 0px #000000',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All</option>
            <option value="landslide">Landslide</option>
            <option value="flood">Flood</option>
            <option value="glof">GLOF</option>
            <option value="avalanche">Avalanche</option>
          </select>
        </div>

        {/* Time Range Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
            Time Range
          </span>
          <select
            defaultValue="72h"
            style={{
              padding: '3px 8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              color: '#000000',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 6,
              boxShadow: '1.5px 1.5px 0px #000000',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="24h">Last 24 hours</option>
            <option value="72h">Last 72 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="monsoon">Monsoon 2026</option>
          </select>
        </div>
      </div>

      {/* Bookmarks Button */}
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          background: '#ffffff',
          color: '#000000',
          border: '2px solid #000000',
          boxShadow: '1.5px 1.5px 0px #000000',
          borderRadius: 6,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 900,
          cursor: 'pointer',
          transition: 'all 0.1s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
      >
        <Bookmark size={13} strokeWidth={2.5} />
        <span>Bookmarks</span>
      </button>
    </div>
  );
}
