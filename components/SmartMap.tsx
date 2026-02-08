
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SystemInfo, User, Incident } from '../types';
import { mapService, operationsService } from '../services/api';
import { Activity, MapPin, Loader2, ShieldAlert, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * S.I.E SMART MAP V8.0 - SRE CONSTRUCTOR FIX
 * Protocolo de Resiliência contra falhas de carregamento de plugin.
 */

const L: any = (window as any).L;

interface SmartMapProps {
  systemInfo?: SystemInfo;
  activeLayers: { residents: boolean; incidents: boolean; heatmap: boolean; surveys: boolean };
  onSelectEntity: (entity: any) => void;
  filteredData?: User[];
}

const SmartMap = ({ systemInfo, activeLayers, onSelectEntity, filteredData }: SmartMapProps) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef({
    markersGroup: null as any,
    incidentsGroup: null as any,
    heatGroup: null as any
  });

  const epicenter = useMemo(() => {
    const fallback = { lat: -22.6288, lng: -43.8975 };
    if (!systemInfo?.coordinates) return fallback;
    try {
      const c = typeof systemInfo.coordinates === 'string' ? JSON.parse(systemInfo.coordinates) : systemInfo.coordinates;
      return (c.lat && c.lng) ? c : fallback;
    } catch { return fallback; }
  }, [systemInfo]);

  const parseCoords = useCallback((c: any) => {
    if (!c) return null;
    try {
        let parsed = c;
        if (typeof c === 'string') {
            // SRE FIX: Algumas vezes as coordenadas vêm como string JSON escapada
            parsed = JSON.parse(c.startsWith('"') ? JSON.parse(c) : c);
        }
        const lat = parseFloat(parsed.lat);
        const lng = parseFloat(parsed.lng || parsed.lon);
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    } catch { return null; }
  }, []);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !L) return;

    console.log("📍 [SRE MAP] Invocando Kernel Vision...");

    const map = L.map(mapContainerRef.current, {
      center: [epicenter.lat, epicenter.lng],
      zoom: 16,
      maxZoom: 20,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd'
    }).addTo(map);

    // ✅ SRE FIX: Resolver erro "MarkerClusterGroup is not a constructor"
    // Plugins Leaflet muitas vezes são expostos como factory functions
    try {
        if (typeof L.markerClusterGroup === 'function') {
            layersRef.current.markersGroup = L.markerClusterGroup({
                maxClusterRadius: 50,
                showCoverageOnHover: false,
                disableClusteringAtZoom: 18,
                spiderfyOnMaxZoom: true
            });
        } else if ((L as any).MarkerClusterGroup) {
             // Fallback para construtor se disponível
             layersRef.current.markersGroup = new (L as any).MarkerClusterGroup({
                 maxClusterRadius: 50
             });
        } else {
            console.warn("⚠️ [SRE MAP] Plugin MarkerCluster não localizado. Usando LayerGroup simples.");
            layersRef.current.markersGroup = L.layerGroup();
        }
    } catch (e) {
        console.error("❌ [SRE MAP] Falha crítica no plugin de cluster:", e);
        layersRef.current.markersGroup = L.layerGroup();
    }

    layersRef.current.incidentsGroup = L.layerGroup();
    layersRef.current.heatGroup = L.layerGroup();

    Object.values(layersRef.current).forEach(layer => {
        if (layer) layer.addTo(map);
    });

    mapInstanceRef.current = map;
    
    // Força redimensionamento para evitar tile gaps
    setTimeout(() => map.invalidateSize(), 500);
  }, [epicenter]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initMap]);

  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current.markersGroup) return;
    const { markersGroup } = layersRef.current;
    
    markersGroup.clearLayers();
    if (activeLayers.residents) {
      const dataToRender = filteredData || units;
      dataToRender.forEach(u => {
        const c = parseCoords(u.coordinates);
        if (!c) return;

        const icon = L.divIcon({
          className: 'marker-tatico',
          html: `<div class="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 shadow-xl flex items-center justify-center text-white transform hover:scale-125 transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([c.lat, c.lng], { icon })
          .bindPopup(`
            <div class="bg-slate-950 text-white p-6 rounded-[1.5rem] min-w-[200px] shadow-2xl border border-white/10 font-sans">
                <p class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Identidade Ledger</p>
                <h4 class="text-sm font-black uppercase mb-4 truncate">${u.name}</h4>
                <div class="space-y-2 mb-4">
                    <p class="text-[9px] text-slate-400 font-bold uppercase">Unidade: ${u.unit || '---'}</p>
                    <p class="text-[9px] text-slate-400 font-bold uppercase">Status: ${u.status}</p>
                </div>
                <button id="map-btn-${u.id}" class="w-full py-2.5 bg-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-lg">Abrir Dossiê</button>
            </div>
          `, { closeButton: false, className: 'sie-custom-popup' });
        
        marker.on('popupopen', () => {
            const btn = document.getElementById(`map-btn-${u.id}`);
            if (btn) btn.onclick = () => onSelectEntity(u);
        });
        
        markersGroup.addLayer(marker);
      });
    }
  }, [units, filteredData, activeLayers.residents, parseCoords, onSelectEntity]);

  useEffect(() => {
    const load = async () => {
      try {
        const [resInc, resUnits] = await Promise.all([
            operationsService.getIncidents(), 
            mapService.getUnits()
        ]);
        setIncidents(resInc.data?.data || []);
        setUnits((resUnits.data?.data || []).filter((u: User) => u.coordinates));
      } catch (e) {
          console.error("📍 [SRE MAP] Data Sync Fail");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="h-full w-full relative bg-[#020617] overflow-hidden flex flex-col font-sans">
      <div ref={mapContainerRef} className="flex-1 w-full h-full outline-none z-10" />
      
      {loading && (
          <div className="absolute inset-0 z-[2000] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
              <Loader2 size={48} className="animate-spin text-indigo-500" />
          </div>
      )}

      <div className="absolute bottom-10 right-10 z-[1000] space-y-3 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl text-right w-56 animate-slide-in-right pointer-events-auto">
              <span className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.3em]">Telemetry HUD</span>
              <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center text-white">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Membros</span>
                      <span className="text-lg font-black tracking-tight">{(filteredData || units).length}</span>
                  </div>
                  <div className="flex justify-between items-center text-white">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={12}/> Alertas</span>
                      <span className="text-lg font-black text-rose-500 tracking-tight">{incidents.filter(i=>i.status==='OPEN').length}</span>
                  </div>
              </div>
          </div>
      </div>

      <style>{`
        .sie-custom-popup .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; }
        .sie-custom-popup .leaflet-popup-tip { display: none; }
        .marker-tatico:hover { z-index: 9999 !important; }
      `}</style>
    </div>
  );
};

export default React.memo(SmartMap);
