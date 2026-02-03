
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SystemInfo, User, Incident, SurveyResponse, TacticalAnalysis } from '../types';
import { mapService, operationsService, aiService } from '../services/api';
import {
  Search, Loader2, Target, Crosshair, Users, ChevronRight,
  MapPin, AlertTriangle, BrainCircuit, Activity, X,
  FileText, Zap, ShieldAlert, Satellite, RefreshCw, User as UserIcon,
  Radar, Layers, Map as MapIcon2
} from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// @ts-ignore
import { debounce } from 'lodash';

// --- CORREÇÃO DE ÍCONES DO LEAFLET EM REACT (SRE Standard) ---
const ICON_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const ICON_RETINA_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const SHADOW_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: ICON_URL,
  iconRetinaUrl: ICON_RETINA_URL,
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
// -----------------------------------------------------------

interface SmartMapProps {
  systemInfo?: SystemInfo;
  activeLayers: { residents: boolean; incidents: boolean; heatmap: boolean; surveys: boolean };
  onSelectEntity: (entity: any) => void;
  focusCoord?: { lat: number, lng: number } | null;
  showSearch?: boolean;
  filteredData?: User[];
  visualizationMode?: 'DEFAULT' | 'RISK' | 'AGE';
}

const SmartMap = ({ systemInfo, activeLayers, onSelectEntity, focusCoord, showSearch = true, filteredData, visualizationMode = 'DEFAULT' }: SmartMapProps) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [selectedDossier, setSelectedDossier] = useState<TacticalAnalysis | null>(null);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState<string | number | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const [radarMode, setRadarMode] = useState(false);
  const [radarRange, setRadarRange] = useState(500);
  const [lastRadarCount, setLastRadarCount] = useState<number | null>(null);
  const [radarAlert, setRadarAlert] = useState<string | null>(null);

  // New State for Layer Toggle
  const [layerType, setLayerType] = useState<'STREET' | 'SATELLITE'>('STREET');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // SRE: Lógica de Cluster Customizada
  const createClusterIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 'small';
    if (count > 10) size = 'medium';
    if (count > 50) size = 'large';

    return L.divIcon({
      html: `<div class="sie-cluster-marker ${size}">
               <div class="ring"></div>
               <span class="count">${count}</span>
             </div>`,
      className: 'sie-cluster-container',
      iconSize: L.point(40, 40)
    });
  };

  const registry = useRef({
    // SRE Optimization: MarkerClusterGroup para alta densidade
    // @ts-ignore - Leaflet.markercluster injetado via CDN
    markersGroup: (L as any).markerClusterGroup ? (L as any).markerClusterGroup({
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: createClusterIcon,
        chunkedLoading: true // Performance fix para 1k+ markers
    }) : L.layerGroup(),
    incidentsGroup: L.layerGroup(),
    circlesGroup: L.layerGroup(),
    heatGroup: L.layerGroup(),
    pingLayer: L.layerGroup(),
    surveyGroup: L.layerGroup(),
    searchResultGroup: L.layerGroup(),
    radarLayer: L.layerGroup()
  });

  const meta = useMemo(() => systemInfo?.module_metadata?.map || {}, [systemInfo]);
  const primaryColor = systemInfo?.primaryColor || '#4f46e5';
  const rules = useMemo(() => {
    try {
      const r = systemInfo?.context_rules;
      return typeof r === 'string' ? JSON.parse(r) : r || {};
    } catch { return {}; }
  }, [systemInfo]);

  const epicenter = useMemo(() => {
    const fallback = { lat: -22.6288, lng: -43.8975 };
    if (!systemInfo?.coordinates) return fallback;
    try {
      const c = typeof systemInfo.coordinates === 'string' ? JSON.parse(systemInfo.coordinates) : systemInfo.coordinates;
      return (c.lat && c.lng) ? c : fallback;
    } catch { return fallback; }
  }, [systemInfo]);

  // SRE FIX: Moved parseCoords outside or useCallback to be stable for other hooks
  const parseCoords = useCallback((c: any) => {
    if (!c) return null;
    try {
      const parsed = typeof c === 'string' ? JSON.parse(c) : c;
      const lat = parseFloat(parsed.lat);
      const lng = parseFloat(parsed.lng || parsed.lon);
      if (isNaN(lat) || isNaN(lng)) return null;
      return { lat, lng };
    } catch { return null; }
  }, []);

  const loadData = useCallback(async () => {
    const isBIMode = !!filteredData;
    try {
      const promises: Promise<any>[] = [
        operationsService.getIncidents(),
        mapService.getSurveyResponses()
      ];

      if (!isBIMode) {
        promises.push(mapService.getUnits());
      }

      const results = await Promise.allSettled(promises);

      if (results[0].status === 'fulfilled') setIncidents(results[0].value.data?.data || []);
      if (results[1].status === 'fulfilled') setSurveys(results[1].value.data?.data || []);

      if (!isBIMode && results[2] && results[2].status === 'fulfilled') {
        const validUnits = (results[2].value.data?.data || []).filter((u: User) => u.coordinates);
        setUnits(validUnits);
      }
    } catch { console.warn("Map data sync issue"); }
  }, [filteredData]);

  useEffect(() => {
    if (filteredData) {
      const validFilteredUnits = filteredData.filter(u => u.coordinates);
      setUnits(validFilteredUnits);
    }
  }, [filteredData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const triggerRadar = useCallback((lat: number, lng: number) => {
    registry.current.radarLayer.clearLayers();

    L.circle([lat, lng], {
      radius: radarRange,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 10'
    }).addTo(registry.current.radarLayer);

    const ping = L.divIcon({
      className: 'radar-ping',
      html: `<div class="radar-ping-ring"></div>`,
      iconSize: [20, 20]
    });
    L.marker([lat, lng], { icon: ping }).addTo(registry.current.radarLayer);

    const center = L.latLng(lat, lng);
    const residentsInRadius = units.filter(u => {
      const c = parseCoords(u.coordinates);
      if (!c) return false;
      return center.distanceTo([c.lat, c.lng]) <= radarRange;
    });

    setLastRadarCount(residentsInRadius.length);

    // SRE Feedback: Alerta se zona estiver vazia
    if (residentsInRadius.length === 0) {
        setRadarAlert("NENHUM ALVO LOCALIZADO NA VARREDURA");
        setTimeout(() => setRadarAlert(null), 3500);
    }

  }, [units, radarRange, parseCoords]);

  const triggerPing = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], 18, { duration: 2.5 });

    registry.current.pingLayer.clearLayers();
    const pingIcon = L.divIcon({
      className: 'sat-ping',
      html: `<div style="border-color:${primaryColor}" class="sat-ring"></div><div style="background-color:${primaryColor}" class="sat-dot"></div>`,
      iconSize: [80, 80]
    });

    L.marker([lat, lng], { icon: pingIcon }).addTo(registry.current.pingLayer);
    setTimeout(() => registry.current.pingLayer.clearLayers(), 5000);
  }, [primaryColor]);

  useEffect(() => { if (focusCoord) triggerPing(focusCoord.lat, focusCoord.lng); }, [focusCoord, triggerPing]);

  // SRE Update: Handle Layer Switching
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (tileLayerRef.current) {
        tileLayerRef.current.remove();
    }

    const url = layerType === 'STREET' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    
    const attribution = layerType === 'STREET' 
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    tileLayerRef.current = L.tileLayer(url, {
        maxZoom: 19,
        attribution: attribution,
        subdomains: layerType === 'STREET' ? 'abcd' : []
    }).addTo(mapInstanceRef.current);

  }, [layerType]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    if (!(L as any).map) return;

    const map = L.map(mapContainerRef.current, {
      center: [epicenter.lat, epicenter.lng],
      zoom: rules.default_zoom || 16,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true
    });

    Object.values(registry.current).forEach(layer => layer.addTo(map));
    mapInstanceRef.current = map;

    // Trigger initial layer load
    setLayerType('STREET'); 

    map.on('click', (e: any) => {
      if (radarMode) {
        triggerRadar(e.latlng.lat, e.latlng.lng);
      }
    });

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(mapContainerRef.current);

    return () => { observer.disconnect(); map.remove(); mapInstanceRef.current = null; };
  }, [epicenter, rules, radarMode, triggerRadar]);

  // SRE FIX: performSearch wrapped in useCallback to stabilize debouncedSearch dependency
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      registry.current.searchResultGroup.clearLayers();
      return setShowResults(false);
    }
    setIsSearching(true);
    try {
      const [localRes, geoRes] = await Promise.all([
        mapService.searchAdvanced(q),
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=4`, {
          headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'SIE-Zenith/21.0' }
        }).then(r => r.json())
      ]);

      const combined = [...(localRes.data.internal || []), ...geoRes.map((i: any) => ({
        id: `geo_${i.place_id}`,
        name: i.display_name,
        isAddress: true,
        coordinates: { lat: parseFloat(i.lat), lng: parseFloat(i.lon) }
      }))];

      setSearchResults(combined);
      setShowResults(true);

      registry.current.searchResultGroup.clearLayers();
      combined.forEach(item => {
        const c = parseCoords(item.coordinates);
        if (!c) return;

        const icon = L.divIcon({
          className: 'search-result-marker',
          html: `<div class="relative group">
                    <div class="absolute -inset-4 bg-white/20 rounded-full animate-ping group-hover:bg-white/40"></div>
                    <div style="background-color:${item.isAddress ? '#10b981' : primaryColor}"
                         class="w-7 h-7 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-white scale-110">
                         ${item.isAddress ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'}
                    </div>
                 </div>`,
          iconSize: [28, 28]
        });

        L.marker([c.lat, c.lng], { icon })
          .bindPopup(`<div class="bg-slate-900 text-white p-5 rounded-[2rem] border border-white/10 min-w-[220px] shadow-2xl">
                        <p class="text-[9px] font-black uppercase text-indigo-400 mb-2 tracking-widest">${item.isAddress ? 'Localização Externa' : 'Membro Localizado'}</p>
                        <h4 class="text-xs font-black uppercase mb-4 leading-tight">${item.name}</h4>
                        <div class="space-y-2">
                            <button id="btn-focus-${item.id}" class="w-full py-2.5 bg-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg"><Target size={12}/> Focar Alvo</button>
                        </div>
                    </div>`, { className: 'custom-tactic-popup' })
          .addTo(registry.current.searchResultGroup)
          .on('popupopen', () => {
            document.getElementById(`btn-focus-${item.id}`)?.addEventListener('click', () => {
              triggerPing(c.lat, c.lng);
            });
          });
      });

    } catch (e: any) { console.error("[SRE SEARCH FAIL]", e.message); } finally { setIsSearching(false); }
  }, [primaryColor, parseCoords, triggerPing]);

  const debouncedSearch = useMemo(() => debounce(performSearch, 500), [performSearch]);

  // SRE: HEATMAP SAFETY GUARD
  // Isola a lógica de Heatmap para permitir validação de dimensões e re-renderização segura
  const updateHeatmap = useCallback(() => {
      if (!mapInstanceRef.current) return;
      const { heatGroup } = registry.current;
      
      // Always clear first
      heatGroup.clearLayers();
      
      if (!activeLayers.heatmap || !(L as any).heatLayer) return;

      // SRE CRITICAL FIX: Prevent crash on hidden/zero-size canvas
      const size = mapInstanceRef.current.getSize();
      if (size.x === 0 || size.y === 0) return;

      const points = incidents.map(inc => {
        const c = parseCoords(inc.coordinates);
        return c ? [c.lat, c.lng, 0.6] : null;
      }).filter(Boolean);

      if (points.length > 0) {
        // @ts-ignore
        L.heatLayer(points, { radius: 30, blur: 20 }).addTo(heatGroup);
      }
  }, [incidents, activeLayers.heatmap, parseCoords]);

  // SRE: Heatmap Resize Listener
  // Garante que o heatmap seja desenhado quando o mapa ganhar dimensões (ex: ao abrir a aba)
  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      
      map.on('resize', updateHeatmap);
      return () => { map.off('resize', updateHeatmap); }
  }, [updateHeatmap]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { markersGroup, incidentsGroup, circlesGroup } = registry.current;

    // Heatmap via Safe Update
    updateHeatmap();

    markersGroup.clearLayers();
    if (activeLayers.residents) {
      units.forEach(u => {
        const c = parseCoords(u.coordinates);
        if (!c) return;

        const survey = surveys.find(s => s.user_id === u.id);
        
        let markerColor = primaryColor;
        
        if (visualizationMode === 'RISK') {
            const socialText = JSON.stringify(u.socialData || {}).toUpperCase();
            if (socialText.includes('BAIXA') || socialText.includes('SIM') || socialText.includes('BOLSA')) {
                markerColor = '#ef4444';
            } else if (socialText.includes('MEDIA')) {
                markerColor = '#f59e0b';
            } else {
                markerColor = '#10b981';
            }
        } else if (visualizationMode === 'AGE') {
            const age = u.age || 0;
            if (age < 18) markerColor = '#8b5cf6';
            else if (age < 60) markerColor = '#3b82f6';
            else markerColor = '#f97316';
        } else if (!!filteredData) {
            markerColor = '#10b981';
        }

        const icon = L.divIcon({
          className: 'marker-tatico',
          html: `
            <div class="relative group cursor-pointer">
                <div style="background-color:${markerColor}" class="w-6 h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const popupContent = `
            <div class="bg-slate-900 text-white p-5 rounded-[2rem] border border-white/10 min-w-[200px] shadow-2xl">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                        <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Membro</p>
                        <h4 class="text-sm font-black uppercase leading-tight">${u.name}</h4>
                    </div>
                </div>
                <div class="space-y-1 mb-4">
                    <div class="flex justify-between text-[10px] uppercase font-bold text-slate-500 border-b border-white/5 pb-1">
                        <span>Unidade</span>
                        <span class="text-white">${u.unit || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between text-[10px] uppercase font-bold text-slate-500 border-b border-white/5 pb-1">
                        <span>Role</span>
                        <span class="text-white">${u.role || 'RESIDENT'}</span>
                    </div>
                </div>
                <button id="btn-select-${u.id}" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                    Visualizar Perfil
                </button>
            </div>
        `;

        const marker = L.marker([c.lat, c.lng], { icon })
          .bindPopup(popupContent, { className: 'custom-tactic-popup', closeButton: false, offset: [0, -10] })
          .on('click', () => { mapInstanceRef.current?.flyTo([c.lat, c.lng], 18, { duration: 1 }); })
          .addTo(markersGroup);

        marker.on('popupopen', () => {
          document.getElementById(`btn-select-${u.id}`)?.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelectEntity(u);
          });
        });
      });
    }

    incidentsGroup.clearLayers();
    circlesGroup.clearLayers();
    if (activeLayers.incidents) {
      incidents.forEach(inc => {
        const c = parseCoords(inc.coordinates);
        if (!c) return;
        const color = inc.priority?.includes('4') ? '#f43f5e' : '#fbbf24';

        L.circle([c.lat, c.lng], { radius: (inc.radius || 0.1) * 1000, color, fillOpacity: 0.1, weight: 1.5 }).addTo(circlesGroup);

        const icon = L.divIcon({
          className: 'tactical-pulse',
          html: `<div style="background-color:${color}" class="w-8 h-8 rounded-full animate-pulse border-2 border-white flex items-center justify-center text-white font-black text-[10px]">!</div>`,
          iconSize: [32, 32]
        });

        L.marker([c.lat, c.lng], { icon })
          .on('click', () => onSelectEntity(inc))
          .addTo(incidentsGroup);
      });
    }
  }, [units, incidents, surveys, activeLayers, primaryColor, onSelectEntity, filteredData, visualizationMode, parseCoords, updateHeatmap]);

  return (
    <div className="h-full w-full relative bg-[#020617] overflow-hidden flex flex-col font-sans">

      {/* SRE ALERT OVERLAY (ZONA VAZIA) */}
      {radarAlert && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[3000] bg-rose-600 text-white px-8 py-3 rounded-2xl shadow-2xl animate-bounce flex items-center gap-3">
            <AlertTriangle size={20} />
            <span className="text-xs font-black uppercase tracking-widest">{radarAlert}</span>
        </div>
      )}

      {/* LAYER SWITCHER (OPTIMIZED VISUALIZATION) */}
      <div className="absolute top-8 left-6 z-[2000] flex flex-col gap-2">
          <button 
            onClick={() => setLayerType('STREET')} 
            className={`p-3 rounded-xl transition-all shadow-lg border backdrop-blur-md ${layerType === 'STREET' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/90 text-slate-400 border-white/10 hover:text-white'}`}
            title="Vista de Rua"
          >
              <MapIcon2 size={18}/>
          </button>
          <button 
            onClick={() => setLayerType('SATELLITE')} 
            className={`p-3 rounded-xl transition-all shadow-lg border backdrop-blur-md ${layerType === 'SATELLITE' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/90 text-slate-400 border-white/10 hover:text-white'}`}
            title="Vista de Satélite"
          >
              <Satellite size={18}/>
          </button>
      </div>

      {showSearch && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-4 w-full max-w-2xl px-6">
          <div className="relative group flex-1">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400">
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </div>
            <input
              type="text"
              placeholder={meta.placeholder || "RASTREAMENTO GLOBAL..."}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); debouncedSearch(e.target.value); if (!e.target.value) { setShowResults(false); registry.current.searchResultGroup.clearLayers(); } }}
              className="w-full pl-14 pr-24 py-5 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white tracking-[0.2em] shadow-2xl outline-none focus:border-indigo-500/50 transition-all"
            />
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[350px] overflow-y-auto z-[2000] animate-slide-down custom-scrollbar">
                {searchResults.map(item => (
                  <button key={item.id} onClick={() => { const c = parseCoords(item.coordinates); if (c) triggerPing(c.lat, c.lng); if (!item.isAddress) onSelectEntity(item); setShowResults(false); }} className="w-full p-6 hover:bg-white/5 border-b border-white/5 flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors shadow-inner">{item.isAddress ? <MapPin size={18} /> : <Users size={18} />}</div>
                      <div className="text-left min-w-0 flex-1"><p className="text-[10px] font-black text-white uppercase truncate max-w-[300px]">{item.name}</p><p className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{item.isAddress ? 'Satélite • OSM Data' : `Unid. ${item.unit || '---'} • Ledger`}</p></div>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><ChevronRight size={14} className="text-indigo-400" /></div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setRadarMode(!radarMode); setLastRadarCount(null); registry.current.radarLayer.clearLayers(); }}
            className={`p-5 rounded-2xl border transition-all ${radarMode ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-900/90 border-white/10 text-slate-400'}`}
            title="Modo Radar (Clique no Mapa para Filtrar por Raio)"
          >
            <Radar size={20} className={radarMode ? 'animate-pulse' : ''} />
          </button>
        </div>
      )}

      {/* HUD RADAR (MANTIDO E ISOLADO) */}
      <div className="absolute bottom-10 left-10 z-[1000] flex flex-col gap-4">
        {radarMode && (
          <div className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] w-64 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2"><Radar size={14} className="text-emerald-500 animate-spin" /><span className="text-[10px] font-black text-white uppercase tracking-widest">RADAR MODE: ACTIVE</span></div>
            </div>
            <div className="space-y-2 text-[8px] font-black uppercase">
              <div className="flex justify-between text-slate-500">
                <span>Raio de Varredura</span>
                <select value={radarRange} onChange={e => setRadarRange(Number(e.target.value))} className="bg-transparent border-none text-white outline-none cursor-pointer font-black">
                  <option value={100} className="bg-slate-900">100m</option>
                  <option value={500} className="bg-slate-900">500m</option>
                  <option value={1000} className="bg-slate-900">1km</option>
                  <option value={2000} className="bg-slate-900">2km</option>
                </select>
              </div>
              {lastRadarCount !== null && (
                <div className="flex justify-between text-slate-500 pt-2 border-t border-white/5">
                  <span>Últimos Nodos Detectados</span>
                  <span className="bg-emerald-500 text-white px-2 py-0.5 rounded ml-2 text-[9px] font-black uppercase">{lastRadarCount}</span>
                </div>
              )}
              <p className="text-[8px] text-slate-600 italic mt-2">Clique no mapa para varrer uma área.</p>
            </div>
          </div>
        )}
      </div>

      {isDossierOpen && selectedDossier && (
        <div className="absolute top-0 right-0 h-full w-full lg:w-[450px] z-[2000] bg-slate-950/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-indigo-50/5">
            <div className="flex items-center gap-4"><div className="p-3 bg-indigo-50/10 rounded-2xl text-indigo-400"><BrainCircuit size={28} /></div><h2 className="text-sm font-black text-white uppercase tracking-tighter">Dossiê Preditivo IA</h2></div>
            <button onClick={() => setIsDossierOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20} className="text-slate-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-white">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Score de Risco</p>
              <div className="text-5xl font-black text-indigo-400">{selectedDossier.risk_score}%</div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Eventos Prováveis</h3>
              {(selectedDossier.predictions || []).map((p, i) => (
                <div key={i} className="p-4 bg-slate-900 border-l-4 border-amber-500/50 rounded-xl text-[11px] text-slate-300 italic">"{p}"</div>
              ))}
            </div>
            <div className="space-y-4 pb-10">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={14} className="text-emerald-500" /> Protocolos Sugeridos</h3>
              {(selectedDossier.recommended_actions || []).map((a, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-slate-200 uppercase">{a}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[1000] flex flex-col gap-4">
        <button onClick={() => mapInstanceRef.current?.flyTo([epicenter.lat, epicenter.lng], 16)} className="p-5 bg-indigo-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all"><Crosshair size={24} /></button>
      </div>

      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0 outline-none" />

      <style>{`
        .leaflet-container { background: #020617 !important; border: none !important; }
        .sat-ping { position: relative; display: flex; align-items: center; justify-content: center; }
        .sat-ring { position: absolute; width: 60px; height: 60px; border: 2px solid; border-radius: 50%; animation: sat-p 2s infinite; opacity: 0; }
        .sat-dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 15px currentColor; border: 2px solid white; }
        @keyframes sat-p { 0% { transform: scale(0.1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

        .radar-ping { position: relative; display: flex; align-items: center; justify-content: center; }
        .radar-ping-ring {
            width: 40px; height: 40px; border: 2px solid #10b981; border-radius: 50%;
            position: absolute; left: -10px; top: -10px;
            animation: radar-sweep 1.5s infinite linear;
        }
        @keyframes radar-sweep { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(4); opacity: 0; } }

        .custom-tactic-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .custom-tactic-popup .leaflet-popup-content { margin: 0 !important; }
        .custom-tactic-popup .leaflet-popup-tip-container { display: none !important; }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #312e81; border-radius: 10px; }

        /* SRE CLUSTER STYLES */
        .sie-cluster-container { pointer-events: none; }
        .sie-cluster-marker {
            width: 40px; height: 40px; border-radius: 50%;
            background: #020617; border: 2px solid #6366f1;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
            position: relative; pointer-events: auto;
            transition: all 0.3s ease;
        }
        .sie-cluster-marker:hover { transform: scale(1.1); border-color: #ffffff; }
        .sie-cluster-marker.medium { width: 50px; height: 50px; border-color: #f59e0b; }
        .sie-cluster-marker.large { width: 60px; height: 60px; border-color: #ef4444; }
        .sie-cluster-marker .count { font-size: 12px; font-weight: 900; color: white; }
        .sie-cluster-marker .ring {
            position: absolute; inset: -4px; border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.2);
            animation: cluster-pulse 2s infinite;
        }
        @keyframes cluster-pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default React.memo(SmartMap);
