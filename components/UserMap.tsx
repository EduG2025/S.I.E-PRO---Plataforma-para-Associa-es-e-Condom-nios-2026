
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface UserMapProps {
  coordinates: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
}

const UserMap = ({ coordinates, onChange }: UserMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainerRef.current, {
        center: [coordinates.lat, coordinates.lng],
        zoom: 16,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

      markerInstance.current = L.marker([coordinates.lat, coordinates.lng], {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-8 h-8 bg-indigo-600 rounded-full border-4 border-white shadow-2xl animate-pulse"></div>`
        })
      }).addTo(mapInstance.current);

      markerInstance.current.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        onChange({ lat, lng });
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (markerInstance.current && mapInstance.current) {
      const currentPos = markerInstance.current.getLatLng();
      if (currentPos.lat !== coordinates.lat || currentPos.lng !== coordinates.lng) {
        markerInstance.current.setLatLng([coordinates.lat, coordinates.lng]);
        mapInstance.current.panTo([coordinates.lat, coordinates.lng]);
      }
    }
  }, [coordinates]);

  return <div ref={mapContainerRef} className="w-full h-96 rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden grayscale-[0.2] hover:grayscale-0 transition-all z-10" />;
};

export default UserMap;
