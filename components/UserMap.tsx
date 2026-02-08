
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface UserMapProps {
  coordinates: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
}

const UserMap = ({ coordinates, onChange }: UserMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // 1. Inicialização do Mapa
  useEffect(() => {
    if (mapContainerRef.current && !mapInstance.current) {
      // Define centro inicial (usa SP se for 0,0 para evitar oceano)
      const initialLat = coordinates.lat === 0 ? -23.5505 : coordinates.lat;
      const initialLng = coordinates.lng === 0 ? -46.6333 : coordinates.lng;

      // SRE FIX: maxZoom definido globalmente
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        maxZoom: 20,
        attributionControl: false,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #4f46e5; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);

      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        onChange({ lat, lng });
      });

      map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onChange({ lat, lng });
      });

      mapInstance.current = map;
      markerInstance.current = marker;

      // SRE FIX: Força o recalculo do tamanho do container após a animação do modal
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // 2. Atualização Reativa de Coordenadas
  useEffect(() => {
    if (markerInstance.current && mapInstance.current) {
      const { lat, lng } = coordinates;
      
      if (lat === 0 && lng === 0) return;

      const currentMarkerPos = markerInstance.current.getLatLng();
      
      if (Math.abs(currentMarkerPos.lat - lat) > 0.00001 || Math.abs(currentMarkerPos.lng - lng) > 0.00001) {
        markerInstance.current.setLatLng([lat, lng]);
        mapInstance.current.setView([lat, lng], 16, { animate: true });
        
        setTimeout(() => {
             mapInstance.current?.invalidateSize();
        }, 100);
      }
    }
  }, [coordinates.lat, coordinates.lng]);

  return (
    <div className="relative w-full h-96 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group">
        <div ref={mapContainerRef} className="w-full h-full z-10 bg-slate-100" />
        <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black uppercase text-indigo-600 shadow-lg pointer-events-none">
            Modo Edição Ativo
        </div>
    </div>
  );
};

export default UserMap;
