'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SpeedInsights } from "@vercel/speed-insights/next";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export default function LocationPage() {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    // Fix for default marker icon in production
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
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
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
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

  const toggleWatchPosition = () => {
    if (watching) {
      setWatching(false);
      return;
    }

    setWatching(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setWatching(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setWatching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  useEffect(() => {
    getCurrentPosition();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">GPS Location Test</h1>
          <p className="text-muted-foreground">
            View your current location on an interactive map using your device&apos;s GPS.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={getCurrentPosition} disabled={loading}>
            {loading ? 'Getting Location...' : 'Refresh Location'}
          </Button>
          <Button
            onClick={toggleWatchPosition}
            variant={watching ? 'destructive' : 'secondary'}
            disabled={loading}
          >
            {watching ? 'Stop Watching' : 'Watch Position'}
          </Button>
        </div>

        {loading && !position ? (
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </Card>
        ) : position ? (
          <>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">
                    Latitude: {position.latitude.toFixed(6)}°
                  </Badge>
                  <Badge variant="secondary">
                    Longitude: {position.longitude.toFixed(6)}°
                  </Badge>
                  <Badge variant="outline">
                    Accuracy: ±{position.accuracy.toFixed(0)}m
                  </Badge>
                  {watching && <Badge>Live Tracking</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(position.timestamp).toLocaleString()}
                </p>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div style={{ height: '500px', width: '100%' }}>
                <MapContainer
                  center={[position.latitude, position.longitude]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  key={`${position.latitude}-${position.longitude}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[position.latitude, position.longitude]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">Your Location</p>
                        <p className="text-xs">
                          {position.latitude.toFixed(6)}°, {position.longitude.toFixed(6)}°
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Accuracy: ±{position.accuracy.toFixed(0)}m
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </Card>
          </>
        ) : null}

        <Card className="p-4 bg-muted/50">
          <div className="space-y-2 text-sm">
            <p className="font-semibold">About this page:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Uses the browser&apos;s Geolocation API to access your device&apos;s GPS</li>
              <li>Displays your location on an interactive OpenStreetMap via Leaflet</li>
              <li>Click &quot;Refresh Location&quot; to get a one-time position update</li>
              <li>
                Click &quot;Watch Position&quot; to continuously track your location (useful for
                testing while moving)
              </li>
              <li>Your location data is only displayed locally and not sent to any server</li>
            </ul>
          </div>
        </Card>
      </div>

      <SpeedInsights />
    </div>
  );
}
