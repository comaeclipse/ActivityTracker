'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

interface LocationPickerProps {
  onLocationChange: (latitude: number | null, longitude: number | null) => void;
}

export default function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const getCurrentPosition = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setPosition(newPosition);
        onLocationChange(newPosition.latitude, newPosition.longitude);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const clearLocation = () => {
    setPosition(null);
    onLocationChange(null, null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location (optional)
        </label>
        <div className="flex gap-2">
          {position && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearLocation}
              className="text-xs"
            >
              Clear
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentPosition}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Getting...
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3 mr-1" />
                Get Location
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-md p-2">
          {error}
        </div>
      )}

      {position && mapReady && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Location: {position.latitude.toFixed(6)}°, {position.longitude.toFixed(6)}°
          </div>
          <div className="border rounded-md overflow-hidden" style={{ height: '200px' }}>
            <MapContainer
              center={[position.latitude, position.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              key={`${position.latitude}-${position.longitude}`}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[position.latitude, position.longitude]} />
            </MapContainer>
          </div>
        </div>
      )}

      {!position && !error && (
        <div className="text-xs text-muted-foreground">
          Click "Get Location" to add GPS coordinates to your activity
        </div>
      )}
    </div>
  );
}
