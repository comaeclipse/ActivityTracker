'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

interface ActivityMapProps {
  latitude: number;
  longitude: number;
}

export default function ActivityMap({ latitude, longitude }: ActivityMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Fix for default marker icon in production
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapReady(true);
    });
  }, []);

  if (!mapReady) {
    return (
      <div className="w-24 h-24 bg-muted/30 rounded-md border border-border flex items-center justify-center">
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-24 h-24 rounded-md overflow-hidden border border-border shadow-sm flex-shrink-0">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </div>
  );
}
