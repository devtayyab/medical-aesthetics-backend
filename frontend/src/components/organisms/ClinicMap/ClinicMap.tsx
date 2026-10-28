import React, { useEffect, useRef, useState } from 'react';
import { Clinic } from '@/types';
import { useNavigate } from 'react-router-dom';
import { loadGoogleMaps } from '@/utils/googleMaps';

interface ClinicMapProps {
 clinics: Clinic[];
 /** Fallback center when no clinic has coordinates. Defaults to Athens. */
 center?: [number, number];
 zoom?: number;
}

// Athens city centre (Syntagma)
export const ATHENS_CENTER: [number, number] = [37.9755, 23.7348];

const hasCoords = (c: Clinic) => {
 const lat = Number(c.latitude);
 const lng = Number(c.longitude);
 // 0/0 (missing data) would put the map in the sea off Africa
 return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

const escapeHtml = (value: string) =>
 value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));

export const ClinicMap: React.FC<ClinicMapProps> = ({
 clinics,
 center = ATHENS_CENTER,
 zoom = 11,
}) => {
 const navigate = useNavigate();
 const mapContainerRef = useRef<HTMLDivElement>(null);
 const mapRef = useRef<any>(null);
 const markersRef = useRef<any[]>([]);
 const infoWindowRef = useRef<any>(null);
 const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
 const isGreek = typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el';

 // Load Google Maps and create the map once
 useEffect(() => {
 let cancelled = false;
 loadGoogleMaps()
 .then((google) => {
 if (cancelled || !mapContainerRef.current) return;
 mapRef.current = new google.maps.Map(mapContainerRef.current, {
 center: { lat: center[0], lng: center[1] },
 zoom,
 disableDefaultUI: true,
 zoomControl: true,
 gestureHandling: 'cooperative',
 clickableIcons: false,
 });
 infoWindowRef.current = new google.maps.InfoWindow();
 setStatus('ready');
 })
 .catch(() => {
 if (!cancelled) setStatus('error');
 });
 return () => {
 cancelled = true;
 markersRef.current.forEach((m) => m.setMap(null));
 markersRef.current = [];
 mapRef.current = null;
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 // Markers + viewport: fit to the clinics, otherwise center on the fallback (Athens)
 useEffect(() => {
 const map = mapRef.current;
 const google = (window as any).google;
 if (status !== 'ready' || !map || !google?.maps) return;

 markersRef.current.forEach((m) => m.setMap(null));
 markersRef.current = [];

 const located = clinics.filter(hasCoords);
 const bounds = new google.maps.LatLngBounds();

 located.forEach((clinic) => {
 const position = { lat: Number(clinic.latitude), lng: Number(clinic.longitude) };
 // Plain pin: no prices on the map
 const marker = new google.maps.Marker({ position, map, title: clinic.name || '' });
 marker.addListener('click', () => {
 const btnId = `map-btn-${clinic.id}`;
 infoWindowRef.current?.setContent(`
 <div style="padding:2px 4px;min-width:140px;font-family:inherit">
 <div style="font-weight:800;font-size:14px;margin-bottom:2px">${escapeHtml(clinic.name || '')}</div>
 <div style="font-size:11px;color:#666;margin-bottom:8px">${escapeHtml(clinic.address?.city || '')}</div>
 <button id="${btnId}" style="width:100%;padding:6px;background:#000;color:#fff;border:none;border-radius:6px;font-weight:700;font-size:11px;cursor:pointer">
 ${isGreek ? 'Προβολή κλινικής' : 'View clinic'}
 </button>
 </div>`);
 infoWindowRef.current?.open({ anchor: marker, map });
 google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
 const btn = document.getElementById(btnId);
 if (btn) btn.onclick = () => navigate(`/clinic/${clinic.id}`);
 });
 });
 markersRef.current.push(marker);
 bounds.extend(position);
 });

 if (located.length > 1) {
 map.fitBounds(bounds, 48);
 } else if (located.length === 1) {
 map.setCenter(bounds.getCenter());
 map.setZoom(14);
 } else {
 map.setCenter({ lat: center[0], lng: center[1] });
 map.setZoom(zoom);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [clinics, status, center?.[0], center?.[1], zoom, navigate]);

 return (
 <div className="w-full h-full min-h-[300px] relative z-0">
 <div ref={mapContainerRef} className="w-full h-full min-h-[300px] bg-gray-100" style={{ height: '100%', width: '100%' }} />
 {status !== 'ready' && (
 <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center px-6">
 {status === 'loading'
 ? (isGreek ? 'Φόρτωση χάρτη...' : 'Loading map...')
 : (isGreek ? 'Ο χάρτης δεν είναι διαθέσιμος' : 'Map not available')}
 </div>
 )}
 </div>
 );
};
