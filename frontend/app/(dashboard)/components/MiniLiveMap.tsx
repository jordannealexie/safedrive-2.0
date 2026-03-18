'use client';

import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLiveSensor } from '@/hooks/useLiveSensor';
import { useUIStore } from '@/store/useUIStore';

// Fix Leaflet icon issue
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MiniLiveMap() {
    const { theme } = useUIStore();
    const { data: sensorData } = useLiveSensor();

    const lat = sensorData?.gps?.latitude;
    const lng = sensorData?.gps?.longitude;
    const hasValidGps = typeof lat === 'number' && typeof lng === 'number' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
    const hasUsableGps = hasValidGps;
    const livePosition: [number, number] | null = hasUsableGps ? [lat, lng] : null;

    const fallbackCenter: [number, number] = [14.5995, 120.9842];
    const center: [number, number] = livePosition ?? fallbackCenter;
    const markerPosition: [number, number] = livePosition ?? fallbackCenter;
    
    return (
        <div className="h-full w-full">
            <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={false}
                zoomControl={false}
                attributionControl={false}
                className="h-full w-full rounded-b-[24px]"
            >
                <TileLayer
                    url={theme === 'dark' 
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                />
                <Marker
                    position={markerPosition}
                    icon={icon}
                >
                    <Popup>
                        {livePosition ? 'BUS-001 live GPS' : 'GPS fix unavailable - showing fallback center'}
                    </Popup>
                    <Circle
                        center={markerPosition}
                        radius={400}
                        pathOptions={{
                            color: livePosition ? '#ED1E24' : '#64748b',
                            fillColor: livePosition ? '#ED1E24' : '#64748b',
                            fillOpacity: 0.1
                        }}
                    />
                </Marker>
            </MapContainer>
        </div>
    );
}
