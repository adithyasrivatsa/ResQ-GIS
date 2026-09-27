import { create } from 'zustand';
import type {
  Habitation,
  RelocationSite,
  DisasterAlert,
  WeatherForecast,
  WeatherReport,
  MapLayer,
  NavSection,
  RiverObservation,
  RiverStation,
  HazardLayerItem,
  PrioritizationItem,
  DistrictRiskReport,
  SystemStatus,
  EmergencyResource,
  OSMRoadFeature,
  AdministrativeHierarchyResponse,
  SystemProvidersStatusResponse,
  MLStatusResponse,
  DynamicHazardAssessment,
} from '../types';
import { DEMO_HABITATIONS } from '../data/habitations';
import { DEMO_RELOCATION_SITES } from '../data/relocationSites';
import { DEMO_ALERTS } from '../data/alerts';
import { DEMO_WEATHER } from '../data/weather';
import { DEMO_RIVER_STATIONS } from '../data/rivers';
import { DEMO_HAZARDS } from '../data/hazards';
import { DEFAULT_LAYERS } from '../data/layers';
import { api } from '../services/api';

interface AppState {
  // Navigation
  activeNav: NavSection;
  setActiveNav: (nav: NavSection) => void;

  // Administrative Scope & Multi-Tier Hierarchy
  selectedRegion: string;
  selectedState: string;
  selectedDistrict: string;
  selectedBlock: string | null;
  adminHierarchy: AdministrativeHierarchyResponse | null;
  setSelectedRegion: (region: string) => void;
  setSelectedState: (state: string) => void;
  setSelectedDistrict: (district: string) => void;
  setSelectedBlock: (block: string | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Selection
  selectedHabitationId: string | null;
  selectHabitation: (id: string | null) => void;
  selectedSiteId: string | null;
  selectSite: (id: string | null) => void;
  selectedRiverId: string | null;
  selectRiver: (id: string | null) => void;
  selectedHazardId: string | null;
  selectHazard: (id: string | null) => void;

  // Data
  habitations: Habitation[];
  relocationSites: RelocationSite[];
  emergencyResources: EmergencyResource[];
  roads: OSMRoadFeature[];
  alerts: DisasterAlert[];
  weather: WeatherForecast[];
  weatherReport: WeatherReport | null;
  riverStations: RiverStation[];
  riverObservations: RiverObservation[];
  hazardLayers: HazardLayerItem[];
  layers: MapLayer[];
  prioritizationResults: PrioritizationItem[];
  districtReport: DistrictRiskReport | null;

  // Status & Connectivity
  isDemoMode: boolean;
  backendConnected: boolean;
  isSyncing: boolean;
  systemStatus: SystemStatus | null;
  providersDetailedStatus: SystemProvidersStatusResponse | null;
  mlStatus: MLStatusResponse | null;
  activeHazardAssessment: DynamicHazardAssessment | null;

  // Layer management
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  getLayerVisibilityMap: () => Record<string, boolean>;

  // Actions
  loadData: () => Promise<void>;
  loadWeather: (district: string) => Promise<void>;
  loadProvidersDetailedStatus: () => Promise<void>;
  loadMLStatus: () => Promise<void>;
  loadHabitationHazardAssessment: (habitationId: string) => Promise<void>;
  calculatePrioritization: (weights?: {
    hvi?: number;
    hazard?: number;
    population?: number;
    historical?: number;
    structural?: number;
    feasibility?: number;
  }) => Promise<void>;
  loadDistrictReport: (district: string) => Promise<void>;

  // Computed
  getSelectedHabitation: () => Habitation | undefined;
  getSelectedSite: () => RelocationSite | undefined;
  getSelectedRiver: () => RiverStation | undefined;
  getSelectedHazard: () => HazardLayerItem | undefined;
  getAtRiskHabitations: () => Habitation[];
  getVisibleLayers: () => MapLayer[];
  getFilteredHabitations: () => Habitation[];
  getFilteredSites: () => RelocationSite[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  activeNav: 'map',
  setActiveNav: (nav) => set({ activeNav: nav }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Selection
  selectedHabitationId: null,
  selectHabitation: (id) => {
    set({
      selectedHabitationId: id,
      selectedSiteId: null,
      selectedRiverId: null,
      selectedHazardId: null,
      activeHazardAssessment: null,
      activeNav: id ? 'habitations' : get().activeNav,
    });
    if (id && get().backendConnected) {
      get().loadHabitationHazardAssessment(id);
    }
  },

  selectedSiteId: null,
  selectSite: (id) =>
    set({
      selectedSiteId: id,
      selectedHabitationId: null,
      selectedRiverId: null,
      selectedHazardId: null,
      activeNav: id ? 'relocation' : get().activeNav,
    }),

  selectedRiverId: null,
  selectRiver: (id) =>
    set({
      selectedRiverId: id,
      selectedHabitationId: null,
      selectedSiteId: null,
      selectedHazardId: null,
      activeNav: id ? 'rivers' : get().activeNav,
    }),

  selectedHazardId: null,
  selectHazard: (id) =>
    set({
      selectedHazardId: id,
      selectedHabitationId: null,
      selectedSiteId: null,
      selectedRiverId: null,
    }),

  // Administrative Scope & Multi-Tier Hierarchy
  selectedRegion: 'Western Himalayas',
  selectedState: 'Uttarakhand',
  selectedDistrict: 'Chamoli',
  selectedBlock: null,
  adminHierarchy: null,
  setSelectedRegion: (region) => set({ selectedRegion: region, selectedDistrict: '', selectedBlock: null }),
  setSelectedState: (state) => set({ selectedState: state, selectedDistrict: '', selectedBlock: null }),
  setSelectedDistrict: (district) => {
    set({ selectedDistrict: district, selectedBlock: null });
    get().loadDistrictReport(district);
  },
  setSelectedBlock: (block) => set({ selectedBlock: block }),

  // Initial Data
  habitations: DEMO_HABITATIONS,
  relocationSites: DEMO_RELOCATION_SITES,
  emergencyResources: [],
  roads: [],
  alerts: DEMO_ALERTS,
  weather: DEMO_WEATHER,
  weatherReport: null,
  riverStations: DEMO_RIVER_STATIONS,
  riverObservations: [],
  hazardLayers: DEMO_HAZARDS,
  layers: DEFAULT_LAYERS,
  prioritizationResults: [],
  districtReport: null,

  // Connectivity
  isDemoMode: true,
  backendConnected: false,
  isSyncing: false,
  systemStatus: null,
  providersDetailedStatus: null,
  mlStatus: null,
  activeHazardAssessment: null,

  // Layer management
  toggleLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    })),

  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, opacity } : l
      ),
    })),

  getLayerVisibilityMap: () => {
    const map: Record<string, boolean> = {};
    get().layers.forEach((l) => {
      map[l.id] = l.visible;
    });
    return map;
  },

  // Actions
  loadData: async () => {
    set({ isSyncing: true });
    try {
      // 1. Health check
      const health = await api.health();
      const isOnline = health.status === 'ok';

      if (isOnline) {
        // Fetch all operational hierarchy datasets in parallel
        const [habs, sites, alerts, rivers, hazards, weatherRes, status, customLayers, roads, emergency, hierarchy, providerStat, ml] =
          await Promise.all([
            api.getHabitations().catch(() => DEMO_HABITATIONS),
            api.getRelocationSites().catch(() => DEMO_RELOCATION_SITES),
            api.getAlerts().catch(() => DEMO_ALERTS),
            api.getRivers().catch(() => DEMO_RIVER_STATIONS),
            api.getHazardLayers().catch(() => DEMO_HAZARDS),
            api.getWeather('Chamoli').catch(() => ({ forecast: DEMO_WEATHER })),
            api.getStatus().catch(() => null),
            api.getLayers().catch(() => DEFAULT_LAYERS),
            api.getRoads().catch(() => []),
            api.getEmergencyResources().catch(() => []),
            api.getAdminHierarchy().catch(() => null),
            api.getProvidersDetailedStatus().catch(() => null),
            api.getMLStatus().catch(() => null),
          ]);

        set({
          backendConnected: true,
          isDemoMode: health.demo_mode,
          habitations: habs.length > 0 ? habs : DEMO_HABITATIONS,
          relocationSites: sites.length > 0 ? sites : DEMO_RELOCATION_SITES,
          alerts: alerts.length > 0 ? alerts : DEMO_ALERTS,
          riverStations: rivers.length > 0 ? rivers : DEMO_RIVER_STATIONS,
          hazardLayers: hazards.length > 0 ? hazards : DEMO_HAZARDS,
          weather: weatherRes.forecast.length > 0 ? weatherRes.forecast : DEMO_WEATHER,
          weatherReport: ('report' in weatherRes && weatherRes.report) ? weatherRes.report : null,
          systemStatus: status,
          providersDetailedStatus: providerStat,
          mlStatus: ml,
          layers: customLayers.length > 0 ? customLayers : DEFAULT_LAYERS,
          roads: roads,
          emergencyResources: emergency,
          adminHierarchy: hierarchy,
          isSyncing: false,
        });

        // Trigger analysis and district report
        get().calculatePrioritization();
        get().loadDistrictReport('Chamoli');
        return;
      }
    } catch {
      console.info('Backend API offline or unreachable, operating in high-fidelity demo mode');
    }

    // Default static fallback prioritization
    set({
      backendConnected: false,
      isDemoMode: true,
      isSyncing: false,
    });
    get().calculatePrioritization();
  },

  loadWeather: async (district: string) => {
    try {
      const res = await api.getWeather(district);
      if (res.forecast.length > 0) {
        set({
          weather: res.forecast,
          weatherReport: res.report || null,
        });
      }
    } catch (e) {
      console.warn('Weather fetch error:', e);
    }
  },

  loadProvidersDetailedStatus: async () => {
    try {
      const res = await api.getProvidersDetailedStatus();
      set({ providersDetailedStatus: res });
    } catch (e) {
      console.warn('Providers detailed status error:', e);
    }
  },

  loadMLStatus: async () => {
    try {
      const res = await api.getMLStatus();
      set({ mlStatus: res });
    } catch (e) {
      console.warn('ML status error:', e);
    }
  },

  loadHabitationHazardAssessment: async (habitationId: string) => {
    try {
      const res = await api.getHazardAssessment(habitationId);
      set({ activeHazardAssessment: res });
    } catch (e) {
      console.warn(`Hazard assessment error for ${habitationId}:`, e);
    }
  },

  calculatePrioritization: async (weights) => {
    const { backendConnected, habitations, relocationSites } = get();

    if (backendConnected) {
      try {
        const res = await api.getPrioritization(weights);
        set({ prioritizationResults: res.rankedHabitations });
        return;
      } catch (err) {
        console.warn('Prioritization API call failed, falling back to local calculation', err);
      }
    }

    // Local deterministic fallback calculation based on TOPSIS-like criteria
    const ranked: PrioritizationItem[] = [...habitations]
      .sort((a, b) => {
        const scoreA =
          a.riskScore * 0.4 +
          a.vulnerabilityIndex.overall * 0.3 +
          (a.population / 5000) * 0.3;
        const scoreB =
          b.riskScore * 0.4 +
          b.vulnerabilityIndex.overall * 0.3 +
          (b.population / 5000) * 0.3;
        return scoreB - scoreA;
      })
      .map((h, idx) => {
        const site = relocationSites.find((s) => s.id === h.nearestRelocationSite);
        const reasons: string[] = [];
        if (h.riskScore >= 0.7) reasons.push('Severe hazard exposure');
        if (h.vulnerabilityIndex.overall >= 0.7) reasons.push('High vulnerability index');
        if (h.population > 1000) reasons.push(`${h.population.toLocaleString()} exposed`);
        if (reasons.length === 0) reasons.push('Routine surveillance');

        const score = Math.max(0.2, +(h.riskScore * 0.55 + h.vulnerabilityIndex.overall * 0.45).toFixed(4));
        return {
          rank: idx + 1,
          habitationId: h.id,
          name: h.name,
          district: h.district,
          population: h.population,
          score,
          reason: reasons.join('; '),
          hvi: h.vulnerabilityIndex.overall,
          hazardScore: h.riskScore,
          nearestRelocationSite: site?.id,
        };
      });

    set({ prioritizationResults: ranked });
  },

  loadDistrictReport: async (district: string) => {
    const { backendConnected, habitations, relocationSites, alerts } = get();
    if (backendConnected) {
      try {
        const rep = await api.getDistrictRisk(district);
        set({ districtReport: rep });
        return;
      } catch (e) {
        console.warn('Backend report error, falling back to local', e);
      }
    }

    const distHabs = habitations.filter((h) => h.district.toLowerCase() === district.toLowerCase());
    const distSites = relocationSites.filter((s) => s.district.toLowerCase() === district.toLowerCase());
    const distAlerts = alerts.filter((a) => a.area.toLowerCase().includes(district.toLowerCase()));
    const atRisk = distHabs.filter((h) => h.riskScore >= 0.6);

    set({
      districtReport: {
        district,
        generatedAt: new Date().toISOString(),
        totalHabitations: distHabs.length,
        atRiskCount: atRisk.length,
        totalPopulationExposed: atRisk.reduce((acc, h) => acc + h.population, 0),
        habitations: distHabs,
        relocationSites: distSites,
        activeAlerts: distAlerts,
      },
    });
  },

  // Computed
  getSelectedHabitation: () => {
    const { habitations, selectedHabitationId } = get();
    return habitations.find((h) => h.id === selectedHabitationId);
  },
  getSelectedSite: () => {
    const { relocationSites, selectedSiteId } = get();
    return relocationSites.find((s) => s.id === selectedSiteId);
  },
  getSelectedRiver: () => {
    const { riverStations, selectedRiverId } = get();
    return riverStations.find((r) => r.id === selectedRiverId);
  },
  getSelectedHazard: () => {
    const { hazardLayers, selectedHazardId } = get();
    return hazardLayers.find((hz) => hz.id === selectedHazardId);
  },
  getAtRiskHabitations: () => {
    const { habitations } = get();
    return habitations.filter((h) => h.riskScore >= 0.6);
  },
  getVisibleLayers: () => {
    const { layers } = get();
    return layers.filter((l) => l.visible);
  },
  getFilteredHabitations: () => {
    const { habitations, searchQuery } = get();
    if (!searchQuery.trim()) return habitations;
    const q = searchQuery.toLowerCase();
    return habitations.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q) ||
        h.recommendedAction.toLowerCase().includes(q)
    );
  },
  getFilteredSites: () => {
    const { relocationSites, searchQuery } = get();
    if (!searchQuery.trim()) return relocationSites;
    const q = searchQuery.toLowerCase();
    return relocationSites.filter(
      (s) => s.name.toLowerCase().includes(q) || s.district.toLowerCase().includes(q)
    );
  },
}));
