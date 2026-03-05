'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BUSES } from '@/lib/mock-data';
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
    
    return (
        <div className="h-full w-full">
            <MapContainer
                center={[23.8103, 90.4125]} 
                zoom={11}
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
                {BUSES.slice(0, 3).map((bus) => (
                    <Marker 
                        key={bus.id} 
                        position={bus.location as [number, number]} 
                        icon={icon}
                    >
                        <Circle 
                            center={bus.location as [number, number]}
                            radius={400}
                            pathOptions={{ 
                                color: '#ED1E24', 
                                fillColor: '#ED1E24', 
                                fillOpacity: 0.1 
                            }}
                        />
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
