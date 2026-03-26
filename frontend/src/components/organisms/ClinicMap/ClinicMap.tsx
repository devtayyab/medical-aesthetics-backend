import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clinic } from '@/types';
import { useNavigate } from 'react-router-dom';

interface ClinicMapProps {
    clinics: Clinic[];
    center?: [number, number];
    zoom?: number;
}

export const ClinicMap: React.FC<ClinicMapProps> = ({
    clinics,
    center = [51.505, -0.09],
    zoom = 13
}) => {
    const navigate = useNavigate();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Create map instance
        const map = L.map(mapContainerRef.current, {
            center: center,
            zoom: zoom,
            zoomControl: false, // Custom zoom buttons
            attributionControl: true
        });

        // Add Tile Layer (Treatwell Style - CartoDB Light)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []); // Only on mount

    // Update Center/Zoom
    useEffect(() => {
        if (mapInstanceRef.current && center) {
            mapInstanceRef.current.setView(center, zoom, { animate: true });
        }
    }, [center, zoom]);

    // Update Markers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Add new markers
        clinics.forEach(clinic => {
            if (clinic.latitude && clinic.longitude) {
                const marker = L.marker([clinic.latitude, clinic.longitude], {
                    icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: `
              <div class="flex flex-col items-center group cursor-pointer transform -translate-x-1/2 -translate-y-[calc(100%-10px)]">
                <div class="bg-black text-white px-3 py-1.5 rounded-lg shadow-xl font-black text-sm whitespace-nowrap group-hover:scale-110 transition-transform">
                  ${clinic.minPrice || 49}+
                </div>
                <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
              </div>
            `,
                        iconSize: [0, 0],
                        iconAnchor: [0, 0],
                    })
                }).addTo(map);

                // Simple popup
                marker.bindPopup(`
          <div style="padding: 4px; min-width: 120px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 800; font-size: 14px;">${clinic.name}</h4>
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #666;">${clinic.address.city}</p>
            <button id="popup-btn-${clinic.id}" style="width: 100%; padding: 6px; background: black; color: white; border-radius: 6px; font-weight: bold; font-size: 10px; cursor: pointer; border: none;">
              View Clinic
            </button>
          </div>
        `);

                // Handle popup button click
                marker.on('popupopen', () => {
                    const btn = document.getElementById(`popup-btn-${clinic.id}`);
                    if (btn) {
                        btn.onclick = () => navigate(`/clinic/${clinic.id}`);
                    }
                });

                markersRef.current.push(marker);
            }
        });

        // Auto-fit bounds if multiple clinics
        if (clinics.length > 1 && !center) {
            const group = L.featureGroup(markersRef.current);
            if (group.getBounds().isValid()) {
                map.fitBounds(group.getBounds(), { padding: [50, 50] });
            }
        }
    }, [clinics, navigate]);

    return (
        <div className="w-full h-full relative z-0">
            <div
                ref={mapContainerRef}
                className="w-full h-full bg-gray-100"
                style={{ height: '100%', width: '100%' }}
            />

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={() => mapInstanceRef.current?.zoomIn()}
                    className="bg-white w-10 h-10 rounded-xl shadow-lg flex items-center justify-center font-bold text-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 border border-gray-100"
                >
                    +
                </button>
                <button
                    onClick={() => mapInstanceRef.current?.zoomOut()}
                    className="bg-white w-10 h-10 rounded-xl shadow-lg flex items-center justify-center font-bold text-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 border border-gray-100"
                >
                    −
                </button>
            </div>
        </div>
    );
};
