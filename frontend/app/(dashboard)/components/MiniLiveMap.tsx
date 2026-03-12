'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
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

    const lat = sensorData?.gps?.latitude || 14.5995;
    const lng = sensorData?.gps?.longitude || 120.9842;
    const position: [number, number] = [lat, lng];
    
    return (
        <div className="h-full w-full">
            <MapContainer
                center={position} 
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
                    position={position} 
                    icon={icon}
                >
                    <Circle 
                        center={position}
                        radius={400}
                        pathOptions={{ 
                            color: '#ED1E24', 
                            fillColor: '#ED1E24', 
                            fillOpacity: 0.1 
                        }}
                    />
                </Marker>
            </MapContainer>
        </div>
    );
}
